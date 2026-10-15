import { auth } from '../../../auth';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import Header from '@/components/ui/Header';
import PropiedadesClient from './PropiedadesClient';

export default async function PropiedadesPage() {
  const session = await auth();
  const activeGroup = ((await cookies()).get('active-group')?.value as 'abogacia' | 'inmobiliaria') ?? 'inmobiliaria';

  if (session?.user?.role === 'admin') {
    return (
      <AppShell session={session} activeGroup={activeGroup}>
        <PropiedadesClient />
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PropiedadesClient />
      </main>
    </div>
  );
}