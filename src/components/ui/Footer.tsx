import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white py-12 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold mb-2">GBS y Asociados</h3>
            <p className="text-sm text-[#fcc238] font-semibold tracking-wider mb-4">
              Inmobiliaria &amp; Estudio Jurídico
            </p>
            <p className="text-gray-400 leading-relaxed mb-4 max-w-md">
              Soluciones integrales en servicios inmobiliarios y legales en Libertador San Martín y toda la provincia de Entre Ríos.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wider text-[#969696] uppercase mb-4">Inmobiliaria</h4>
            <ul className="space-y-2.5 text-gray-400">
              <li><Link href="/propiedades" className="hover:text-[#63bae9] transition-colors text-sm">Alquileres</Link></li>
              <li><Link href="/propiedades" className="hover:text-[#63bae9] transition-colors text-sm">Ventas</Link></li>
              <li><Link href="/propiedades" className="hover:text-[#63bae9] transition-colors text-sm">Administración</Link></li>
              <li><Link href="/propiedades" className="hover:text-[#63bae9] transition-colors text-sm">Tasaciones</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-wider text-[#969696] uppercase mb-4">Servicios Legales</h4>
            <ul className="space-y-2.5 text-gray-400">
              <li><Link href="/disponibilidad" className="hover:text-[#fcc238] transition-colors text-sm">Consultar disponibilidad</Link></li>
              <li><Link href="/#servicios" className="hover:text-[#fcc238] transition-colors text-sm">Derecho Civil</Link></li>
              <li><Link href="/#servicios" className="hover:text-[#fcc238] transition-colors text-sm">Contratos</Link></li>
              <li><Link href="/#servicios" className="hover:text-[#fcc238] transition-colors text-sm">Sucesiones</Link></li>
            </ul>
          </div>
        </div>

        <div className="h-px bg-white/5 mb-6"></div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} GBS y Asociados • Todos los derechos reservados</p>
          <div className="flex gap-6">
            <Link href="/nosotros" className="hover:text-white transition-colors">Nosotros</Link>
            <Link href="/#contacto" className="hover:text-white transition-colors">Contacto</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
