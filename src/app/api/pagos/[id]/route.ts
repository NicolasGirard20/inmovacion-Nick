// src/app/api/pagos/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// FIX Decimal → number
function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      value?.toNumber instanceof Function ? value.toNumber() : value
    )
  );
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ===============================
// GET — Obtener Pago
// ===============================
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const pago = await db.pagoProveedor.findUnique({
      where: { id_pago: id },
      include: {
        proveedor: true,
        medioPago: true,
        estadoPago: true,
      },
    });

    return NextResponse.json(serialize(pago));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener pago" }, { status: 500 });
  }
}

// ===============================
// PUT — Actualizar Pago
// ===============================
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);
    const data = await req.json();

    const pago = await db.pagoProveedor.update({
      where: { id_pago: id },
      data: {
        concepto: data.concepto?.trim(),
        importe: Number(data.importe),
        medioPagoId: Number(data.medioPagoId),
        estadoPagoId: Number(data.estadoPagoId),
        comprobante: data.comprobante?.trim() || null,
        responsable: data.responsable?.trim(),
        fecha_pago: data.fecha_pago ? new Date(data.fecha_pago) : undefined,
      },
    });

    return NextResponse.json({ success: true, pago: serialize(pago) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 });
  }
}

// ===============================
// DELETE — Soft Delete
// ===============================
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = Number(idStr);

    const pago = await db.pagoProveedor.update({
      where: { id_pago: id },
      data: { estado: false },
    });

    return NextResponse.json({ success: true, pago: serialize(pago) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar pago" }, { status: 500 });
  }
}
