"use server";

import { db } from "@/lib/db";
import { getAuthenticatedSession } from "@/lib/auth-guards";


// ======================================================
// VALIDACIONES
// ======================================================

function validarCliente(data: any) {

  if (!data.nombre || data.nombre.trim().length < 2) {
    return {
      field: "nombre",
      message: "El nombre es obligatorio y debe tener al menos 2 caracteres."
    };
  }

  if (data.apellido && data.apellido.trim().length < 2) {
    return {
      field: "apellido",
      message: "El apellido debe tener al menos 2 caracteres."
    };
  }

  if (data.email) {

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(data.email)) {
      return {
        field: "email",
        message: "El email ingresado no es válido."
      };
    }

  }

  if (data.telefono) {

    const telRegex = /^[0-9+\s-]+$/;

    if (!telRegex.test(data.telefono)) {
      return {
        field: "telefono",
        message: "Formato de teléfono inválido."
      };
    }

  }

  const tieneTipoDoc = !!data.tipoDocumentoId;
  const tieneNumeroDoc = !!data.numeroDocumento;

  if (tieneTipoDoc && !tieneNumeroDoc) {
    return {
      field: "numeroDocumento",
      message: "Debe ingresar el número de documento."
    };
  }

  if (!tieneTipoDoc && tieneNumeroDoc) {
    return {
      field: "tipoDocumentoId",
      message: "Debe seleccionar el tipo de documento."
    };
  }

  return null;

}


// ======================================================
// CREAR CLIENTE
// ======================================================

export async function createCliente(data: any) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, message: "No autenticado." };
  }

  try {

    const error = validarCliente(data);

    if (error) {
      return {
        success: false,
        field: error.field,
        message: error.message
      };
    }

    const cliente = await db.cliente.create({

      data: {

        nombre: data.nombre.trim(),

        apellido: data.apellido?.trim() || null,

        email: data.email?.trim() || null,

        telefono: data.telefono?.trim() || null,

        numero_documento: data.numeroDocumento?.trim() || null,

        descripcion: data.descripcion || null,

        tipoDocumentoId:
          data.tipoDocumentoId
            ? Number(data.tipoDocumentoId)
            : null,

        tiposCliente:
          data.tipoClienteIds?.length
            ? {
                create: data.tipoClienteIds.map((id: any) => ({
                  tipoCliente: {
                    connect: {
                      id_tipo_cliente: Number(id),
                    },
                  },
                })),
              }
            : undefined,

      },

    });

    return {
      success: true,
      data: cliente
    };

  }
  catch (error) {

    console.error(error);

    return {
      success: false,
      message: "Error interno al crear el cliente."
    };

  }

}


// ======================================================
// ACTUALIZAR CLIENTE
// ======================================================
export async function updateCliente(id: number, data: any) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, message: "No autenticado." };
  }

  try {

    const error = validarCliente(data);

    if (error) {
      return {
        success: false,
        field: error.field,
        message: error.message
      };
    }

    const cliente = await db.cliente.update({

      where: {
        id_cliente: id
      },

      data: {

        nombre: data.nombre.trim(),

        apellido: data.apellido?.trim() || null,

        email: data.email?.trim() || null,

        telefono: data.telefono?.trim() || null,

        numero_documento: data.numeroDocumento?.trim() || null,

        descripcion: data.descripcion || null,

        tipoDocumentoId:
          data.tipoDocumentoId
            ? Number(data.tipoDocumentoId)
            : null,

        tiposCliente: {

          deleteMany: {},

          create:
            data.tipoClienteIds?.map((idTipo: any) => ({
              tipoCliente: {
                connect: {
                  id_tipo_cliente: Number(idTipo),
                },
              },
            })) || []

        }

      },

    });

    return {
      success: true,
      data: cliente
    };

  }
  catch (error) {

    console.error(error);

    return {
      success: false,
      message: "Error interno al actualizar el cliente."
    };

  }

}



// ======================================================
// SOFT DELETE
// ======================================================

export async function softDeleteCliente(id: number) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return { success: false, message: "No autenticado." };
  }

  try {

    const cliente = await db.cliente.update({

      where: {
        id_cliente: id
      },

      data: {
        activo: false
      }

    });

    return {
      success: true,
      data: cliente
    };

  }
  catch (error) {

    console.error(error);

    return {
      success: false,
      message: "Error al eliminar cliente."
    };

  }

}
