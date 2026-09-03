// src/components/ui/Header.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, User, Home, CreditCard, FileText, FileSignature, Settings, DollarSign, Users, AlertCircle, X, LogOut } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const titulo = "GBS & Asociados"; // ← este texto lo podés cambiar dinámicamente

  const modules: [string, string, any][] = [
    ["Clientes", "/clientes", User],
    ["Propiedades", "/propiedades", Home],
    ["Proveedores", "/proveedores", CreditCard],
    ["Pagos a Proveedores", "/pagos", CreditCard],
    ["Rendiciones", "/rendiciones", FileText],
    ["Contratos", "/contratos", FileSignature],
    ["Cobranzas a Clientes", "/cobranzas", DollarSign],
    ["Usuarios", "/usuarios", Users],
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  console.log("Session:", session);

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
          ${isScrolled ? 'border-b shadow-md' : 'border-b shadow-sm'}
        `}
        style={{
          background: isScrolled 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'linear-gradient(to right, rgba(99,186,233,0.05), rgba(252,194,56,0.05), transparent)',
          backdropFilter: 'blur(8px)',           // ← mantiene el efecto vidrio
          WebkitBackdropFilter: 'blur(8px)',
          borderColor: isScrolled ? '#e5e7eb' : 'rgba(229, 231, 235, 0.5)',
        }}
      >
        <div className="px-6 sm:px-8 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 group focus:outline-none transition-all duration-200 text-left rounded-xl p-1 -ml-1 hover:bg-slate-100/60"
              title="GBS & Asociados - Ir al inicio"
            >
              {/* Contenedor del Logo con relación de aspecto proporcional */}
              <div className="relative h-11 w-10 sm:h-12 sm:w-11 flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Logo GBS & Asociados"
                  fill
                  sizes="(max-width: 640px) 40px, 44px"
                  className="object-contain drop-shadow-sm"
                  priority
                />
              </div>

              {/* Título de la marca y subtítulo institucional */}
              <div className="flex flex-col justify-center">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#4a4a4a] group-hover:text-[#2e2e2e] transition-colors leading-tight">
                  {titulo}
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium tracking-wide text-[#8a8a8a] hidden xs:block">
                  Estudio Jurídico e Inmobiliario
                </span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="border transition-all duration-200 rounded-lg"
                  style={{
                    borderColor: '#e5e7eb',
                    color: '#686363',
                  }}
                  onClick={handleUserSettingsClick}
                  title="Ver perfil"
                  disabled={!session?.user}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#63bae9';
                    e.currentTarget.style.backgroundColor = '#e8f6fc';
                    e.currentTarget.style.color = '#63bae9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#686363';
                  }}
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="border transition-all duration-200 rounded-lg"
                  style={{
                    borderColor: '#e5e7eb',
                    color: '#686363',
                  }}
                  onClick={() => setMenuOpen(!menuOpen)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#fcc238';
                    e.currentTarget.style.backgroundColor = '#fff9e6';
                    e.currentTarget.style.color = '#fcc238';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb';
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#686363';
                  }}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => signIn()}
                className="font-semibold transition-all duration-200 rounded-lg shadow-sm hover:shadow-md text-white"
                style={{ backgroundColor: '#63bae9' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4ca8d8';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#63bae9';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Iniciar sesión
              </Button>
            )}
          </div>
        </div>
      </header>

      {error && (
        <div className="fixed top-20 right-8 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert
            className="shadow-lg border-l-4 rounded-xl max-w-sm"
            style={{
              backgroundColor: '#fff9e6',
              borderLeftColor: '#fcc238',
              borderColor: '#fcc238',
            }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#fef3cd' }}>
                <AlertCircle className="h-5 w-5" style={{ color: '#fcc238' }} />
              </div>
              <AlertDescription style={{ color: '#686363' }}>{error}</AlertDescription>
            </div>
          </Alert>
        </div>
      )}

      {session && (
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-gray-50 shadow-2xl transform transition-all duration-300 z-50 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ borderLeft: '1px solid #e5e7eb' }}
        >
          <div className="flex flex-col h-full">
            <div
              className="p-6 border-b flex items-center justify-between"
              style={{ borderColor: '#e5e7eb', backgroundColor: '#f8f9fa' }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#e8f6fc' }}>
                  <Menu className="w-5 h-5" style={{ color: '#63bae9' }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#686363' }}>
                  Módulos
                </h2>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg transition-all duration-200"
                style={{ color: '#969696' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#686363';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#969696';
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {modules.map(([label, path, Icon]) => (
                  <button
                    key={path}
                    onClick={() => {
                      router.push(path);
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-3.5 rounded-xl font-semibold text-left flex items-center gap-3 transition-all duration-200"
                    style={{ color: '#686363' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8f6fc';
                      e.currentTarget.style.color = '#63bae9';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#686363';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: '#f3f4f6' }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6 border-t" style={{ borderColor: '#e5e7eb' }}>
              <button
                onClick={() => {
                  signOut({ redirect: true, callbackUrl: "/" });
                  setMenuOpen(false);
                }}
                className="w-full px-4 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-200 shadow-sm hover:shadow-md"
                style={{ backgroundColor: '#ef4444' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <LogOut className="w-5 h-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}