// Archivo: src/actions/getUsers.ts
// Descripción: Acción para obtener la lista de usuarios.
// Proyecto: inmovacion (GBS y Asociados), sistema inmobiliario.
'use server';
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth-guards";

export async function getUsers() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users;
}