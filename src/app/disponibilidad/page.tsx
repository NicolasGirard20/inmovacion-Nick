import Link from "next/link";
import { ArrowLeft, CalendarDays, Scale } from "lucide-react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { PublicAvailabilityView } from "@/components/abogacia/PublicAvailabilityView";
import { getPublicAvailabilityData } from "@/lib/abogacia/availability";

export const metadata = {
  title: "Disponibilidad para consultas legales | GBS & Asociados",
  description: "Consultá los horarios disponibles para una consulta legal con GBS & Asociados.",
};

export const dynamic = "force-dynamic";

export default async function PublicAvailabilityPage() {
  let availability: Awaited<ReturnType<typeof getPublicAvailabilityData>> | null = null;

  try {
    availability = await getPublicAvailabilityData();
  } catch {
    console.error("No se pudo cargar la disponibilidad pública de abogacía.");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header />
      <main className="flex-1 px-4 py-8 text-[#2e2e2e] sm:px-6 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <Link href="/#servicios" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5a5a5a] transition-colors hover:text-[#2e2e2e]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a GBS &amp; Asociados
          </Link>

          <header className="mb-8 border-b border-gray-200 pb-7 sm:mb-10 sm:pb-9">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fcc238]/20 text-[#9a6c00]">
              <Scale className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a650f]">Abogacía · GBS &amp; Asociados</p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Consultá disponibilidad</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#686363]">
              Elegí un día para ver los horarios disponibles para una consulta. El turno se coordina directamente con el estudio.
            </p>
          </header>

          {availability ? (
            <PublicAvailabilityView availability={availability} />
          ) : (
            <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold">No pudimos cargar el calendario</h2>
                  <p className="mt-1">Podés comunicarte con el estudio para consultar los horarios disponibles.</p>
                  <a className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href="https://wa.me/5493434612497" target="_blank" rel="noopener noreferrer">
                    Consultar por WhatsApp
                  </a>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
