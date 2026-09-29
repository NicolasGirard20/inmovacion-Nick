// src/app/(protected)/templates/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, AlertCircle, Check, ArrowLeft, Tag, Download, Search, Calendar } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Template {
  id: number;
  nombre: string;
  archivoPath: string;
  camposVariables: string[] | null;
  tipo: 'ALQUILER_LOCACION' | 'COMPRA_VENTA';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

function TemplatePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'ALQUILER_LOCACION' | 'COMPRA_VENTA' | ''>('');
  const [file, setFile] = useState<File | null>(null);
  const [campos, setCampos] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; nombre: string } | null>(null);
  const [search, setSearch] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [filterTipo, setFilterTipo] = useState<'ALQUILER_LOCACION' | 'COMPRA_VENTA' | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Estado para notificaciones
const [notification, setNotification] = useState<{
  isOpen: boolean;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}>({
  isOpen: false,
  variant: 'success',
  title: '',
  message: '',
});

// Función helper para mostrar notificaciones
const showNotification = (
  variant: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string
) => {
  setNotification({ isOpen: true, variant, title, message });
};

  useEffect(() => {
    setPage(1); // Resetear a la primera página al cambiar la búsqueda o filtros
    fetchTemplates();
  }, [search, filterTipo]);

  useEffect(() => {
    fetchTemplates(); // Carga inicial
  }, [page]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (filterTipo) params.append('tipo', filterTipo);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      const url = `/api/templates?${params.toString()}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error al cargar templates');
      const { templates, total } = await res.json();
      setTemplates(templates);
      setTotal(total);
    } catch (err) {
      setError('No se pudieron cargar los templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Resetear a la primera página al filtrar
    fetchTemplates();
  };

const handleUpload = async () => {
  if (!nombre || !tipo || !file) {
    showNotification('warning', 'Datos incompletos', 'Por favor, ingresa un nombre, selecciona un tipo y selecciona un archivo .docx');
    return;
  }

  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('tipo', tipo);
  formData.append('file', file);

  try {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/templates', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al subir el template');
    }
    const data = await res.json();
    setCampos(data.campos || []);
    setNombre('');
    setTipo('');
    setFile(null);
    showNotification('success', '¡Éxito!', 'Template subido exitosamente');
    setSuccessMessage('Template subido exitosamente');
    setTimeout(() => setSuccessMessage(null), 5000);
    setPage(1);
    fetchTemplates();
  } catch (err: any) {
    showNotification('error', 'Error', err.message);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  const handleDelete = (id: number, nombre: string) => {
    setItemToDelete({ id, nombre });
    setDeleteModalOpen(true);
  };

const confirmDelete = async () => {
  if (!itemToDelete) return;

  try {
    setLoading(true);
    const res = await fetch('/api/templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemToDelete.id }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al eliminar el template');
    }
    
    showNotification('success', '¡Eliminado!', 'Template eliminado exitosamente');
    fetchTemplates();
  } catch (err: any) {
    showNotification('error', 'Error', err.message);
    setError(err.message);
  } finally {
    setLoading(false);
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }
};

  const closeModal = () => {
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la página */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fcc238' }}>
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#686363' }}>
                  Gestión de Plantillas
                </h1>
                <p className="text-sm mt-1" style={{ color: '#969696' }}>
                  Administra plantillas para generación de contratos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/contratos"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all hover:shadow-md"
                style={{ borderColor: '#63bae9', color: '#63bae9' }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Volver a Contratos</span>
              </a>
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: '#fef9e7' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#fcc238' }}></div>
                <span className="text-sm font-medium" style={{ color: '#686363' }}>
                  {total} {total === 1 ? 'template' : 'templates'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Success Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 shadow-sm" style={{ backgroundColor: '#e8f7fd', borderLeft: '4px solid #63bae9' }}>
            <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#63bae9' }} />
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#686363' }}>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 shadow-sm" style={{ backgroundColor: '#fef9e7', borderLeft: '4px solid #fcc238' }}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#fcc238' }} />
            <div className="flex-1">
              <p className="font-medium" style={{ color: '#686363' }}>{error}</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="p-6 border-b border-gray-200" style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #ffffff 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fcc238' }}>
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold" style={{ color: '#686363' }}>
                  Subir Nueva Plantilla
                </h2>
                <p className="text-sm" style={{ color: '#969696' }}>
                  Carga un archivo .docx con campos variables
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#686363' }}>
                <span>Nombre de la Plantilla</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9e7', color: '#fcc238' }}>Requerido</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Contrato de Arrendamiento Comercial"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-opacity-100 transition-all"
                style={{
                  color: '#686363',
                  borderColor: nombre ? '#63bae9' : '#e5e7eb'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#686363' }}>
                <span>Tipo de Plantilla</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9e7', color: '#fcc238' }}>Requerido</span>
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as 'ALQUILER_LOCACION' | 'COMPRA_VENTA' | '')}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-opacity-100 transition-all"
                style={{
                  color: '#686363',
                  borderColor: tipo ? '#63bae9' : '#e5e7eb'
                }}
              >
                <option value="">Seleccione un tipo</option>
                <option value="ALQUILER_LOCACION">Alquiler/Locación</option>
                <option value="COMPRA_VENTA">Compra/Venta</option>
              </select>
            </div>

<div>
  <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#686363' }}>
    <span>Archivo .docx</span>
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9e7', color: '#fcc238' }}>Requerido</span>
  </label>
  <div className="relative">
    <div 
      className="border-2 border-dashed rounded-lg p-6 transition-all hover:border-opacity-100" 
      style={{ 
        borderColor: error?.includes('docx') ? '#ef4444' : (file ? '#63bae9' : '#e5e7eb'),
        backgroundColor: error?.includes('docx') ? '#fef2f2' : (file ? '#f0f9ff' : '#fafafa')
      }}
    >
      <input
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => {
          const selectedFile = e.target.files?.[0] || null;

          if (!selectedFile) {
            setFile(null);
            setError(null);
            return;
          }

          // Validación de extensión
          if (!selectedFile.name.toLowerCase().endsWith('.docx')) {
            setError('Solo se permiten archivos con extensión .docx');
            setFile(null);
            e.target.value = '';
            return;
          }

          // Validación de MIME type
          const validMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          if (selectedFile.type !== validMime) {
            setError('El archivo no es un documento Word válido (.docx)');
            setFile(null);
            e.target.value = '';
            return;
          }

          setError(null);
          setFile(selectedFile);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="text-center">
        <FileText 
          className="w-10 h-10 mx-auto mb-3" 
          style={{ color: error?.includes('docx') ? '#ef4444' : (file ? '#63bae9' : '#969696') }} 
        />
        {file ? (
          <div>
            <p className="font-semibold mb-1" style={{ color: '#686363' }}>{file.name}</p>
            <p className="text-xs" style={{ color: '#969696' }}>
              {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="font-medium mb-1" style={{ color: '#686363' }}>
              Haz clic o arrastra un archivo aquí
            </p>
            <p className="text-xs" style={{ color: '#969696' }}>
              Solo archivos .docx
            </p>
          </div>
        )}
        {error?.includes('docx') && (
          <p className="text-xs mt-3 font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  </div>
</div>

            <button
              onClick={handleUpload}
              disabled={loading || !nombre || !tipo || !file}
              className="w-full py-4 px-6 rounded-lg font-semibold text-white flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: '#fcc238' }}
            >
              <Upload className="w-5 h-5" />
              {loading ? 'Subiendo Template...' : 'Subir Template'}
            </button>
          </div>
        </div>

        {/* Detected Fields */}
{successMessage && (
  <div className="mb-8 p-6 rounded-xl shadow-sm border-2" 
       style={{ 
         backgroundColor: campos.length > 0 ? '#e8f7fd' : '#fef9e7',
         borderColor: campos.length > 0 ? '#63bae9' : '#fcc238'
       }}>
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        campos.length > 0 ? 'bg-[#63bae9]' : 'bg-[#fcc238]'
      }`}>
        {campos.length > 0 ? (
          <Tag className="w-5 h-5 text-white" />
        ) : (
          <AlertCircle className="w-5 h-5 text-white" />
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: '#686363' }}>
          {campos.length > 0 
            ? 'Campos Variables Detectados' 
            : 'Advertencia: Sin Campos Variables'}
        </h3>
        <p className="text-sm" style={{ color: '#969696' }}>
          {campos.length > 0 
            ? 'Estos campos podrán ser rellenados al crear contratos'
            : 'El documento no contiene campos con formato {nombre}. La plantilla se subió, pero no será muy útil para generar contratos automáticos.'}
        </p>
      </div>
    </div>

    {campos.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {campos.map((campo, index) => (
          <span
            key={index}
            className="px-4 py-2 rounded-full text-sm font-semibold shadow-sm"
            style={{ backgroundColor: '#63bae9', color: 'white' }}
          >
            {campo}
          </span>
        ))}
      </div>
    ) : (
      <div className="text-sm font-medium" style={{ color: '#fcc238' }}>
        Sugerencia: Usa llaves como {'{locador_nombre}'}, {'{monto}'}, {'{fecha_inicio}'} en tu Word.
      </div>
    )}
  </div>
)}

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                Buscar por nombre
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej: Contrato Alquiler"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-opacity-100 transition-all pr-10"
                  style={{
                    color: '#686363',
                    borderColor: search ? '#63bae9' : '#e5e7eb'
                  }}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#969696' }} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                Tipo de Plantilla
              </label>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value as 'ALQUILER_LOCACION' | 'COMPRA_VENTA' | '')}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-opacity-100 transition-all"
                style={{
                  color: '#686363',
                  borderColor: filterTipo ? '#63bae9' : '#e5e7eb'
                }}
              >
                <option value="">Todos los tipos</option>
                <option value="ALQUILER_LOCACION">Alquiler/Locación</option>
                <option value="COMPRA_VENTA">Compra/Venta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                Fecha de Creación
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-opacity-100 transition-all"
                  style={{
                    color: '#686363',
                    borderColor: fechaDesde ? '#63bae9' : '#e5e7eb'
                  }}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: '#969696' }} />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-all hover:shadow-md hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#63bae9' }}
              >
                <Calendar className="w-5 h-5" />
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold" style={{ color: '#686363' }}>
              Plantillas Disponibles
            </h2>
            <p className="text-sm mt-1" style={{ color: '#969696' }}>
              Plantillas cargadas en el sistema
            </p>
          </div>

          <div className="p-6">
            {loading && templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#fcc238' }}></div>
                <p className="mt-4 text-lg font-medium" style={{ color: '#969696' }}>Cargando Plantillas...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef9e7' }}>
                  <FileText className="w-12 h-12" style={{ color: '#fcc238' }} />
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#686363' }}>
                  No hay Plantillas disponibles
                </h3>
                <p className="text-lg" style={{ color: '#969696' }}>
                  Haz un ajuste en la búsqueda o sube una nueva plantilla para comenzar
                </p>
              </div>
            ) : (
              <div>
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className="group border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all"
                      style={{
                        borderLeftWidth: '6px',
                        borderLeftColor: '#fcc238'
                      }}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#fef9e7' }}>
                          <FileText className="w-7 h-7" style={{ color: '#fcc238' }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-2" style={{ color: '#686363' }}>
                            {template.nombre}
                          </h3>
                          <p className="text-sm mb-3 flex items-center gap-2" style={{ color: '#969696' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#63bae9' }}></span>
                            {template.archivoPath}
                          </p>
                          <p className="text-sm mb-3 flex items-center gap-2" style={{ color: '#969696' }}>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#63bae9' }}></span>
                            Tipo: {template.tipo === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta'}
                          </p>

                          {template.camposVariables && template.camposVariables.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold mb-2" style={{ color: '#969696' }}>
                                CAMPOS VARIABLES:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {template.camposVariables.map((campo, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                                    style={{ backgroundColor: '#f0f9ff', color: '#63bae9' }}
                                  >
                                    {campo}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                         <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: '#969696' }}>
  <div className="flex items-center gap-2">
    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-[10px] font-bold text-white">
      {template.createdBy.name.charAt(0).toUpperCase()}
    </div>
    <span>Por {template.createdBy.name}</span>
  </div>
  <span>•</span>
  <span>
    {new Date(template.createdAt).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}
  </span>
</div>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={template.archivoPath}
                            download
                            className="px-4 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-all hover:shadow-md hover:scale-105 active:scale-95"
                            style={{ backgroundColor: '#63bae9' }}
                          >
                            <Download className="w-5 h-5" />
                            <span className="hidden sm:inline">Descargar</span>
                          </a>
                          <button
                            onClick={() => handleDelete(template.id, template.nombre)}
                            disabled={loading}
                            className="px-4 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-all hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{ backgroundColor: '#fcc238' }}
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Paginación */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-all hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#63bae9' }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Anterior
                  </button>
                  <span className="text-sm font-medium" style={{ color: '#686363' }}>
                    Página {page} de {Math.ceil(total / pageSize)}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / pageSize)}
                    className="px-6 py-3 rounded-lg font-medium text-white flex items-center gap-2 transition-all hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#63bae9' }}
                  >
                    Siguiente
                    <ArrowLeft className="w-5 h-5 transform rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

       {/* Modal de confirmación */}
<Modal
  isOpen={deleteModalOpen}
  onClose={closeModal}
  onConfirm={confirmDelete}
  title="¿Eliminar Plantilla?"
  message={itemToDelete ? `¿Estás seguro de que quieres eliminar la plantilla "${itemToDelete.nombre}"? Esta acción no se puede deshacer.` : ''}
  confirmText="Eliminar"
  cancelText="Cancelar"
  variant="danger"
/>

{/* Modal de notificación */}
<Modal
  isOpen={notification.isOpen}
  onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
  title={notification.title}
  message={notification.message}
  variant={notification.variant}
  autoClose={3000}
/>
      </main>
    </div>
  );
}

export default TemplatePage;