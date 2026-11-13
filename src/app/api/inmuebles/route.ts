/// src/app/api/inmuebles/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";
import { auth } from "../../../../auth";

/* -------------------------------------------------------------
   Helpers
---------------------------------------------------------------- */
const toNumberOrUndefined = (v: any): number | undefined =>
  v !== undefined && v !== null && v !== "" && !isNaN(Number(v))
    ? Number(v)
    : undefined;

const toDecimalOrUndefined = (v: any): Prisma.Decimal | undefined =>
  v !== undefined && v !== null && v !== "" && !isNaN(Number(v))
    ? new Prisma.Decimal(Number(v))
    : undefined;

/* =============================================================
   🚀 GET /api/inmuebles (OPTIMIZADO)
=============================================================== */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const isAuthenticated = Boolean(session?.user?.id);
    const { searchParams } = new URL(req.url);

    // ──► Recibir filtros y paginación
    const tipoId      = searchParams.get("tipoId");
    const estadoId    = searchParams.get("estadoId");
    const operacionId = searchParams.get("operacionId");
    const precioMin   = searchParams.get("precioMin");
    const precioMax   = searchParams.get("precioMax");
    const archivadoParam = searchParams.get("archivado");
    const page        = Number(searchParams.get("page") ?? "1");
    const pageSize    = Number(searchParams.get("pageSize") ?? "20");

    const where: Prisma.InmuebleWhereInput = {};

    if (tipoId)      where.id_tipo_inmueble = Number(tipoId);
    if (estadoId)    where.id_estado        = Number(estadoId);
    if (operacionId) where.id_operacion     = Number(operacionId);

    if (precioMin || precioMax) {
      where.precio = {};
      if (precioMin) where.precio.gte = toDecimalOrUndefined(precioMin);
      if (precioMax) where.precio.lte = toDecimalOrUndefined(precioMax);
    }

    // Los visitantes públicos solo ven propiedades activas (no archivadas)
    if (!isAuthenticated) {
      where.archivado = false;
    } else if (archivadoParam === "true") {
      where.archivado = true;
    } else if (archivadoParam === "false") {
      where.archivado = false;
    }


    const [inmuebles, total] = await Promise.all([
      db.inmueble.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id_inmueble: "desc" },
        select: {
          id_inmueble: true,
          titulo: true,
          detalles: true,
          superficie_total: true,
          superficie_cubierta: true,
          precio: true,
          cantidad_ambientes: true,
          cantidad_banos: true,
          cantidad_dormitorios: true,
          cantidad_cocheras: true,
          cantidad_pisos: true,
          antiguedad: true,
          archivado: true,
          createdAt: true,
          updatedAt: true,

          tipo_inmueble: { select: { nombre: true } },
          estado:       { select: { nombre: true } },
          operacion:    { select: { nombre: true } },

          cliente: { select: { id_cliente: true, nombre: true } },

         ubicacion: {
            select: {
              direccion: true,
              ciudad: true,
              provincia: true,
              barrio: {
                select: {
                  nombre: true,
                  localidad: {
                    select: {
                      nombre: true,
                    },
                  },
                },
              },
            },
          },

          imagenes: {
  select: {
    id: true,
    url: true,
    principal: true
  }
},

          // Auditoría completa (como en tu versión original)
          createdBy: { select: { id: true, name: true, email: true } },
          updatedBy:  { select: { id: true, name: true, email: true } },
        },
        // Si tu Prisma es ≥ 5.1.0 → descomenta esta línea
        // relationLoadStrategy: "join",
      }),

      db.inmueble.count({ where }),
    ]);

    const formatted = inmuebles.map((i) => {
  const imagenes = i.imagenes ?? [];

  const fotoPrincipal =
    imagenes.find((img) => img.principal)?.url ||
    imagenes[0]?.url ||
    "/placeholder.jpg";

  return {
    ...i,
    fotoPrincipal,
    imagenes,

    superficie_total: Number(i.superficie_total),
    superficie_cubierta: i.superficie_cubierta
      ? Number(i.superficie_cubierta)
      : null,
    precio: i.precio ? Number(i.precio) : null,

    cliente: isAuthenticated ? i.cliente : undefined,

    createdBy: isAuthenticated && i.createdBy
      ? {
          id_usuario: String(i.createdBy.id),
          nombre:
            i.createdBy.name ||
            i.createdBy.email ||
            "Usuario desconocido",
        }
      : undefined,

    updatedBy: isAuthenticated && i.updatedBy
      ? {
          id_usuario: String(i.updatedBy.id),
          nombre:
            i.updatedBy.name ||
            i.updatedBy.email ||
            "Usuario desconocido",
        }
      : undefined,

    createdAt: i.createdAt?.toISOString(),
    updatedAt: i.updatedAt?.toISOString(),
  };
});

    return NextResponse.json({
      data: formatted,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("❌ Error GET /api/inmuebles:", error);
    return NextResponse.json(
      { error: "Error al obtener inmuebles" },
      { status: 500 }
    );
  }
}

/* =============================================================
   🚀 POST /api/inmuebles (CON VALIDACIONES COMPLETAS)
=============================================================== */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    let body: Record<string, any> = {};

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    body = await req.json();
  } 
  else if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    // Convertimos FormData a un objeto plano
    body = Object.fromEntries(formData);

    // Opcional: si esperas arrays (como imagenes), puedes mejorar el parseo aquí
    // Por ahora asumimos que los campos llegan como strings simples
  } 
  else {
    return NextResponse.json(
      { error: "Content-Type no soportado" },
      { status: 415 }
    );
  }

  // ── Para debug (puedes quitarlo después)
  console.log("Content-Type:", contentType);
  console.log("Body parseado:", body);

    /* =============================================================
       VALIDACIONES GENERALES
    ============================================================= */
    const clienteId =
      body.id_cliente ||
      (body.cliente && typeof body.cliente === "object"
        ? body.cliente.id
        : null);

    if (!clienteId) throw new Error("Debe seleccionar un propietario");
    if (!body.id_tipo_inmueble) throw new Error("Debe seleccionar un tipo");
    if (!body.id_estado) throw new Error("Debe seleccionar un estado");
    if (!body.id_operacion) throw new Error("Debe seleccionar una operación");

    if (!body.titulo || body.titulo.trim().length < 5)
      throw new Error("El título debe tener al menos 5 caracteres");

    if (!body.direccion?.trim())
      throw new Error("La dirección es obligatoria");

    if (!body.barrio?.trim())
      throw new Error("El barrio es obligatorio");

    const supTotal = Number(body.superficie_total);
    if (isNaN(supTotal) || supTotal <= 0)
      throw new Error("La superficie total debe ser mayor a 0");

    const precio = Number(body.precio);
    if (isNaN(precio) || precio <= 0)
      throw new Error("El precio debe ser mayor a 0");

    /* =============================================================
       USUARIO
    ============================================================= */
    const user =
      (await db.user.findUnique({ where: { id: userId } })) ??
      (await db.user.create({
        data: {
          id: userId,
          name: session.user.name ?? "Usuario Dev",
          email: session.user.email ?? `dev_${userId}@example.com`,
        },
      }));

    /* =============================================================
       ESTADO
    ============================================================= */
    const estadoDb = await db.estado.findUnique({
      where: { id_estado: Number(body.id_estado) },
    });
    if (!estadoDb) throw new Error("Estado inválido");

    const archivado =
      estadoDb.nombre.toLowerCase() !== "disponible";

    /* =============================================================
       LOCALIDAD / BARRIO
    ============================================================= */
    let barrioId = body.id_barrio;

    if (!barrioId) {
      const localidad =
        (await db.localidad.findFirst({
          where: { nombre: body.ciudad?.trim() || "SIN_LOCALIDAD" },
        })) ??
        (await db.localidad.create({
          data: { nombre: body.ciudad?.trim() || "SIN_LOCALIDAD" },
        }));

      const barrio =
        (await db.barrio.findFirst({
          where: {
            nombre: body.barrio.trim(),
            id_localidad: localidad.id_localidad,
          },
        })) ??
        (await db.barrio.create({
          data: {
            nombre: body.barrio.trim(),
            id_localidad: localidad.id_localidad,
          },
        }));

      barrioId = barrio.id_barrio;
    }

    /* =============================================================
       UBICACIÓN
    ============================================================= */
    const ubicacion = await db.ubicacion.create({
      data: {
        direccion: body.direccion.trim(),
        ciudad: body.ciudad?.trim() ?? null,
        provincia: body.provincia?.trim() ?? null,
        id_barrio: Number(barrioId),
      },
    });

   /* =============================================================
   IMÁGENES
=============================================================== */
const imagenes = Array.isArray(body.imagenes)
  ? body.imagenes
      .filter((i: any) => typeof i?.url === 'string' && i.url.startsWith('http'))
      .map((i: any) => ({
        url: i.url,
        principal: !!i.principal,
      }))
  : [];

if (!imagenes.length) throw new Error("Debe subir al menos una imagen válida (URL http/s)");

if (!imagenes.some((i: any) => i.principal)) {
  imagenes[0].principal = true;
}

    /* =============================================================
       TRANSACCIÓN (CORTA Y SEGURA)
    ============================================================= */
    const result = await db.$transaction(async (tx) => {
      const inmueble = await tx.inmueble.create({
        data: {
          titulo: body.titulo,
          superficie_total: toDecimalOrUndefined(body.superficie_total)!,
          superficie_cubierta: toDecimalOrUndefined(body.superficie_cubierta),
          precio: toDecimalOrUndefined(body.precio),
          cantidad_ambientes: toNumberOrUndefined(body.cantidad_ambientes),
          cantidad_banos: toNumberOrUndefined(body.cantidad_banos),
          cantidad_dormitorios: toNumberOrUndefined(body.cantidad_dormitorios),
          cantidad_cocheras: toNumberOrUndefined(body.cantidad_cocheras),
          cantidad_pisos: toNumberOrUndefined(body.cantidad_pisos),
          antiguedad: toNumberOrUndefined(body.antiguedad),
          archivado,
          createdById: user.id,
          updatedById: user.id,
          id_tipo_inmueble: Number(body.id_tipo_inmueble),
          id_estado: Number(body.id_estado),
          id_cliente: Number(clienteId),
          id_operacion: Number(body.id_operacion),
          id_ubicacion: ubicacion.id_ubicacion,
          foto:
            imagenes.find((i: any) => i.principal)?.url ??
            "/placeholder.jpg",
        },
      });

      await tx.inmuebleImagen.createMany({
        data: imagenes.map((img: any) => ({
          url: img.url,
          principal: Boolean(img.principal),
          inmuebleId: inmueble.id_inmueble,
        })),
      });

      return inmueble;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error POST /api/inmuebles:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear inmueble" },
      { status: 400 }
    );
  }
}