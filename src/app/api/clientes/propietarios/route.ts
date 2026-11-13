// src/app/api/clientes/propietarios/route.ts

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return unauthorizedResponse();

  try {
    const { searchParams } = new URL(req.url);
    const includeIdParam = searchParams.get("includeId");
    const includeId = includeIdParam ? Number(includeIdParam) : null;

    const propietarios = await db.cliente.findMany({
      where: {
        OR: [
          // ✅ Propietarios activos
          {
            AND: [
              {
                activo: true,
              },
              {
                tiposCliente: {
                  some: {
                    tipoCliente: {
                      nombre: "Propietario",
                    },
                  },
                },
              },
            ],
          },

          // ✅ Incluir propietario actual aunque esté inactivo
          ...(includeId
            ? [
                {
                  id_cliente: includeId,
                },
              ]
            : []),
        ],
      },

      select: {
        id_cliente: true,
        nombre: true,
        apellido: true,
      },

      orderBy: {
        nombre: "asc",
      },
    });

    return NextResponse.json(propietarios);

  } catch (error) {
    console.error("Error al obtener propietarios:", error);

    return NextResponse.json(
      { error: "Error al obtener propietarios" },
      { status: 500 }
    );
  }
}
