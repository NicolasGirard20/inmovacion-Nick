
// src/app/(protected)/rendiciones/page.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'; 

import { FileText, PlusCircle, Trash2, Pencil, FileSignature, User, Filter, X, Calendar, AlertCircle, ArrowLeft, Home, CheckCircle, XCircle, MapPin } from 'lucide-react';
// 🔹 Iconos SVG usados en los botones y elementos visuales.



import { useRouter } from "next/navigation";
// 🔹 Permite navegar programáticamente (router.push).

import { useQuery, useMutation, useQueryClient, keepPreviousData  } from '@tanstack/react-query';
import Loading from '@/components/ui/Loading';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Modal from '@/components/ui/Modal';
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from 'react';


// ----------------------
// 📌 Interfaces de tipos
// ----------------------

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

// Recibo asociado a una cobranza
interface Recibo {
  id_recibo: number;
  total: number;
  descripcion: string;
}

// Cobranza perteneciente a una rendición
interface IPC {
  mes: number;
  anio: number;
}

interface Cobranza {
  id_cobranza: number;
  cliente: Cliente;
  monto: number;
  concepto: string;
  fecha_cobranza: string;
  recibo: Recibo | null;
  pagado: boolean;

  ipc?: IPC | null;
  montoActualizado?: number;  // monto + IPC
}


// Inmueble asociado a la rendición
interface Inmueble {
  id_inmueble: number;
  nombre: string;
  direccionCompleta?: string;
}

// Rendición completa
interface Rendicion {
  id_rendicion: number;
  fecha: string;
  monto_total: number;

  inmueble: Inmueble;
  cobranzas: Cobranza[];

  createdAt?: string;
  updatedAt?: string;

  createdBy?: UserInfo | null;
  updatedBy?: UserInfo | null;

  pagado: boolean;
}

// ---------------------------
// 📌 Componente principal
// ---------------------------

export default function RendicionesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
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


  // ----------------------
  // 📌 Estados – paginación
  // ----------------------
  const [page, setPage] = useState(1);
const [pageSize] = useState(5); // o el valor que quieras


  // ----------------------
  // 📌 Estados – filtros
  // ----------------------
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterCliente, setFilterCliente] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ----------------------
  // 📌 Estados – autocomplete cliente
  // ----------------------
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // ----------------------
  // 📌 Fetch rendiciones
  // ----------------------
  interface RendicionesResponse {
    data: Rendicion[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }

  const fetchRendiciones = async (page: number): Promise<RendicionesResponse> => {
    const params = new URLSearchParams();

    params.set('page', String(page));
    params.set('pageSize', String(pageSize));

    if (filterYear) params.set('year', filterYear);
    if (filterMonth) params.set('month', filterMonth);
    if (filterCliente) params.set('cliente', filterCliente);

    const res = await fetch(`/api/rendiciones?${params.toString()}`);

    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("ERROR_FETCH");
    }

    return res.json();
  };



 const { data, isLoading, isFetching, error } =useQuery<RendicionesResponse>({
  queryKey:['rendiciones', page, filterYear, filterMonth, filterCliente],
  queryFn: async () => {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (filterYear) query.append("year", filterYear);
      if (filterMonth) query.append("month", filterMonth);
      if (filterCliente) query.append("cliente", filterCliente);

      const res = await fetch(`/api/rendiciones?${query.toString()}`);
      if (!res.ok) throw new Error('Error al cargar rendiciones');

      return res.json();
    },
    placeholderData: keepPreviousData, 
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutos (opcional pero recomendado)
  });



  const rendiciones = data?.data ?? [];
const total = data?.total ?? 0;


  // ----------------------
  // 📌 Fetch clientes
  // ----------------------
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

  // ----------------------
  // 📌 Mutation eliminar rendición
  // ----------------------
  const handleDelete = (rend: Rendicion) => {
  setModalConfig({
    title: "Eliminar rendición",
    message: `¿Estás seguro que querés eliminar la rendición #${rend.id_rendicion}? Esta acción no se puede deshacer.`,
    variant: "danger",
    onConfirm: async () => {
      try {
        const res = await fetch(`/api/rendiciones/${rend.id_rendicion}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error();

        queryClient.invalidateQueries({ queryKey: ['rendiciones'] });

        setModalConfig({
          title: "Eliminada",
          message: "La rendición se eliminó correctamente.",
          variant: "success",
          onConfirm: () => setModalOpen(false),
        });

        setModalOpen(true);
      } catch {
        setModalConfig({
          title: "Error",
          message: "No se pudo eliminar la rendición.",
          variant: "error",
        });

        setModalOpen(true);
      }
    },
  });

  setModalOpen(true);
};



  // ----------------------
  // 📌 Datos derivados – autocomplete clientes
  // ----------------------
  const clientesFiltrados = clientes.filter((c: any) => {
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    return fullName.includes(clienteSearch.toLowerCase());
  });

  const getRendicionPagadoStatus = (rendicion: Rendicion) => {
    if (rendicion.pagado) return 'completo';
    return 'ninguno';
  };



 const updateRendicionPagadoMutation = useMutation({
    mutationFn: async ({ id_rendicion, pagado }: { id_rendicion: number; pagado: boolean }) => {
      const res = await fetch(`/api/rendiciones/${id_rendicion}/pagado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagado }),
      });

      if (!res.ok) throw new Error('Error al actualizar estado');
      return res.json();
    },

    onMutate: async ({ id_rendicion, pagado }) => {
      await queryClient.cancelQueries({ queryKey: ['rendiciones'] });

      const previous = queryClient.getQueryData<any>(['rendiciones', page]);

      queryClient.setQueryData<any>(['rendiciones', page], (old: { data: Rendicion[] }) => {
        if (!old) return old;

        return {
          ...old,
          data: old.data.map((r: Rendicion) =>
            r.id_rendicion === id_rendicion
              ? { ...r, pagado }
              : r
          ),
        };
      });

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['rendiciones', page], context.previous);
      }

      setModalConfig({
        title: "Error",
        message: "No se pudo actualizar el estado de la rendición.",
        variant: "error",
      });
      setModalOpen(true);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rendiciones'] });
    },

    onSuccess: () => {
      setModalConfig({
        title: "Estado actualizado",
        message: "El estado de la rendición se actualizó correctamente.",
        variant: "success",
      });
      setModalOpen(true);
    },
  });



  // ----------------------
  // 📌 Handlers
  // ----------------------

  const handleToggleRendicionPagado = (rendicion: Rendicion) => {
    updateRendicionPagadoMutation.mutate({
      id_rendicion: rendicion.id_rendicion,
      pagado: !rendicion.pagado,
    });
  };





  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#63bae9]">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Gestión de Rendiciones</h1>
              <p className="text-sm text-gray-500">Administra y controla las rendiciones registradas</p>
            </div>  
          </div>

          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-[#fef9e7]">
            <div className="w-2 h-2 rounded-full animate-pulse bg-[#fcc238]" />
          <span className="text-sm font-medium text-gray-600">
            {total} rendicion{total !== 1 ? 'es' : ''} 
          </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {error && (
            <Alert className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                No se pudieron cargar las rendiciones
              </AlertDescription>
            </Alert>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <a
            href="/rendiciones/alta"
            className="group p-6 rounded-xl font-medium text-white flex items-center gap-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#63bae9' }}
          >
            <div className="w-12 h-12 rounded-lg bg-white bg-opacity-20 flex items-center justify-center group-hover:rotate-12 transition-transform">
               <FileSignature className="w-7 h-7 text-[#63bae9]" strokeWidth={2} />
            </div>
            <div>
              <div className="text-lg font-semibold">Registrar Rendición</div>
              <div className="text-sm opacity-90">Crear una nueva rendición</div>
            </div>
          </a>

          <a
            href="/rendiciones/ipc"
            className="group p-6 rounded-xl font-medium border-2 flex items-center gap-4 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-white"
            style={{ borderColor: '#fcc238', color: '#686363' }}
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform" style={{ backgroundColor: '#fef9e7' }}>
              <FileText className="w-6 h-6" style={{ color: '#fcc238' }} />
            </div>
            <div className="text-left">
              <div className="text-lg font-semibold">Cargar IPC</div>
              <div className="text-sm" style={{ color: '#969696' }}>Subir archivo de IPC</div>
            </div>
          </a>
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

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h2 className="text-xl font-bold text-[#686363]">Rendiciones Registradas</h2>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loading message="Cargando rendiciones..." size="lg" />
              </div>
            ) : rendiciones.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#63bae9]/10 to-[#63bae9]/5 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-[#63bae9]" />
                </div>
                <h3 className="text-2xl font-bold text-[#686363] mb-2">
                  No hay rendiciones disponibles
                </h3>
              </div>
            ) : (
              <div className="space-y-4">
                {rendiciones.map((r) => {

                  const fechaFormatted = new Date(r.fecha).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });

                  const totalConIPC = r.monto_total;



                  return (
                    <div
                      key={r.id_rendicion}
                      className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 bg-white relative"
                    >
                      {/* Header con gradiente */}
                      <div className="bg-gradient-to-r from-[#63bae9]/5 via-[#63bae9]/3 to-transparent p-6 border-b border-gray-100">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#63bae9] to-[#4a9fd4] flex items-center justify-center flex-shrink-0 shadow-sm">
                              <FileText className="w-7 h-7 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-[#686363] mb-2 group-hover:text-[#63bae9] transition-colors">
                                Rendición #{r.id_rendicion}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#63bae9]/10 text-[#63bae9] border border-[#63bae9]/20">
                                  {fechaFormatted}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
                                  {r.cobranzas.length} cobranza{r.cobranzas.length !== 1 ? 's' : ''}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                                  Total con IPC: ${totalConIPC.toLocaleString('es-AR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                </span>

                                {/* Nueva etiqueta de estado COBRADO para toda la rendición */}
                                {r.cobranzas.length > 0 && (
                                  <div
                                    onClick={() => handleToggleRendicionPagado(r)}
                                    className={`
                                        inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium cursor-pointer
                                        transition-all duration-200 select-none
                                        ${
                                          getRendicionPagadoStatus(r) === 'completo'
                                            ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                            : getRendicionPagadoStatus(r) === 'ninguno'
                                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200'
                                              : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                                        }
                                      `}
                                  >
                                    <span className="font-semibold">
                                      {(() => {
                                          const status = getRendicionPagadoStatus(r);

                                          if (status === 'completo') return 'COBRADO';
                                          if (status === 'ninguno') return 'NO COBRADO';
                                          return 'NO COBRADO';
                                        })()}
                                    </span>
                                    {getRendicionPagadoStatus(r) === 'completo' ? (
                                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                        ) : getRendicionPagadoStatus(r) === 'ninguno' ? (
                                          <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                                        ) : (
                                          <XCircle className="w-3.5 h-3.5 text-gray-500" />
                                        )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Botones visibles de Modificar y Eliminar */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => router.push(`/rendiciones/modificar/${r.id_rendicion}`)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                            >
                              <Pencil className="w-4 h-4" /> Modificar
                            </button>
                            <button
                              onClick={() => handleDelete(r)}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Contenido principal */}
                      <div className="p-6">
                        <div className="mb-6">
                          <h4 className="text-xs font-bold text-[#969696] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            Inmueble
                          </h4>

                          <p className="font-bold text-[#686363] text-lg">
                            {r.inmueble?.nombre || '—'}
                          </p>

                          {/* 👇 UBICACIÓN */}
                          <div className="flex items-center gap-2 text-sm text-[#969696] mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{r.inmueble?.direccionCompleta|| 'Ubicación no disponible'}</span>
                          </div>
                        </div>

                        {r.cobranzas.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xs font-bold text-[#969696] uppercase tracking-wider mb-3">
                              Cobranzas incluidas
                            </h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                              {r.cobranzas.map((c) => (
                                <div
                                  key={c.id_cobranza}
                                  className="text-sm bg-gray-50 px-3 py-2 rounded-lg border border-gray-100"
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[#686363] font-medium">
                                      {c.concepto}
                                    </span>
                                    <span className="font-medium text-[#63bae9]">
                                      ${c.monto.toLocaleString('es-AR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-[#969696]">
                                    <span>
                                      Cliente: {c.cliente.nombre} {c.cliente.apellido}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sección de auditoría - exactamente igual que en contratos */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-xs text-[#969696]">
                              <User className="w-3.5 h-3.5" />
                              <span className="font-medium">Creado por:</span>
                              <span className="font-bold text-[#686363]">{r.createdBy?.nombre || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#969696]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium">Creado:</span>
                              <span className="font-bold text-[#686363]">
                                {r.createdAt
                                  ? new Date(r.createdAt).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }).replace(',', ' •')
                                  : '—'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#969696]">
                              <User className="w-3.5 h-3.5" />
                              <span className="font-medium">Actualizado por:</span>
                              <span className="font-bold text-[#686363]">{r.updatedBy?.nombre || '—'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#969696]">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="font-medium">Actualizado:</span>
                              <span className="font-bold text-[#686363]">
                                {r.updatedAt
                                  ? new Date(r.updatedAt).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }).replace(',', ' •')
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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



        </div>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalConfig.title}
          message={modalConfig.message}
          variant={modalConfig.variant}
          onConfirm={modalConfig.onConfirm}
        />
      </main>
    </div>
  );
}