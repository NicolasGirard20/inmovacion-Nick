// =============================================================
// src/app/api/proveedores/[id]/route.ts
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proveedorSchema } from "@/lib/zod";

// ================================
// GET por ID
// ================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  const proveedor = await db.proveedor.findUnique({
    where: { id_proveedor: id },
  });

  if (!proveedor) {
    return NextResponse.json(
      { error: "Proveedor no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(proveedor);
}

// ================================
// PUT (actualizar)
// ================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID inválido" },
        { status: 400 }
      );
    }

    const json = await req.json();
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

    const proveedor = await db.proveedor.update({
      where: { id_proveedor: id },
      data: {
        ...data,
        tipoServicioId: Number(data.tipoServicioId),
      },
    });

    return NextResponse.json({ success: true, proveedor });

  } catch (err: any) {
    console.error("Error actualizando proveedor:", err);

    return NextResponse.json(
      { success: false, message: "Error interno" },
      { status: 500 }
    );
  }
}
