// src/components/Filtros.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Filter, DollarSign, X, SlidersHorizontal, Home, CheckCircle } from "lucide-react";
import { FiltrosInmueble } from "@/types/filtros";

/* =====================
   TIPOS
===================== */

interface Operacion {
  id_operacion: number;
  nombre: string;
}

interface TipoInmueble {
  id_tipo_inmueble: number;
  nombre: string;
}

interface Estado {
  id_estado: number;
  nombre: string;
}

interface FiltrosProps {
  filtros: FiltrosInmueble;
  setFiltros: Dispatch<SetStateAction<FiltrosInmueble>>;
  onApply?: () => void;
}

/* =====================
   COMPONENTE
===================== */

export default function Filtros({
  filtros,
  setFiltros,
  onApply,
}: FiltrosProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const [open, setOpen] = useState(false);
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [tipos, setTipos] = useState<TipoInmueble[]>([]);
  const [estados, setEstados] = useState<Estado[]>([]);

  /* =====================
     CARGA DE DATOS
  ===================== */

  useEffect(() => {
    fetch("/api/operaciones")
      .then((res) => res.json())
      .then(setOperaciones)
      .catch(() => console.error("Error cargando operaciones"));

    fetch("/api/tipos_inmueble")
      .then((res) => res.json())
      .then(setTipos)
      .catch(() => console.error("Error cargando tipos"));

    if (isAdmin) {
      fetch("/api/estados")
        .then((res) => res.json())
        .then(setEstados)
        .catch(() => console.error("Error cargando estados"));
    }
  }, [isAdmin]);

  /* =====================
     HANDLERS
  ===================== */

  const handleChange = <K extends keyof FiltrosInmueble>(
    field: K,
    value: FiltrosInmueble[K]
  ) => {
    setFiltros((prev) => ({ ...prev, [field]: value }));
  };

  const handleRemove = (field: keyof FiltrosInmueble) => {
    setFiltros((prev) => ({ ...prev, [field]: undefined }));
    onApply?.();
  };

  const aplicar = () => onApply?.();

  /* =====================
     HELPERS
  ===================== */

  const getOperacionNombre = (id: number) =>
    operaciones.find((o) => o.id_operacion === id)?.nombre ?? "";

  const getTipoNombre = (id: number) =>
    tipos.find((t) => t.id_tipo_inmueble === id)?.nombre ?? "";

  const getEstadoNombre = (id: number) =>
    estados.find((e) => e.id_estado === id)?.nombre ?? "";

  /* =====================
     RENDER
  ===================== */

  return (
    <div className="w-full">
      {/* Contenedor principal - mismo estilo que contratos */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header del panel de filtros */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#63bae9]/10 flex items-center justify-center">
                <Filter className="w-5 h-5 text-[#63bae9]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#686363]">Búsqueda y Filtros</h3>
                <p className="text-sm text-[#969696]">Encuentra inmuebles específicos</p>
              </div>
            </div>

            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#63bae9] text-white font-medium hover:bg-[#4a9fd4] transition-colors shadow-md hover:shadow-lg"
            >
              <Filter className="w-4 h-4" />
              {open ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>
          </div>
        </div>

        {/* Contenido desplegable */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Operación */}
              <div>
                <label className="block text-sm font-bold text-[#686363] mb-2">
                  Operación
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363] appearance-none bg-white"
                    value={filtros.operacionId ?? ""}
                    onChange={(e) =>
                      handleChange("operacionId", Number(e.target.value))
                    }
                  >
                    <option value="" disabled hidden>
                      Seleccione una operación
                    </option>

                    {operaciones.map((o) => (
                      <option key={o.id_operacion} value={o.id_operacion}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                  <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-bold text-[#686363] mb-2">
                  Tipo de inmueble
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363] appearance-none bg-white"
                    value={filtros.tipoId ?? ""}
                    onChange={(e) =>
                      handleChange("tipoId", Number(e.target.value))
                    }
                  >
                    <option value="" disabled hidden>
                      Seleccione un tipo
                    </option>

                    {tipos.map((t) => (
                      <option key={t.id_tipo_inmueble} value={t.id_tipo_inmueble}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                  <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                </div>
              </div>

              {/* Estado (solo admin) */}
              {isAdmin && (
                <div>
                  <label className="block text-sm font-bold text-[#686363] mb-2">
                    Estado
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363] appearance-none bg-white"
                      value={filtros.estadoId ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "estadoId",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    >
                      <option value="">Todos los estados</option>
                      {estados.map((e) => (
                        <option key={e.id_estado} value={e.id_estado}>
                          {e.nombre}
                        </option>
                      ))}
                    </select>
                    <CheckCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Precio mínimo */}
              <div>
                <label className="block text-sm font-bold text-[#686363] mb-2">
                  Precio mínimo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio mínimo"
                    value={filtros.precioMin ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "precioMin",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363]"
                  />
                </div>
              </div>

              {/* Precio máximo */}
              <div>
                <label className="block text-sm font-bold text-[#686363] mb-2">
                  Precio máximo
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    placeholder="Precio máximo"
                    value={filtros.precioMax ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "precioMax",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363]"
                  />
                </div>
              </div>
            </div>

            {/* Botón Aplicar */}
            <div className="flex justify-end mt-6">
              <button
                onClick={aplicar}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#63bae9] text-white rounded-xl font-medium hover:bg-[#4a9fd4] transition-colors shadow-md hover:shadow-lg"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tags activos - estilo similar a contratos */}
      {(filtros.operacionId ||
        filtros.tipoId ||
        filtros.estadoId ||
        filtros.precioMin ||
        filtros.precioMax) && (
        <div className="flex flex-wrap gap-2.5 mt-4">
          {filtros.operacionId && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
              {getOperacionNombre(filtros.operacionId)}
              <button onClick={() => handleRemove("operacionId")}>
                <X className="w-4 h-4 hover:text-red-600" />
              </button>
            </span>
          )}

          {filtros.tipoId && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
              {getTipoNombre(filtros.tipoId)}
              <button onClick={() => handleRemove("tipoId")}>
                <X className="w-4 h-4 hover:text-red-600" />
              </button>
            </span>
          )}

          {isAdmin && filtros.estadoId && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
              Estado: {getEstadoNombre(filtros.estadoId)}
              <button onClick={() => handleRemove("estadoId")}>
                <X className="w-4 h-4 hover:text-red-600" />
              </button>
            </span>
          )}

          {filtros.precioMin && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
              Mín: ${filtros.precioMin.toLocaleString()}
              <button onClick={() => handleRemove("precioMin")}>
                <X className="w-4 h-4 hover:text-red-600" />
              </button>
            </span>
          )}

          {filtros.precioMax && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
              Máx: ${filtros.precioMax.toLocaleString()}
              <button onClick={() => handleRemove("precioMax")}>
                <X className="w-4 h-4 hover:text-red-600" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}