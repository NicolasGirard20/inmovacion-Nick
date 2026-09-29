import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { NavigationTracker } from '@/components/layout/NavigationTracker';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const activeGroup = ((await cookies()).get('active-group')?.value as 'abogacia' | 'inmobiliaria') ?? 'inmobiliaria';
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={session.user} activeGroup={activeGroup} />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader session={session} activeGroup={activeGroup} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
      <NavigationTracker />
    </div>
  );
}
