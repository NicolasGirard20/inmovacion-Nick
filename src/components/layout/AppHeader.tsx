import type { Session } from 'next-auth';
import { GroupSelector } from './GroupSelector';
import { UserMenu } from './UserMenu';

interface AppHeaderProps { session: Session; activeGroup: 'abogacia' | 'inmobiliaria'; }

export function AppHeader({ session, activeGroup }: AppHeaderProps) {
  const isAdmin = session.user?.role === 'admin';
  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-4">
        {isAdmin && <GroupSelector current={activeGroup} />}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 hidden sm:inline">{session.user?.name || session.user?.email}</span>
        <UserMenu user={session.user} />
      </div>
    </header>
  );
}
