import "server-only";
import { db } from "@/lib/db";
import { WEEK_DAYS, type AvailabilityDay, type AvailabilitySlot, type OccupiedBlock, type ScheduleDay } from "@/lib/abogacia/availability-types";

const TIME_ZONE = "America/Argentina/Buenos_Aires";
const DAY_MS = 24 * 60 * 60 * 1000;

function dateKeyFromParts(parts: Intl.DateTimeFormatPart[]) {
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("No se pudo obtener la fecha local.");
  return `${year}-${month}-${day}`;
}

export function getBuenosAiresDateKey(date = new Date()) {
  return dateKeyFromParts(new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date));
}

export function getBuenosAiresMinuteOfDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function getCurrentMonthKey(date = new Date()) {
  return getBuenosAiresDateKey(date).slice(0, 7);
}

export function getNextMonthKey(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  return `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getMonthDateKeys(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = Date.UTC(year, month - 1, 1);
  const end = Date.UTC(year, month, 1);
  const dates: string[] = [];
  for (let day = start; day < end; day += DAY_MS) {
    dates.push(new Date(day).toISOString().slice(0, 10));
  }
  return dates;
}

function dateKeyToUtcDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function minutesFromTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromMinutes(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function calculateDayAvailability(
  dateKey: string,
  schedule: ScheduleDay | undefined,
  occupied: Array<Pick<OccupiedBlock, "horaInicio" | "horaFin">>,
  todayKey?: string,
  nowMinute?: number,
): AvailabilityDay {
  if (!schedule?.activo) return { fecha: dateKey, horarios: [] };

  const start = minutesFromTime(schedule.horaInicio);
  const end = minutesFromTime(schedule.horaFin);
  const blockedRanges = occupied.map((block) => ({
    start: minutesFromTime(block.horaInicio),
    end: minutesFromTime(block.horaFin),
  }));
  const horarios: AvailabilitySlot[] = [];

  for (let slotStart = start; slotStart + 30 <= end; slotStart += 30) {
    const slotEnd = slotStart + 30;
    const isPast = todayKey === dateKey && nowMinute !== undefined && slotStart <= nowMinute;
    const isOccupied = blockedRanges.some((block) => block.start < slotEnd && block.end > slotStart);
    if (!isPast && !isOccupied) {
      horarios.push({ inicio: timeFromMinutes(slotStart), fin: timeFromMinutes(slotEnd) });
    }
  }

  return { fecha: dateKey, horarios };
}

export async function getPublicAvailabilityData() {
  const now = new Date();
  const todayKey = getBuenosAiresDateKey(now);
  const currentMonthKey = todayKey.slice(0, 7);
  const nextMonthKey = getNextMonthKey(currentMonthKey);
  const endExclusiveKey = `${getNextMonthKey(nextMonthKey)}-01`;
  const startKey = `${currentMonthKey}-01`;
  const [schedule, blocks] = await Promise.all([
    db.horarioBaseAbogacia.findMany(),
    db.bloqueOcupadoAbogacia.findMany({
      where: { fecha: { gte: dateKeyToUtcDate(startKey), lt: dateKeyToUtcDate(endExclusiveKey) } },
      select: { fecha: true, horaInicio: true, horaFin: true },
    }),
  ]);

  const scheduleByWeekday = new Map(schedule.map((entry) => [entry.diaSemana, entry]));
  const blocksByDate = new Map<string, Array<Pick<OccupiedBlock, "horaInicio" | "horaFin">>>();
  for (const block of blocks) {
    const dateKey = block.fecha.toISOString().slice(0, 10);
    const dayBlocks = blocksByDate.get(dateKey) ?? [];
    dayBlocks.push({ horaInicio: block.horaInicio, horaFin: block.horaFin });
    blocksByDate.set(dateKey, dayBlocks);
  }

  const dates = [...getMonthDateKeys(currentMonthKey), ...getMonthDateKeys(nextMonthKey)];
  const days = dates.map((dateKey) => {
    const weekday = dateKeyToUtcDate(dateKey).getUTCDay();
    return calculateDayAvailability(
      dateKey,
      scheduleByWeekday.get(weekday),
      blocksByDate.get(dateKey) ?? [],
      todayKey,
      getBuenosAiresMinuteOfDay(now),
    );
  });

  return { currentMonthKey, nextMonthKey, todayKey, days };
}

export async function getAdminAvailabilityData(monthKey: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)) return null;
  const [year, month] = monthKey.split("-").map(Number);
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const [storedSchedule, storedBlocks] = await Promise.all([
    db.horarioBaseAbogacia.findMany({ orderBy: { diaSemana: "asc" } }),
    db.bloqueOcupadoAbogacia.findMany({
      where: { fecha: { gte: startDate, lt: endDate } },
      orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      select: { id: true, fecha: true, horaInicio: true, horaFin: true, motivo: true },
    }),
  ]);

  const scheduleByDay = new Map(storedSchedule.map((entry) => [entry.diaSemana, entry]));
  const schedule: ScheduleDay[] = WEEK_DAYS.map((_, diaSemana) => {
    const entry = scheduleByDay.get(diaSemana);
    return {
      diaSemana,
      horaInicio: entry?.horaInicio ?? "09:00",
      horaFin: entry?.horaFin ?? "17:00",
      activo: entry?.activo ?? false,
    };
  });

  const occupiedBlocks: OccupiedBlock[] = storedBlocks.map((block) => ({
    ...block,
    fecha: block.fecha.toISOString().slice(0, 10),
  }));

  return { monthKey, todayKey: getBuenosAiresDateKey(), schedule, occupiedBlocks };
}

export function getWeekdayForDateKey(dateKey: string) {
  return dateKeyToUtcDate(dateKey).getUTCDay();
}

export function getDateKeyToday() {
  return getBuenosAiresDateKey();
}

export function getDateAtUtcMidnight(dateKey: string) {
  return dateKeyToUtcDate(dateKey);
}

export function timesOverlap(firstStart: string, firstEnd: string, secondStart: string, secondEnd: string) {
  return minutesFromTime(firstStart) < minutesFromTime(secondEnd)
    && minutesFromTime(firstEnd) > minutesFromTime(secondStart);
}
