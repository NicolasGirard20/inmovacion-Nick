// src/components/layout/AppShell.tsx
// Server component — shell compartido para páginas protegidas y
// páginas públicas que requieren navegación admin (ej. /propiedades).

import { Sidebar } from '@/components/layout/Sidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { NavigationTracker } from '@/components/layout/NavigationTracker';
import type { Session } from 'next-auth';

interface AppShellProps {
  session: Session;
  activeGroup: 'abogacia' | 'inmobiliaria';
  children: React.ReactNode;
}

export function AppShell({ session, activeGroup, children }: AppShellProps) {
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