/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/contracts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { z } from 'zod';
import { auth } from '../../../../auth';
import { supabaseServer } from '@/lib/supabase/server';

// ==================== CONFIG ====================
const TEMPLATES_BUCKET = 'templates';  // bucket donde están las plantillas
const CONTRACTS_BUCKET = 'contracts';  // bucket donde se guardan los contratos generados

// ==================== ESQUEMA DE VALIDACIÓN ====================
const contractSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  tipo_contrato: z.enum(['ALQUILER_LOCACION', 'COMPRA_VENTA'], { message: 'Tipo de contrato inválido' }),
  id_locador: z.number().int().positive().optional(),
  id_locatario: z.number().int().positive().optional(),
  id_comprador: z.number().int().positive().optional(),
  id_vendedor: z.number().int().positive().optional(),
  id_inmueble: z.number().int().positive('ID de inmueble inválido'),
  id_template: z.number().int().positive('ID de plantilla inválido'),
  valores: z.record(z.string(), z.string().min(1, 'Los valores no pueden estar vacíos')),
  fecha_inicio: z.string().min(1, 'Fecha de inicio obligatoria'),
  fecha_fin: z.string().min(1, 'Fecha de fin obligatoria'),
  monto: z.string().min(1, 'El monto es obligatorio').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'El monto debe ser un número positivo',
  }),
}).refine((data) => {
  if (data.tipo_contrato === 'ALQUILER_LOCACION') {
    return !!data.id_locador && !!data.id_locatario && data.id_locador !== data.id_locatario;
  }
  return !!data.id_comprador && !!data.id_vendedor && data.id_comprador !== data.id_vendedor;
}, { message: 'Deben especificarse dos clientes diferentes según el tipo de contrato' });

// ==================== GET (listado) - SIN CAMBIOS ====================
// ==================== GET OPTIMIZADO - SOLO CAMPOS NECESARIOS ====================
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const id_cliente_1 = parseInt(searchParams.get('id_cliente_1') || '0') || undefined;
    const id_cliente_2 = parseInt(searchParams.get('id_cliente_2') || '0') || undefined;
    const id_inmueble = parseInt(searchParams.get('id_inmueble') || '0') || undefined;
    const id_template = parseInt(searchParams.get('id_template') || '0') || undefined;
    const tipo_contrato = searchParams.get('tipo_contrato') || undefined;
    const firmado = searchParams.get('firmado');
    const activo = searchParams.get('activo');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const where: any = {};
    
    if (search) where.nombre = { contains: search, mode: 'insensitive' };
    
    if (fechaDesde || fechaHasta) {
      where.AND = where.AND || [];
      if (fechaDesde) {
        const [y, m, d] = fechaDesde.split('-').map(Number);
        where.AND.push({ fecha_fin: { gte: new Date(y, m - 1, d) } });
      }
      if (fechaHasta) {
        const [y, m, d] = fechaHasta.split('-').map(Number);
        where.AND.push({ fecha_inicio: { lte: new Date(y, m - 1, d, 23, 59, 59) } });
      }
    }
    
    if (id_cliente_1) where.id_cliente_1 = id_cliente_1;
    if (id_cliente_2) where.id_cliente_2 = id_cliente_2;
    if (id_inmueble) where.id_inmueble = id_inmueble;
    if (id_template) where.id_template = id_template;
    if (tipo_contrato) where.tipo_contrato = tipo_contrato;
    if (firmado !== null) where.firmado = firmado === 'true';
    if (activo !== null) where.activo = activo === 'true';

    // ✅ OPTIMIZACIÓN: Promise.all + select específico
    const [contratos, total] = await Promise.all([
      db.contrato.findMany({
        where,
        select: {
          id_contrato: true,
          nombre: true,
          tipo_contrato: true,
          fecha_inicio: true,
          fecha_fin: true,
          monto: true,
          archivoPath: true,
          activo: true,
          firmado: true,
          createdAt: true,
          updatedAt: true,
          valores: true,
          cliente_1: {
            select: {
              id_cliente: true,
              nombre: true,
              apellido: true,
            }
          },
          cliente_2: {
            select: {
              id_cliente: true,
              nombre: true,
              apellido: true,
            }
          },
          inmueble: {
            select: {
              id_inmueble: true,
              titulo: true,
            }
          },
          template: {
            select: {
              id: true,
              nombre: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          updatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.contrato.count({ where }),
    ]);

    const formatted = contratos.map(c => ({
      ...c,
      createdBy: {
        id: c.createdBy.id,
        name: c.createdBy.name || c.createdBy.email || 'Usuario desconocido'
      },
      updatedBy: {
        id: c.updatedBy.id,
        name: c.updatedBy.name || c.updatedBy.email || 'Usuario desconocido'
      },
    }));

    return NextResponse.json({ contratos: formatted, total, page, pageSize });
  } catch (error) {
    console.error('Error listando contratos:', error);
    return NextResponse.json({ error: 'Error al obtener contratos' }, { status: 500 });
  }
}

// ==================== POST → (CREAR CONTRATO) ====================
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const validated = contractSchema.parse(data);

    // 1. Buscar template
    const template = await db.template.findUnique({
      where: { id: validated.id_template },
      select: { archivoPath: true, tipo: true },
    });

    if (!template) return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    if (template.tipo !== validated.tipo_contrato)
      return NextResponse.json({ error: 'El tipo de plantilla no coincide con el tipo de contrato' }, { status: 400 });

    // 2. Descargar plantilla desde Supabase
    const templateUrl = new URL(template.archivoPath);
    const templatePathInBucket = templateUrl.pathname.replace(/^\/storage\/v1\/object\/public\/templates\//, '');

    const { data: templateFile, error: downloadError } = await supabaseServer.storage
      .from(TEMPLATES_BUCKET)
      .download(templatePathInBucket);

    if (downloadError || !templateFile) {
      console.error('Error descargando plantilla:', downloadError);
      return NextResponse.json({ error: 'No se pudo cargar la plantilla' }, { status: 500 });
    }

    // 3. Generar contrato con Docxtemplater
    const templateBuffer = Buffer.from(await templateFile.arrayBuffer());
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });

    doc.render(validated.valores);
    const generatedBuffer = doc.getZip().generate({ type: 'nodebuffer' });

    // 4. Subir contrato generado a Supabase
    const filename = `${Date.now()}-${validated.nombre.replace(/\s+/g, '_')}.docx`;
    const pathInBucket = `${session.user.id}/${filename}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(CONTRACTS_BUCKET)
      .upload(pathInBucket, generatedBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo contrato:', uploadError);
      return NextResponse.json({ error: 'Error al guardar el contrato generado' }, { status: 500 });
    }

    // 5. Obtener URL pública
    const { data: urlData } = supabaseServer.storage
      .from(CONTRACTS_BUCKET)
      .getPublicUrl(pathInBucket);

    const publicUrl = urlData.publicUrl;

    // 6. Determinar clientes
    const id_cliente_1 = validated.tipo_contrato === 'ALQUILER_LOCACION' ? validated.id_locador! : validated.id_vendedor!;
    const id_cliente_2 = validated.tipo_contrato === 'ALQUILER_LOCACION' ? validated.id_locatario! : validated.id_comprador!;

    // 7. Guardar en DB
    const contrato = await db.contrato.create({
      data: {
        nombre: validated.nombre,
        tipo_contrato: validated.tipo_contrato,
        id_cliente_1,
        id_cliente_2,
        id_inmueble: validated.id_inmueble,
        id_template: validated.id_template,
        valores: validated.valores,
        archivoPath: publicUrl,
        fecha_inicio: new Date(validated.fecha_inicio),
        fecha_fin: new Date(validated.fecha_fin),
        monto: parseFloat(validated.monto),
        activo: true,
        firmado: false,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
      include: {
        cliente_1: { select: { nombre: true, apellido: true } },
        cliente_2: { select: { nombre: true, apellido: true } },
        inmueble: { select: { titulo: true } },
        template: { select: { nombre: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const formatted = {
      ...contrato,
      createdBy: { id: contrato.createdBy.id, name: contrato.createdBy.name || contrato.createdBy.email || 'Usuario desconocido' },
      updatedBy: { id: contrato.updatedBy.id, name: contrato.updatedBy.name || contrato.updatedBy.email || 'Usuario desconocido' },
    };

    return NextResponse.json({ contrato: formatted, downloadUrl: publicUrl }, { status: 201 });
  } catch (error) {
    console.error('Error creando contrato:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno al generar el contrato' }, { status: 500 });
  }
}

// ==================== DELETE (solo desactiva) ====================
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Falta el ID del contrato' }, { status: 400 });

    const contrato = await db.contrato.findUnique({ where: { id_contrato: id } });
    if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    if (contrato.firmado) return NextResponse.json({ error: 'No se puede desactivar un contrato firmado' }, { status: 400 });

    const updated = await db.contrato.update({
      where: { id_contrato: id },
      data: { activo: false, updatedById: session.user.id },
    });

    return NextResponse.json({ success: true, contrato: updated });
  } catch (error) {
    console.error('Error desactivando contrato:', error);
    return NextResponse.json({ error: 'Error al desactivar el contrato' }, { status: 500 });
  }
}