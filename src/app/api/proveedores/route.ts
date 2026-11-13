// =============================================================
// src/app/api/proveedores/route.ts
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proveedorSchema } from "@/lib/zod";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";

// =============================================================
// GET → Obtener todos los proveedores activos
// =============================================================
export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const proveedores = await db.proveedor.findMany({
      where: { estado: true },
      include: {
        tipoServicio: true,
      },
      orderBy: {
        id_proveedor: "desc",
      },
    });

    return NextResponse.json(proveedores);

  } catch (error) {
    console.error("Error obteniendo proveedores:", error);

    return NextResponse.json(
      { success: false, message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// =============================================================
// POST → Crear nuevo proveedor
// =============================================================
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const json = await req.json();

    // 🔥 Aseguramos que tipoServicioId sea string antes de validar con Zod
    if (json.tipoServicioId !== undefined && json.tipoServicioId !== null) {
      json.tipoServicioId = String(json.tipoServicioId);
    }

    const parsed = proveedorSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0].message,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const proveedor = await db.proveedor.create({
      data: {
        ...data,
        tipoServicioId: Number(data.tipoServicioId),
        estado: true,
      },
      include: {
        tipoServicio: true,
      },
    });

    return NextResponse.json({
      success: true,
      proveedor,
    });

  } catch (err: any) {
    console.error("Error creando proveedor:", err);

    if (err.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "Ya existe un proveedor con ese CUIT/CUIL",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
