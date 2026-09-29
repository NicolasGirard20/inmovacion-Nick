import { Home, Users, FileSignature, Banknote } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { getKpis } from '@/actions/dashboard/getKpis';

function fmtCurrency(n: number | null) {
  if (n == null) return '-';
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export async function KpiGrid() {
  try {
    const kpis = await getKpis();
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Home} value={kpis.propiedadesActivas} label="Propiedades activas" />
        <KpiCard icon={Users} value={kpis.clientesActivos} label="Clientes activos" variant="yellow" />
        <KpiCard icon={FileSignature} value={kpis.contratosActivos} label="Contratos activos" />
        <KpiCard icon={Banknote} value={fmtCurrency(kpis.recaudacionMes)} label="Recaudación del mes" variant="yellow" />
      </div>
    );
  } catch {
    return <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">No se pudieron cargar las métricas.</div>;
  }
}
