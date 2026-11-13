/* eslint-disable @typescript-eslint/no-explicit-any */
// ===============================================
// src/actions/pagos/pagos-actions.ts
// Acciones CRUD para pagos — con validaciones y FIX Decimal
// ===============================================

"use server";

import { db } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth-guards";

// Validaciones backend (las mismas del POST /api/pagos)
import {
  validateConcepto,
  validateMonto,
  validateResponsable,
  validateComprobante,
} from "@/actions/pagos/validaciones";

// ---------------------------------------------
// Convertir Prisma Decimal a number plano
// ---------------------------------------------
function serialize(obj: any) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      value?.toNumber instanceof Function ? value.toNumber() : value
    )
  );
}

// =======================
// OBTENER TODOS LOS PAGOS
// =======================
export async function getPagos() {
  const session = await getAuthenticatedSession();
  if (!session) return [];

  try {
    const pagos = await db.pagoProveedor.findMany({
      where: { estado: true },
      include: {
        proveedor: true,
        medioPago: true,
        estadoPago: true,
      },
      orderBy: { id_pago: "desc" },
    });

    return serialize(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    return [];
  }
}

// =======================
// OBTENER PAGO POR ID
// =======================
export async function getPagoById(id_pago: number) {
  const session = await getAuthenticatedSession();
  if (!session) return null;

  try {
    const pago = await db.pagoProveedor.findUnique({
      where: { id_pago },
      include: {
        proveedor: true,
        medioPago: true,
        estadoPago: true,
      },
    });

    return serialize(pago);
  } catch (error) {
    console.error("Error al obtener pago:", error);
    return null;
  }
}

// =======================
// CREAR PAGO
// =======================
export async function createPago(data: any) {
  const session = await getAuthenticatedSession();
  if (!session) return { success: false, message: "No autenticado" };

  try {
    // ======================
    // VALIDACIONES BACKEND
    // ======================

    const errConcepto = validateConcepto(data.concepto);
    if (errConcepto)
      return { success: false, message: errConcepto };

    const errMonto = validateMonto(data.importe);
    if (errMonto)
      return { success: false, message: errMonto };

    const errResp = validateResponsable(data.responsable);
    if (errResp)
      return { success: false, message: errResp };

    const errComp = validateComprobante(data.comprobante);
    if (errComp)
      return { success: false, message: errComp };

    // CREAR PAGO
    const pago = await db.pagoProveedor.create({
      data: {
        proveedorId: Number(data.proveedorId),
        medioPagoId: Number(data.medioPagoId),
        estadoPagoId: Number(data.estadoPagoId),
        concepto: data.concepto.trim(),
        importe: Number(data.importe),
        comprobante: data.comprobante?.trim() || null,
        responsable: data.responsable.trim(),
        fecha_pago: data.fecha_pago ? new Date(data.fecha_pago) : new Date(),
        estado: true,
      },
    });

    return { success: true, pago: serialize(pago) };

  } catch (error) {
    console.error("Error al crear pago:", error);
    return { success: false, message: "No se pudo crear el pago" };
  }
}

// =======================
// ACTUALIZAR PAGO
// =======================
export async function updatePago(id_pago: number, data: any) {
  const session = await getAuthenticatedSession();
  if (!session) return { success: false, message: "No autenticado" };

  try {
    // ======================
    // VALIDACIONES BACKEND
    // ======================

    const errConcepto = validateConcepto(data.concepto);
    if (errConcepto)
      return { success: false, message: errConcepto };

    const errMonto = validateMonto(data.importe);
    if (errMonto)
      return { success: false, message: errMonto };

    const errResp = validateResponsable(data.responsable);
    if (errResp)
      return { success: false, message: errResp };

    const errComp = validateComprobante(data.comprobante);
    if (errComp)
      return { success: false, message: errComp };

    // ======================
    // UPDATE EN LA DB
    // ======================

    const pago = await db.pagoProveedor.update({
      where: { id_pago },
      data: {
        proveedorId: Number(data.proveedorId),
        medioPagoId: Number(data.medioPagoId),
        estadoPagoId: Number(data.estadoPagoId),
        concepto: data.concepto.trim(),
        importe: Number(data.importe),
        responsable: data.responsable.trim(),
        comprobante: data.comprobante?.trim() || null,

        // ⚠ IMPORTANTE:
        // NO modificamos fecha_pago en EDITAR
      },
    });

    return { success: true, pago: serialize(pago) };

  } catch (error) {
    console.error("Error al actualizar pago:", error);
    return { success: false, message: "No se pudo actualizar el pago" };
  }
}

// =======================
// SOFT DELETE
// =======================
export async function deletePago(id: number) {
  const session = await getAuthenticatedSession();
  if (!session) return { success: false, message: "No autenticado" };

  try {
    const pago = await db.pagoProveedor.update({
      where: { id_pago: id },
      data: {
        estado: false,
      },
    });

    return { success: true, pago: serialize(pago) };
  } catch (error) {
    console.error("Error desactivando pago:", error);
    return { success: false, message: "Error al desactivar pago" };
  }
}
