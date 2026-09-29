/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect} from 'react';
import { Save, AlertCircle, Trash2, DollarSign, User , ArrowLeft} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

import Loading from '@/components/ui/Loading';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Modal from "@/components/ui/Modal";
import { useQuery } from '@tanstack/react-query';
import Link from "next/link";
import { Button } from "@/components/ui/button"
import { useQueryClient } from '@tanstack/react-query';


// Tipos
interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  tiposCliente?: {
    tipoCliente: {
      nombre: string;
    };
  }[];
}


interface Contrato {
  id_contrato: number;
  nombre: string;
  inmueble?: {
    titulo: string;
  };
}

interface CobranzaForm {
  id_contrato: number;
  monto: string;
  fecha_cobranza: string;
  medio_pago: string;
  concepto: string;
  observaciones: string;
}

export default function EditarCobranzaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [selectedCliente, setSelectedCliente] = useState<number | ''>('');
  const [tipoCliente, setTipoCliente] = useState('');

  const hoy = new Date();
  const siguienteMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 9);
  const fechaDefault = siguienteMes.toISOString().split('T')[0];
  
  const [errores, setErrores] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();

  const [cobranza, setCobranza] = useState<CobranzaForm>({
    id_contrato: 0,
    monto: '',
    fecha_cobranza: fechaDefault,
    medio_pago: '',
    concepto: '',
    observaciones: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    variant?: "success" | "error" | "warning" | "info" | "danger";
    onConfirm?: () => void;
  }>({ title: "", message: "" });

  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  // Cargar clientes
 const {
    data: clientes = [],
    isLoading: loadingClientes,
    error: clientesError
  } = useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes');
      const data = await res.json();
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.clientes)
            ? data.clientes
            : [];
    },
  });


 // Cargar cobranza
  const {
    data: cobranzaData,
    isLoading: loadingCobranza,
    error: cobranzaError
  } = useQuery({
    queryKey: ['cobranza', id],
    queryFn: async () => {
      const res = await fetch(`/api/cobranzas/${id}`);
      const data = await res.json();
      return data.cobranza;
    },
    enabled: !!id,
  });

  useEffect(() => {
  if (!cobranzaData || !clientes.length) return;
  if (!cobranzaData.id_cliente) return; // 👈 guard extra

  setSelectedCliente(cobranzaData.id_cliente);

  const cliente = clientes.find(
  (c) => Number(c.id_cliente) === Number(cobranzaData.id_cliente)
);

  if (cliente) {
    setClienteSearch(`${cliente.apellido}, ${cliente.nombre}`);
  }

  setCobranza({
    id_contrato: cobranzaData.id_contrato ?? 0,
    monto: String(cobranzaData.monto ?? ''),
    fecha_cobranza: cobranzaData.fecha_cobranza?.split('T')[0] || fechaDefault,
    medio_pago: cobranzaData.medio_pago || '',
    concepto: cobranzaData.concepto || '',
    observaciones: cobranzaData.observaciones || '',
  });
}, [cobranzaData, clientes]);



  // Cargar contratos al cambiar cliente
  const {
    data: contratos = [],
    isLoading: loadingContratos,
    error: contratosError
  } = useQuery<Contrato[]>({
    queryKey: ['contratos', selectedCliente],
    queryFn: async () => {
      const res = await fetch(`/api/contracts?id_cliente=${selectedCliente}`);
      const data = await res.json();
      return Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.contratos)
            ? data.contratos
            : [];
    },
    enabled: !!selectedCliente,
  });

  // Tipo cliente
useEffect(() => {
  if (!selectedCliente || !clientes.length) return;

  const cliente = clientes.find(
    (c) => c.id_cliente === selectedCliente
  );

  setTipoCliente(
    cliente?.tiposCliente?.[0]?.tipoCliente?.nombre || ''
  );
}, [selectedCliente, clientes]);



const validar = () => {
  const nuevosErrores: Record<string, string> = {};

  if (!selectedCliente) {
    nuevosErrores.cliente = "Debes seleccionar un cliente.";
  }

  if (!cobranza.id_contrato || cobranza.id_contrato === 0) {
    nuevosErrores.id_contrato = "Debes seleccionar un contrato.";
  }

  if (!cobranza.monto.trim()) {
    nuevosErrores.monto = "El monto es obligatorio.";
  } else if (isNaN(Number(cobranza.monto)) || Number(cobranza.monto) <= 0) {
    nuevosErrores.monto = "El monto debe ser mayor a 0.";
  }

  if (!cobranza.fecha_cobranza) {
    nuevosErrores.fecha_cobranza = "La fecha es obligatoria.";
  }

  if (!cobranza.medio_pago.trim()) {
    nuevosErrores.medio_pago = "El medio de pago es obligatorio.";
  }

  if (!cobranza.concepto.trim()) {
    nuevosErrores.concepto = "El concepto es obligatorio.";
  }

  setErrores(nuevosErrores);

  return Object.keys(nuevosErrores).length === 0 ? null : "Hay errores en el formulario";
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const err = validar();
    if (err) return setError(err);

    try {
      setLoading(true);

      const res = await fetch(`/api/cobranzas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: selectedCliente,
          ...cobranza,
          monto: Number(cobranza.monto),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al modificar');


      // ⚡ actualizar cache instantáneamente
      queryClient.setQueryData(['cobranzas'], (old: any) => {

        if (!old?.cobranzas) return old;

        return {
          ...old,
          cobranzas: old.cobranzas.map((c: any) =>
            c.id_cobranza === Number(id)
              ? { ...c, ...data.cobranza }
              : c
          ),
        };
      });


      // actualizar también cache individual
      queryClient.setQueryData(['cobranza', id], data.cobranza);


      // revalidación en background
      queryClient.invalidateQueries({
        queryKey: ['cobranzas'],
        refetchType: 'inactive'
      });


      setModalConfig({
        title: "Cobranza modificada",
        message: "La cobranza se actualizó correctamente.",
        variant: "success",
        onConfirm: () => {
          setModalOpen(false);
          router.push('/cobranzas');
        },
      });
      setModalOpen(true);

    } catch (e: any) {
      setModalConfig({
        title: "Error al modificar",
        message: e.message || "Ocurrió un error inesperado.",
        variant: "error",
      });
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loadingClientes || loadingCobranza) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loading message="Cargando cobranza..." size="lg" />
    </div>
  );
}


  const clientesFiltrados = clientes.filter((c) => {
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    return fullName.includes(clienteSearch.toLowerCase());
  });

  const getInputClass = (fieldName: string) =>
  `w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ${
    errores[fieldName]
      ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/40"
      : "border-gray-300 focus:ring-[#63bae9] focus:border-[#63bae9]"
  }`;

const ErrorMessage = ({ field }: { field: string }) =>
  errores[field] ? (
    <p className="text-sm text-red-600 mt-1.5 leading-tight font-medium">
      {errores[field]}
    </p>
  ) : null;

  return (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-8 py-8 flex items-center gap-6">
        {/* BOTÓN VOLVER */}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-[#63bae9] text-[#63bae9]"
        >
          <Link href="/cobranzas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>

        {/* ICONO */}
        <div className="p-3 rounded-xl bg-[#e8f6fc]">
          <DollarSign className="w-7 h-7 text-[#63bae9]" />
        </div>

        {/* TÍTULO */}
        <div>
          <h1 className="text-3xl font-bold text-gray-700">Modificar Cobranza</h1>
          <p className="text-sm mt-1 text-gray-500">
            Edita los datos de la cobranza registrada
          </p>
        </div>
      </div>
    </header>

    <main className="max-w-5xl mx-auto px-8 py-10">
      {/* Alerta general de errores de validación */}
      {Object.keys(errores).length > 0 && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de validación</AlertTitle>
          <AlertDescription>
            Corrige los campos marcados en rojo antes de guardar los cambios.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de error general (si aún la usas) */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* SECCIÓN: Cliente */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Cliente</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar cliente <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                    if (errores.cliente) {
                      setErrores(prev => { const n = { ...prev }; delete n.cliente; return n; });
                    }
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  placeholder="Buscar cliente por nombre o apellido"
                  className={getInputClass("cliente")}
                  required
                />
                <ErrorMessage field="cliente" />

                {showClienteDropdown && clienteSearch && (
                  <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id_cliente}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-[#f0f9ff] transition-colors"
                        onClick={() => {
                          setSelectedCliente(c.id_cliente);
                          setClienteSearch(`${c.apellido}, ${c.nombre}`);
                          setShowClienteDropdown(false);
                          if (errores.cliente) {
                            setErrores(prev => { const n = { ...prev }; delete n.cliente; return n; });
                          }
                        }}
                      >
                        {c.apellido}, {c.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cliente
              </label>
              <input
                type="text"
                readOnly
                value={tipoCliente}
                className="w-full px-4 py-2.5 border rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN: Datos de la cobranza */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              Datos de la cobranza
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contrato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrato <span className="text-red-500">*</span>
              </label>
              <select
                value={cobranza.id_contrato}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, id_contrato: Number(e.target.value) }));
                  if (errores.id_contrato) {
                    setErrores(prev => { const n = { ...prev }; delete n.id_contrato; return n; });
                  }
                }}
                className={getInputClass("id_contrato")}
                required
              >
                <option value={0} disabled hidden>
                  Selecciona contrato
                </option>
                {contratos.map((ct) => (
                  <option key={ct.id_contrato} value={ct.id_contrato}>
                    {ct.nombre} {ct.inmueble ? `- ${ct.inmueble.titulo}` : ''}
                  </option>
                ))}
              </select>
              <ErrorMessage field="id_contrato" />
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={cobranza.monto}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, monto: e.target.value }));
                  if (errores.monto) {
                    setErrores(prev => { const n = { ...prev }; delete n.monto; return n; });
                  }
                }}
                className={`${getInputClass("monto")} pl-10`}
                required
              />
              <ErrorMessage field="monto" />
            </div>

            {/* Fecha de cobranza */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de cobranza <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={cobranza.fecha_cobranza}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, fecha_cobranza: e.target.value }));
                  if (errores.fecha_cobranza) {
                    setErrores(prev => { const n = { ...prev }; delete n.fecha_cobranza; return n; });
                  }
                }}
                className={getInputClass("fecha_cobranza")}
                required
              />
              <ErrorMessage field="fecha_cobranza" />
            </div>

            {/* Medio de pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medio de pago <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cobranza.medio_pago}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, medio_pago: e.target.value }));
                  if (errores.medio_pago) {
                    setErrores(prev => { const n = { ...prev }; delete n.medio_pago; return n; });
                  }
                }}
                className={getInputClass("medio_pago")}
                required
              />
              <ErrorMessage field="medio_pago" />
            </div>

            {/* Concepto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concepto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={cobranza.concepto}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, concepto: e.target.value }));
                  if (errores.concepto) {
                    setErrores(prev => { const n = { ...prev }; delete n.concepto; return n; });
                  }
                }}
                className={getInputClass("concepto")}
                required
              />
              <ErrorMessage field="concepto" />
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={cobranza.observaciones}
                onChange={(e) => {
                  setCobranza(prev => ({ ...prev, observaciones: e.target.value }));
                  if (errores.observaciones) {
                    setErrores(prev => { const n = { ...prev }; delete n.observaciones; return n; });
                  }
                }}
                className={getInputClass("observaciones")}
                rows={4}
                maxLength={300}
                placeholder="Detalles adicionales (opcional)"
              />
              <ErrorMessage field="observaciones" />
            </div>
          </div>
        </div>

        {/* Botones finales */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.push('/cobranzas')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#fcc238] text-white rounded-xl font-bold hover:bg-[#e0b02f] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
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
