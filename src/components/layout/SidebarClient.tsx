'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import * as Icons from 'lucide-react';

interface NavItem { label: string; href: string; iconName: string; }

export function SidebarClient({ items }: { items: NavItem[] }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsOpen(true); else setIsOpen(false);
    };
    onResize(); window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { if (isMobile) setIsOpen(false); }, [pathname, isMobile]);

  return (
    <>
      {isMobile && isOpen && <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed md:relative z-50 h-full bg-[#63bae9] text-white transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 font-bold text-xl tracking-wide text-white">inmovacion</div>
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            {items.map(item => {
              const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.iconName] ?? Icons.Circle;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${active ? 'bg-white/20 font-semibold' : 'hover:bg-white/10'}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-2 mt-auto">
            <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-3 px-3 py-2 w-full rounded-md hover:bg-white/10 transition-colors">
              <Icons.LogOut className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-[#63bae9] text-white">
        <Icons.Menu className="w-6 h-6" />
      </button>
    </>
  );
}
