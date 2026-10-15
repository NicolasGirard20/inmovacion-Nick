import { redirect } from "next/navigation";
import { CalendarClock, Scale } from "lucide-react";
import { auth } from "../../../../../auth";
import { AdminAvailabilityManager } from "@/components/abogacia/AdminAvailabilityManager";
import { getAdminAvailabilityData, getCurrentMonthKey } from "@/lib/abogacia/availability";

export const metadata = {
  title: "Turnos de abogacía | Inmovacion",
};

export default async function AbogaciaTurnosPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/inicio");

  const initialData = await getAdminAvailabilityData(getCurrentMonthKey());
  if (!initialData) redirect("/inicio");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#fcc238]/20 text-[#80600b]">
            <CalendarClock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#80600b]"><Scale className="h-3.5 w-3.5" aria-hidden="true" /> Gestión administrativa</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Disponibilidad de abogacía</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 sm:text-base">
              Configurá el horario semanal de atención y marcá los rangos en los que el abogado no estará disponible. El calendario público mostrará los espacios restantes.
            </p>
          </div>
        </div>
      </header>
      <AdminAvailabilityManager initialData={initialData} />
    </div>
  );
}
