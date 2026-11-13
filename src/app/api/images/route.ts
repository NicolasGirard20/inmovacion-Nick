// Importamos NextResponse para poder devolver respuestas HTTP en formato JSON
// Importamos 'db' que es nuestra instancia de Prisma para interactuar con la base de datos
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedSession, unauthorizedResponse } from "@/lib/auth-guards";

// Esta función maneja las solicitudes POST a esta ruta.
// Es decir: cuando el frontend envía una imagen para guardarla en la base de datos.
export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return unauthorizedResponse();
  }

  try {
    // Intentamos leer el cuerpo (body) del request como JSON.
    // Esperamos recibir algo como: { inmuebleId: 3, url: "https://...." }
    const { inmuebleId, url } = await req.json();

    // ================================
    //   VALIDACIÓN DE DATOS
    // ================================
    // Si falta algún dato requerido, devolvemos un error 400 -> Bad Request
    if (!inmuebleId || !url || typeof url !== "string") {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const parsedInmuebleId = Number(inmuebleId);
    if (!Number.isInteger(parsedInmuebleId) || parsedInmuebleId <= 0) {
      return NextResponse.json({ error: "inmuebleId inválido" }, { status: 400 });
    }

    if (!url.startsWith("https://") && !url.startsWith("/")) {
      return NextResponse.json({ error: "URL inválida" }, { status: 400 });
    }

    // ================================
    //   CREACIÓN EN LA BASE DE DATOS
    // ================================
    const imagen = await db.inmuebleImagen.create({
      data: { inmuebleId: parsedInmuebleId, url, principal: false },
    });

    // Respondemos con la imagen recién creada y código 201 -> Created
    return NextResponse.json(imagen, { status: 201 });

  } catch (error) {
    // Si ocurre cualquier error inesperado, lo mostramos en consola para debug
    console.error("Error al guardar imagen:", error);

    // Y devolvemos un error 500 -> Internal Server Error
    return NextResponse.json(
      { error: "Error al guardar imagen" },
      { status: 500 }
    );
  }
}
