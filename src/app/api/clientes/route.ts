import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ==================== GET ====================
export async function GET() {
  try {
    const clientes = await db.cliente.findMany({
      orderBy: { id_cliente: "desc" },
      include: {
        tipoDocumento: true,

        tiposCliente: {
          include: {
            tipoCliente: true, // 👈 ESTO ES LA CLAVE
          },
        },
      },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// ==================== POST (Crear) ====================
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ==== Validaciones ====
    if (!body.nombre || body.nombre.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre es obligatorio y debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    if (body.apellido && body.apellido.trim().length < 2) {
      return NextResponse.json(
        { error: "El apellido debe tener al menos 2 caracteres." },
        { status: 400 }
      );
    }

    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: "El email no es válido." }, { status: 400 });
      }
    }

    if (body.telefono) {
      const telRegex = /^[0-9+\s-]+$/;
      if (!telRegex.test(body.telefono)) {
        return NextResponse.json(
          { error: "El teléfono solo puede contener números, espacios, + y -." },
          { status: 400 }
        );
      }
    }

    if ((body.numeroDocumento && !body.tipoDocumentoId) || (!body.numeroDocumento && body.tipoDocumentoId)) {
      return NextResponse.json(
        { error: "Debe completar tanto el tipo de documento como el número de documento." },
        { status: 400 }
      );
    }

    if (body.tipoDocumentoId) {
      const exists = await db.tipoDocumento.findUnique({
        where: { id_tipo_documento: Number(body.tipoDocumentoId) },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "El tipo de documento seleccionado no existe." },
          { status: 400 }
        );
      }
    }

    // ==== Crear cliente ====
    const cliente = await db.cliente.create({
  data: {
    nombre: body.nombre.trim(),
    apellido: body.apellido?.trim() || null,
    email: body.email?.trim() || null,
    telefono: body.telefono?.trim() || null,
    numero_documento: body.numeroDocumento?.trim() || null,
    descripcion: body.descripcion || null,
    tipoDocumentoId: body.tipoDocumentoId
      ? Number(body.tipoDocumentoId)
      : null,

    tiposCliente:
      body.tipoClienteIds && body.tipoClienteIds.length > 0
        ? {
            create: body.tipoClienteIds.map((id: any) => ({
              tipoCliente: {
                connect: {
                  id_tipo_cliente: Number(id),
                },
              },
            })),
          }
        : undefined,
  },
  include: { tiposCliente: true, tipoDocumento: true },
});
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}
