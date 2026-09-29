//src/app/protected/contratos/preview/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FileText, Download, AlertCircle, Loader2 } from 'lucide-react';

// Importar el visor como componente dinámico (solo cliente)
const DocxViewer = dynamic(() => import('@/components/DocxViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-96">
      <Loader2 className="w-16 h-16 text-[#63bae9] animate-spin mb-6" />
      <p className="text-xl font-semibold text-[#686363]">Cargando visor...</p>
    </div>
  ),
});

export default function ContractPreview() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');

  useEffect(() => {
    const loadContract = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/contracts/${id}`);
        if (!res.ok) {
          throw new Error('No se pudo cargar el contrato');
        }
        const contrato = await res.json();

        if (!contrato?.archivoPath) {
          throw new Error('El contrato no tiene documento asociado');
        }

        setFileUrl(contrato.archivoPath);
         
        const timestamp = Date.now();
const fileRes = await fetch(`${contrato.archivoPath}?t=${timestamp}`);
        if (!fileRes.ok) {
          throw new Error('No se pudo descargar el documento');
        }
        
        const blob = await fileRes.blob();
        
        if (blob.size === 0) {
          throw new Error('El archivo está vacío');
        }

        setDocxBlob(blob);
        setLoading(false);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Error al cargar el documento');
        setLoading(false);
      }
    };

    loadContract();
  }, [id]);

  const handleDownload = () => {
    if (docxBlob) {
      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contrato-${id}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#63bae9] text-white">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#686363]">
                Vista Previa del Contrato
              </h1>
              <p className="text-sm sm:text-base text-[#969696] mt-1">
                Previsualización fiel del documento Word
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              disabled={!docxBlob}
              className="flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#fcc238] text-[#686363] font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              Descargar .docx
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 sm:h-96">
            <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-[#63bae9] animate-spin mb-4 sm:mb-6" />
            <p className="text-lg sm:text-xl font-semibold text-[#686363]">Cargando documento...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-[#fcc238] mx-auto mb-4 sm:mb-6" />
            <h2 className="text-xl sm:text-2xl font-bold text-[#686363] mb-3 sm:mb-4">No se pudo cargar la vista previa</h2>
            <p className="text-sm sm:text-base text-[#969696] mb-6 sm:mb-8 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-[#63bae9] text-white rounded-lg sm:rounded-xl hover:bg-[#4a9fd4] transition-colors shadow-md"
            >
              Volver al listado
            </button>
          </div>
        ) : docxBlob ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <DocxViewer blob={docxBlob} />
          </div>
        ) : null}

        <div className="mt-6 sm:mt-8 p-4 sm:p-5 bg-[#e8f6fc] rounded-lg sm:rounded-xl flex items-start gap-3 sm:gap-4 border border-[#63bae9]/30">
          <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#63bae9] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm sm:text-base font-medium text-[#686363]">
              Esta es una previsualización fiel del documento original.
            </p>
            <p className="text-xs sm:text-sm text-[#686363] mt-1">
              Para editar, imprimir o guardar, usa el botón de descarga.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}