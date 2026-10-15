import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, "Usá intervalos de 30 minutos.");

const scheduleEntrySchema = z.object({
  diaSemana: z.number().int().min(0).max(6),
  horaInicio: timeSchema,
  horaFin: timeSchema,
  activo: z.boolean(),
}).refine(
  (entry) => !entry.activo || entry.horaInicio < entry.horaFin,
  { message: "La hora de fin debe ser posterior a la hora de inicio." },
);

export const weeklyScheduleSchema = z.object({
  entries: z.array(scheduleEntrySchema).length(7),
}).refine(
  ({ entries }) => new Set(entries.map((entry) => entry.diaSemana)).size === 7,
  { message: "Debe configurarse una única entrada para cada día de la semana." },
);

const validDateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((dateKey) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateKey;
}, "La fecha no es válida.");

export const occupiedBlockSchema = z.object({
  fecha: validDateKey,
  horaInicio: timeSchema,
  horaFin: timeSchema,
  motivo: z.string().trim().max(160, "El motivo admite hasta 160 caracteres.").optional(),
}).refine(
  (block) => block.horaInicio < block.horaFin,
  { message: "La hora de fin debe ser posterior a la hora de inicio." },
);

export const deleteOccupiedBlockSchema = z.object({
  id: z.string().min(1).max(40),
});

export type WeeklyScheduleValues = z.infer<typeof weeklyScheduleSchema>;
export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
export type OccupiedBlockValues = z.infer<typeof occupiedBlockSchema>;
