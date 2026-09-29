'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackNavigation } from '@/actions/navigation/trackNavigation';

const MODULE_MAP: Record<string, string> = {
  '/inicio': 'inicio', '/dashboard': 'inicio', '/clientes': 'clientes', '/propiedades': 'propiedades',
  '/proveedores': 'proveedores', '/pagos': 'pagos', '/rendiciones': 'rendiciones', '/contratos': 'contratos',
  '/cobranzas': 'cobranzas', '/usuarios': 'usuarios',
};

export function NavigationTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname) return;
    const module = MODULE_MAP[pathname];
    if (!module || lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    const t = setTimeout(() => trackNavigation({ module, path: pathname }), 1000);
    return () => clearTimeout(t);
  }, [pathname]);
  return null;
}
