'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
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
      <aside className={`fixed md:relative z-50 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0 overflow-hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-4">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-sidebar-foreground">INMOVACION</span>
          </div>
          <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
            {items.map(item => {
              const Icon = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.iconName] ?? Icons.Circle;
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-[15px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${active ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold' : 'hover:bg-sidebar-accent'}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-sidebar-primary text-sidebar-primary-foreground border border-sidebar-border shadow-sm">
        <Icons.Menu className="w-6 h-6" />
      </button>
    </>
  );
}
