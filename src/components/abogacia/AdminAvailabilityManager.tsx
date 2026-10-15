"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, LoaderCircle, Trash2 } from "lucide-react";
import { createOccupiedBlock, deleteOccupiedBlock, getAdminTurnosData, saveWeeklySchedule } from "@/actions/abogacia/turnos-actions";
import { WEEK_DAYS, type OccupiedBlock, type ScheduleDay } from "@/lib/abogacia/availability-types";
import { occupiedBlockSchema, weeklyScheduleSchema, type OccupiedBlockValues, type WeeklyScheduleValues } from "@/lib/abogacia/schemas";

type AdminAvailabilityData = {
  monthKey: string;
  todayKey: string;
  schedule: ScheduleDay[];
  occupiedBlocks: OccupiedBlock[];
};

const weekdayLabels = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];

function getCalendarDates(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates: Array<{ dateKey: string; day: number } | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    dates.push({ dateKey: `${monthKey}-${String(day).padStart(2, "0")}`, day });
  }
  return dates;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

function getWeekday(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
}

function getNextMonth(monthKey: string, offset: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function initialScheduleForm(schedule: ScheduleDay[]): WeeklyScheduleValues {
  return { entries: schedule.map((entry) => ({ ...entry })) };
}

export function AdminAvailabilityManager({ initialData }: { initialData: AdminAvailabilityData }) {
  const [monthKey, setMonthKey] = useState(initialData.monthKey);
  const [todayKey, setTodayKey] = useState(initialData.todayKey);
  const [schedule, setSchedule] = useState(initialData.schedule);
  const [occupiedBlocks, setOccupiedBlocks] = useState(initialData.occupiedBlocks);
  const [selectedDate, setSelectedDate] = useState(initialData.todayKey);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const scheduleForm = useForm<WeeklyScheduleValues>({
    resolver: zodResolver(weeklyScheduleSchema),
    defaultValues: initialScheduleForm(initialData.schedule),
  });
  const blockForm = useForm<OccupiedBlockValues>({
    resolver: zodResolver(occupiedBlockSchema),
    defaultValues: { fecha: initialData.todayKey, horaInicio: "09:00", horaFin: "09:30", motivo: "" },
  });
  const setBlockValue = blockForm.setValue;

  const calendarDates = getCalendarDates(monthKey);
  const selectedDayBlocks = useMemo(
    () => occupiedBlocks.filter((block) => block.fecha === selectedDate),
    [occupiedBlocks, selectedDate],
  );
  const selectedDaySchedule = schedule.find((entry) => entry.diaSemana === getWeekday(selectedDate));
  const startMin = selectedDaySchedule?.horaInicio ?? "09:00";
  const endMax = selectedDaySchedule?.horaFin ?? "17:00";

  useEffect(() => {
    let cancelled = false;
    setLoadingMonth(true);
    getAdminTurnosData(monthKey)
      .then((data) => {
        if (!data || cancelled) return;
        setOccupiedBlocks(data.occupiedBlocks);
        setSchedule(data.schedule);
        setTodayKey(data.todayKey);
        const suggestedDate = monthKey === data.todayKey.slice(0, 7) ? data.todayKey : `${monthKey}-01`;
        setSelectedDate(suggestedDate);
        setBlockValue("fecha", suggestedDate);
      })
      .catch(() => {
        if (!cancelled) setFeedback({ type: "error", text: "No se pudo cargar el calendario de ese mes." });
      })
      .finally(() => {
        if (!cancelled) setLoadingMonth(false);
      });
    return () => { cancelled = true; };
  }, [monthKey, setBlockValue]);

  async function onSaveSchedule(values: WeeklyScheduleValues) {
    setFeedback(null);
    const result = await saveWeeklySchedule(values);
    setFeedback({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) setSchedule(values.entries);
  }

  async function onCreateBlock(values: OccupiedBlockValues) {
    setFeedback(null);
    const result = await createOccupiedBlock(values);
    if (!result.success) {
      setFeedback({ type: "error", text: result.message });
      return;
    }
    blockForm.reset({ fecha: selectedDate, horaInicio: startMin, horaFin: nextHalfHour(startMin, endMax), motivo: "" });
    const refreshedData = await getAdminTurnosData(monthKey);
    if (refreshedData) setOccupiedBlocks(refreshedData.occupiedBlocks);
    setFeedback({ type: "success", text: result.message });
  }

  async function onDeleteBlock(id: string) {
    setPendingBlockId(id);
    setFeedback(null);
    const result = await deleteOccupiedBlock({ id });
    if (result.success) {
      setOccupiedBlocks((current) => current.filter((block) => block.id !== id));
      setFeedback({ type: "success", text: result.message });
    } else {
      setFeedback({ type: "error", text: result.message });
    }
    setPendingBlockId(null);
  }

  function changeMonth(offset: number) {
    const nextMonth = getNextMonth(monthKey, offset);
    setFeedback(null);
    setMonthKey(nextMonth);
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    blockForm.setValue("fecha", dateKey, { shouldValidate: true });
    const daySchedule = schedule.find((entry) => entry.diaSemana === getWeekday(dateKey));
    blockForm.setValue("horaInicio", daySchedule?.horaInicio ?? "09:00");
    blockForm.setValue("horaFin", daySchedule?.horaInicio ? nextHalfHour(daySchedule.horaInicio, daySchedule.horaFin) : "09:30");
  }

  return (
    <div className="space-y-7">
      {feedback && (
        <p role={feedback.type === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${feedback.type === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          {feedback.text}
        </p>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#63bae9]/15 text-[#327fa5]">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Horario semanal de atención</h2>
            <p className="mt-1 text-sm text-gray-600">Activá los días de atención. Los horarios libres se publican en bloques de 30 minutos.</p>
          </div>
        </div>

        <form onSubmit={scheduleForm.handleSubmit(onSaveSchedule)}>
          <div className="divide-y divide-gray-100">
            {WEEK_DAYS.map((day, index) => {
              const isActive = scheduleForm.watch(`entries.${index}.activo`);
              return (
                <div key={day} className="grid gap-3 py-3 sm:grid-cols-[minmax(120px,1fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)] sm:items-center">
                  <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
                    <input type="hidden" {...scheduleForm.register(`entries.${index}.diaSemana`, { valueAsNumber: true })} />
                    <input
                      type="checkbox"
                      {...scheduleForm.register(`entries.${index}.activo`)}
                      className="h-4 w-4 rounded border-gray-300 accent-[#327fa5] focus:ring-[#327fa5]"
                    />
                    {day}
                  </label>
                  <label className="grid grid-cols-[65px_1fr] items-center gap-2 text-sm text-gray-600">
                    <span>Desde</span>
                    <input
                      type="time"
                      step={1800}
                      disabled={!isActive}
                      {...scheduleForm.register(`entries.${index}.horaInicio`)}
                      aria-label={`${day}: hora de inicio`}
                      className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    {scheduleForm.formState.errors.entries?.[index]?.horaInicio?.message && <span role="alert" className="col-span-2 text-xs text-red-700">{scheduleForm.formState.errors.entries[index]?.horaInicio?.message}</span>}
                  </label>
                  <label className="grid grid-cols-[65px_1fr] items-center gap-2 text-sm text-gray-600">
                    <span>Hasta</span>
                    <input
                      type="time"
                      step={1800}
                      disabled={!isActive}
                      {...scheduleForm.register(`entries.${index}.horaFin`)}
                      aria-label={`${day}: hora de fin`}
                      className="h-11 rounded-md border border-gray-300 px-3 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    {scheduleForm.formState.errors.entries?.[index]?.horaFin?.message && <span role="alert" className="col-span-2 text-xs text-red-700">{scheduleForm.formState.errors.entries[index]?.horaFin?.message}</span>}
                  </label>
                  {scheduleForm.formState.errors.entries?.[index]?.message && <p role="alert" className="text-xs text-red-700 sm:col-span-3">{scheduleForm.formState.errors.entries[index]?.message}</p>}
                </div>
              );
            })}
          </div>
          {scheduleForm.formState.errors.entries?.message && <p role="alert" className="mt-3 text-sm text-red-700">{scheduleForm.formState.errors.entries.message}</p>}
          <button
            type="submit"
            disabled={scheduleForm.formState.isSubmitting}
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2e2e2e] px-5 text-sm font-semibold text-white transition hover:bg-[#444] disabled:opacity-60"
          >
            {scheduleForm.formState.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            Guardar horario semanal
          </button>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.8fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#fcc238]/20 text-[#80600b]">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bloqueos puntuales</p>
                <h2 className="text-lg font-semibold capitalize">{getMonthLabel(monthKey)}</h2>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" aria-label="Mes anterior" onClick={() => changeMonth(-1)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Mes siguiente" onClick={() => changeMonth(1)} className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase text-gray-500">
            {weekdayLabels.map((day) => <span key={day} className="py-2">{day}</span>)}
          </div>
          <div className="relative grid grid-cols-7 gap-1.5 sm:gap-2">
            {loadingMonth && <div className="absolute inset-0 z-10 animate-pulse rounded-xl bg-white/70" aria-label="Cargando calendario" />}
            {calendarDates.map((item, index) => {
              if (!item) return <span key={`empty-${index}`} aria-hidden="true" />;
              const blockedCount = occupiedBlocks.filter((block) => block.fecha === item.dateKey).length;
              const isSelected = selectedDate === item.dateKey;
              const isPast = item.dateKey < todayKey;
              return (
                <button
                  key={item.dateKey}
                  type="button"
                  onClick={() => selectDate(item.dateKey)}
                  aria-pressed={isSelected}
                  aria-label={`${item.day} de ${getMonthLabel(monthKey)}${blockedCount ? `, ${blockedCount} bloqueos` : ""}`}
                  className={`relative flex aspect-square min-h-11 items-center justify-center rounded-lg text-sm font-medium transition ${isSelected ? "bg-[#2e2e2e] text-white" : "text-gray-800 hover:bg-gray-100"} ${isPast ? "text-gray-400" : ""}`}
                >
                  {item.day}
                  {blockedCount > 0 && <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${isSelected ? "bg-[#fcc238]" : "bg-[#b27b00]"}`} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs leading-5 text-gray-500">Seleccioná un día para consultar sus bloqueos o marcar un rango como ocupado.</p>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">{selectedDate ? formatDate(selectedDate) : "Seleccioná un día"}</h2>
            <p className="mt-1 text-sm text-gray-600">Horarios marcados como ocupados</p>
            {selectedDayBlocks.length ? (
              <ul className="mt-4 space-y-2">
                {selectedDayBlocks.map((block) => (
                  <li key={block.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#604600]">{block.horaInicio}–{block.horaFin}</p>
                      {block.motivo && <p className="mt-0.5 truncate text-xs text-gray-600">{block.motivo}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteBlock(block.id)}
                      disabled={pendingBlockId === block.id}
                      aria-label={`Eliminar bloqueo de ${block.horaInicio} a ${block.horaFin}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-gray-600 transition hover:bg-white hover:text-red-700 disabled:opacity-50"
                    >
                      {pendingBlockId === block.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">No hay bloqueos para esta fecha.</p>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Marcar horario ocupado</h2>
            {selectedDaySchedule?.activo ? (
              <form onSubmit={blockForm.handleSubmit(onCreateBlock)} className="mt-4 space-y-4">
                <input type="hidden" {...blockForm.register("fecha")} />
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">
                    <span>Desde</span>
                    <input type="time" step={1800} min={startMin} max={endMax} {...blockForm.register("horaInicio")} className="h-11 w-full rounded-md border border-gray-300 px-3" />
                    {blockForm.formState.errors.horaInicio?.message && <span role="alert" className="block text-xs text-red-700">{blockForm.formState.errors.horaInicio.message}</span>}
                  </label>
                  <label className="space-y-1.5 text-sm font-medium text-gray-700">
                    <span>Hasta</span>
                    <input type="time" step={1800} min={startMin} max={endMax} {...blockForm.register("horaFin")} className="h-11 w-full rounded-md border border-gray-300 px-3" />
                    {blockForm.formState.errors.horaFin?.message && <span role="alert" className="block text-xs text-red-700">{blockForm.formState.errors.horaFin.message}</span>}
                  </label>
                </div>
                <label className="block space-y-1.5 text-sm font-medium text-gray-700">
                  <span>Motivo interno <span className="font-normal text-gray-500">(opcional)</span></span>
                  <input type="text" maxLength={160} placeholder="Ej.: audiencia o reunión" {...blockForm.register("motivo")} className="h-11 w-full rounded-md border border-gray-300 px-3" />
                </label>
                {blockForm.formState.errors.root?.message && <p role="alert" className="text-sm text-red-700">{blockForm.formState.errors.root.message}</p>}
                <button type="submit" disabled={blockForm.formState.isSubmitting || !selectedDate || selectedDate < todayKey} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#9a6c00] px-4 text-sm font-semibold text-white transition hover:bg-[#805900] disabled:cursor-not-allowed disabled:opacity-50">
                  {blockForm.formState.isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                  Guardar bloqueo
                </button>
              </form>
            ) : (
              <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-600">
                No hay un horario base activo para este día. Configuralo arriba para poder agregar bloqueos.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function nextHalfHour(start: string, end: string) {
  const [hour, minute] = start.split(":").map(Number);
  const endMinutes = Number(end.split(":")[0]) * 60 + Number(end.split(":")[1]);
  const next = hour * 60 + minute + 30;
  const value = Math.min(next, endMinutes);
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
