/* eslint-disable @typescript-eslint/no-explicit-any */
// Archivo: app/api/cobranzas/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "../../../../../auth";

/* =====================================================
   GET — obtener una cobranza por ID
   ===================================================== */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const id_cobranza = Number(id);

  // Validamos que sea un número válido
  if (isNaN(id_cobranza))
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  try {
    // Buscamos la cobranza en la BD y traemos también relaciones
    const cobranza = await db.cobranza.findUnique({
      where: { id_cobranza },
      include: {
        cliente: true, // une información del cliente
        inmueble: { include: { ubicacion: true } }, 
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Si no existe la cobranza → error 404
    if (!cobranza)
      return NextResponse.json(
        { error: "Cobranza no encontrada." },
        { status: 404 }
      );

    // Creamos un objeto "mapeado" para enriquecer los datos
    const mapped = {
      ...cobranza,
        createdBy: cobranza.createdBy
          ? {
              id_usuario: cobranza.createdBy.id,
              nombre: cobranza.createdBy.name || cobranza.createdBy.email,
            }
          : null,
        updatedBy: cobranza.updatedBy
          ? {
              id_usuario: cobranza.updatedBy.id,
              nombre: cobranza.updatedBy.name || cobranza.updatedBy.email,
            }
          : null,
      inmueble: cobranza.inmueble
        ? {
            ...cobranza.inmueble,
            // Creamos un "nombre completo" concatenando título y dirección
            nombre:
              cobranza.inmueble.titulo +
              (cobranza.inmueble.ubicacion?.direccion
                ? ` - ${cobranza.inmueble.ubicacion.direccion}`
                : ""),
          }
        : null,
    };

    // Devolvemos la cobranza formateada
    return NextResponse.json({ cobranza: mapped });
  } catch (error) {
    console.error("❌ Error GET /cobranzas/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener cobranza." },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE — eliminar una cobranza por ID
   (solo si está INACTIVA)
   ===================================================== */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const id_cobranza = Number(id);

  // Validación del ID
  if (isNaN(id_cobranza)) {
    return NextResponse.json(
      { error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    // Buscamos la cobranza
    const cobranza = await db.cobranza.findUnique({
      where: { id_cobranza },
    });

    if (!cobranza) {
      return NextResponse.json(
        { error: "Cobranza no encontrada." },
        { status: 404 }
      );
    }

    // 🚫 REGLA DE NEGOCIO: no se puede eliminar si está activa
    if (cobranza.activa) {
      return NextResponse.json(
        { error: "No se puede eliminar una cobranza activa. Primero desactívela." },
        { status: 409 } // conflicto de estado
      );
    }

    // ✅ Eliminamos solo si está inactiva
    await db.cobranza.delete({
      where: { id_cobranza },
    });

    return NextResponse.json({
      message: "Cobranza eliminada correctamente.",
    });
  } catch (error) {
    console.error("❌ Error DELETE /cobranzas/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar la cobranza." },
      { status: 500 }
    );
  }
}


/* =====================================================
   PUT — actualizar una cobranza existente
   ===================================================== */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const id_cobranza = Number(id);

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const user =
    (await db.user.findUnique({ where: { id: userId } })) ??
    (await db.user.create({
      data: {
        id: userId,
        name: session.user.name ?? "Usuario",
        email: session.user.email ?? `user_${userId}@example.com`,
      },
    }));



  if (isNaN(id_cobranza))
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  try {
    // Verificamos que la cobranza exista
    const existente = await db.cobranza.findUnique({
      where: { id_cobranza },
    });

    if (!existente)
      return NextResponse.json(
        { error: "Cobranza no encontrada." },
        { status: 404 }
      );

    // Obtenemos cuerpo enviado desde el cliente
    const body = await req.json();

    // Creamos un objeto donde solo agregaremos los campos enviados
    const dataToUpdate: any = {};

    // Validaciones y asignaciones campo por campo
    if ("id_cliente" in body)
      dataToUpdate.id_cliente = Number(body.id_cliente);

    // Si viene id_contrato, buscamos ese contrato
    if ("id_contrato" in body && body.id_contrato) {
      const contrato = await db.contrato.findUnique({
        where: { id_contrato: Number(body.id_contrato) },
        include: { inmueble: true }, // obtenemos el inmueble asociado
      });

      dataToUpdate.id_contrato = Number(body.id_contrato);

      // Asociamos automáticamente el inmueble del contrato
      dataToUpdate.id_inmueble = contrato?.inmueble?.id_inmueble || null;
    }

    if ("monto" in body) dataToUpdate.monto = Number(body.monto);
    if ("medio_pago" in body) dataToUpdate.medio_pago = body.medio_pago;
    if ("concepto" in body) dataToUpdate.concepto = body.concepto;

    if ("observaciones" in body)
      dataToUpdate.observaciones = body.observaciones ?? null;

    // Parseamos la fecha (viene como "YYYY-MM-DD")
    if ("fecha_cobranza" in body && body.fecha_cobranza) {
      const [y, m, d] = body.fecha_cobranza.split("-").map(Number);
      dataToUpdate.fecha_cobranza = new Date(y, m - 1, d, 12, 0, 0);
      // Se setea a las 12:00 para evitar desfases por timezone
    }

    if ("activa" in body) dataToUpdate.activa = Boolean(body.activa);

    dataToUpdate.updatedById = user.id;


    // Ejecutamos la actualización
    const updated = await db.cobranza.update({
      where: { id_cobranza },
      data: dataToUpdate,
      include: {
        cliente: true,
        inmueble: { include: { ubicacion: true } },
      },
    });

    // Mapeamos nuevamente para agregar el nombre del inmueble
    const mapped = {
      ...updated,
      inmueble: updated.inmueble
        ? {
            ...updated.inmueble,
            nombre:
              updated.inmueble.titulo +
              (updated.inmueble.ubicacion?.direccion
                ? ` - ${updated.inmueble.ubicacion.direccion}`
                : ""),
          }
        : null,
    };

    return NextResponse.json({ updated: mapped });
  } catch (error) {
    console.error("❌ Error PUT /cobranzas/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar." },
      { status: 500 }
    );
  }
}
