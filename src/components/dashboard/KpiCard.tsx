import { type LucideIcon } from 'lucide-react';

interface KpiCardProps { icon: LucideIcon; value: string | number; label: string; variant?: 'blue' | 'yellow'; }
export function KpiCard({ icon: Icon, value, label, variant = 'blue' }: KpiCardProps) {
  const bg = variant === 'blue' ? 'bg-[#63bae9]' : 'bg-[#fcc238]';
  const text = variant === 'blue' ? 'text-white' : 'text-[#2e2e2e]';
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-md ${bg} ${text}`}><Icon className="w-5 h-5" /></div>
        <span className="text-2xl font-bold text-gray-800">{value}</span>
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
