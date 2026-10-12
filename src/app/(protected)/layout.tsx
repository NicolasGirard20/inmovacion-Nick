// src/app/(protected)/layout.tsx
import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/AppShell';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const activeGroup = ((await cookies()).get('active-group')?.value as 'abogacia' | 'inmobiliaria') ?? 'inmobiliaria';
  return (
    <AppShell session={session} activeGroup={activeGroup}>
      {children}
    </AppShell>
  );
}