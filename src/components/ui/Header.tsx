// src/components/ui/Header.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Menu,
  User,
  AlertCircle,
  X,
  Mail,
  BookOpen,
  Award,
  ShieldCheck,
  ChevronDown,
  Building2,
  CalendarDays,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PRINCIPAL_SUBITEMS = [
  { label: "Cómo trabajamos", href: "/#como-trabajamos", Icon: BookOpen },
  { label: "Nuestra experiencia", href: "/#servicios", Icon: Award },
  { label: "Por qué GBS", href: "/#por-que-gbs", Icon: ShieldCheck },
  { label: "Contacto", href: "/#contacto", Icon: Mail },
];

const DIRECT_NAV_LINKS = [
  { label: "Propiedades", href: "/propiedades", Icon: Building2 },
  { label: "Disponibilidad", href: "/disponibilidad", Icon: CalendarDays },
  { label: "Nosotros", href: "/nosotros", Icon: Users },
];

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const titulo = "GBS & Asociados";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUserSettingsClick = () => {
    if (session?.user) {
      router.push("/usuarios/perfil");
    } else {
      setError("No se pudo cargar la configuración del usuario.");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <>
      <header
        className={`
          sticky top-0 z-50
          w-full
          transition-all duration-300
          ${isScrolled ? "border-b shadow-md" : "border-b shadow-xs"}
        `}
        style={{
          background: isScrolled
            ? "rgba(255, 255, 255, 0.95)"
            : "linear-gradient(to right, rgba(99,186,233,0.05), rgba(252,194,56,0.05), transparent)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderColor: isScrolled ? "#e5e7eb" : "rgba(229, 231, 235, 0.5)",
        }}
      >
        <div className="px-6 sm:px-8 py-2 sm:py-2.5 flex justify-between items-center">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 sm:gap-3.5 group focus:outline-none transition-all duration-200 text-left rounded-xl p-1 -ml-1 hover:bg-slate-100/60 cursor-pointer"
              title="GBS & Asociados - Ir al inicio"
            >
              <div className="relative h-14 w-12 sm:h-16 sm:w-14 md:h-16 md:w-14 shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Logo GBS & Asociados"
                  fill
                  sizes="(max-width: 640px) 48px, 64px"
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#4a4a4a] group-hover:text-[#2e2e2e] transition-colors leading-tight">
                  {titulo}
                </span>
                <span className="text-[11px] sm:text-xs font-medium tracking-wide text-[#8a8a8a] hidden xs:block">
                  Estudio Jurídico e Inmobiliario
                </span>
              </div>
            </button>
          </div>

          {/* Menú Desktop & Botones de Acción */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Navegación Desktop (4 grupos/ítems) */}
            <nav className="hidden md:flex items-center gap-1 mr-2" aria-label="Navegación principal">
              {/* 1. Principal (Desplegable) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-[#686363] hover:text-[#63bae9] hover:bg-[#63bae9]/10 focus:outline-none focus:ring-2 focus:ring-[#63bae9]/20 data-[state=open]:text-[#63bae9] data-[state=open]:bg-[#63bae9]/10 cursor-pointer"
                    aria-label="Menú principal"
                  >
                    <span>Principal</span>
                    <ChevronDown className="h-4 w-4 text-[#969696] group-hover:text-[#63bae9] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="w-56 p-2 rounded-2xl border border-gray-100 shadow-xl bg-white/95 backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95"
                >
                  <div className="px-2 py-1.5 text-[11px] font-semibold text-[#969696] uppercase tracking-wider">
                    Secciones del Sitio
                  </div>
                  {PRINCIPAL_SUBITEMS.map(({ label, href, Icon }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link
                        href={href}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-xl text-[#686363] hover:text-[#63bae9] hover:bg-[#e8f6fc] transition-colors cursor-pointer w-full"
                      >
                        <div className="p-1 rounded-md bg-gray-50 text-[#63bae9]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>{label}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 2. Propiedades, 3. Disponibilidad, 4. Conócenos */}
              {DIRECT_NAV_LINKS.map(({ label, href, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "text-[#4ca8d8] bg-[#63bae9]/15 font-semibold shadow-xs"
                        : "text-[#686363] hover:text-[#63bae9] hover:bg-[#63bae9]/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile hamburger button */}
            <button
              className="md:hidden p-2 rounded-lg transition-all duration-200 text-[#686363] hover:bg-slate-100/60 mr-1"
              onClick={() => setPublicMenuOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Acciones de usuario según sesión */}
            {status === "loading" ? (
              <div className="h-9 w-28 bg-slate-200/60 animate-pulse rounded-lg" />
            ) : session ? (
              <Button
                variant="outline"
                size="icon"
                className="border transition-all duration-200 rounded-lg border-gray-200 text-[#686363] hover:border-[#63bae9] hover:bg-[#e8f6fc] hover:text-[#63bae9]"
                onClick={handleUserSettingsClick}
                title="Ver perfil"
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="hidden md:inline-flex font-semibold transition-all duration-200 rounded-lg shadow-xs hover:shadow-md text-white bg-[#63bae9] hover:bg-[#4ca8d8] hover:-translate-y-0.5"
              >
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Alerta flotante ante errores */}
      {error && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert
            className="shadow-lg border-l-4 rounded-xl max-w-sm bg-[#fff9e6] border-l-[#fcc238] border-[#fcc238]"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#fef3cd]">
                <AlertCircle className="h-5 w-5 text-[#fcc238]" />
              </div>
              <AlertDescription className="text-[#686363]">{error}</AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {/* Menú lateral Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200 ${
          publicMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del drawer */}
        <div className="p-5 border-b border-gray-200 bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-11 shrink-0">
              <Image
                src="/logo.png"
                alt="Logo GBS & Asociados"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#4a4a4a] leading-tight">
                Navegación
              </h2>
              <span className="text-xs text-[#8a8a8a]">GBS &amp; Asociados</span>
            </div>
          </div>
          <button
            onClick={() => setPublicMenuOpen(false)}
            className="p-2 rounded-lg transition-all text-[#969696] hover:bg-[#f3f4f6] hover:text-[#686363]"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable del drawer */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* 1. Bloque Principal */}
          <div>
            <p className="text-[11px] font-bold text-[#969696] uppercase tracking-wider mb-2 px-2">
              Principal
            </p>
            <div className="space-y-1">
              {PRINCIPAL_SUBITEMS.map(({ label, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setPublicMenuOpen(false)}
                  className="w-full px-3 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all text-[#686363] hover:bg-[#e8f6fc] hover:text-[#63bae9]"
                >
                  <div className="p-1.5 rounded-lg bg-[#f3f4f6] text-[#686363]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* 2. Bloque Explorar (Propiedades, Disponibilidad, Conócenos) */}
          <div>
            <p className="text-[11px] font-bold text-[#969696] uppercase tracking-wider mb-2 px-2">
              Explorar
            </p>
            <div className="space-y-1">
              {DIRECT_NAV_LINKS.map(({ label, href, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setPublicMenuOpen(false)}
                    className={`w-full px-3 py-2.5 rounded-xl font-medium text-sm flex items-center gap-3 transition-all ${
                      isActive
                        ? "bg-[#63bae9]/15 text-[#4ca8d8] font-semibold"
                        : "text-[#686363] hover:bg-[#e8f6fc] hover:text-[#63bae9]"
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive ? "bg-[#63bae9]/20 text-[#4ca8d8]" : "bg-[#f3f4f6] text-[#686363]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer del drawer */}
        <div className="p-5 border-t border-gray-200 bg-[#f8f9fa]">
          {session ? (
            <button
              onClick={() => {
                setPublicMenuOpen(false);
                handleUserSettingsClick();
              }}
              className="w-full px-4 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 border border-gray-200 text-[#4a4a4a] bg-white hover:bg-gray-50 transition-all shadow-xs"
            >
              <User className="w-4 h-4 text-[#63bae9]" />
              <span>Mi cuenta</span>
            </button>
          ) : (
            <button
              onClick={() => {
                router.push("/login");
                setPublicMenuOpen(false);
              }}
              className="w-full px-4 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md bg-[#63bae9] hover:bg-[#4ca8d8]"
            >
              <User className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Overlay oscuro para mobile */}
      {publicMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setPublicMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
}