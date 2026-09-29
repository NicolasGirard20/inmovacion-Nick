'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setGroup } from '@/actions/user/setGroup';

export function GroupSelector({ current }: { current: 'abogacia' | 'inmobiliaria' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const select = async (value: 'abogacia' | 'inmobiliaria') => {
    if (value === current || isPending) return;
    startTransition(async () => { await setGroup(value); router.refresh(); });
  };

  const base = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors border';
  return (
    <div className="flex gap-2">
      <button disabled={isPending} onClick={() => select('inmobiliaria')} className={`${base} ${current === 'inmobiliaria' ? 'bg-[#63bae9] text-white border-[#63bae9]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Inmobiliaria</button>
      <button disabled={isPending} onClick={() => select('abogacia')} className={`${base} ${current === 'abogacia' ? 'bg-[#fcc238] text-[#2e2e2e] border-[#fcc238]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Abogacía</button>
    </div>
  );
}
