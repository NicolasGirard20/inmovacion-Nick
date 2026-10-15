"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { db } from "@/lib/db";
import { getAdminAvailabilityData, getDateAtUtcMidnight, getDateKeyToday, getWeekdayForDateKey, timesOverlap } from "@/lib/abogacia/availability";
import { deleteOccupiedBlockSchema, occupiedBlockSchema, weeklyScheduleSchema } from "@/lib/abogacia/schemas";

async function isAdmin() {
  const session = await auth();
  return session?.user?.role === "admin" ? session : null;
}

export async function getAdminTurnosData(monthKey: string) {
  if (!(await isAdmin())) return null;
  try {
    return await getAdminAvailabilityData(monthKey);
  } catch {
    console.error("Error al cargar la disponibilidad administrativa.");
    return null;
  }
}

export async function saveWeeklySchedule(input: unknown) {
  if (!(await isAdmin())) return { success: false, message: "No tenés permisos para realizar esta acción." };

  const parsed = weeklyScheduleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revisá los horarios ingresados." };
  }

  try {
    await db.$transaction(parsed.data.entries.map((entry) => db.horarioBaseAbogacia.upsert({
      where: { diaSemana: entry.diaSemana },
      create: entry,
      update: {
        horaInicio: entry.horaInicio,
        horaFin: entry.horaFin,
        activo: entry.activo,
      },
    })));
    revalidatePath("/disponibilidad");
    revalidatePath("/abogacia/turnos");
    return { success: true, message: "El horario semanal quedó actualizado." };
  } catch {
    console.error("Error al guardar el horario base de abogacía.");
    return { success: false, message: "No se pudo guardar el horario base." };
  }
}

export async function createOccupiedBlock(input: unknown) {
  const session = await isAdmin();
  if (!session?.user?.id) return { success: false, message: "No tenés permisos para realizar esta acción." };

  const parsed = occupiedBlockSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revisá los datos del bloqueo." };
  }

  const { fecha, horaInicio, horaFin, motivo } = parsed.data;
  if (fecha < getDateKeyToday()) {
    return { success: false, message: "No se pueden bloquear horarios de días pasados." };
  }

  try {
    const weekday = getWeekdayForDateKey(fecha);
    const schedule = await db.horarioBaseAbogacia.findUnique({ where: { diaSemana: weekday } });
    if (!schedule?.activo || horaInicio < schedule.horaInicio || horaFin > schedule.horaFin) {
      return { success: false, message: "El rango debe estar dentro del horario base activo de ese día." };
    }

    const existingBlocks = await db.bloqueOcupadoAbogacia.findMany({
      where: { fecha: getDateAtUtcMidnight(fecha) },
      select: { horaInicio: true, horaFin: true },
    });
    if (existingBlocks.some((block) => timesOverlap(horaInicio, horaFin, block.horaInicio, block.horaFin))) {
      return { success: false, message: "El horario se superpone con otro bloqueo existente." };
    }

    await db.bloqueOcupadoAbogacia.create({
      data: {
        fecha: getDateAtUtcMidnight(fecha),
        horaInicio,
        horaFin,
        motivo: motivo || null,
        creadoPorId: session.user.id,
      },
    });
    revalidatePath("/disponibilidad");
    revalidatePath("/abogacia/turnos");
    return { success: true, message: "El horario quedó marcado como ocupado." };
  } catch {
    console.error("Error al crear un bloqueo de abogacía.");
    return { success: false, message: "No se pudo guardar el bloqueo." };
  }
}

export async function deleteOccupiedBlock(input: unknown) {
  if (!(await isAdmin())) return { success: false, message: "No tenés permisos para realizar esta acción." };

  const parsed = deleteOccupiedBlockSchema.safeParse(input);
  if (!parsed.success) return { success: false, message: "El bloqueo seleccionado no es válido." };

  try {
    await db.bloqueOcupadoAbogacia.delete({ where: { id: parsed.data.id } });
    revalidatePath("/disponibilidad");
    revalidatePath("/abogacia/turnos");
    return { success: true, message: "El bloqueo fue eliminado." };
  } catch {
    console.error("Error al eliminar un bloqueo de abogacía.");
    return { success: false, message: "No se pudo eliminar el bloqueo." };
  }
}
