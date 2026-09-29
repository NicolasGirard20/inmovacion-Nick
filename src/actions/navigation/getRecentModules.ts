'use server';
import { db } from '@/lib/db';
import { auth } from '../../../auth';

const MODULE_LABELS: Record<string, { label: string; href: string }> = {
  inicio: { label: 'Inicio', href: '/inicio' }, clientes: { label: 'Clientes', href: '/clientes' },
  propiedades: { label: 'Propiedades', href: '/propiedades' }, proveedores: { label: 'Proveedores', href: '/proveedores' },
  pagos: { label: 'Pagos a Proveedores', href: '/pagos' }, rendiciones: { label: 'Rendiciones', href: '/rendiciones' },
  contratos: { label: 'Contratos', href: '/contratos' }, cobranzas: { label: 'Cobranzas', href: '/cobranzas' },
  usuarios: { label: 'Usuarios', href: '/usuarios' },
};

export async function getRecentModules(): Promise<{ label: string; href: string }[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];
    const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const results = await db.navigationLog.groupBy({
      by: ['module'], where: { userId: session.user.id, visitedAt: { gte: hace30Dias } },
      _count: { module: true }, orderBy: { _count: { module: 'desc' } }, take: 5,
    });
    return results.map(r => MODULE_LABELS[r.module]).filter((m): m is { label: string; href: string } => Boolean(m)).slice(0, 5);
  } catch { return []; }
}
