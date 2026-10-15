import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Compass,
  Eye,
  ShieldCheck,
  Award,
  Users,
  Handshake,
  Scale,
  Building2,
  ArrowRight,
  ArrowLeft,
  Clock,
  type LucideIcon,
} from "lucide-react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export const metadata = {
  title: "Nosotros | GBS & Asociados",
  description:
    "Conocé la misión, visión, valores y el equipo profesional interdisciplinario de GBS & Asociados.",
};

type ValueItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type TeamMember = {
  name: string;
  role: string;
  specialty: string;
  bio: string;
  image?: string;
  initials: string;
};

const VALUES: ValueItem[] = [
  {
    icon: ShieldCheck,
    title: "Seguridad Jurídica",
    description:
      "Cada operación inmobiliaria y trámite cuenta con rigurosa verificación y respaldo normativo para tu total tranquilidad.",
  },
  {
    icon: Handshake,
    title: "Transparencia Absoluta",
    description:
      "Claridad en cada etapa: honorarios justos, condiciones precisas y comunicación constante sin sorpresas.",
  },
  {
    icon: Award,
    title: "Trayectoria y Excelencia",
    description:
      "Más de 15 años combinando práctica legal y conocimiento del mercado regional con altos estándares de calidad.",
  },
  {
    icon: Clock,
    title: "Respuesta Ágil",
    description:
      "Entendemos el valor del tiempo: atención dedicada y respuesta oportuna ante cada consulta o eventualidad.",
  },
];

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Dr. Gabriel B. Silva",
    role: "Socio Fundador · Área Legal",
    specialty: "Derecho Civil, Comercial y Contratos Inmobiliarios",
    bio: "Especialista en estructuración legal de operaciones patrimoniales, resolución de conflictos y asesoramiento integral a propietarios e inversores.",
    initials: "GS",
  },
  {
    name: "Lic. Martín Benítez",
    role: "Director de Operaciones Inmobiliarias",
    specialty: "Corredor y Martillero Público",
    bio: "Experto en tasación, comercialización y gestión de inmuebles residenciales y comerciales en Libertador San Martín y la región.",
    initials: "MB",
  },
  {
    name: "Dra. Sofía Albornoz",
    role: "Asesora Jurídica",
    specialty: "Derecho de Familia y Sucesiones",
    bio: "Acompañamiento legal humanizado y preventivo en procesos sucesorios, división de bienes y acuerdos familiares complejos.",
    initials: "SA",
  },
];

export default function NosotrosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Header />

      <main className="flex-1 px-4 py-8 text-[#2e2e2e] sm:px-6 lg:py-12">
        <div className="mx-auto max-w-6xl">
          {/* Enlace volver consistente */}
          <Link
            href="/#servicios"
            className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5a5a5a] transition-colors hover:text-[#2e2e2e]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver a GBS &amp; Asociados
          </Link>

          {/* Encabezado con el mismo patrón de /propiedades y /disponibilidad */}
          <header className="mb-10 border-b border-gray-200 pb-7 sm:mb-12 sm:pb-9">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#63bae9]/20 text-[#4ca8d8]">
              <Users className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#4ca8d8]">
              Institucional · GBS &amp; Asociados
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              Sobre nosotros
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[#686363]">
              Somos un estudio integrado por profesionales del derecho y la gestión inmobiliaria.
              Conocé nuestra misión, visión, valores y el equipo que te acompaña en cada decisión.
            </p>
          </header>

          {/* Misión y Visión */}
          <section className="mb-16">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Misión */}
              <div className="relative p-8 rounded-3xl bg-white border border-[#63bae9]/20 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#63bae9]/15 flex items-center justify-center text-[#4ca8d8]">
                    <Compass className="w-6 h-6 text-[#4ca8d8]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-[0.16em] text-[#4ca8d8] uppercase">
                      Nuestro Propósito
                    </span>
                    <h2 className="text-2xl font-bold text-[#2e2e2e]">Misión</h2>
                  </div>
                </div>

                <p className="text-[#555] leading-relaxed text-base">
                  Brindar asesoramiento jurídico de excelencia y una gestión inmobiliaria integral,
                  segura y transparente. Guiamos a personas y familias en cada decisión legal y
                  patrimonial, transformando procesos complejos en soluciones claras, confiables y
                  duraderas.
                </p>
              </div>

              {/* Visión */}
              <div className="relative p-8 rounded-3xl bg-white border border-[#fcc238]/30 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#fcc238]/20 flex items-center justify-center text-[#9a6c00]">
                    <Eye className="w-6 h-6 text-[#9a6c00]" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-[0.16em] text-[#9a6c00] uppercase">
                      Hacia Dónde Vamos
                    </span>
                    <h2 className="text-2xl font-bold text-[#2e2e2e]">Visión</h2>
                  </div>
                </div>

                <p className="text-[#555] leading-relaxed text-base">
                  Consolidarnos como el estudio interdisciplinario de referencia en Libertador San
                  Martín y toda la región de Entre Ríos, reconocidos por nuestra ética profesional,
                  la adopción de tecnología que optimiza la experiencia del cliente y la capacidad de
                  proteger lo que más importa.
                </p>
              </div>
            </div>
          </section>

          {/* Valores */}
          <section className="mb-16">
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-[0.16em] text-[#686363] uppercase">
                Nuestros Pilares
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2e2e2e] mt-1">
                Valores que definen nuestro trabajo
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((val, idx) => {
                const IconComponent = val.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md hover:border-[#63bae9]/30 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#63bae9]/10 text-[#4ca8d8] flex items-center justify-center mb-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2e2e2e] mb-2">{val.title}</h3>
                    <p className="text-sm text-[#686363] leading-relaxed">{val.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Equipo / Miembros */}
          <section className="mb-16">
            <div className="mb-8">
              <span className="text-xs font-semibold tracking-[0.16em] text-[#686363] uppercase">
                Nuestro Equipo
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#2e2e2e] mt-1">
                Profesionales a tu servicio
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TEAM_MEMBERS.map((member, idx) => (
                <div
                  key={idx}
                  className="group bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden"
                >
                  {/* Foto o Avatar */}
                  <div className="relative h-52 bg-gradient-to-tr from-[#2e2e2e] via-[#3a3a3a] to-[#505050] flex items-center justify-center overflow-hidden">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-18 h-18 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-2xl font-bold tracking-wider shadow-inner group-hover:scale-110 transition-transform">
                          {member.initials}
                        </div>
                        <span className="text-[11px] text-white/60 mt-3 font-medium uppercase tracking-widest">
                          GBS &amp; Asociados
                        </span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/90 text-[#2e2e2e] backdrop-blur-xs shadow-xs">
                        Miembro
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-[#2e2e2e] mb-1 group-hover:text-[#4ca8d8] transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-xs font-semibold text-[#fcc238] uppercase tracking-wider mb-2">
                        {member.role}
                      </p>
                      <p className="text-xs text-[#8a8a8a] font-medium mb-3">
                        {member.specialty}
                      </p>
                      <p className="text-sm text-[#686363] leading-relaxed">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#2e2e2e] to-[#1a1a1a] text-white text-center shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-8">
              Ya sea para encontrar tu próximo inmueble o resolver una consulta legal con nuestro equipo, estamos a tu disposición.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/propiedades"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#63bae9] text-white font-semibold hover:bg-[#4ca8d8] transition-all shadow-md hover:-translate-y-0.5"
              >
                <Building2 className="w-4 h-4" />
                Explorar propiedades
              </Link>
              <Link
                href="/disponibilidad"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#fcc238] text-[#2e2e2e] font-semibold hover:bg-[#e6af32] transition-all shadow-md hover:-translate-y-0.5"
              >
                <Scale className="w-4 h-4" />
                Agendar consulta legal
              </Link>
              <Link
                href="/#contacto"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 border border-white/20 transition-all hover:-translate-y-0.5"
              >
                Contactanos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
