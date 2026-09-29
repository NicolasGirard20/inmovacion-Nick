// src/app/(protected)/cobranzas/alta/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Save, AlertCircle, FileCheck2, Plus, Trash2, FileSignature, DollarSign, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Loading from '@/components/ui/Loading';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import Modal from "@/components/ui/Modal";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from "next/link";
import { Button } from "@/components/ui/button"


// Tipos (sin cambios)
interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  activo: boolean;

  tiposCliente?: {
    tipoCliente: {
      id_tipo_cliente: number;
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


export default function NuevaCobranzaPage() {
  const router = useRouter();

  // Estados principales
  const [selectedCliente, setSelectedCliente] = useState<number | ''>('');
  const [tipoCliente, setTipoCliente] = useState('');

  const hoy = new Date();
  const siguienteMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 9);
  const fechaDefault = siguienteMes.toISOString().split('T')[0];

  const [cobranzas, setCobranzas] = useState<CobranzaForm[]>([
  {
    id_contrato: 0,
    monto: '',
    fecha_cobranza: fechaDefault,
    medio_pago: '',
    concepto: '',
    observaciones: '',
  },
]);

  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Modal
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

  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  const {
    data: clientes = [],
    isLoading: clientesLoading,
  } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const res = await fetch('/api/clientes');
      if (!res.ok) throw new Error('Error al cargar clientes');
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

  const {
    data: contratos = [],
    isLoading: contratosLoading,
  } = useQuery({
    queryKey: ['contratos', selectedCliente],
    enabled: !!selectedCliente, // 👈 CLAVE
    queryFn: async () => {
      const res = await fetch(`/api/contracts?id_cliente=${selectedCliente}`);
      if (!res.ok) throw new Error('Error al cargar contratos');
      const data = await res.json();

      return Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.contratos)
            ? data.contratos
            : [];
    },
  });

  const crearCobranzaMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cobranzas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_cliente: selectedCliente,
          cobranzas,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Error al guardar');
      }

      return data;
    },
    onSuccess: (data) => {

  // ⚡ actualizar cache instantáneamente
  queryClient.setQueryData(['cobranzas'], (old: any) => {

    if (!old) return old;

    const nuevas = Array.isArray(data?.cobranzas)
      ? data.cobranzas
      : Array.isArray(data?.data)
        ? data.data
        : [];

    return {
      ...old,
      cobranzas: [...(old.cobranzas || []), ...nuevas],
    };
  });

  // opcional: revalidar en background
  queryClient.invalidateQueries({
    queryKey: ['cobranzas'],
    refetchType: 'inactive'
  });

  setModalConfig({
    title: "Cobranzas registradas",
    message: "Las cobranzas se guardaron correctamente.",
    variant: "success",
    onConfirm: () => {
      setModalOpen(false);
      router.push('/cobranzas');
    },
  });

  setModalOpen(true);

  // reset formulario
  setSelectedCliente('');
  setTipoCliente('');
  setCobranzas([
    {
      id_contrato: 0,
      monto: '',
      fecha_cobranza: fechaDefault,
      medio_pago: '',
      concepto: '',
      observaciones: '',
    },
  ]);
},
    onError: (error: any) => {
      setModalConfig({
        title: "Error al guardar",
        message: error.message || "Ocurrió un error inesperado.",
        variant: "error",
      });
      setModalOpen(true);
    },
  });


  useEffect(() => {
    setCobranzas((prev) =>
      prev.map((c) => ({ ...c, id_contrato: 0 }))
    );
  }, [selectedCliente]);


  // Actualizar tipo de cliente
useEffect(() => {
  const cliente = clientes.find(
    (c: any) => c.id_cliente === selectedCliente
  );

  if (!cliente || !cliente.tiposCliente || cliente.tiposCliente.length === 0) {
    setTipoCliente('');
    return;
  }

  // tomar el primer tipo (o podés concatenar varios)
  const tipo = cliente.tiposCliente[0]?.tipoCliente?.nombre || '';

  setTipoCliente(tipo);

}, [selectedCliente, clientes]);


  // Handlers
  const handleCobranzaChange = (index: number, field: string, value: any) => {
    const updated = [...cobranzas];
    (updated as any)[index][field] = value;
    setCobranzas(updated);
  };

  const agregarCobranza = () => {
    setCobranzas([
      ...cobranzas,
      {
        id_contrato: 0,
        monto: '',
        fecha_cobranza: fechaDefault,
        medio_pago: '',
        concepto: '',
        observaciones: '',
      },
    ]);
  };

  const eliminarCobranza = (index: number) => {
    if (cobranzas.length === 1) return;
    setCobranzas(cobranzas.filter((_, i) => i !== index));
  };

  // Función de validación completa - ahora llena el objeto errores
const validar = (): boolean => {
  const nuevosErrores: Record<string, string> = {};

  // Validación del cliente (campo global)
  if (!selectedCliente) {
    nuevosErrores.cliente = "Debes seleccionar un cliente.";
  }

  // Fecha límites (se calculan una sola vez)
  const hoyISO = new Date().toISOString().split('T')[0];
  const maxFecha = new Date();
  maxFecha.setFullYear(maxFecha.getFullYear() + 2);
  const maxFechaISO = maxFecha.toISOString().split('T')[0];

  // Validamos cada fila de cobranza
  cobranzas.forEach((c, index) => {
    const prefix = `cobranzas[${index}].`;

    // Contrato
    if (!c.id_contrato || c.id_contrato === 0) {
      nuevosErrores[`${prefix}id_contrato`] = "Debes seleccionar un contrato.";
    }

    // Monto
    if (!c.monto?.trim()) {
      nuevosErrores[`${prefix}monto`] = "El monto es obligatorio.";
    } else {
      const montoNum = Number(c.monto);
      if (isNaN(montoNum)) {
        nuevosErrores[`${prefix}monto`] = "El monto debe ser un número válido.";
      } else if (montoNum <= 0) {
        nuevosErrores[`${prefix}monto`] = "El monto debe ser mayor a 0.";
      } else if (montoNum > 99999999) {
        nuevosErrores[`${prefix}monto`] = "El monto es demasiado grande.";
      }
    }

    // Fecha de cobranza
    if (!c.fecha_cobranza) {
      nuevosErrores[`${prefix}fecha_cobranza`] = "Debes ingresar una fecha.";
    } else if (c.fecha_cobranza < hoyISO) {
      nuevosErrores[`${prefix}fecha_cobranza`] = "La fecha no puede ser anterior a hoy.";
    } else if (c.fecha_cobranza > maxFechaISO) {
      nuevosErrores[`${prefix}fecha_cobranza`] = "La fecha no puede ser mayor a 2 años.";
    }

    // Medio de pago
    if (!c.medio_pago?.trim()) {
      nuevosErrores[`${prefix}medio_pago`] = "El medio de pago es obligatorio.";
    } else if (c.medio_pago.trim().length < 3) {
      nuevosErrores[`${prefix}medio_pago`] = "Debe tener al menos 3 caracteres.";
    } else if (!/^[a-zA-Z0-9 áéíóúÁÉÍÓÚ.-]+$/.test(c.medio_pago)) {
      nuevosErrores[`${prefix}medio_pago`] = "Contiene caracteres no permitidos.";
    }

    // Concepto
    if (!c.concepto?.trim()) {
      nuevosErrores[`${prefix}concepto`] = "El concepto es obligatorio.";
    } else if (c.concepto.trim().length < 3) {
      nuevosErrores[`${prefix}concepto`] = "Debe tener al menos 3 caracteres.";
    } else if (!/^[a-zA-Z0-9 áéíóúÁÉÍÓÚ.-]+$/.test(c.concepto)) {
      nuevosErrores[`${prefix}concepto`] = "Contiene caracteres no permitidos.";
    }

    // Observaciones (opcional)
    if (c.observaciones && c.observaciones.length > 300) {
      nuevosErrores[`${prefix}observaciones`] = "No puede superar los 300 caracteres.";
    }
  });

  // Actualizamos el estado de errores
  setErrores(nuevosErrores);

  // Retornamos si hay errores o no
  const hayErrores = Object.keys(nuevosErrores).length > 0;

  if (hayErrores) {
    // Opcional: scroll al primer error visible
    setTimeout(() => {
      const primerError = document.querySelector('[class*="border-red-500"]');
      primerError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  return !hayErrores;  // true = válido, false = hay errores
};

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const esValido = validar();

  if (!esValido) {
    // Ya se setearon los errores → el render los muestra automáticamente
    return;
  }

  // Limpiamos errores residuales (por si acaso)
  setErrores({});

  // Procedemos a guardar
  crearCobranzaMutation.mutate();
};


  if (clientesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Cargando datos para nueva cobranza..." size="lg" />
      </div>
    );
  }


  const clientesFiltrados = clientes
  .filter((c: any) => c.activo === true) // 👈 SOLO ACTIVOS
  .filter((c: any) => {
    const fullName = `${c.nombre} ${c.apellido}`.toLowerCase();
    return fullName.includes(clienteSearch.toLowerCase());
  });

const getInputClass = (fieldName: string, index?: number) => {
  const errorKey = index !== undefined 
    ? `cobranzas[${index}].${fieldName}` 
    : fieldName;

  return `w-full px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-150 ${
    errores[errorKey]
      ? "border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50/40"
      : "border-gray-300 focus:ring-[#63bae9] focus:border-[#63bae9]"
  }`;
};

const ErrorMessage = ({ field, index }: { field: string; index?: number }) => {
  const errorKey = index !== undefined 
    ? `cobranzas[${index}].${field}` 
    : field;

  return errores[errorKey] ? (
    <p className="text-sm text-red-600 mt-1.5 leading-tight font-medium">
      {errores[errorKey]}
    </p>
  ) : null;
};

 return (
  <div className="min-h-screen bg-gray-50">
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-5xl mx-auto px-8 py-8 flex items-center gap-6">
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

        <div className="p-3 rounded-xl bg-[#e8f6fc]">
          <DollarSign className="w-7 h-7 text-[#63bae9]" />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-700">Nueva Cobranza</h1>
          <p className="text-sm mt-1 text-gray-500">
            Registra los detalles de la nueva cobranza
          </p>
        </div>
      </div>
    </header>

    <main className="max-w-5xl mx-auto px-8 py-10">
      {/* Alerta general cuando hay errores */}
      {Object.keys(errores).length > 0 && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de validación</AlertTitle>
          <AlertDescription>
            Corrige los campos marcados en rojo antes de guardar.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate  className="space-y-8">
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
                  placeholder="Buscar cliente por nombre o apellido"
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                    if (errores.cliente) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n.cliente;
                        return n;
                      });
                    }
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  className={getInputClass("cliente")}
                  required
                />
                <ErrorMessage field="cliente" />

                {showClienteDropdown && clienteSearch && (
                  <div className="absolute z-20 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientesFiltrados.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        No hay coincidencias
                      </div>
                    ) : (
                      clientesFiltrados.map((c) => (
                        <button
                          key={c.id_cliente}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-[#f0f9ff] transition"
                          onClick={() => {
                            setSelectedCliente(c.id_cliente);
                            setClienteSearch(`${c.apellido}, ${c.nombre}`);
                            setShowClienteDropdown(false);
                            if (errores.cliente) {
                              setErrores((prev) => {
                                const n = { ...prev };
                                delete n.cliente;
                                return n;
                              });
                            }
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de cliente
              </label>
              <input
                type="text"
                value={tipoCliente}
                readOnly
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN: Cobranzas (por cada fila) */}
        {cobranzas.map((c, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Cobranza #{index + 1}
                </h2>
              </div>

              {cobranzas.length > 1 && (
                <button
                  type="button"
                  onClick={() => eliminarCobranza(index)}
                  className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium transition"
                >
                  <Trash2 size={18} /> Quitar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contrato <span className="text-red-500">*</span>
                </label>
                <select
                  value={c.id_contrato}
                  onChange={(e) => {
                    handleCobranzaChange(index, 'id_contrato', Number(e.target.value));
                    const key = `cobranzas[${index}].id_contrato`;
                    if (errores[key]) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[key];
                        return n;
                      });
                    }
                  }}
                  className={getInputClass("id_contrato", index)}
                  required
                >
                  <option value={0} disabled hidden>
                    Selecciona contrato
                  </option>
                  {contratos.map((ct) => (
                    <option key={ct.id_contrato} value={ct.id_contrato}>
                      {ct.nombre} {ct.inmueble ? `- ${ct.inmueble.titulo}` : ""}
                    </option>
                  ))}
                </select>
                <ErrorMessage field="id_contrato" index={index} />
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={c.monto}
                    onChange={(e) => {
                      handleCobranzaChange(index, "monto", e.target.value);
                      const key = `cobranzas[${index}].monto`;
                      if (errores[key]) {
                        setErrores((prev) => {
                          const n = { ...prev };
                          delete n[key];
                          return n;
                        });
                      }
                    }}
                    className={`${getInputClass("monto")} pl-10`}
                    required
                  />
                </div>
                <ErrorMessage field="monto" index={index} />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de cobranza <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  max={
                    new Date(new Date().setFullYear(new Date().getFullYear() + 2))
                      .toISOString()
                      .split("T")[0]
                  }
                  value={c.fecha_cobranza}
                  onChange={(e) => {
                    handleCobranzaChange(index, "fecha_cobranza", e.target.value);
                    const key = `cobranzas[${index}].fecha_cobranza`;
                    if (errores[key]) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[key];
                        return n;
                      });
                    }
                  }}
                  className={getInputClass("fecha_cobranza", index)}
                  required
                />
                <ErrorMessage field="fecha_cobranza" index={index} />
              </div>

              {/* Medio de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medio de pago <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={c.medio_pago}
                  onChange={(e) => {
                    handleCobranzaChange(index, "medio_pago", e.target.value);
                    const key = `cobranzas[${index}].medio_pago`;
                    if (errores[key]) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[key];
                        return n;
                      });
                    }
                  }}
                  className={getInputClass("medio_pago", index)}
                  required
                />
                <ErrorMessage field="medio_pago" index={index} />
              </div>

              {/* Concepto */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={c.concepto}
                  onChange={(e) => {
                    handleCobranzaChange(index, "concepto", e.target.value);
                    const key = `cobranzas[${index}].concepto`;
                    if (errores[key]) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[key];
                        return n;
                      });
                    }
                  }}
                  className={getInputClass("concepto", index)}
                  required
                />
                <ErrorMessage field="concepto" index={index} />
              </div>

              {/* Observaciones */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={c.observaciones}
                  onChange={(e) => {
                    handleCobranzaChange(index, "observaciones", e.target.value);
                    const key = `cobranzas[${index}].observaciones`;
                    if (errores[key]) {
                      setErrores((prev) => {
                        const n = { ...prev };
                        delete n[key];
                        return n;
                      });
                    }
                  }}
                  className={getInputClass("observaciones", index)}
                  maxLength={300}
                  rows={4}
                  placeholder="Detalles adicionales (opcional)"
                />
                <ErrorMessage field="observaciones" index={index} />
              </div>
            </div>
          </div>
        ))}

        {/* Botón agregar cobranza */}
        <button
          type="button"
          onClick={agregarCobranza}
          className="flex items-center gap-2 px-6 py-3 bg-[#63bae9] text-white rounded-xl font-medium hover:bg-[#57a9d3] transition shadow-sm"
        >
          <Plus size={18} /> Agregar otra cobranza
        </button>

        {/* Botones finales */}
        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => router.push("/cobranzas")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={crearCobranzaMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-[#fcc238] text-white rounded-xl font-bold hover:bg-[#e0b02f] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {crearCobranzaMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Cobranzas
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