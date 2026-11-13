//| src/app/api/pagos/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
// ===============================================
// API: Pagos a Proveedor (Listado y Creación)
// Ruta: /api/pagos
// ===============================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";

import {
  validateConcepto,
  validateMonto,
  validateResponsable,
  validateComprobante,
} from "@/actions/pagos/validaciones";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// -------------------------------
// FIX Decimal → number
// -------------------------------
function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      value?.toNumber instanceof Function ? value.toNumber() : value
    )
  );
}

// ===============================================
// GET — Listar todos los pagos activos
// ===============================================
export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const pagos = await db.pagoProveedor.findMany({
      where: { estado: true },
      orderBy: { fecha_pago: "desc" },
      include: {
        proveedor: true,
        medioPago: true,
        estadoPago: true,
      },
    });

    return NextResponse.json(serialize(pagos));
  } catch (error) {
    console.error("Error cargando pagos:", error);
    return NextResponse.json(
      { error: "Error al obtener pagos" },
      { status: 500 }
    );
  }
}

// ===============================================
// POST — Crear un pago
// ===============================================
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const data = await req.json();

    // ======================
    // VALIDACIONES BACKEND
    // ======================
    const errConcepto = validateConcepto(data.concepto);
    if (errConcepto)
      return NextResponse.json(
        { success: false, message: errConcepto },
        { status: 400 }
      );

    const errMonto = validateMonto(data.importe);
    if (errMonto)
      return NextResponse.json(
        { success: false, message: errMonto },
        { status: 400 }
      );

    const errResp = validateResponsable(data.responsable);
    if (errResp)
      return NextResponse.json(
        { success: false, message: errResp },
        { status: 400 }
      );

    const errComp = validateComprobante(data.comprobante);
    if (errComp)
      return NextResponse.json(
        { success: false, message: errComp },
        { status: 400 }
      );

    // ======================
    // FECHA — SIEMPRE AUTOMÁTICA
    // ======================
    let fechaPagoFinal = new Date(); // por defecto siempre hoy

    if (data.fecha_pago && !isNaN(Date.parse(data.fecha_pago))) {
      fechaPagoFinal = new Date(data.fecha_pago);
    }

    // ======================
    // CREAR EN LA DB
    // ======================
    const pago = await db.pagoProveedor.create({
      data: {
        proveedorId: Number(data.proveedorId),
        medioPagoId: Number(data.medioPagoId),
        estadoPagoId: Number(data.estadoPagoId),
        importe: Number(data.importe),
        concepto: data.concepto.trim(),
        comprobante: data.comprobante?.trim() || null,
        responsable: data.responsable.trim(),
        fecha_pago: fechaPagoFinal,
        estado: true,
      },
    });

    return NextResponse.json(
      { success: true, pago: serialize(pago) },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Error creando pago:", error);

    return NextResponse.json(
      { success: false, message: error?.message || "Error creando pago" },
      { status: 500 }
    );
  }
}
