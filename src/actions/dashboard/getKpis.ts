'use server';
import { db } from '@/lib/db';
import { auth } from '../../../auth';

export interface DashboardKpiData {
  propiedadesActivas: number; clientesActivos: number; contratosActivos: number; recaudacionMes: number | null;
}

export async function getKpis(): Promise<DashboardKpiData> {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');
  const hoy = new Date();
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const [propiedadesActivas, clientesActivos, contratosActivos, recaudacion] = await Promise.all([
    db.inmueble.count({ where: { archivado: false } }),
    db.cliente.count({ where: { activo: true } }),
    db.contrato.count({ where: { activo: true } }),
    db.cobranza.aggregate({ _sum: { monto: true }, where: { fecha_cobranza: { gte: inicioMes, lte: finMes }, pagado: true } }),
  ]);
  const recaudacionMes = recaudacion._sum?.monto != null ? Number(recaudacion._sum.monto) : null;
  return { propiedadesActivas, clientesActivos, contratosActivos, recaudacionMes };
}
