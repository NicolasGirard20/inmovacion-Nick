import { auth } from '../../../../auth';
import { cookies } from 'next/headers';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { QuickAccess } from '@/components/dashboard/QuickAccess';
import EnDesarrollo from '@/components/ui/EnDesarrollo';

export default async function InicioPage() {
  const session = await auth();
  const activeGroup = ((await cookies()).get('active-group')?.value as 'abogacia' | 'inmobiliaria') ?? 'inmobiliaria';
  const user = session?.user;
  const isAdmin = user?.role === 'admin';
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#63bae9] to-sky-400 text-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">¡Hola, {user?.name || user?.email}!</h1>
        <p className="text-white/90 mt-1">Bienvenido a inmovacion. Selecciona un módulo desde el menú lateral para comenzar.</p>
      </div>
      {isAdmin && activeGroup === 'inmobiliaria' && <><KpiGrid /><QuickAccess /></>}
      {isAdmin && activeGroup === 'abogacia' && <EnDesarrollo />}
    </div>
  );
}
