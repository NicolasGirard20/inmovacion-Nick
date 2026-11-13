// src/actions/user-actions.ts
'use server';

import { db } from "@/lib/db";
import { auth } from "../../auth";
import { getAdminSession } from "@/lib/auth-guards";
import bcrypt from "bcryptjs";

export async function deactivateUser(id: string) {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("No autorizado");
  }
  if (session.user.id === id) {
    throw new Error("No puedes desactivar tu propio usuario");
  }

  await db.user.update({
    where: { id },
    data: { status: "inactive" },
  });
  return { success: true };
}

export async function activateUser(id: string) {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("No autorizado");
  }

  await db.user.update({
    where: { id },
    data: { status: "active" },
  });
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("No autorizado");
  }
  if (session.user.id === id) {
    throw new Error("No puedes eliminar tu propio usuario");
  }

  await db.user.delete({
    where: { id },
  });
  return { success: true };
}

export async function getUserById(id: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }

  // Solo admins pueden ver cualquier usuario; no-admins solo el propio
  if (session.user.role !== "admin" && session.user.id !== id) {
    throw new Error("No autorizado para ver este usuario");
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return {
    id: user.id,
    name: user.name || "Sin nombre",
    email: user.email,
    phone: user.phone || "No registrado",
    role: user.role,
    status: user.status || "active",
    image: user.image || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getActiveUsers() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("No autenticado");
  }

  const users = await db.user.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name || user.email || "Usuario desconocido",
  }));
}

export async function updateUser(id: string, data: { name: string; email: string; phone: string; role: "user" | "admin" }) {
  const session = await auth();
  console.log("updateUser - Session:", session);
  if (!session?.user) {
    console.log("updateUser - No autenticado");
    throw new Error("No autenticado");
  }

  // Fetch del usuario actual para validar cambios
  const currentUser = await db.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!currentUser) {
    console.log("updateUser - User not found for ID:", id);
    throw new Error("Usuario no encontrado");
  }

  // Validación de permisos
  if (session.user.role !== "admin") {
    // No-admins solo editan su propio perfil
    if (session.user.id !== id) {
      console.log("updateUser - No autorizado: session.user.id:", session.user.id, "requested id:", id);
      throw new Error("No autorizado para editar este usuario");
    }
    // No-admins no pueden cambiar role
    if (data.role !== currentUser.role) {
      console.log("updateUser - No autorizado para cambiar rol");
      throw new Error("No autorizado para cambiar el rol");
    }
  }

  // Procede con la actualización
  await db.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    },
  });
  console.log("updateUser - User updated successfully for ID:", id);
  return { success: true };
}

export async function changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
  console.log("changePassword - userId:", userId);
  const session = await auth();
  console.log("changePassword - Session:", session);
  if (!session?.user) {
    console.log("changePassword - No autenticado");
    throw new Error("No autenticado");
  }

  // Solo el propio usuario puede cambiar su contraseña
  if (session.user.id !== userId) {
    console.log("changePassword - No autorizado: session.user.id:", session.user.id, "requested id:", userId);
    throw new Error("No autorizado para cambiar la contraseña de este usuario");
  }

  // Obtener hash de contraseña directamente en servidor sin exponerlo en getUserById
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Verificar si el usuario tiene una contraseña configurada
  if (!user.password) {
    throw new Error("Este usuario no tiene una contraseña configurada (posible autenticación externa)");
  }

  // Verificar la contraseña actual
  const isValid = await bcrypt.compare(data.currentPassword, user.password);
  console.log("changePassword - Current password valid:", isValid);
  if (!isValid) {
    console.log("changePassword - Current password incorrect for user ID:", userId);
    throw new Error("La contraseña actual es incorrecta");
  }

  // Hashear la nueva contraseña
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  console.log("changePassword - New password hashed for user ID:", userId);

  // Actualizar la contraseña
  await db.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
  console.log("changePassword - Password updated successfully for user ID:", userId);

  return { success: true };
}