'use client';
import { useState } from 'react';
import type { User } from 'next-auth';
import { signOut } from 'next-auth/react';

export function UserMenu({ user }: { user?: User }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700">
        {(user.name?.charAt(0) ?? user.email?.charAt(0) ?? 'U').toUpperCase()}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-48 bg-white border rounded-md shadow-lg z-50 py-1">
            <div className="px-4 py-2 text-sm text-gray-600 border-b">{user.name || user.email}</div>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Cerrar sesión</button>
          </div>
        </>
      )}
    </div>
  );
}
