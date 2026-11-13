// src/app/api/contracts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import { auth } from '../../../../../auth';

// ==================== CONFIG ====================
const TEMPLATES_BUCKET = 'templates';
const CONTRACTS_BUCKET = 'contracts';

// ==================== ESQUEMAS ====================
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
  monto: z.string().min(1).refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'El monto debe ser un número positivo',
  }),
}).refine((data) => {
  const start = new Date(data.fecha_inicio);
  const end = new Date(data.fecha_fin);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['fecha_fin'],
}).refine((data) => {
  if (data.tipo_contrato === 'ALQUILER_LOCACION') {
    return !!data.id_locador && !!data.id_locatario && data.id_locador !== data.id_locatario;
  }
  return !!data.id_comprador && !!data.id_vendedor && data.id_comprador !== data.id_vendedor;
}, {
  message: 'Deben seleccionarse dos clientes diferentes',
  path: ['id_locatario', 'id_vendedor'],
});

const patchSchema = z.object({
  firmado: z.boolean().optional(),
  activo: z.boolean().optional(),
}).refine((data) => data.firmado !== undefined || data.activo !== undefined, {
  message: 'Se debe proporcionar al menos un campo: firmado o activo',
});


// ==================== GET OPTIMIZADO ====================
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  // ✅ OPTIMIZACIÓN: Select solo campos necesarios
  const contrato = await db.contrato.findUnique({
    where: { id_contrato: numId },
    select: {
      id_contrato: true,
      nombre: true,
      archivoPath: true,
      fecha_inicio: true,
      fecha_fin: true,
      monto: true,
      valores: true,
      id_cliente_1: true,
      id_cliente_2: true,
      id_inmueble: true,
      id_template: true,
      tipo_contrato: true,
      activo: true,
      firmado: true,
      createdAt: true,
      updatedAt: true,
      // Solo campos necesarios de las relaciones
      cliente_1: { 
        select: { 
          id_cliente: true,
          nombre: true, 
          apellido: true 
        } 
      },
      cliente_2: { 
        select: { 
          id_cliente: true,
          nombre: true, 
          apellido: true 
        } 
      },
      inmueble: { 
        select: { 
          id_inmueble: true,
          titulo: true 
        } 
      },
      template: { 
        select: { 
          id: true,
          nombre: true,
          camposVariables: true
        } 
      },
    },
  });

  if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  return NextResponse.json(contrato);
}

// ==================== PUT (EDITAR CONTRATO) ====================
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const data = await req.json();
    const validated = contractSchema.parse(data);

    const contrato = await db.contrato.findUnique({ where: { id_contrato: numId } });
    if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    if (!contrato.activo) return NextResponse.json({ error: 'No se puede editar un contrato inactivo' }, { status: 400 });
    if (contrato.firmado) return NextResponse.json({ error: 'Contrato firmado no se puede modificar' }, { status: 403 });

    const template = await db.template.findUnique({
      where: { id: validated.id_template },
      select: { archivoPath: true, tipo: true },
    });
    if (!template) return NextResponse.json({ error: 'Template no encontrado' }, { status: 404 });
    if (template.tipo !== validated.tipo_contrato)
      return NextResponse.json({ error: 'El tipo de plantilla no coincide' }, { status: 400 });

    // Descargar plantilla
    const templatePath = new URL(template.archivoPath).pathname.replace(/^\/storage\/v1\/object\/public\/templates\//, '');
    const { data: file, error: dlError } = await supabaseServer.storage.from(TEMPLATES_BUCKET).download(templatePath);
    if (dlError || !file) return NextResponse.json({ error: 'Error cargando plantilla' }, { status: 500 });

    // Generar documento
    const zip = new PizZip(Buffer.from(await file.arrayBuffer()));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
    doc.render(validated.valores);
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

   // Obtener el path existente del contrato anterior (para sobreescribir)
if (!contrato.archivoPath) {
  return NextResponse.json({ error: 'El contrato no tiene archivo asociado' }, { status: 400 });
}

const existingPath = new URL(contrato.archivoPath).pathname.replace(/^\/storage\/v1\/object\/public\/contracts\//, '');

    // Subir el nuevo buffer al mismo path (sobreescribir)
    const { error: uploadError } = await supabaseServer.storage
      .from(CONTRACTS_BUCKET)
      .upload(existingPath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });

    if (uploadError) return NextResponse.json({ error: 'Error al actualizar el contrato' }, { status: 500 });

    // No cambiamos la URL pública, ya que el path es el mismo
    const id_cliente_1 = validated.tipo_contrato === 'ALQUILER_LOCACION' ? validated.id_locador! : validated.id_vendedor!;
    const id_cliente_2 = validated.tipo_contrato === 'ALQUILER_LOCACION' ? validated.id_locatario! : validated.id_comprador!;

    const updated = await db.contrato.update({
      where: { id_contrato: numId },
      data: {
        nombre: validated.nombre,
        tipo_contrato: validated.tipo_contrato,
        id_cliente_1,
        id_cliente_2,
        id_inmueble: validated.id_inmueble,
        id_template: validated.id_template,
        valores: validated.valores,
        fecha_inicio: new Date(validated.fecha_inicio),
        fecha_fin: new Date(validated.fecha_fin),
        monto: parseFloat(validated.monto),
        updatedById: session.user.id,
      },
    });

    return NextResponse.json({ ...updated, downloadUrl: contrato.archivoPath });
  } catch (error) {
    console.error('Error PUT contrato:', error);
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Error al actualizar el contrato' }, { status: 500 });
  }
}

// ==================== PATCH ====================
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const data = await req.json();
    const validated = patchSchema.parse(data);

    const contrato = await db.contrato.findUnique({ where: { id_contrato: numId } });
    if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });

    if (validated.activo === false && contrato.firmado) {
      return NextResponse.json({ error: 'No se puede desactivar un contrato firmado' }, { status: 400 });
    }

    const updated = await db.contrato.update({
      where: { id_contrato: numId },
      data: {
        ...(validated.firmado !== undefined && { firmado: validated.firmado }),
        ...(validated.activo !== undefined && { activo: validated.activo }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues }, { status: 400 });
    return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 });
  }
}

// ==================== DELETE (borrado permanente) ====================
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await params;
  const numId = Number(id);
  if (isNaN(numId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const contrato = await db.contrato.findUnique({ where: { id_contrato: numId } });
  if (!contrato) return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
  if (contrato.activo) return NextResponse.json({ error: 'No se puede eliminar un contrato activo' }, { status: 400 });

  // Borrar archivo de Supabase
  if (contrato.archivoPath) {
    try {
      const path = new URL(contrato.archivoPath).pathname.replace(/^\/storage\/v1\/object\/public\/contracts\//, '');
      const { error } = await supabaseServer.storage.from(CONTRACTS_BUCKET).remove([path]);
      if (error) console.warn('Error borrando archivo:', error);
    } catch (e) {
      console.warn('No se pudo borrar el archivo físico');
    }
  }

  await db.contrato.delete({ where: { id_contrato: numId } });
  return NextResponse.json({ success: true });
}