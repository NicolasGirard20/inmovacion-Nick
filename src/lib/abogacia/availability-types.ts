export const WEEK_DAYS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export type AvailabilitySlot = { inicio: string; fin: string };
export type AvailabilityDay = { fecha: string; horarios: AvailabilitySlot[] };
export type ScheduleDay = {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
};
export type OccupiedBlock = {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string | null;
};
