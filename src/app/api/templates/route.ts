// src/app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { parseOfficeAsync } from 'officeparser';
import { db } from '@/lib/db';
import { z } from 'zod';
import { auth } from '../../../../auth';
import { supabaseServer } from '@/lib/supabase/server';

// ==================== CONFIG ====================
const BUCKET_NAME = 'templates'; // nombre exacto del bucket en Supabase

const templateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo: z.enum(['ALQUILER_LOCACION', 'COMPRA_VENTA'], { message: 'Tipo inválido' }),
});

// ==================== POST ====================
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const nombre = formData.get('nombre') as string;
    const tipo = formData.get('tipo') as string;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const validatedData = templateSchema.parse({ nombre, tipo });

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    }

    const validExtension = '.docx';
    const validMimeType =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!file.name.toLowerCase().endsWith(validExtension)) {
      return NextResponse.json(
        { error: 'Solo se permiten archivos .docx' },
        { status: 400 }
      );
    }

    if (file.type !== validMimeType) {
      return NextResponse.json(
        { error: 'El archivo debe ser un documento Word válido (.docx)' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const extension = file.name.split('.').pop()!;
    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const pathInBucket = `${session.user.id}/${filename}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(pathInBucket, buffer, {
        contentType: validMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error al subir archivo a Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Error al guardar el archivo' },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(pathInBucket);

    const publicUrl = urlData.publicUrl;

    let text: string;
    try {
      text = await parseOfficeAsync(buffer);
    } catch (parseError) {
      await supabaseServer.storage.from(BUCKET_NAME).remove([pathInBucket]);
      return NextResponse.json(
        { error: 'No se pudo leer el documento Word. Verifica que sea un .docx válido.' },
        { status: 400 }
      );
    }

    const campos = Array.from(text.matchAll(/\{([^}]+)\}/g))
      .map((m) => m[1].trim())
      .filter(Boolean);
    const uniqueCampos = [...new Set(campos)];

    if (uniqueCampos.length === 0) {
      await supabaseServer.storage.from(BUCKET_NAME).remove([pathInBucket]);
      return NextResponse.json(
        { error: 'La plantilla debe contener al menos un campo con formato {nombre_campo}' },
        { status: 400 }
      );
    }

    const template = await db.template.create({
      data: {
        nombre: validatedData.nombre,
        archivoPath: publicUrl,
        camposVariables: uniqueCampos,
        tipo: validatedData.tipo,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ template, campos: uniqueCampos }, { status: 201 });
  } catch (error) {
    console.error('Error al crear template:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ==================== GET ====================
// ==================== GET OPTIMIZADO ====================
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const fechaDesde = searchParams.get('fechaDesde');
    const tipo = searchParams.get('tipo');
    const page = Number(searchParams.get('page') ?? '1');
    const pageSize = Number(searchParams.get('pageSize') ?? '10');

    const where: any = {};
    if (search) where.nombre = { contains: search, mode: 'insensitive' };
    if (fechaDesde) where.createdAt = { gte: new Date(fechaDesde) };
    if (tipo) where.tipo = tipo;

    // ✅ OPTIMIZACIÓN: Select solo campos necesarios
    const [templates, total] = await Promise.all([
      db.template.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          archivoPath: true,
          camposVariables: true,
          tipo: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.template.count({ where }),
    ]);

    const formattedTemplates = templates.map((t) => ({
      ...t,
      createdBy: {
        id: t.createdBy.id,
        name: t.createdBy.name || t.createdBy.email || 'Usuario desconocido',
      },
    }));

    return NextResponse.json(
      { templates: formattedTemplates, total, page, pageSize },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al listar templates:', error);
    return NextResponse.json(
      { error: 'Error al obtener templates' },
      { status: 500 }
    );
  }
}

// ==================== DELETE (CORREGIDO Y SEGURO) ====================
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    const template = await db.template.findUnique({
      where: { id },
      select: { id: true, archivoPath: true },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    // Verificar si el template está en uso
    const contratosEnUso = await db.contrato.findMany({
      where: { id_template: id },
      select: { nombre: true },
    });

    if (contratosEnUso.length > 0) {
      const nombres = contratosEnUso.map((c) => c.nombre).join(', ');
      return NextResponse.json(
        {
          error: `No se puede eliminar porque está en uso por los contratos: ${nombres}`,
        },
        { status: 400 }
      );
    }

    // Borrar archivo del bucket de forma 100% confiable
    if (template.archivoPath) {
      try {
        const url = new URL(template.archivoPath);
        const pathInBucket = url.pathname.replace(
          /^\/storage\/v1\/object\/public\/templates\//,
          ''
        );

        if (pathInBucket) {
          const { error: deleteError } = await supabaseServer.storage
            .from(BUCKET_NAME)
            .remove([pathInBucket]);

          if (deleteError) {
            console.error('Error borrando archivo de Supabase:', deleteError.message);
            // No rompemos si falla el borrado físico
          } else {
            console.log('Archivo eliminado de Supabase:', pathInBucket);
          }
        }
      } catch (err) {
        console.warn('No se pudo extraer el path del archivo. Se omite borrado físico.');
      }
    }

    // Eliminar el registro de la base de datos
    await db.template.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: 'Template eliminado correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar template:', error);
    return NextResponse.json({ error: 'Error al eliminar template' }, { status: 500 });
  }
}