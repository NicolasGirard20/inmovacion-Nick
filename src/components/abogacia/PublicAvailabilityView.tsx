"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MessageCircle } from "lucide-react";
import type { AvailabilityDay } from "@/lib/abogacia/availability-types";

type PublicAvailability = {
  currentMonthKey: string;
  nextMonthKey: string;
  todayKey: string;
  days: AvailabilityDay[];
};

function monthTitle(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)));
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

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

function whatsappLink(dateKey?: string, slot?: { inicio: string; fin: string }) {
  const detail = dateKey
    ? `Quisiera consultar por un turno${slot ? ` el ${formatDate(dateKey)} a las ${slot.inicio}` : ` para el ${formatDate(dateKey)}`}.`
    : "Quisiera consultar por un turno para una consulta legal.";
  return `https://wa.me/5493434612497?text=${encodeURIComponent(detail)}`;
}

export function PublicAvailabilityView({ availability }: { availability: PublicAvailability }) {
  const [monthKey, setMonthKey] = useState(availability.currentMonthKey);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const daysByDate = useMemo(() => new Map(availability.days.map((day) => [day.fecha, day])), [availability.days]);
  const displayedDates = getCalendarDates(monthKey);
  const selectedDay = selectedDate ? daysByDate.get(selectedDate) : undefined;
  const hasAnyAvailability = availability.days.some((day) => day.horarios.length > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
      <section aria-label="Calendario de disponibilidad" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#686363]">Horarios disponibles</p>
            <h2 className="mt-1 text-xl font-semibold capitalize">{monthTitle(monthKey)}</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Mes anterior"
              disabled={monthKey === availability.currentMonthKey}
              onClick={() => setMonthKey(availability.currentMonthKey)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Mes siguiente"
              disabled={monthKey === availability.nextMonthKey}
              onClick={() => setMonthKey(availability.nextMonthKey)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-[#777]">
          {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((day) => <span key={day} className="py-2">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {displayedDates.map((item, index) => {
            if (!item) return <span key={`empty-${index}`} aria-hidden="true" />;
            const dayAvailability = daysByDate.get(item.dateKey);
            const available = Boolean(dayAvailability?.horarios.length);
            const isPast = item.dateKey < availability.todayKey;
            const isSelected = selectedDate === item.dateKey;
            return (
              <button
                key={item.dateKey}
                type="button"
                disabled={!available || isPast}
                aria-pressed={isSelected}
                aria-label={`${item.day} de ${monthTitle(monthKey)}${available ? `, ${dayAvailability?.horarios.length} horarios disponibles` : ", sin horarios disponibles"}`}
                onClick={() => setSelectedDate(item.dateKey)}
                className={`relative flex aspect-square min-h-11 items-center justify-center rounded-lg text-sm font-medium transition ${
                  isSelected
                    ? "bg-[#2e2e2e] text-white"
                    : available
                      ? "bg-[#fff8e6] text-[#604600] hover:bg-[#ffedbd]"
                      : "cursor-not-allowed text-gray-400"
                }`}
              >
                {item.day}
                {available && !isSelected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-[#c38c00]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-[#686363]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c38c00]" aria-hidden="true" />
          Día con horarios para consultar
        </div>
      </section>

      <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fcc238]/20 text-[#80600b]">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">{selectedDay ? formatDate(selectedDay.fecha) : "Elegí un día"}</h2>
            <p className="text-sm text-[#686363]">Turnos en bloques de 30 minutos</p>
          </div>
        </div>

        {selectedDay?.horarios.length ? (
          <div className="mt-5">
            <p className="mb-3 text-sm text-[#686363]">Horarios disponibles para consultar:</p>
            <div className="grid grid-cols-2 gap-2">
              {selectedDay.horarios.map((slot) => (
                <a
                  key={`${slot.inicio}-${slot.fin}`}
                  href={whatsappLink(selectedDay.fecha, slot)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-[#e5c76e] bg-[#fffaf0] px-3 text-sm font-semibold text-[#604600] transition hover:bg-[#fff2cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a6c00]"
                >
                  {slot.inicio}
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#686363]">Al seleccionar un horario, se abrirá WhatsApp para coordinar la consulta con el estudio.</p>
          </div>
        ) : (
          <div className="py-7 text-sm leading-6 text-[#686363]">
            {selectedDate
              ? "No hay horarios disponibles para este día. Podés elegir otra fecha o consultar directamente con el estudio."
              : hasAnyAvailability
                ? "Seleccioná un día marcado en el calendario para ver sus horarios."
                : "Todavía no hay horarios publicados. Consultá directamente con el estudio."}
          </div>
        )}

        <a
          href={whatsappLink(selectedDate ?? undefined)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#2e2e2e] px-4 text-sm font-semibold text-white transition hover:bg-[#444] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a6c00] focus-visible:ring-offset-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Consultar por WhatsApp
        </a>
        <p className="mt-4 flex items-center gap-2 text-xs text-[#777]">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          La disponibilidad puede cambiar al coordinar el turno.
        </p>
      </aside>
    </div>
  );
}
