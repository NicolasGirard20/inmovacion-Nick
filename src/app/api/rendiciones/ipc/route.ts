/* eslint-disable @typescript-eslint/no-explicit-any */
// rendiciones/ipc/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";

// Tipos para validar entrada
interface IPCEntrada {
  mes: number;
  anio: number;
  valor: number;
  fuente: string;
  fechaConsulta: string;
}

// =====================================================
// GET — Traer todos los IPC ordenados por año y mes
// =====================================================
export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const datos = await db.ipc.findMany({
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    });

    return NextResponse.json({ datos });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ datos: [], error });
  }
}

// =====================================================
// POST — Guardar o actualizar múltiples IPC
// =====================================================
export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const nuevosDatos = (await req.json()) as IPCEntrada[];

    const created = await Promise.all(
      nuevosDatos.map((d) =>
        db.ipc.upsert({
          where: {
            mes_anio: { mes: d.mes, anio: d.anio },
          },
          update: {
            valor: d.valor / 100,
            fuente: d.fuente,
            fechaConsulta: new Date(d.fechaConsulta),
          },
          create: {
            mes: d.mes,
            anio: d.anio,
            valor: d.valor / 100,
            fuente: d.fuente,
            fechaConsulta: new Date(d.fechaConsulta),
          },
        })
      )
    );

    return NextResponse.json({ success: true, count: created.length });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ success: false, error });
  }
}

// =====================================================
// DELETE — Eliminar un registro IPC por ID
// =====================================================
export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const idStr = searchParams.get("id");

    if (!idStr) {
      return NextResponse.json({
        success: false,
        error: "Falta el parámetro ID",
      });
    }

    const id = Number(idStr);
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: "ID inválido",
      });
    }

    await db.ipc.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ success: false, error });
  }
}

// PUT — actualizar IPC existente
export async function PUT(req: NextRequest) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {

    const { id, valor, fuente, fechaConsulta } = await req.json();

    if (id === undefined || id === null) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    let valorParsed: number | undefined = undefined;

    if (valor !== undefined) {
      valorParsed = Number(valor) / 100;

      if (isNaN(valorParsed)) {
        return NextResponse.json(
          { error: "Valor inválido" },
          { status: 400 }
        );
      }
    }

    const existing = await db.ipc.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "IPC no encontrado" },
        { status: 404 }
      );
    }

    const updated = await db.ipc.update({
      where: { id: Number(id) },
      data: {
        valor: valorParsed,
        fuente: fuente ?? undefined,
        fechaConsulta: fechaConsulta
          ? new Date(fechaConsulta)
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error: any) {

    console.error("Error updating IPC:", error);

    return NextResponse.json(
      {
        error: "Error actualizando IPC",
        detail: error.message,
      },
      { status: 500 }
    );
  }
}
