// src/app/(protected)/rendiciones/ipc/page.tsx

/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useRef } from 'react';
import { TrendingUp, ArrowLeft, Upload, Trash2, FileSpreadsheet, Loader2, AlertCircle, Calendar, X, Pencil } from 'lucide-react';

import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Loading from '@/components/ui/Loading'; 
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Modal from '@/components/ui/Modal';

/**
 * Interface que representa un registro de IPC almacenado en BD.
 */
interface IpcData {
  id: number;
  mes: number;
  anio: number;
  valor: number | string | null;
  fuente: string;
  fechaConsulta: string;
}

export default function IpcManagementPage() {

  const [editConfirmOpen, setEditConfirmOpen] = useState(false);

  const [filterYear, setFilterYear] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  const [editingItem, setEditingItem] = useState<IpcData | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editFuente, setEditFuente] = useState("");


  // Estados para la subida mejorada
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const fetchIpcData = async (): Promise<IpcData[]> => {
    const res = await fetch('/api/rendiciones/ipc');
    if (!res.ok) throw new Error('ERROR_FETCH');
    const { datos } = await res.json();
    return datos ?? [];
  };

  const {
    data: ipcData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ipc'],
    queryFn: fetchIpcData,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<IpcData | null>(null);

 const deleteIpcMutation = useMutation({
  mutationFn: async (id: number) => {
    const res = await fetch(`/api/rendiciones/ipc?id=${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error();
  },

  onSuccess: () => {
    toast.success('Dato de IPC eliminado');

    // ✅ ESTO ES LO QUE TE FALTA
    queryClient.invalidateQueries({ queryKey: ['ipc'] });

    setModalOpen(false);
    setItemToDelete(null);
  },

  onError: () => {
    toast.error('No se pudo eliminar el IPC');
  },
});

const currentYear = new Date().getFullYear();

const years = Array.from(
  { length: currentYear - 2025 + 1 },
  (_, i) => 2025 + i
);



  // ============================================================
  // 📌 SUBIDA MEJORADA: Drag & Drop + Vista previa + Validación
  // ============================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!validateFile(file)) return;
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0] ?? null;
    if (!validateFile(file)) return;
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleEdit = (item: IpcData) => {
    setEditingItem(item);
    setEditValor(String(item.valor ?? ""));
    setEditFuente(item.fuente ?? "");
  };



  const validateFile = (file: File | null): boolean => {
    if (!file) return false;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos .xlsx o .xls');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande (máximo 10MB)');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);

    try {
      const data = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      const nuevosDatos = rows.map((r: any) => {

        // detectar columna año o anio automáticamente
        const keyAnio = Object.keys(r).find(
          k => k.toLowerCase() === "anio" || k.toLowerCase() === "año"
        );

        return {
          mes: Number(
            r.mes ??
            r.Mes ??
            r.MES
          ),

          anio: Number(
            r.anio ??
            r.año ??
            (keyAnio ? r[keyAnio] : null)
          ),

          valor:
            r.valor !== undefined && r.valor !== null
              ? Number(r.valor)
              : 0,

          fuente:
            r.fuente ??
            r.Fuente ??
            'Archivo Excel',

          fechaConsulta:
            r.fecha_publicacion ??
            r.fechaConsulta ??
            new Date().toISOString(),
        };

      }).filter(d =>
        !isNaN(d.mes) &&
        !isNaN(d.anio)
      );


      const res = await fetch('/api/rendiciones/ipc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevosDatos),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`¡Éxito! ${result.count || nuevosDatos.length} registros cargados`);
        setSelectedFile(null);
        queryClient.invalidateQueries({ queryKey: ['ipc'] });
      } else {
        toast.error(result.error || 'Error al guardar en la base de datos');
      }
    } catch (err: any) {
      toast.error('Error al procesar el archivo Excel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 const handleDelete = (item: IpcData) => {
    setItemToDelete(item);
    setModalOpen(true);
  };

  const updateIpcMutation = useMutation({
    mutationFn: async () => {

      if (!editingItem) {
        toast.error("No hay IPC seleccionado");
        throw new Error("NO_ITEM");
      }

      const valorNumber = Number(editValor);

      if (isNaN(valorNumber)) {
        toast.error("El valor debe ser un número válido");
        throw new Error("INVALID_NUMBER");
      }

      const res = await fetch("/api/rendiciones/ipc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem.id,
          valor: valorNumber,
          fuente: editFuente,
        }),
      });

      if (!res.ok) throw new Error("UPDATE_FAILED");

      return {
        id: editingItem.id,
        valor: valorNumber,
        fuente: editFuente,
      };
    },

    onSuccess: () => {

      // ✅ recargar datos desde el backend
      queryClient.invalidateQueries({ queryKey: ['ipc'] });

      toast.success("IPC actualizado");

      setEditingItem(null);
    },


      onError: () => {
        toast.error("Error actualizando IPC");
      },
    });





  // ============================================================
  // 📌 Formatear número del IPC con decimales
  // ============================================================
  const formatValor = (valor: number | string | null) => {
  if (valor === null || valor === undefined) return 'N/A';

  const num = typeof valor === 'string' ? parseFloat(valor) : valor;

  if (isNaN(num)) return 'N/A';

  return (num * 100).toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


  const filteredData = filterYear
    ? ipcData.filter(d => d.anio === filterYear)
    : ipcData;


if (isLoading) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loading message="Cargando datos de IPC..." size="lg" />
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#fcc238]">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#686363]">Gestión de IPC</h1>
              <p className="text-sm mt-1 text-[#969696]">Suba y administre los datos del IPC anual</p>
            </div>
          </div>
          <a
            href="/rendiciones"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9]/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Volver a Rendiciones</span>
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* === SUBIDA MEJORADA === */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[#63bae9]/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#fcc238] flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-[#686363]">Subir archivo Excel anual</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Arrastrar y sueltar el archivo .xlsx o .xls aquí (máximo 10MB)
            </p>
          </div>

          <div className="p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragging
                  ? 'border-[#63bae9] bg-[#63bae9]/5 ring-2 ring-[#63bae9]/30'
                  : 'border-gray-300 hover:border-[#63bae9] hover:bg-gray-50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div className="space-y-4">
                  <Upload className="w-16 h-16 mx-auto text-[#63bae9] opacity-80" />
                  <div>
                    <p className="text-xl font-medium text-gray-800">
                      Arrastrar el archivo aquí o hacer clic para seleccionar
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Solo archivos Excel (.xlsx / .xls) – Máximo 10MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-[#fcc238]/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-12 h-12 text-[#fcc238]" />
                  </div>
                  <div className="text-center max-w-xs">
                    <p className="font-semibold text-gray-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className={`
                  inline-flex items-center gap-3 px-10 py-5 rounded-xl font-bold text-white text-lg
                  transition-all duration-300 shadow-lg
                  ${!selectedFile || loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#fcc238] hover:bg-[#e0b02f] hover:shadow-xl active:scale-95'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Procesando archivo...
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6" />
                    Subir y procesar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filtro por año - estilo igual que Filtros.tsx */}
          <div className="w-full">
            {/* Contenedor principal - mismo estilo que contratos */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header del panel de filtros */}
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#63bae9]/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#63bae9]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#686363]">Filtro por Año</h3>
                      <p className="text-sm text-[#969696]">Seleccionar un año para ver los datos de IPC</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenido (sin desplegable en este caso, porque es solo un filtro) */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selector de Año */}
                  <div>
                    <label className="block text-sm font-bold text-[#686363] mb-2">
                      Año
                    </label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 pl-11 rounded-xl border-2 border-gray-200 focus:border-[#63bae9] focus:outline-none transition-all text-[#686363] appearance-none bg-white"
                        value={filterYear ?? ""}
                        onChange={(e) =>
                          setFilterYear(e.target.value ? Number(e.target.value) : null)
                        }
                      >
                        <option value="" disabled hidden>
                          Seleccione un año
                        </option>

                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#969696] pointer-events-none" />
                    </div>
                  </div>

                  {/* Espacio reservado – si en el futuro agregas otro filtro (ej: mes, fuente), va aquí */}
                  <div></div>
                </div>
              </div>
            </div>

            {/* Tag activo - igual que en Filtros.tsx */}
            {filterYear && (
              <div className="flex flex-wrap gap-2.5 mt-4">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#63bae9]/10 text-[#63bae9] rounded-lg text-sm font-medium shadow-sm">
                  Año: {filterYear}
                  <button
                    onClick={() => setFilterYear(null)}
                    className="focus:outline-none"
                  >
                    <X className="w-4 h-4 hover:text-red-600 transition-colors" />
                  </button>
                </span>
              </div>
            )}
          </div>

        {/* Lista de datos */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6">
          <h2 className="text-2xl font-semibold mb-6 text-[#686363]">
            Datos IPC {filterYear ? `(${filterYear})` : ''}
          </h2>

          {error && (
            <Alert className="mb-6 bg-red-50 border-l-4 border-red-400">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                No se pudieron cargar los datos de IPC
              </AlertDescription>
            </Alert>
          )}


          {filteredData.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-500">
              No hay datos de IPC cargados aún {filterYear ? `para el año ${filterYear}` : ''}.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredData.map(d => (
                <div
                  key={d.id}
                  className="group border border-gray-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg transition-all duration-300"
                  style={{ borderLeft: '6px solid #63bae9' }}
                >
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {new Date(0, d.mes - 1).toLocaleString('es-AR', { month: 'long' })} {d.anio}
                    </h3>
                    <p className="text-gray-700 flex items-center gap-2">
                      Valor:

                      {editingItem?.id === d.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editValor}
                          onChange={(e) => setEditValor(e.target.value)}
                          className="px-2 py-1 border rounded-lg w-32 font-semibold"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold">{formatValor(d.valor)}</span>
                      )}
                    </p>  
                    <p className="text-sm text-gray-600">
                      Fuente: {d.fuente} • Cargado: {new Date(d.fechaConsulta).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {editingItem?.id === d.id ? (
                      <>
                        <button
                          onClick={() => setEditConfirmOpen(true)}
                          className="px-5 py-2.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 font-medium"
                        >
                          Guardar
                        </button>

                        <button
                          onClick={() => setEditingItem(null)}
                          className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                          <button
                            onClick={() => handleEdit(d)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>Modificar</span>
                          </button>

                          <button
                            onClick={() => handleDelete(d)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                      </>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={() => itemToDelete && deleteIpcMutation.mutate(itemToDelete.id)}
          title="Eliminar dato de IPC"
          message={
            itemToDelete
              ? `¿Eliminar IPC de ${itemToDelete.mes}/${itemToDelete.anio}?`
              : ''
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
        />

        <Modal
          isOpen={editConfirmOpen}
          onClose={() => setEditConfirmOpen(false)}
          onConfirm={() => {
            updateIpcMutation.mutate(undefined, {
              onSuccess: () => {
                setEditConfirmOpen(false);
                setEditingItem(null);
              }
            });
          }}
          title="Confirmar edición"
          message="¿Desea guardar los cambios del IPC?"
          confirmText="Guardar"
          cancelText="Cancelar"
          variant="success"
        />

    </div>
  );
}