// src/app/api/rendiciones/[id]/route.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

import { generarExcelRendicion, CobranzaForExcel } from "@/lib/excelGenerator";
import { auth } from "../../../../../auth";


// =========================================================
// HELPER: CALCULAR SALDO ANTERIOR
// =========================================================
async function calcularSaldoAnterior(id_inmueble: number, fechaActual: Date) {
  const prevRend = await db.rendicion.findFirst({
    where: {
      id_inmueble,
      fecha: { lt: fechaActual },
    },
    orderBy: { fecha: "desc" },
    select: { monto_total: true },
  });

  return prevRend ? Number(prevRend.monto_total) : 0;
}


// =========================================================
// GET — Obtener rendición por ID
// =========================================================
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const id_rendicion = Number(id);


  if (isNaN(id_rendicion))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {

    const rendicion = await db.rendicion.findUnique({
  where: { id_rendicion },
  select: {
    id_rendicion: true,
    fecha: true,
    monto_total: true,
    mes_ipc: true,
    anio_ipc: true,
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
        id_contrato: true,
        numero_recibo: true,
        observaciones: true,
        genera_recibo: true,

        cliente: {
          select: {
            id_cliente: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },

        recibo: {
          select: {
            id_recibo: true,
            total: true,
            descripcion: true,
          },
        },

        inmueble: {
          select: {
            titulo: true,
            ubicacion: {
              select: { direccion: true },
            },
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
});


    if (!rendicion)
      return NextResponse.json(
        { error: "Rendición no encontrada" },
        { status: 404 }
      );


    // mismo formato que GET principal
    const mapped = {
    ...rendicion,

    monto_total: Number(rendicion.monto_total),

    cobranzas: rendicion.cobranzas.map(c => ({
      ...c,
      monto: c.monto ? Number(c.monto) : null,
    })),

    createdBy: rendicion.createdBy
      ? {
          id_usuario: rendicion.createdBy.id,
          nombre: rendicion.createdBy.name || rendicion.createdBy.email,
        }
      : null,

    updatedBy: rendicion.updatedBy
      ? {
          id_usuario: rendicion.updatedBy.id,
          nombre: rendicion.updatedBy.name || rendicion.updatedBy.email,
        }
      : null,
  };



    return NextResponse.json(mapped);

  } catch (err: any) {

    return NextResponse.json(
      {
        error: "No se pudo obtener la rendición",
        detail: err.message || String(err),
      },
      { status: 500 }
    );

  }

}


// =========================================================
// PUT — Actualizar rendición
// =========================================================
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const id_rendicion = Number(id);


  if (isNaN(id_rendicion))
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {

    const { cobranzas, mes_ipc, anio_ipc } = await req.json();

    if (!Array.isArray(cobranzas) || cobranzas.length === 0)
      return NextResponse.json(
        { error: "Seleccioná cobranzas" },
        { status: 400 }
      );


    const idsCobranzas = cobranzas
      .map((id: any) => Number(id))
      .filter(Boolean);


    if (idsCobranzas.length === 0)
      return NextResponse.json(
        { error: "IDs inválidos" },
        { status: 400 }
      );


    const existing = await db.rendicion.findUnique({
      where: { id_rendicion },
      include: { cobranzas: true },
    });

    if (!existing)
      return NextResponse.json(
        { error: "Rendición no encontrada" },
        { status: 404 }
      );


    const seleccionadas = await db.cobranza.findMany({

      where: {
        id_cobranza: { in: idsCobranzas },
      },

      include: {
        cliente: true,
        recibo: true,
        inmueble: {
          include: { ubicacion: true },
        },
      },

    });


    if (seleccionadas.length === 0)
      return NextResponse.json(
        { error: "Cobranzas inválidas" },
        { status: 404 }
      );


    const inmuebles = [
      ...new Set(
        seleccionadas.map(c => c.id_inmueble).filter(Boolean)
      ),
    ];

    if (inmuebles.length !== 1)
      return NextResponse.json(
        { error: "Las cobranzas deben ser del mismo inmueble" },
        { status: 400 }
      );


    const totalBase = seleccionadas.reduce(
  (acc, c) => acc + Number(c.monto ?? 0),
  0
);

// IPC real (lo movemos acá arriba para usarlo en DB)
let ipcValor: number | null = null;

if (mes_ipc && anio_ipc) {
  const ipc = await db.ipc.findFirst({
    where: {
      mes: Number(mes_ipc),
      anio: Number(anio_ipc),
    },
  });

  if (!ipc) {
    return NextResponse.json(
      { error: `No existe IPC para ${mes_ipc}/${anio_ipc}` },
      { status: 400 }
    );
  }

  ipcValor = Number(ipc.valor);

  // por si viene como 12 en vez de 0.12
  if (ipcValor > 1) {
    ipcValor = ipcValor / 100;
  }
}

const totalConIPC =
  ipcValor != null
    ? totalBase + totalBase * ipcValor
    : totalBase;

const monto_total = Number(totalConIPC.toFixed(2));




    // obtener usuario igual que POST
    const session = await auth();

    if (!session?.user?.id)
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );


    const user =
      (await db.user.findUnique({
        where: { id: session.user.id },
      })) ??
      (await db.user.create({
        data: {
          id: session.user.id,
          name: session.user.name ?? "Usuario",
          email:
            session.user.email ??
            `user_${session.user.id}@example.com`,
        },
      }));


    await db.$transaction(async (tx) => {

      await tx.cobranza.updateMany({
        where: { id_rendicion },
        data: { id_rendicion: null },
      });

      await tx.rendicion.update({
        where: { id_rendicion },
        data: {
          monto_total,
          mes_ipc: mes_ipc ?? null,
          anio_ipc: anio_ipc ?? null,
          updatedById: user.id,
        },
      });



      await Promise.all(
        idsCobranzas.map(id =>
          tx.cobranza.update({
            where: { id_cobranza: id },
            data: { id_rendicion },
          })
        )
      );

    });



    const saldoAnterior =
      await calcularSaldoAnterior(
        inmuebles[0]!,
        new Date()
      );

      console.log("ipcValor:", ipcValor);


    // Excel data
    const cobranzasExcel: CobranzaForExcel[] =
      seleccionadas.map(c => {

        const montoBase = Number(c.monto ?? 0);

        // ✅ aplicar IPC correctamente
        const aumentoIPC =
          ipcValor != null
            ? montoBase * ipcValor
            : 0;

        const total_cobrar =
          Number((montoBase + aumentoIPC).toFixed(2));

        const total_cobrado =
          c.pagado ? total_cobrar : 0;

        const a_cobrar =
          total_cobrar - total_cobrado;

        return {

          id_cobranza: c.id_cobranza,

          id_inmueble: c.id_inmueble,

          id_contrato: c.id_contrato,

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

          concepto: c.concepto,

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

          // ✅ ESTOS SON LOS IMPORTANTES
          total_cobrar,

          total_cobrado,

          a_cobrar,

          unFuncional:
            c.inmueble
              ? `${c.inmueble.ubicacion?.direccion ?? ""}: ${c.inmueble.titulo ?? ""}`
              : "",

          contratoStr:
            c.id_contrato
              ? `Contrato ${c.id_contrato}`
              : "",

          ipcAumento:
            ipcValor != null
              ? `IPC ${mes_ipc}/${anio_ipc}`
              : "",

          ipcValor,

        };

      });



    const buffer =
      await generarExcelRendicion(
        `Rendicion_${id_rendicion}`,
        new Date()
          .toISOString()
          .substring(0, 10),
        cobranzasExcel,
        {
          mes: mes_ipc ?? null,
          anio: anio_ipc ?? null,
          valor: ipcValor ?? null,
        },

      );


    return new NextResponse(
      new Uint8Array(buffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename=Rendicion_${id_rendicion}.xlsx`,
        },
      }
    );

  } catch (err: any) {

    return NextResponse.json(
      {
        error: "No se pudo actualizar",
        detail:
          err.message || String(err),
      },
      { status: 500 }
    );

  }

}


// =========================================================
// DELETE
// =========================================================
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params;
  const id_rendicion = Number(id);


  if (isNaN(id_rendicion))
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );


  try {

    await db.$transaction(async tx => {

      await tx.cobranza.updateMany({
        where: { id_rendicion },
        data: { id_rendicion: null },
      });

      await tx.rendicion.delete({
        where: { id_rendicion },
      });

    });


    return NextResponse.json({
      success: true,
    });

  } catch (err: any) {

    return NextResponse.json(
      {
        error: "No se pudo eliminar",
        detail:
          err.message || String(err),
      },
      { status: 500 }
    );

  }

}
