//src/actions/proveedores/getProveedores.ts

'use server';

import { db } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth-guards";

// ========================================================
// Obtener proveedores — SOLO ACTIVOS
// ========================================================
export async function getProveedores() {
  const session = await getAuthenticatedSession();
  if (!session) {
    throw new Error("No autenticado");
  }

  try {
    const proveedores = await db.proveedor.findMany({
      where: { estado: true },  // 👈 SOLO ACTIVOS
      include: {
        tipoServicio: true,
      },
      orderBy: {
        id_proveedor: "desc",
      },
    });

    return proveedores;
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    throw new Error("No se pudieron obtener los proveedores");
  }
}
