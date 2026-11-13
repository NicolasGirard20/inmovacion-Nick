// src/app/api/clientes/[id]/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";


// ==========================
// GET
// ==========================
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  const params = await context.params;

  const numId = Number(params.id);

  if (isNaN(numId)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {

    const cliente = await db.cliente.findUnique({

      where: {
        id_cliente: numId
      },

      include: {

        tiposCliente: {
          include: {
            tipoCliente: true
          }
        },

        tipoDocumento: true

      }

    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(cliente);

  }
  catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );

  }

}



// ==========================
// PUT
// ==========================
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  const params = await context.params;

  const numId = Number(params.id);

  if (isNaN(numId)) {
    return NextResponse.json(
      { error: "ID inválido" },
      { status: 400 }
    );
  }

  try {

    const body = await req.json();

    if (!body.nombre || body.nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }


    const cliente = await db.cliente.update({

      where: {
        id_cliente: numId
      },

      data: {

        nombre: body.nombre.trim(),

        apellido: body.apellido?.trim() || null,

        email: body.email?.trim() || null,

        telefono: body.telefono?.trim() || null,

        numero_documento: body.numeroDocumento?.trim() || null,

        tipoDocumentoId:
          body.tipoDocumentoId
            ? Number(body.tipoDocumentoId)
            : null,

        descripcion: body.descripcion || null,


        // 🔥 CORRECTO PARA N:N
        tiposCliente: {

          deleteMany: {},

          create:
            body.tipoClienteIds?.map((idTipo: number) => ({
              tipoCliente: {
                connect: {
                  id_tipo_cliente: idTipo
                }
              }
            })) || []

        }

      },

      include: {

        tiposCliente: {
          include: {
            tipoCliente: true
          }
        },

        tipoDocumento: true

      }

    });

    return NextResponse.json(cliente);

  }
  catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );

  }

}
