// src/app/api/rendiciones/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

// Importamos herramientas del framework Next.js para manejar requests/responses HTTP
import { NextRequest, NextResponse } from "next/server";

// Importamos la conexión a la base de datos mediante Prisma
import { db } from "@/lib/db";



// Funciones para generar archivos (EXCEL y PDF)
import { generarExcelRendicion , CobranzaForExcel} from "@/lib/excelGenerator";

import { auth } from "../../../../auth";


// ========================================================
// FUNCIÓN AUXILIAR — Genera número y período de rendición
// ========================================================
/*
  Dado una fecha, esta función calcula:
  - número de rendición (ej: "3-2025")
  - período de rendición (ej: "3/2025")

  La lógica es: usa el mes siguiente al de la fecha pasada.
*/
function calcularNumeroRendicion(fecha: Date) {
  const mes = fecha.getMonth() + 1;
  const año = fecha.getFullYear();

  // Si es diciembre → el próximo mes es enero del año siguiente
  const nextMes = mes === 12 ? 1 : mes + 1;
  const nextAño = mes === 12 ? año + 1 : año;

  return { numero: `${nextMes}-${nextAño}`, periodo: `${nextMes}/${nextAño}` };
}


// ========================================================
// FUNCIÓN AUXILIAR — Calcula saldo anterior de un inmueble
// ========================================================
/*
  Devuelve el monto_total de la última rendición previa al día actual.
  Si no existe, devuelve 0.
*/
async function calcularSaldoAnterior(id_inmueble: number, fechaActual: Date) {
  const prevRend = await db.rendicion.findFirst({
    where: {
      id_inmueble,
      fecha: { lt: fechaActual }, // lt → menos que
    },
    orderBy: { fecha: 'desc' },
    select: { monto_total: true },
  });

  return prevRend ? Number(prevRend.monto_total) : 0;
}



// ========================================================
// GET — Listar todas las rendiciones completas
// ========================================================
export async function GET(req: NextRequest) {
  try {

    const { searchParams } = new URL(req.url);

    // Parámetros de paginación 
const page = Number(searchParams.get("page") || 1);
const pageSize = Number(searchParams.get("pageSize") || 5);
const skip = (page - 1) * pageSize;
const take = pageSize;


    const year = searchParams.get("year");
  const month = searchParams.get("month");
  const cliente = searchParams.get("cliente");


    const where: any = {};

// FILTRO POR CLIENTE
if (cliente) {
  const clienteNumber = Number(cliente);

  where.cobranzas = {
    some: {
      ...(isNaN(clienteNumber)
        ? {
            cliente: {
              OR: [
                { nombre: { contains: cliente, mode: "insensitive" } },
                { apellido: { contains: cliente, mode: "insensitive" } },
              ],
            },
          }
        : { id_cliente: clienteNumber }),
    },
  };
}

// FILTRO POR FECHA (MES y AÑO) DE COBRANZAS
if (year && month) {
  const y = Number(year);
  const m = Number(month);
  where.cobranzas = {
    some: {
      ...where.cobranzas?.some,
      fecha_cobranza: {
        gte: new Date(y, m - 1, 1),
        lte: new Date(y, m, 0, 23, 59, 59),
      },
    },
  };
} else if (year) {
  const y = Number(year);
  where.cobranzas = {
    some: {
      ...where.cobranzas?.some,
      fecha_cobranza: {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59),
      },
    },
  };
} else if (month) {
  const m = Number(month);
  const currentYear = new Date().getFullYear();
  where.cobranzas = {
    some: {
      ...where.cobranzas?.some,
      fecha_cobranza: {
        gte: new Date(currentYear, m - 1, 1),
        lte: new Date(currentYear, m, 0, 23, 59, 59),
      },
    },
  };
}





   const [rendiciones, total] = await Promise.all([
  db.rendicion.findMany({
  where,
  skip,
  take,
  orderBy: { id_rendicion: "desc" },
  select: {
    id_rendicion: true,
    fecha: true,
    monto_total: true,
    pagado: true,
    createdAt: true,
    updatedAt: true,

    inmueble: {
      select: {
        id_inmueble: true,
        titulo: true,
        ubicacion: {
          select: {
            direccion: true,
            ciudad: true,
            provincia: true,
          },
        },
      },
    },

    cobranzas: {
      select: {
        id_cobranza: true,
        monto: true,
        concepto: true,
        fecha_cobranza: true,
        pagado: true,

        cliente: {
          select: {
            id_cliente: true,
            nombre: true,
            apellido: true,
          },
        },

        recibo: {
          select: {
            id_recibo: true,
            total: true,
            descripcion: true,
          },
        },
      },
    },

    createdBy: {
      select: { id: true, name: true, email: true },
    },

    updatedBy: {
      select: { id: true, name: true, email: true },
    },
  },
}),


  db.rendicion.count({ where }), 
  
]);

const ipcs = await db.ipc.findMany();

const ipcMap = new Map(
  ipcs.map(i => [`${i.mes}-${i.anio}`, Number(i.valor)])
);

   const mapped = rendiciones.map(r => ({
  id_rendicion: r.id_rendicion,
  fecha: r.fecha,
  monto_total: Number(r.monto_total),

  pagado: r.pagado,


  // ✅ MAPEAR INMUEBLE CORRECTAMENTE
    inmueble: r.inmueble
    ? {
        id_inmueble: r.inmueble.id_inmueble,

        nombre:
          r.inmueble.titulo ??
          `Inmueble ${r.inmueble.id_inmueble}`,

        direccionCompleta: [
          r.inmueble.ubicacion?.direccion,
          r.inmueble.ubicacion?.ciudad,
          r.inmueble.ubicacion?.provincia,
        ]
          .filter(Boolean)
          .join(", "),
      }
    : null,



  cobranzas: r.cobranzas.map(c => {

    const montoBase = Number(c.monto ?? 0);



  return {

    id_cobranza: c.id_cobranza,

    monto: montoBase,

    ipcValor: null,
    montoActualizado: montoBase,

    concepto: c.concepto,

    fecha_cobranza: c.fecha_cobranza,

    pagado: c.pagado,

    cliente: c.cliente
      ? {
          id_cliente: c.cliente.id_cliente,
          nombre: c.cliente.nombre,
          apellido: c.cliente.apellido,
        }
      : null,

    recibo: c.recibo
      ? {
          id_recibo: c.recibo.id_recibo,
          total: Number(c.recibo.total),
          descripcion: c.recibo.descripcion,
        }
      : null,

  };

}),


    createdAt: r.createdAt,
    updatedAt: r.updatedAt,

    // ✅ MAPEAR USUARIO CORRECTAMENTE
    createdBy: r.createdBy
      ? {
          id_usuario: r.createdBy.id,
          nombre: r.createdBy.name || r.createdBy.email,
        }
      : null,

    updatedBy: r.updatedBy
      ? {
          id_usuario: r.updatedBy.id,
          nombre: r.updatedBy.name || r.updatedBy.email,
        }
      : null,
  }));


    return NextResponse.json({
      data: mapped,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });

  } catch (e) {

    console.error("Error en GET /rendiciones:", e);

    return NextResponse.json(
      { error: "No se pudieron obtener las rendiciones" },
      { status: 500 }
    );
  }
}




// ========================================================
// POST — Crear rendición + generar Excel de descarga automática
// ========================================================
export async function POST(req: NextRequest) {
  try {

    const body = await req.json();

    const cobranzasIdsRaw = body.cobranzas;
    const fecha_rendicion = body.fecha_rendicion;
    const mes_ipc = body.mes_ipc ? Number(body.mes_ipc) : null;
    const anio_ipc = body.anio_ipc ? Number(body.anio_ipc) : null;


    // ========================================================
    // VALIDACIONES
    // ========================================================
    if (!Array.isArray(cobranzasIdsRaw) || cobranzasIdsRaw.length === 0) {
      return NextResponse.json(
        { error: "Seleccioná cobranzas válidas" },
        { status: 400 }
      );
    }

    const idsCobranzas = cobranzasIdsRaw
      .map((id: any) => Number(id))
      .filter((id: number) => !isNaN(id));

    if (idsCobranzas.length === 0) {
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );
    }


    // ========================================================
    // SESSION
    // ========================================================
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



    // ========================================================
    // BUSCAR COBRANZAS
    // ========================================================
    const seleccionadas = await db.cobranza.findMany({

      where: {
        id_cobranza: { in: idsCobranzas },
        id_rendicion: null,
      },

      include: {
        cliente: true,
        inmueble: {
          include: { ubicacion: true },
        },
        recibo: true,
      },

    });



    if (seleccionadas.length === 0) {
      return NextResponse.json(
        { error: "Las cobranzas ya fueron rendidas o no existen" },
        { status: 404 }
      );
    }



    // ========================================================
    // VALIDAR MISMO INMUEBLE
    // ========================================================
    const inmuebles = [
      ...new Set(
        seleccionadas
          .map(c => c.id_inmueble)
          .filter(Boolean)
      ),
    ];

    if (inmuebles.length !== 1) {
      return NextResponse.json(
        { error: "Todas las cobranzas deben pertenecer al mismo inmueble" },
        { status: 400 }
      );
    }

    const id_inmueble = inmuebles[0]!;



    // ========================================================
    // FECHA + NUMERO RENDICION
    // ========================================================
    const fecha = fecha_rendicion
      ? new Date(fecha_rendicion)
      : new Date();

    const { numero } = calcularNumeroRendicion(fecha);



    // ========================================================
// IPC 
// ========================================================
let ipcValor: number | null = null;

if (mes_ipc != null && anio_ipc != null) {
  const ipc = await db.ipc.findFirst({
    where: {
      mes: Number(mes_ipc),
      anio: Number(anio_ipc),
    },
  });

  if (!ipc) {
    return NextResponse.json(
      {
        error: `No existe IPC cargado para ${mes_ipc}/${anio_ipc}`,
        code: "IPC_NOT_FOUND",
      },
      { status: 400 }
    );
  }

  ipcValor = Number(ipc.valor);

  // ✅ por si viene como 12 en vez de 0.12
  if (ipcValor > 1) {
    ipcValor = ipcValor / 100;
  }
}



    // ========================================================
    // GENERAR DATA EXCEL
    // ========================================================
    const cobranzasExcel: CobranzaForExcel[] =
      seleccionadas.map(c => {

        const montoBase = Number(c.monto ?? 0);

        const aumentoIPC =
          ipcValor != null
            ? montoBase * ipcValor
            : 0;

        const totalCobrar =
          montoBase + aumentoIPC;

        const totalCobrado =
          c.pagado
            ? totalCobrar
            : 0;

        const saldo =
          totalCobrar - totalCobrado;

        return {

          id_cobranza: c.id_cobranza,

          id_inmueble: c.id_inmueble ?? null,

          id_contrato: c.id_contrato ?? null,

          cliente: {
            nombre: c.cliente?.nombre ?? "",
            apellido: c.cliente?.apellido ?? "",
            email: c.cliente?.email ?? null,
            telefono: c.cliente?.telefono ?? null,
          },

          inmueble: c.inmueble
            ? {
                titulo: c.inmueble.titulo,
                ubicacion: {
                  direccion:
                    c.inmueble.ubicacion?.direccion ?? "",
                },
              }
            : undefined,

          concepto: c.concepto ?? "",

          monto: montoBase,

          fecha_cobranza:
            c.fecha_cobranza
              ?.toISOString()
              .substring(0, 10) ?? "",

          numero_recibo:
            c.numero_recibo ?? null,

          genera_recibo:
            c.genera_recibo ?? false,

          pagado:
            Boolean(c.pagado),

          observaciones:
            c.observaciones ?? null,

          total_cobrar:
            Number(totalCobrar.toFixed(2)),

          total_cobrado:
            Number(totalCobrado.toFixed(2)),

          a_cobrar:
            Number(saldo.toFixed(2)),

          ipcValor,

          ipcAumento:
            ipcValor != null
              ? `IPC ${mes_ipc}/${anio_ipc}`
              : "",

          unFuncional:
            c.inmueble
              ? `${c.inmueble.ubicacion?.direccion ?? ""} - ${c.inmueble.titulo ?? ""}`
              : "",

        };

      });





    // ========================================================
      // TOTAL 
      // ========================================================
      const totalBase = seleccionadas.reduce(
        (acc, c) => acc + Number(c.monto ?? 0),
        0
      );

      const totalConIPC =
        ipcValor != null
          ? totalBase + totalBase * ipcValor
          : totalBase;

      const totalFinal = Number(totalConIPC.toFixed(2));




    // ========================================================
    // SALDO ANTERIOR
    // ========================================================
    const saldoAnterior =
      await calcularSaldoAnterior(
        id_inmueble,
        fecha
      );



    // ========================================================
    // TRANSACCION (MUY IMPORTANTE)
    // ========================================================
    const rend =
      await db.$transaction(async tx => {

        const nueva =
          await tx.rendicion.create({

            data: {

              id_inmueble,

              fecha,

              monto_total: totalFinal,

              mes_ipc,
              anio_ipc,

              createdById: user.id,
              updatedById: user.id,

            },

          });


        // vincular cobranzas + guardar monto actualizado
        for (const c of cobranzasExcel) {
          await tx.cobranza.update({
            where: { id_cobranza: c.id_cobranza },
            data: {
              id_rendicion: nueva.id_rendicion,
            },
          });
        }

        return nueva;
      });




    // ========================================================
    // GENERAR EXCEL
    // ========================================================
    const buffer =
      await generarExcelRendicion(

        numero,

        fecha.toISOString().substring(0, 10),

        cobranzasExcel,

        {
          mes: mes_ipc ?? null,
          anio: anio_ipc ?? null,
          valor: ipcValor ?? null,
        },

      );



    // ========================================================
    // RESPONSE
    // ========================================================
    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename=Rendicion_${rend.id_rendicion}.xlsx`,

          // 👇 AGREGÁ ESTO
          "X-Rendicion-Id": String(rend.id_rendicion),
        },
      }
    );


  } catch (error: any) {

    console.error(
      "Error POST rendiciones:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error creando rendición",
        detail:
          error.message ??
          String(error),
      },
      { status: 500 }
    );

  }
}
