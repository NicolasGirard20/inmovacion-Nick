import Link from 'next/link';
import { getRecentModules } from '@/actions/navigation/getRecentModules';
import { ArrowRight } from 'lucide-react';

export async function QuickAccess() {
  const modules = await getRecentModules();
  if (modules.length === 0) {
    return <div className="mt-6 p-4 rounded-lg bg-gray-50 text-gray-600 text-sm">Aún no hay historial reciente. Explora los módulos disponibles.</div>;
  }
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Módulos más accedidos</h3>
      <div className="flex flex-wrap gap-3">
        {modules.map((mod: { label: string; href: string }) => (
          <Link key={mod.href} href={mod.href} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {mod.label}<ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
