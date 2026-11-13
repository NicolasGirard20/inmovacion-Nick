// src/app/api/cobranzas/route.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "../../../../auth";

/* =============================================================
   ================   MÉTODO GET – LISTAR COBRANZAS   ===========
   ============================================================= */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);

    // Parámetros de paginación (por defecto page=1, pageSize=10)
    const page = Number(searchParams.get("page") || 1);
    const pageSize = Number(searchParams.get("pageSize") || 10);

    // Normaliza valores: si viene "" o null → lo convierte en null real
    const normalize = (v: string | null) =>
      v && v.trim() !== "" ? v : null;

    const anio = normalize(searchParams.get("anio"));
    const mes = normalize(searchParams.get("mes"));

    // Cliente
    const id_cliente_raw = normalize(searchParams.get("cliente"));
    const id_cliente = id_cliente_raw !== null ? Number(id_cliente_raw) : null;

    // 🔥 ESTO VA ACÁ
    const sinRendir = searchParams.get("sinRendir") === "1";
    const soloActivas = searchParams.get("soloActivas") === "1";

    // 🔥 NUEVO
    const incluirSeleccionadas = searchParams.get("incluirSeleccionadas") === "1";
    const rendicionActualRaw = searchParams.get("rendicionActual");
    const rendicionActual = rendicionActualRaw ? Number(rendicionActualRaw) : null;


    const skip = (page - 1) * pageSize;
    const take = pageSize;

    /* ---------------------------------------------------------
       Construcción del filtro dinámico "where" para Prisma
       --------------------------------------------------------- */
    const where: any = {};

    if (id_cliente !== null) {
      where.id_cliente = id_cliente;
    }

    if (sinRendir) {
  if (incluirSeleccionadas && rendicionActual) {
    where.OR = [
      { id_rendicion: null },
      { id_rendicion: rendicionActual },
    ];
  } else {
    where.id_rendicion = null;
  }
}



    if (soloActivas) {
    where.activa = true;
  }

    // --- FILTROS POR FECHA (MES y AÑO) ---
    if (anio && mes) {
      // Caso: año + mes → filtro por mes específico del año
      where.fecha_cobranza = {
        gte: new Date(Number(anio), Number(mes) - 1, 1),
        lte: new Date(Number(anio), Number(mes), 0, 23, 59, 59),
      };
    } else if (anio && !mes) {
      // Solo año → 1 de enero a 31 de diciembre
      where.fecha_cobranza = {
        gte: new Date(Number(anio), 0, 1),
        lte: new Date(Number(anio), 11, 31, 23, 59, 59),
      };
    } else if (!anio && mes) {
      // Solo mes → del mes del año actual
      const currentYear = new Date().getFullYear();
      where.fecha_cobranza = {
        gte: new Date(currentYear, Number(mes) - 1, 1),
        lte: new Date(currentYear, Number(mes), 0, 23, 59, 59),
      };
    }

    /* ---------------------------------------------------------
       CONSULTA PRINCIPAL A LA BASE DE DATOS
       --------------------------------------------------------- */
    const cobranzas = await db.cobranza.findMany({
      skip,
      take,
      where,
      include: {
        cliente: {
  include: {
    tiposCliente: {
      include: {
        tipoCliente: true,
      },
    },
  },
},

        inmueble: { include: { ubicacion: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { fecha_cobranza: "desc" }, // últimas primero
    });

    // Total de resultados para paginación
    const total = await db.cobranza.count({ where });

    /* ---------------------------------------------------------
       MAPEO FINAL: nombre amigable del inmueble
       --------------------------------------------------------- */
    const mapped = cobranzas.map((c) => ({
      id_cobranza: c.id_cobranza,
      id_cliente: c.id_cliente,
      id_inmueble: c.id_inmueble,
      monto: c.monto,
      fecha_cobranza: c.fecha_cobranza,
      medio_pago: c.medio_pago,
      concepto: c.concepto,
      observaciones: c.observaciones,
      activa: c.activa,

      // 🔥 TIMESTAMPS (CLAVE)
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,

      // 🔥 USUARIOS
      createdBy: c.createdBy
        ? {
            id_usuario: c.createdBy.id,
            nombre: c.createdBy.name || c.createdBy.email,
          }
        : null,
      updatedBy: c.updatedBy
        ? {
            id_usuario: c.updatedBy.id,
            nombre: c.updatedBy.name || c.updatedBy.email,
          }
        : null,

      cliente: c.cliente,

      inmueble: c.inmueble
        ? {
            ...c.inmueble,
            nombre:
              c.inmueble.titulo +
              (c.inmueble.ubicacion?.direccion
                ? ` - ${c.inmueble.ubicacion.direccion}`
                : ""),
          }
        : null,
    }));

    return NextResponse.json({ cobranzas: mapped, total });
  } catch (error: any) {
    console.error("❌ Error GET cobranzas (REAL):", error);
    return NextResponse.json(
      {
        error: "Error al obtener cobranzas",
        detalle: error.message,
      },
      { status: 500 }
    );
  }
}



/* =============================================================
   =============   MÉTODO POST – CREAR COBRANZAS   =============
   ============================================================= */
export async function POST(req: NextRequest) {
  try {

    const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }

      const userId = session.user.id;

      // 👇 MISMO PATRÓN QUE INMUEBLES
      const user =
        (await db.user.findUnique({ where: { id: userId } })) ??
        (await db.user.create({
          data: {
            id: userId,
            name: session.user.name ?? "Usuario",
            email: session.user.email ?? `user_${userId}@example.com`,
          },
        }));

    const body = await req.json();

    const { id_cliente, cobranzas } = body;

    // Validaciones mínimas
    if (!id_cliente || !Array.isArray(cobranzas) || cobranzas.length === 0) {
      return NextResponse.json(
        { error: "Datos incompletos." },
        { status: 400 }
      );
    }

    /* ---------------------------------------------------------
       Función robusta para parsear fechas de distintos formatos
       --------------------------------------------------------- */
    const parseFecha = (f: any): Date => {
      if (!f) return new Date(); // fallback: hoy

      // Si ya es Date válida
      if (f instanceof Date && !isNaN(f.getTime())) return f;

      if (typeof f === "string") {
        // Reemplaza "/" por "-" → normaliza strings
        const normalizada = f.replace(/\//g, "-");

        // Prueba YYYY-MM-DD
        const d1 = new Date(normalizada);
        if (!isNaN(d1.getTime())) return d1;

        // Prueba DD-MM-YYYY
        const m = normalizada.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (m) {
          const [_, dd, mm, yyyy] = m;
          return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
        }
      }

      // Último recurso: intentar new Date(f)
      const fallback = new Date(f);
      if (!isNaN(fallback.getTime())) return fallback;

      // Si todo falla → hoy
      return new Date();
    };

    /* ---------------------------------------------------------
       Crear todas las cobranzas en paralelo
       --------------------------------------------------------- */
    const created = await Promise.all(
      cobranzas.map(async (c: any) => {
        // Buscar el contrato y su inmueble asociado
        const contrato = await db.contrato.findUnique({
          where: { id_contrato: Number(c.id_contrato) },
          include: { inmueble: { include: { ubicacion: true } } },
        });

        const fecha = parseFecha(c.fecha_cobranza);

        // Crear la cobranza
        return db.cobranza.create({
          data: {
            id_cliente: Number(id_cliente),
            id_contrato: Number(c.id_contrato),
            id_inmueble: contrato?.inmueble?.id_inmueble || null,
            monto: Number(c.monto),
            fecha_cobranza: fecha,
            medio_pago: c.medio_pago,
            concepto: c.concepto,
            observaciones: c.observaciones || null,
            activa: true,
            id_rendicion: null,
            createdById: user.id,
             updatedById: user.id,
          },
          include: {
            cliente: {
  include: {
    tiposCliente: {
      include: {
        tipoCliente: true,
      },
    },
  },
},

            inmueble: { include: { ubicacion: true } },
            createdBy: true,
            updatedBy: true,
          },
        });
      })
    );

    /* ---------------------------------------------------------
       MAPEO FINAL PARA EL FRONTEND
       --------------------------------------------------------- */
    const mapped = created.map((c) => ({
      ...c, //devolviendo todos los datos de la cobranza
      inmueble: c.inmueble
        ? {
            ...c.inmueble,
            nombre:
              c.inmueble.titulo +
              (c.inmueble.ubicacion?.direccion
                ? ` - ${c.inmueble.ubicacion.direccion}`
                : ""),
          }
        : null,
    }));

    return NextResponse.json(
      { success: true, created: mapped },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ Error POST /cobranzas:", err);
    return NextResponse.json(
      { error: err.message || "Error al crear cobranzas." },
      { status: 500 }
    );
  }
}
