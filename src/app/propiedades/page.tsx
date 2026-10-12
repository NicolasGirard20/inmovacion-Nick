// src/app/propiedades/page.tsx
// Server Component — carga sesión y grupo activo, y decide si
// mostrar la navegación admin (AppShell) o el contenido directo.

import { auth } from '../../../auth';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';
import PropiedadesClient from './PropiedadesClient';

export default async function PropiedadesPage() {
  const session = await auth();
  const activeGroup = ((await cookies()).get('active-group')?.value as 'abogacia' | 'inmobiliaria') ?? 'inmobiliaria';

  // Admin ve el shell con sidebar, header y navegación;
  // el resto (user, visitante) ve el contenido sin shell.
  if (session?.user?.role === 'admin') {
    return (
      <AppShell session={session} activeGroup={activeGroup}>
        <PropiedadesClient />
      </AppShell>
    );
  }

  return <PropiedadesClient />;
}