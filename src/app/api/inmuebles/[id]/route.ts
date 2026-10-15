// src/app/api/inmuebles/[id]/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { InmuebleDTO } from "@/types/inmuebles";
import { Prisma } from "@/generated/prisma";
import { auth } from "../../../../../auth";

/* -------------------------------------------------------------
   Helpers
---------------------------------------------------------------- */

const toNumberOrUndefined = (v: any): number | undefined =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  !isNaN(Number(v))
    ? Number(v)
    : undefined;

const toDecimalOrUndefined = (v: any): Prisma.Decimal | undefined =>
  v !== undefined &&
  v !== null &&
  v !== "" &&
  !isNaN(Number(v))
    ? new Prisma.Decimal(Number(v))
    : undefined;

const normalize = (v: any) =>
  v === "" || v === null ? undefined : v;

/* ============================= GET ============================= */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const numId = Number(idStr);

  if (isNaN(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const inmueble = await db.inmueble.findUnique({
      where: { id_inmueble: numId },
      include: {
        tipo_inmueble: true,
        estado: true,
        operacion: true,
        cliente: {
  include: {
    tiposCliente: {
      include: {
        tipoCliente: true,
      },
    },
  },
},

        ubicacion: {
          include: {
            barrio: { include: { localidad: true } },
          },
        },
        imagenes: true,
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!inmueble) {
      return NextResponse.json(
        { error: "Inmueble no encontrado" },
        { status: 404 }
      );
    }

    const imagenes = inmueble.imagenes.map((img) => ({
      id: img.id,
      url: img.url,
      inmuebleId: img.inmuebleId,
      principal: Boolean(img.principal),
    }));

    const dto: InmuebleDTO = {
      id_inmueble: inmueble.id_inmueble,
      id_tipo_inmueble: inmueble.id_tipo_inmueble,
      id_ubicacion: inmueble.id_ubicacion,
      id_estado: inmueble.id_estado,
      id_cliente: inmueble.id_cliente,
      id_operacion: inmueble.id_operacion,

      titulo: inmueble.titulo,
      detalles: inmueble.detalles ?? undefined,
      archivado: Boolean(inmueble.archivado),

      precio: inmueble.precio !== null ? Number(inmueble.precio) : null,
      superficie_total: Number(inmueble.superficie_total),
      superficie_cubierta:
        inmueble.superficie_cubierta !== null
          ? Number(inmueble.superficie_cubierta)
          : null,

      cantidad_ambientes: inmueble.cantidad_ambientes,
      cantidad_banos: inmueble.cantidad_banos,
      cantidad_dormitorios: inmueble.cantidad_dormitorios,
      cantidad_cocheras: inmueble.cantidad_cocheras,
      cantidad_pisos: inmueble.cantidad_pisos,
      antiguedad: inmueble.antiguedad,

      foto: inmueble.foto,
      imagenes,
      fotoPrincipal:
        imagenes.find((i) => i.principal)?.url ||
        inmueble.foto ||
        "/placeholder.jpg",

      tipo_inmueble: inmueble.tipo_inmueble,
      estado: inmueble.estado,
      operacion: inmueble.operacion,
      cliente: inmueble.cliente,

      ubicacion: inmueble.ubicacion
    ? {
        id_ubicacion: inmueble.ubicacion.id_ubicacion,
        direccion: inmueble.ubicacion.direccion,
        ciudad: inmueble.ubicacion.ciudad,
        provincia: inmueble.ubicacion.provincia,
        id_barrio: inmueble.ubicacion.id_barrio,

        barrio:
          inmueble.ubicacion.barrio &&
          inmueble.ubicacion.barrio.localidad
            ? {
                id_barrio: inmueble.ubicacion.barrio.id_barrio,
                nombre: inmueble.ubicacion.barrio.nombre,
                id_localidad:
                  inmueble.ubicacion.barrio.localidad.id_localidad,
                localidad: {
                  id_localidad:
                    inmueble.ubicacion.barrio.localidad.id_localidad,
                  nombre:
                    inmueble.ubicacion.barrio.localidad.nombre,
                },
              }
            : undefined,
      }
    : undefined,

      createdAt: inmueble.createdAt?.toISOString(),
      updatedAt: inmueble.updatedAt?.toISOString(),
    };

    return NextResponse.json(dto);
  } catch (error) {
    console.error("❌ Error GET /api/inmuebles/[id]:", error);
    return NextResponse.json(
      { error: "Error al obtener inmueble" },
      { status: 500 }
    );
  }
} 

/* =============================================================
   PUT
============================================================= */

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autenticado" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  const { id: idStr } = await params;
  const numId = Number(idStr);

  if (isNaN(numId)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    /* ---------------------------------------------------------
       Validar existencia del inmueble
    --------------------------------------------------------- */

    const existing = await db.inmueble.findUnique({
      where: { id_inmueble: numId },
      select: {
        id_inmueble: true,
        id_ubicacion: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Inmueble no encontrado" },
        { status: 404 }
      );
    }

    /* ---------------------------------------------------------
       Validar foreign keys SOLO si vienen definidas
    --------------------------------------------------------- */

    if (body.id_cliente !== undefined) {
      const cliente = await db.cliente.findUnique({
        where: { id_cliente: Number(body.id_cliente) },
        select: { id_cliente: true },
      });

      if (!cliente) {
        return NextResponse.json(
          { error: "Cliente inválido" },
          { status: 400 }
        );
      }
    }

    if (body.id_estado !== undefined) {
      const estado = await db.estado.findUnique({
        where: { id_estado: Number(body.id_estado) },
        select: { id_estado: true },
      });

      if (!estado) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }
    }

    if (body.id_operacion !== undefined) {
      const operacion = await db.operacion.findUnique({
        where: { id_operacion: Number(body.id_operacion) },
        select: { id_operacion: true },
      });

      if (!operacion) {
        return NextResponse.json(
          { error: "Operación inválida" },
          { status: 400 }
        );
      }
    }

    if (body.id_tipo_inmueble !== undefined) {
      const tipo = await db.tipo_inmueble.findUnique({
        where: {
          id_tipo_inmueble: Number(body.id_tipo_inmueble),
        },
        select: { id_tipo_inmueble: true },
      });

      if (!tipo) {
        return NextResponse.json(
          { error: "Tipo inválido" },
          { status: 400 }
        );
      }
    }

    /* ---------------------------------------------------------
       Transaction
    --------------------------------------------------------- */

    const result = await db.$transaction(async (tx) => {

      /* ---------------- Inmueble ---------------- */

      // construir objeto dinámico seguro
const updateData: any = {};
/* ✅ VALIDAR que el usuario exista antes de usarlo */

const userExists = await tx.user.findUnique({
  where: { id: userId },
  select: { id: true },
});

if (userExists) {
  updateData.updatedById = userId;
}

if (body.titulo !== undefined)
  updateData.titulo = normalize(body.titulo);

if (body.detalles !== undefined)
  updateData.detalles = normalize(body.detalles);

if (body.superficie_total !== undefined)
  updateData.superficie_total =
    toDecimalOrUndefined(body.superficie_total);

if (body.superficie_cubierta !== undefined)
  updateData.superficie_cubierta =
    toDecimalOrUndefined(body.superficie_cubierta);

if (body.precio !== undefined)
  updateData.precio =
    toDecimalOrUndefined(body.precio);

if (body.cantidad_ambientes !== undefined)
  updateData.cantidad_ambientes =
    toNumberOrUndefined(body.cantidad_ambientes);

if (body.cantidad_banos !== undefined)
  updateData.cantidad_banos =
    toNumberOrUndefined(body.cantidad_banos);

if (body.cantidad_dormitorios !== undefined)
  updateData.cantidad_dormitorios =
    toNumberOrUndefined(body.cantidad_dormitorios);

if (body.cantidad_cocheras !== undefined)
  updateData.cantidad_cocheras =
    toNumberOrUndefined(body.cantidad_cocheras);

if (body.cantidad_pisos !== undefined)
  updateData.cantidad_pisos =
    toNumberOrUndefined(body.cantidad_pisos);

if (body.antiguedad !== undefined)
  updateData.antiguedad =
    toNumberOrUndefined(body.antiguedad);

if (body.id_tipo_inmueble !== undefined)
  updateData.id_tipo_inmueble =
    toNumberOrUndefined(body.id_tipo_inmueble);


if (body.id_operacion !== undefined)
  updateData.id_operacion =
    toNumberOrUndefined(body.id_operacion);

if (body.id_cliente !== undefined)
  updateData.id_cliente =
    toNumberOrUndefined(body.id_cliente);

// =====================================================
// LÓGICA AUTOMÁTICA ARCHIVADO / ESTADO
// =====================================================

// Buscar estados por nombre en la DB
const estados = await tx.estado.findMany({
  where: {
    nombre: {
      in: ["Disponible", "No disponible"],
    },
  },
  select: { id_estado: true, nombre: true },
});

const estadoDisponible = estados.find(e => e.nombre === "Disponible")?.id_estado;
const estadoNoDisponible = estados.find(e => e.nombre === "No disponible")?.id_estado;

if (!estadoDisponible || !estadoNoDisponible) {
  throw new Error("Faltan estados requeridos en la tabla estado");
}

// Si cambia el estado manualmente
if (body.id_estado !== undefined) {
  updateData.id_estado = Number(body.id_estado);

  // si NO es disponible → archivar automáticamente
  const nombreEstado = estados.find(e => e.id_estado === Number(body.id_estado))?.nombre;
  if (nombreEstado !== "Disponible") {
    updateData.archivado = true;
  }
}

// Si cambia archivado manualmente
if (body.archivado !== undefined) {
  const nuevoArchivado = Boolean(body.archivado);
  updateData.archivado = nuevoArchivado;

  if (nuevoArchivado === false) {
    // desarchivar → poner disponible
    updateData.id_estado = estadoDisponible;
  } else {
    // archivar → poner no disponible
    updateData.id_estado = estadoNoDisponible;
  }
}

const inmueble = await tx.inmueble.update({
  where: {
    id_inmueble: numId,
  },
  data: updateData,
});

      /* ---------------- Ubicación ---------------- */

      if (
        body.direccion !== undefined ||
        body.ciudad !== undefined ||
        body.provincia !== undefined ||
        body.id_barrio !== undefined
      ) {

        const ubicacionData: any = {};

        if (body.direccion !== undefined)
          ubicacionData.direccion = normalize(body.direccion);

        if (body.ciudad !== undefined)
          ubicacionData.ciudad = normalize(body.ciudad);

        if (body.provincia !== undefined)
          ubicacionData.provincia = normalize(body.provincia);

        if (body.id_barrio !== undefined) {
          const barrioId = toNumberOrUndefined(body.id_barrio);

          if (barrioId !== undefined) {
            const barrio = await tx.barrio.findUnique({
              where: { id_barrio: barrioId },
              select: { id_barrio: true },
            });

            if (!barrio) {
              return NextResponse.json(
                { error: "Barrio inválido" },
                { status: 400 }
              );
            }

            ubicacionData.id_barrio = barrioId;
          }
        }

        if (Object.keys(ubicacionData).length > 0) {
          await tx.ubicacion.update({
            where: {
              id_ubicacion: existing.id_ubicacion,
            },
            data: ubicacionData,
          });
        }
      }

      /* ---------------- Imágenes ---------------- */

      if (Array.isArray(body.imagenes)) {

        await tx.inmuebleImagen.deleteMany({
          where: {
            inmuebleId: numId,
          },
        });

        if (body.imagenes.length > 0) {

          await tx.inmuebleImagen.createMany({

            data: body.imagenes.map((img: any) => ({

              url: img.url,

              principal:
                Boolean(img.principal),

              inmuebleId: numId,
            })),
          });
        }
      }

      return inmueble;
    });

    return NextResponse.json(result);

  } catch (error: any) {

    console.error(
      "❌ Error PUT /api/inmuebles/[id]:",
      error
    );

    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede actualizar porque una relación no existe",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error al actualizar inmueble" },
      { status: 500 }
    );
  }
}

/* =============================================================
   DELETE
============================================================= */

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const { id: idStr } = await params;
  const numId = Number(idStr);

  if (isNaN(numId)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {

    /* ---------------------------------------------------------
       Intentar delete físico
    --------------------------------------------------------- */

    await db.inmuebleImagen.deleteMany({
      where: {
        inmuebleId: numId,
      },
    });

    await db.inmueble.delete({
      where: {
        id_inmueble: numId,
      },
    });

    return new NextResponse(null, { status: 204 });

  } catch (error: any) {

    /* ---------------------------------------------------------
       Si falla FK → hacer soft delete
    --------------------------------------------------------- */

    if (error.code === "P2003") {

      await db.inmueble.update({

        where: {
          id_inmueble: numId,
        },

        data: {
          archivado: true,
        },
      });

      return NextResponse.json({

        message:
          "No se pudo eliminar físicamente porque tiene relaciones. Se archivó correctamente.",

        archived: true,

      });
    }

    console.error(
      "❌ Error DELETE /api/inmuebles/[id]:",
      error
    );

    return NextResponse.json(
      { error: "Error al eliminar inmueble" },
      { status: 500 }
    );
  }
}