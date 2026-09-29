/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/propiedades/page.tsx

'use client';

import { useState } from 'react';
import { Home, PlusCircle, AlertCircle, User, Calendar, FileSignature, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import InmuebleCard from '@/components/InmuebleCard';
import Filtros from '@/components/Filtros';

import type { InmuebleDTO } from '@/types/inmuebles';
import type { FiltrosInmueble } from '@/types/filtros';
import Loading from '@/components/ui/Loading';
import Modal from "@/components/ui/Modal";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface InmuebleLocal extends InmuebleDTO {
  archivadoLocal: boolean;
}
// =============================
// MAPA DE COLORES UI
// =============================

const ESTADO_COLORS: Record<string, string> = {
  "Disponible": "bg-green-100 text-green-700",
  "No disponible": "bg-red-100 text-red-700",
  "Reservada": "bg-yellow-100 text-yellow-800",
  "Vendida": "bg-purple-100 text-purple-700",
};

const OPERACION_COLORS: Record<string, string> = {
  "Venta": "bg-emerald-100 text-emerald-700",
  "Alquiler": "bg-blue-100 text-blue-700",
  "Alquiler temporal": "bg-violet-100 text-violet-700",
};


// fallback si viene algo raro del back
const DEFAULT_TAG_COLOR = "bg-gray-100 text-gray-700";



export default function PropiedadesPage() {
  const { data: session, status } = useSession();
  const isAuthenticated = !!session;
  const isLoadingAuth = status === 'loading';

  // Paginación
  const [paginaActivos, setPaginaActivos] = useState(1);
  const [paginaArchivados, setPaginaArchivados] = useState(1);

  const [filtros, setFiltros] = useState<FiltrosInmueble>({});

  const inmueblesPorPagina = 5;
  const router = useRouter();

  const queryClient = useQueryClient();

  const fetchInmuebles = async () => {
    const params = new URLSearchParams({
      page: paginaActivos.toString(),
      pageSize: inmueblesPorPagina.toString(),
      archivado: "false",
      ...(filtros.tipoId && { tipoId: filtros.tipoId.toString() }),
      ...(filtros.estadoId && { estadoId: filtros.estadoId.toString() }),
      ...(filtros.operacionId && { operacionId: filtros.operacionId.toString() }),
      ...(filtros.precioMin && { precioMin: filtros.precioMin.toString() }),
      ...(filtros.precioMax && { precioMax: filtros.precioMax.toString() }),
    });

    const res = await fetch(`/api/inmuebles?${params.toString()}`);

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('UNAUTHORIZED');
      }
      throw new Error('ERROR_FETCH');
    }

    return res.json();
  };

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['inmuebles', paginaActivos, filtros],
    queryFn: fetchInmuebles,
    placeholderData: (prev) => prev,
    enabled: status !== 'loading',
  });

  const inmuebles: InmuebleLocal[] =
  data?.data?.map((i: InmuebleDTO) => ({
    ...i,
    archivadoLocal: Boolean(i.archivado),
  })) ?? [];

const totalActivos = data?.total ?? 0;
const totalPagesActivos = data?.totalPages ?? 1;

const fetchArchivados = async () => {
  const params = new URLSearchParams({
    page: paginaArchivados.toString(),
    pageSize: inmueblesPorPagina.toString(),

    archivado: "true",

    ...(filtros.tipoId && { tipoId: filtros.tipoId.toString() }),
    ...(filtros.estadoId && { estadoId: filtros.estadoId.toString() }),
    ...(filtros.operacionId && { operacionId: filtros.operacionId.toString() }),
    ...(filtros.precioMin && { precioMin: filtros.precioMin.toString() }),
    ...(filtros.precioMax && { precioMax: filtros.precioMax.toString() }),
  });

  const res = await fetch(`/api/inmuebles?${params.toString()}`);

  if (!res.ok) throw new Error();

  return res.json();
};

const { data: dataArchivados } = useQuery({
  queryKey: ['inmueblesArchivados', paginaArchivados, filtros],
  queryFn: fetchArchivados,
  placeholderData: (prev) => prev,
  enabled: status !== 'loading',
});

  


  // =====================================================================
  // HANDLERS (sin cambios importantes)
  // =====================================================================

  const handleCrear = () => router.push('/propiedades/nuevo');
  const handleModificar = (id: number) => router.push(`/propiedades/modificar/${id}`);

  const toggleArchivarMutation = useMutation({
  mutationFn: async ({ id, archivado }: { id: number; archivado: boolean }) => {
    const res = await fetch(`/api/inmuebles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivado: !archivado }),
    });

    if (!res.ok) throw new Error();
  },
});


  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info" | "danger";
    onConfirm?: () => void;
  }>({
    title: "",
    message: "",
  });

  const deleteMutation = useMutation({
  mutationFn: async (id: number) => {
    const res = await fetch(`/api/inmuebles/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("ERROR_DELETE");
    }

    // si es 204 no hay body
    if (res.status === 204) {
      return { archived: false };
    }

    // si es soft delete viene JSON
    return await res.json();
  },

  onSuccess: async (data) => {

    // 🔥 Forzar refetch inmediato
    await queryClient.refetchQueries({ queryKey: ["inmuebles"] });
    await queryClient.refetchQueries({ queryKey: ["inmueblesArchivados"] });

    setModalConfig({
      title: data?.archived
        ? "Propiedad archivada"
        : "Propiedad eliminada",
      message: data?.archived
        ? "No se pudo eliminar porque tiene relaciones. Se archivó correctamente."
        : "Propiedad eliminada correctamente",
      variant: "success",
    });

    setModalOpen(true);
  },

  onError: () => {
    setModalConfig({
      title: "Error",
      message: "No se pudo eliminar la propiedad",
      variant: "error",
    });

    setModalOpen(true);
  },
});

const handleEliminar = (id: number) => {
  setModalConfig({
    title: "Eliminar propiedad",
    message: "¿Estás seguro? Esta acción no se puede deshacer.",
    variant: "danger",
    onConfirm: () => {
      setModalOpen(false);
      deleteMutation.mutate(id);
    },
  });

  setModalOpen(true);
};

  const handleToggleArchivar = (id: number, archivado: boolean) => {
  setModalConfig({
    title: archivado ? "Activar propiedad" : "Archivar propiedad",
    message: archivado
      ? "¿Querés activar esta propiedad?"
      : "¿Querés archivar esta propiedad?",
    variant: archivado ? "success" : "warning",
    onConfirm: async () => {
      try {
        setModalOpen(false); // cerrar confirmación

        await toggleArchivarMutation.mutateAsync({ id, archivado });

        setModalConfig({
          title: "Éxito",
          message: archivado
            ? "Propiedad activada correctamente"
            : "Propiedad archivada correctamente",
          variant: "success",
        });

        setModalOpen(true); // 🔥 mostrar modal de éxito

        await queryClient.invalidateQueries({ queryKey: ['inmuebles'] });
        await queryClient.invalidateQueries({ queryKey: ['inmueblesArchivados'] });

      } catch {
        setModalConfig({
          title: "Error",
          message: "No se pudo actualizar la propiedad",
          variant: "error",
        });

        setModalOpen(true); // 🔥 mostrar modal de error
      }
    },
  });

  setModalOpen(true); // modal de confirmación
};
  // =====================================================================
  // FILTRADO Y PAGINACIÓN LOCAL (solo para separar activos/archivados)
  // =====================================================================

  const activos = inmuebles;
  const archivados: InmuebleLocal[] =
  dataArchivados?.data?.map((i: InmuebleDTO) => ({
    ...i,
    archivadoLocal: true,
  })) ?? [];
  
const totalArchivados = dataArchivados?.total ?? 0;

const totalPagesArchivados =
  dataArchivados?.totalPages ?? 1;

const totalGeneral = totalActivos + totalArchivados;

  const activosPagina = activos;

  const archivadosPagina = archivados;

  // =====================================================================
  // ============================= RENDER ================================
  // =====================================================================

  // Mientras se valida la sesión
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading
          message="Cargando propiedades..."
          size="lg"
        />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#63bae9]">
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Gestión de Propiedades</h1>
              <p className="text-sm mt-1 text-gray-500">
                Administra y controla los inmuebles registrados
              </p>
            </div>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#fef9e7]">
              <div className="w-2 h-2 rounded-full animate-pulse bg-[#fcc238]" />
              <span className="text-sm font-medium text-gray-600">
                {totalGeneral} {totalGeneral === 1 ? 'propiedad' : 'propiedades'}
              </span>
            </div>
          )}

        </div>
      </header>
      {/* CONTENIDO */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
            <Alert className="mb-6 bg-[#fef9e7] border-l-4 border-[#fcc238]">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                No se pudieron cargar los inmuebles
              </AlertDescription>
            </Alert>
          )}

        {/* BOTÓN CREAR - Solo para usuarios logueados */}
        {isAuthenticated && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleCrear}
            className="group relative p-6 rounded-xl font-medium flex items-center gap-4 
                      transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                      bg-[#63bae9] overflow-hidden"
          >
            {/* Overlay hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/25 
                            opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Contenido */}
            <div className="relative flex items-center gap-4">
              {/* Cuadrado blanco */}
              <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center 
                              group-hover:rotate-12 transition-transform duration-300 shadow-md">
                <FileSignature className="w-7 h-7 text-[#63bae9]" strokeWidth={2} />
              </div>

              {/* Texto */}
              <div className="flex-1 text-left text-white">
                <div className="text-lg font-bold mb-1">
                  Registrar Propiedad
                </div>
                <div className="text-sm opacity-90">
                  Agrega un nuevo inmueble
                </div>
              </div>
            </div>
          </button>
        </div>
      )}


        {/* FILTROS */}
        <Filtros
  filtros={filtros}
  setFiltros={setFiltros}
  onApply={() => {
    setPaginaActivos(1);
    setPaginaArchivados(1);
  }}
/>


        {/* LISTADO ACTIVOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8">
          {isAuthenticated && (
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-700">
                Inmuebles Activos
              </h2>

              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#ecfdf5]">
                <div className="w-2 h-2 rounded-full animate-pulse bg-[#22c55e]" />
                <span className="text-sm font-medium text-gray-600">
                  {activos.length} {activos.length === 1 ? 'activo' : 'activos'}
                </span>
              </div>
            </div>
          )}


          <div className="p-6">
          {isLoading && activos.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-[#63bae9] rounded-full animate-spin mb-4"></div>
              <p className="text-lg font-semibold text-[#969696]">
                Cargando inmuebles...
              </p>
            </div>
            ) : activos.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-xl font-semibold mb-2 text-gray-700">
                  No hay inmuebles activos
                </h3>
              </div>
            ) : (
              <div className="grid gap-4">
                {activosPagina.map((i) => (
                  <div
                    key={i.id_inmueble}
                    className="group border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all relative border-l-4 border-l-[#63bae9]"
                  >
                    {/* Tags */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">

                        {/* Estado → solo logueado */}
                        {isAuthenticated && i.estado?.nombre && (
                          <span
                            className={`
                              px-3 py-1 text-xs font-semibold rounded-full
                              ${ESTADO_COLORS[i.estado.nombre] ?? DEFAULT_TAG_COLOR}
                            `}
                          >
                            {i.estado.nombre}
                          </span>
                        )}

                        {/* Operación → SIEMPRE visible */}
                        {i.operacion?.nombre && (
                          <span
                            className={`
                              px-3 py-1 text-xs font-semibold rounded-full
                              ${OPERACION_COLORS[i.operacion.nombre] ?? DEFAULT_TAG_COLOR}
                            `}
                          >
                            {i.operacion.nombre}
                          </span>
                        )}

                      </div>


                    <InmuebleCard inmueble={i} />
                    {/* ← Info básica de creación/modificación (solo para logueados) */}
                    {isAuthenticated && (
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">Creado por:</span>
                            <span className="font-bold text-gray-700">{i.createdBy?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">Creado:</span>
                            <span className="font-bold text-gray-700">
                              {i.createdAt ? new Date(i.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).replace(',', ' •') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">Actualizado por:</span>
                            <span className="font-bold text-gray-700">{i.updatedBy?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">Actualizado:</span>
                            <span className="font-bold text-gray-700">
                              {i.updatedAt ? new Date(i.updatedAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).replace(',', ' •') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* ACCIONES - Solo para usuarios logueados */}
                    {isAuthenticated && (
                      <div className="mt-4 flex gap-3">
                        {/* ARCHIVAR → cuando NO está archivado */}
                        <button
                          onClick={() =>
                            handleToggleArchivar(
                              i.id_inmueble,
                              i.archivadoLocal
                            )
                          }
                          className="px-4 py-2 text-sm rounded-md font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          Archivar
                        </button>
                        <button
                          onClick={() => handleModificar(i.id_inmueble)}
                          className="px-4 py-2 text-sm rounded-md font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        >
                          Modificar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* PAGINACIÓN ACTIVOS */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t border-gray-200">
              <button
                onClick={() => setPaginaActivos(paginaActivos - 1)}
                disabled={paginaActivos === 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <ArrowLeft className="w-5 h-5" />
                Anterior
              </button>

              <span className="text-sm font-bold text-[#686363] px-4 py-2 rounded-lg bg-gray-100">
                Página {paginaActivos} de {Math.ceil(totalActivos / inmueblesPorPagina) || 1}
              </span>

              <button
                onClick={() => setPaginaActivos(paginaActivos + 1)}
                disabled={paginaActivos >= Math.ceil(totalActivos / inmueblesPorPagina)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Siguiente
                <ArrowLeft className="w-5 h-5 transform rotate-180" />
              </button>
            </div>

          </div>
        </div>
        {/* ARCHIVADOS - Solo para usuarios logueados */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-10">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-700">
                Inmuebles Archivados
              </h2>

              {/* Contador */}
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#fef2f2]">
                <div className="w-2 h-2 rounded-full animate-pulse bg-[#ef4444]" />
                <span className="text-sm font-medium text-gray-600">
                  {archivados.length} {archivados.length === 1 ? 'archivado' : 'archivados'}
                </span>
              </div>
            </div>

            <div className="p-6">
              {archivados.length === 0 ? (
                <p className="text-center text-gray-500">
                  No hay inmuebles archivados.
                </p>
              ) : (
                <div className="grid gap-4">
                  {archivadosPagina.map((i) => (
                    <div
                      key={i.id_inmueble}
                      className="group border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all relative border-l-4 border-l-red-400"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {i.estado?.nombre && (
                            <span
                              className={`
                                px-3 py-1 text-xs font-semibold rounded-full
                                ${ESTADO_COLORS[i.estado.nombre] ?? DEFAULT_TAG_COLOR}
                              `}
                            >
                              {i.estado.nombre}
                            </span>
                          )}

                          {i.operacion?.nombre && (
                            <span
                              className={`
                                px-3 py-1 text-xs font-semibold rounded-full
                                ${OPERACION_COLORS[i.operacion.nombre] ?? DEFAULT_TAG_COLOR}
                              `}
                            >
                              {i.operacion.nombre}
                            </span>
                          )}

                      </div>
                      <InmuebleCard inmueble={i} />
                      {/* ← Info básica de creación/modificación (igual para archivados) */}
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">Creado por:</span>
                            <span className="font-bold text-gray-700">{i.createdBy?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">Creado:</span>
                            <span className="font-bold text-gray-700">
                              {i.createdAt ? new Date(i.createdAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).replace(',', ' •') : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium">Actualizado por:</span>
                            <span className="font-bold text-gray-700">{i.updatedBy?.nombre || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="font-medium">Actualizado:</span>
                            <span className="font-bold text-gray-700">
                              {i.updatedAt ? new Date(i.updatedAt).toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).replace(',', ' •') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        {/* ACTIVAR → cuando SÍ está archivado */}
                        <button
                          onClick={() =>
                            handleToggleArchivar(
                              i.id_inmueble,
                              i.archivadoLocal
                            )
                          }
                          className="px-4 py-2 text-sm rounded-md font-medium bg-green-100 text-green-700 hover:bg-green-200 transition"
                        >
                          Activar
                        </button>
                        <button
                          onClick={() => handleModificar(i.id_inmueble)}
                          className="px-4 py-2 text-sm rounded-md font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                        >
                          Modificar
                        </button>
                        <button
                          onClick={() => handleEliminar(i.id_inmueble)}
                          className="px-4 py-2 text-sm rounded-md font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
{/* PAGINACIÓN ARCHIVADOS */}
<div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t border-gray-200">
  <button
    onClick={() => setPaginaArchivados(paginaArchivados - 1)}
    disabled={paginaArchivados === 1}
    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    <ArrowLeft className="w-5 h-5" />
    Anterior
  </button>

  <span className="text-sm font-bold text-[#686363] px-4 py-2 rounded-lg bg-gray-100">
    Página {paginaArchivados} de {Math.ceil(totalArchivados / inmueblesPorPagina) || 1}
  </span>

  <button
    onClick={() => setPaginaArchivados(paginaArchivados + 1)}
    disabled={paginaArchivados >= Math.ceil(totalArchivados / inmueblesPorPagina)}
    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    Siguiente
    <ArrowLeft className="w-5 h-5 transform rotate-180" />
  </button>
</div>


            </div>
          </div>
        )}
      </main>

      {/* MODAL GLOBAL */}
    <Modal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      title={modalConfig.title}
      message={modalConfig.message}
      variant={modalConfig.variant}
      onConfirm={modalConfig.onConfirm}
    />

    </div>
  );
}
