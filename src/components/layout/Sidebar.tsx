import { SidebarClient } from './SidebarClient';
import type { User } from 'next-auth';

interface SidebarProps { user?: User; activeGroup: 'abogacia' | 'inmobiliaria'; }

const baseItems = [{ label: 'Inicio', href: '/inicio', iconName: 'Home' }];

const inmobiliariaItems = [
  { label: 'Clientes', href: '/clientes', iconName: 'Users' },
  { label: 'Propiedades', href: '/propiedades', iconName: 'Building' },
  { label: 'Proveedores', href: '/proveedores', iconName: 'Truck' },
  { label: 'Pagos a Proveedores', href: '/pagos', iconName: 'CreditCard' },
  { label: 'Rendiciones', href: '/rendiciones', iconName: 'BarChart3' },
  { label: 'Contratos', href: '/contratos', iconName: 'FileText' },
  { label: 'Cobranzas', href: '/cobranzas', iconName: 'Banknote' },
  { label: 'Usuarios', href: '/usuarios', iconName: 'UserCog' },
];

const abogaciaItems = [
  { label: 'Abogacía – En desarrollo', href: '/abogacia', iconName: 'Scale' },
];

export function Sidebar({ user, activeGroup }: SidebarProps) {
  let items = [...baseItems];
  if (user?.role === 'admin') {
    items = [...items, ...(activeGroup === 'inmobiliaria' ? inmobiliariaItems : abogaciaItems)];
  }
  return <SidebarClient items={items} />;
}
