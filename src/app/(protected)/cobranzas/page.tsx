/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/cobranzas/page.tsx

'use client'; 
// Indica que este archivo se ejecuta del lado del cliente (React).
// Es necesario para usar hooks como useState o useEffect.

import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { DollarSign, PlusCircle, AlertCircle, Trash2, FileSignature, Filter, Calendar, User, X, Home, CheckCircle, XCircle, Edit3, ArrowLeft  } from 'lucide-react';
// Iconos SVG importados como componentes React.


// Componente visual para el encabezado de la página.

import { useRouter } from "next/navigation";
// Hook de Next.js para navegación del lado del cliente.

import Loading from '@/components/ui/Loading';

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Modal from "@/components/ui/Modal";

import { useQuery, useMutation, useQueryClient, keepPreviousData  } from '@tanstack/react-query';

// ---------------------------
// TIPOS (interfaces TypeScript)
// ---------------------------

interface UserInfo {
  id_usuario: string;
  nombre: string;
}
// Info del usuario que creó o actualizó una cobranza.

interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
}
// Representa un cliente. Se usa en filtros y relaciones.

interface Cobranza {
  id_cobranza: number;
  id_cliente: number;
  id_inmueble?: number | null;
  cliente?: Cliente | null;
  inmueble?: { nombre: string } | null;

  monto: number;
  fecha_cobranza: string;   // Llega como string desde la API
  medio_pago: string;
  concepto: string;
  observaciones?: string | null;
  activa: boolean;

  // NUEVO historial
  createdAt?: string;
  updatedAt?: string;
  createdBy?: UserInfo | null;
  updatedBy?: UserInfo | null;
}

interface CobranzasResponse {
  cobranzas: Cobranza[];
  total: number;
}

// ==========================
// FORMATEADOR DE MONEDA ARS
// ==========================
const formatMoney = (value: number) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};


export default function CobranzasPage() {
  const router = useRouter();

  const handleCrear = () => router.push('/cobranzas/alta');

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

  //clientes
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);



  // ---------------------------
  // PAGINACIÓN + FILTROS
  // ---------------------------

  const [page, setPage] = useState(1);      // Página actual
  const [pageSize] = useState(5);          // Cantidad por página

  // Filtros del usuario
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: clientes = [],
    isLoading: clientesLoading,
  } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('Error al cargar clientes');
      return res.json();
    },
  });

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useQuery<CobranzasResponse>({
    queryKey: ['cobranzas', page, filterYear, filterMonth, filterCliente],
    queryFn: async () => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (filterYear) query.append("anio", filterYear);
      if (filterMonth) query.append("mes", filterMonth);
      if (filterCliente) query.append("cliente", filterCliente);

      const res = await fetch(`/api/cobranzas?${query.toString()}`);
      if (!res.ok) throw new Error('Error al cargar cobranzas');

      return res.json();
    },
    placeholderData: keepPreviousData, 
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos (opcional pero recomendado)
  });

  const cobranzas: Cobranza[] = data?.cobranzas ?? [];

  //  Función para agrupar
  const agruparCobranzas = () => {
    const grupos: Record<string, { 
      clienteId: number;
      clienteNombre: string;
      mesAno: string;          
      total: number;
      cantidad: number;
      activas: number;
      cobranzas: Cobranza[];
    }> = {};

    cobranzas.forEach(c => {
      // Si no hay cliente, saltamos o agrupamos como "Sin cliente"
      if (!c.cliente) return;

      const fecha = new Date(c.fecha_cobranza);
      const mes = fecha.toLocaleString('es-AR', { month: 'long' });
      const ano = fecha.getFullYear();
      const mesAno = `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${ano}`;
      
      // Clave única: clienteId + mesAno
      const key = `${c.id_cliente}-${mesAno}`;

      if (!grupos[key]) {
        grupos[key] = {
          clienteId: c.id_cliente,
          clienteNombre: `${c.cliente.nombre} ${c.cliente.apellido}`,
          mesAno,
          total: 0,
          cantidad: 0,
          activas: 0,
          cobranzas: [],
        };
      }

      grupos[key].total += c.monto;
      grupos[key].cantidad += 1;
      if (c.activa) grupos[key].activas += 1;
      grupos[key].cobranzas.push(c);
    });

    // Convertir a array y ordenar 
    return Object.values(grupos).sort((a, b) => {
      // Ordenar por fecha descendente (último mes primero)
      const fechaA = new Date(a.cobranzas[0]?.fecha_cobranza || '');
      const fechaB = new Date(b.cobranzas[0]?.fecha_cobranza || '');
      return fechaB.getTime() - fechaA.getTime();
    });
  };

  // Usar la agrupación
  const gruposCobranzas = agruparCobranzas();

  const total = data?.total ?? 0;

  const queryClient = useQueryClient();



  // ========================================
  // FUNCIÓN: toggle del campo "activa"
  // ========================================
const toggleActivaMutation = useMutation({
  mutationFn: async (cobranza: Cobranza) => {
    const res = await fetch(`/api/cobranzas/${cobranza.id_cobranza}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !cobranza.activa }),
    });

    if (!res.ok) throw new Error();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cobranzas'] });
    // Abrimos modal de éxito
    setModalConfig({
      title: "Estado actualizado",
      message: "El estado de la cobranza se actualizó correctamente.",
      variant: "success",
      onConfirm: () => setModalOpen(false),
    });
    setModalOpen(true);
  },
  onError: () => {
    setModalConfig({
      title: "Error",
      message: "No se pudo cambiar el estado de la cobranza.",
      variant: "error",
      onConfirm: () => setModalOpen(false),
    });
    setModalOpen(true);
  },
});




  // ========================================
  // FUNCIÓN: abrir modal para eliminar
  // ========================================
  const handleDelete = (cobranza: Cobranza) => {
  if (cobranza.activa) {
    setModalConfig({
      title: "No se puede eliminar",
      message: "No se puede eliminar una cobranza activa. Primero desactívela.",
      variant: "warning",
      onConfirm: () => setModalOpen(false),
    });
    setModalOpen(true);
    return;
  }

  setModalConfig({
    title: "Eliminar cobranza",
    message: "¿Estás seguro? Esta acción no se puede deshacer.",
    variant: "danger",
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/cobranzas/${cobranza.id_cobranza}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error();

        queryClient.invalidateQueries({ queryKey: ['cobranzas'] });

        setModalConfig({
          title: "Eliminada",
          message: "La cobranza se eliminó correctamente.",
          variant: "success",
          onConfirm: () => setModalOpen(false),
        });

        setModalOpen(true);
      } catch {
        setModalConfig({
          title: "Error",
          message: "No se pudo eliminar la cobranza.",
          variant: "error",
          onConfirm: () => setModalOpen(false),
        });
        setModalOpen(true);
      }
    },
  });

  setModalOpen(true);
};





  const clientesFiltrados = clientes.filter((c: { nombre: any; apellido: any; }) => {
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    return fullName.includes(clienteSearch.toLowerCase());
  });


  if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading message="Cargando cobranzas..." size="lg" />
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#63bae9]">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Gestión de Cobranzas</h1>
              <p className="text-sm text-gray-500">Administra y controla los pagos registrados</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#fef9e7]">
            <div className="w-2 h-2 rounded-full animate-pulse bg-[#fcc238]" />
          <span className="text-sm font-medium text-gray-600">
            {total} cobranza{total !== 1 ? 's' : ''}
          </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
            <Alert className="mb-6 bg-[#fef9e7] border-l-4 border-[#fcc238]">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {(error as Error).message}
              </AlertDescription>
            </Alert>
          )}

        {/* BOTÓN CREAR */}
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
                  Registrar Cobranza
                </div>
                <div className="text-sm opacity-90">
                  Agrega una nueva cobranza
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* FILTROS - mismo estilo que en contratos */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#63bae9]/10 flex items-center justify-center">
                    <Filter className="w-5 h-5 text-[#63bae9]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#686363]">Búsqueda y Filtros</h3>
                    <p className="text-sm text-[#969696]">Encuentra cobranzas específicas</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#63bae9] text-white font-medium hover:bg-[#4a9fd4] transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  <Filter className="w-4 h-4" />
                  {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>
              </div>
            </div>

            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                  {/* Año */}
                  <div>
                    <label className="block text-sm font-bold text-[#686363] mb-2">
                      Año
                    </label>
                    <div className="relative">
                      <select
                        value={filterYear}
                        onChange={(e) => {
                          setFilterYear(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none focus:ring-0 transition-all text-[#686363] appearance-none bg-white"
                      >
                        <option value="" disabled hidden>Seleccione un año</option>
                        {Array.from(
                          { length: new Date().getFullYear() - 2020 + 1 },
                          (_, i) => 2020 + i
                        ).map(year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                    </div>
                  </div>

                  {/* Mes */}
                  <div>
                    <label className="block text-sm font-bold text-[#686363] mb-2">
                      Mes
                    </label>
                    <div className="relative">
                      <select
                        value={filterMonth}
                        onChange={(e) => {
                          setFilterMonth(e.target.value);
                          setPage(1);
                        }}
                        className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none focus:ring-0 transition-all text-[#686363] appearance-none bg-white"
                      >
                        <option value="" disabled hidden>Seleccione un mes</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(mes => (
                          <option key={mes} value={mes}>
                            {mes.toString().padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-bold text-[#686363] mb-2">
                      Cliente
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={clienteSearch}
                        onChange={(e) => {
                          setClienteSearch(e.target.value);
                          setShowClienteDropdown(true);
                          if (e.target.value.trim() === '') {
                            setFilterCliente('');
                          }
                          setPage(1);
                        }}
                        onFocus={() => setShowClienteDropdown(true)}
                        className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none focus:ring-0 transition-all text-[#686363] placeholder:text-[#969696] bg-white"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />

                      {showClienteDropdown && clienteSearch && (
                        <div className="absolute z-30 mt-1 w-full bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-gray-100">
                          {clientesFiltrados.length === 0 ? (
                            <div className="p-4 text-sm text-[#969696] text-center">
                              No hay coincidencias
                            </div>
                          ) : (
                            clientesFiltrados.map((c: { id_cliente: Key | null | undefined; apellido: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; nombre: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
                              <button
                                key={c.id_cliente}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-[#63bae9]/5 transition-colors text-[#686363]"
                                onClick={() => {
                                  setFilterCliente(String(c.id_cliente));
                                  setClienteSearch(`${c.apellido}, ${c.nombre}`);
                                  setShowClienteDropdown(false);
                                  setPage(1);
                                }}
                              >
                                {c.apellido}, {c.nombre}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botón Limpiar filtros - solo visible si hay algo seleccionado */}
                {(filterYear || filterMonth || filterCliente || clienteSearch.trim()) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => {
                        setFilterYear('');
                        setFilterMonth('');
                        setFilterCliente('');
                        setClienteSearch('');
                        setPage(1);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-[#969696] hover:text-[#686363] hover:bg-white/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* LISTADO */}
        <div className="bg-white rounded-xl shadow-sm border">

          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-gray-700">Cobranzas Registradas</h2>
          </div>

          <div className="p-6">
            
            {isFetching  ? (
              <div className="py-20 flex justify-center">
                <Loading message="Actualizando cobranzas..." size="md" />
              </div>
            ) : cobranzas.length === 0 ? (
              <p className="text-center py-16 text-gray-500">
                No hay cobranzas con los filtros seleccionados
              </p>
            ) : (
              <div className="p-6">
  {isFetching ? (
    <div className="py-20 flex justify-center">
      <Loading message="Actualizando cobranzas..." size="md" />
    </div>
  ) : gruposCobranzas.length === 0 ? (
    <p className="text-center py-16 text-gray-500">
      No hay cobranzas con los filtros seleccionados
    </p>
  ) : (
    <div className="space-y-6">
      {gruposCobranzas.map(grupo => (
        <div
          key={`${grupo.clienteId}-${grupo.mesAno}`}
          className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white relative"
        >
          {/* Header del grupo - igual estilo que contratos */}
          <div className="bg-gradient-to-r from-[#63bae9]/5 via-[#63bae9]/3 to-transparent p-6 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#63bae9] to-[#63bae9]/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-[#686363] mb-1 group-hover:text-[#63bae9] transition-colors">
                    {grupo.clienteNombre}
                  </h3>
                  <p className="text-sm text-[#969696]">
                    {grupo.mesAno} • {grupo.cantidad} cobranza{grupo.cantidad !== 1 ? 's' : ''}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-white border-2 border-[#63bae9]/20 text-[#63bae9]">
                      ${formatMoney(grupo.total)}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border-2 ${
                        grupo.activas === grupo.cantidad
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : grupo.activas === 0
                          ? 'bg-gray-100 text-[#969696] border-gray-300'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}
                    >
                      {grupo.activas} / {grupo.cantidad} activas
                    </span>
                  </div>
                </div>
              </div>

              {/* Acciones del grupo (opcional - por ahora vacío o con botón de exportar) */}
              <div className="flex items-center gap-2">
                {/* Podrías poner aquí un botón para exportar el mes o ver resumen */}
              </div>
            </div>
          </div>

          {/* Lista de cobranzas individuales */}
          <div className="divide-y divide-gray-100">
          {grupo.cobranzas.map(c => (
            <div
              key={c.id_cobranza}
              className="p-5 hover:bg-gray-50 transition-colors relative border-b border-gray-100 last:border-b-0"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#686363] group-hover:text-[#63bae9] transition-colors">
                    {c.concepto}
                  </p>
                  <div className="text-sm text-[#969696] mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(c.fecha_cobranza).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <span>• {c.medio_pago}</span>
                    {c.inmueble && <span>• {c.inmueble.nombre}</span>}
                  </div>
                </div>

                {/* Monto + estado + acciones */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  {/* Monto */}
                  <span className="text-lg font-bold text-[#63bae9]">
                    ${formatMoney(c.monto)}
                  </span>

                  {/* Estado */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      c.activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {c.activa ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {/* Modificar - SIEMPRE visible */}
                    <button
                      onClick={() => router.push(`/cobranzas/modificar/${c.id_cobranza}`)}
                      className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-[#63bae9] hover:bg-[#63bae9]/5 transition-colors"
                      title="Modificar cobranza"
                    >
                      <Edit3 className="w-5 h-5 text-[#686363]" />
                    </button>

                    {/* Eliminar - SOLO si está desactivada */}
                    {!c.activa && (
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-2.5 rounded-lg bg-white border border-gray-200 hover:border-red-400 hover:bg-red-50 transition-colors"
                        title="Eliminar cobranza (solo inactivas)"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>

                  {/* Toggle Activa/Desactiva - siempre visible */}
                  <button
                    onClick={() => toggleActivaMutation.mutate(c)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-colors ${
                      c.activa
                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {c.activa ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>

          {/* AUDITORÍA / HISTORIAL - exactamente igual que en contratos, al final de la card grupal */}
          <div className="pt-4 pb-6 px-6 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#969696]">
              {grupo.cobranzas[0]?.createdBy && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">Creado por:</span>
                  <span className="font-bold text-[#686363]">
                    {grupo.cobranzas[0].createdBy.nombre}
                  </span>
                </div>
              )}
              {grupo.cobranzas[0]?.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">Creado:</span>
                  <span className="font-bold text-[#686363]">
                    {new Date(grupo.cobranzas[0].createdAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', ' •')}
                  </span>
                </div>
              )}
              {grupo.cobranzas[0]?.updatedBy && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span className="font-medium">Actualizado por:</span>
                  <span className="font-bold text-[#686363]">
                    {grupo.cobranzas[0].updatedBy.nombre}
                  </span>
                </div>
              )}
              {grupo.cobranzas[0]?.updatedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-medium">Actualizado:</span>
                  <span className="font-bold text-[#686363]">
                    {new Date(grupo.cobranzas[0].updatedAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', ' •')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
            )}
          </div>

        </div>

        {/* PAGINACIÓN */}
<div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4 border-t border-gray-200">
  <button
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    <ArrowLeft className="w-5 h-5" />
    Anterior
  </button>
  
  <span className="text-sm font-bold text-[#686363] px-4 py-2 rounded-lg bg-gray-100">
    Página {page} de {Math.ceil(total / pageSize) || 1}
  </span>
  
  <button
    onClick={() => setPage(page + 1)}
    disabled={page >= Math.ceil(total / pageSize)}
    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#63bae9] to-[#4a9fd4] text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
  >
    Siguiente
    <ArrowLeft className="w-5 h-5 transform rotate-180" />
  </button>
</div>


      </main>

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