/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { db } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth-guards";

// =======================
// CREAR PROVEEDOR
// =======================
export async function createProveedor(data: any) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const proveedor = await db.proveedor.create({
      data: {
        ...data,
        tipoServicioId: Number(data.tipoServicioId),
        estado: true,
      },
    });

    return { success: true, proveedor };
  } catch (error: any) {
    console.error("Error al crear proveedor:", error);

    if (error.code === "P2002") {
      return { success: false, error: "CUIT/CUIL duplicado" };
    }

    return { success: false, error: "Error al crear proveedor" };
  }
}

// =======================
// ACTUALIZAR PROVEEDOR
// =======================
export async function updateProveedor(id_proveedor: number, data: any) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, error: "No autenticado" };
  }

  try {
    const proveedor = await db.proveedor.update({
      where: { id_proveedor },
      data: {
        ...data,
        tipoServicioId: Number(data.tipoServicioId),
      }
    });

    return { success: true, proveedor };
  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    return { success: false, error: "No se pudo actualizar el proveedor" };
  }
}

// =======================
// SOFT DELETE
// =======================
export async function softDeleteProveedor(id_proveedor: number) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, error: "No autenticado" };
  }

  try {
    await db.proveedor.update({
      where: { id_proveedor },
      data: { estado: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Error eliminando proveedor:", error);
    return { success: false, error: "No se pudo eliminar el proveedor" };
  }
}

// =======================
// OBTENER POR ID
// =======================
export async function getProveedorById(id_proveedor: number) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return null;
  }

  try {
    return await db.proveedor.findUnique({
      where: { id_proveedor },
      include: { tipoServicio: true },
    });
  } catch (error) {
    console.error("Error obtener proveedor:", error);
    return null;
  }
}
