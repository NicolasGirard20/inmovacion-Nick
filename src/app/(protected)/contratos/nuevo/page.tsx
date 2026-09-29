/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/contratos/nuevo/page.tsx
'use client';
import { useState, useEffect, useCallback } from 'react';
import { FileText, Save, AlertCircle, Calendar, DollarSign, Building2, User, FileType, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Combobox from '@/components/ui/combobox';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';

interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  numero_documento?: string;
  descripcion?: string;
  activo?: boolean;
  tipoDocumento?: { nombre: string };          // ← era tipo_documento: string
  tiposCliente?: { tipoCliente: { nombre: string } }[];  // ← era tipoCliente: { nombre }
}

interface Inmueble {
  id_inmueble: number;
  titulo: string;
  precio?: number;
  superficie_total?: number;
  superficie_cubierta?: number;
  cantidad_ambientes?: number;
  cantidad_banos?: number;
  cantidad_dormitorios?: number;
  cantidad_cocheras?: number;
  cantidad_pisos?: number;
  antiguedad?: number;
  detalles?: string;
  archivado?: boolean;
  ubicacion?: {
    direccion: string;
    ciudad?: string;
    provincia?: string;
    barrio?: { nombre: string; localidad?: { nombre: string } };
  };
  tipo_inmueble?: { nombre: string };
  estado?: { nombre: string };
  operacion?: { nombre: string };
  cliente?: { nombre: string; apellido?: string };
}

interface Template {
  id: number;
  nombre: string;
  tipo: 'ALQUILER_LOCACION' | 'COMPRA_VENTA';
  camposVariables: string[] | null;
}

interface Contrato {
  nombre: string;
  tipo_contrato: 'ALQUILER_LOCACION' | 'COMPRA_VENTA';
  id_locador?: number;
  id_locatario?: number;
  id_comprador?: number;
  id_vendedor?: number;
  id_inmueble: number;
  id_template: number;
  valores: { [key: string]: string };
  fecha_inicio: string;
  fecha_fin: string;
  monto: string;
}

const contractSchema = z.object({
  nombre: z.string().min(1, 'El nombre del contrato es obligatorio'),
  tipo_contrato: z.enum(['ALQUILER_LOCACION', 'COMPRA_VENTA'], { message: 'El tipo de contrato es obligatorio' }),
  id_locador: z.number({ message: 'El locador es obligatorio' }).optional(),
  id_locatario: z.number({ message: 'El locatario es obligatorio' }).optional(),
  id_comprador: z.number({ message: 'El comprador es obligatorio' }).optional(),
  id_vendedor: z.number({ message: 'El vendedor es obligatorio' }).optional(),
  id_inmueble: z.number({ message: 'El inmueble es obligatorio' }),
  id_template: z.number({ message: 'La plantilla es obligatoria' }),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
  fecha_fin: z.string().min(1, 'La fecha de fin es obligatoria'),
  monto: z.string().min(1, 'El monto es obligatorio').refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'El monto debe ser un número positivo',
  }),
}).refine((data) => {
  const start = new Date(data.fecha_inicio);
  const end = new Date(data.fecha_fin);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
}, {
  message: 'La fecha de fin debe ser posterior a la de inicio',
  path: ['fecha_fin'],
}).refine((data) => {
  if (data.tipo_contrato === 'ALQUILER_LOCACION') {
    return !!data.id_locador && !!data.id_locatario && data.id_locador !== data.id_locatario;
  }
  return !!data.id_comprador && !!data.id_vendedor && data.id_comprador !== data.id_vendedor;
}, {
  message: 'Deben seleccionarse dos clientes diferentes',
  path: ['id_locatario', 'id_vendedor'],
});

export default function NewContract() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [nombre, setNombre] = useState('');
  const [tipoContrato, setTipoContrato] = useState<'ALQUILER_LOCACION' | 'COMPRA_VENTA' | ''>('');
  const [id_locador, setIdLocador] = useState<number | undefined>(undefined);
  const [id_locatario, setIdLocatario] = useState<number | undefined>(undefined);
  const [id_comprador, setIdComprador] = useState<number | undefined>(undefined);
  const [id_vendedor, setIdVendedor] = useState<number | undefined>(undefined);
  const [id_inmueble, setIdInmueble] = useState<number | undefined>(undefined);
  const [id_template, setIdTemplate] = useState<number | undefined>(undefined);
  const [valores, setValores] = useState<{ [key: string]: string }>({});
  const [fecha_inicio, setFechaInicio] = useState('');
  const [fecha_fin, setFechaFin] = useState('');
  const [monto, setMonto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocador, setSelectedLocador] = useState<Cliente | null>(null);
  const [selectedLocatario, setSelectedLocatario] = useState<Cliente | null>(null);
  const [selectedComprador, setSelectedComprador] = useState<Cliente | null>(null);
  const [selectedVendedor, setSelectedVendedor] = useState<Cliente | null>(null);
  const [selectedInmueble, setSelectedInmueble] = useState<Inmueble | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  // 1. Estado solo para el modal de confirmación (antes de crear)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // 2. Estado separado para notificaciones (éxito, error, warning)
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    variant: 'success' | 'error' | 'warning' | 'info' | 'danger';
    title: string;
    message: string;
    autoClose?: number;
  }>({
    isOpen: false,
    variant: 'success',
    title: '',
    message: '',
  });

  // Helper para mostrar notificaciones (éxito, error, etc.)
  const showNotification = (
    variant: typeof notification.variant,
    title: string,
    message: string,
    autoClose: number = 4000
  ) => {
    setNotification({ isOpen: true, variant, title, message, autoClose });
  };

  // Cierra la notificación
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

    // Guardamos los datos validados para usarlos al confirmar
  const [contractData, setContractData] = useState<Contrato | null>(null);
  const [hasUserEditedMonto, setHasUserEditedMonto] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clientesRes, inmueblesRes, templatesRes] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/inmuebles'),
          fetch('/api/templates?pageSize=1000'),
        ]);
        if (!clientesRes.ok || !inmueblesRes.ok || !templatesRes.ok) {
          throw new Error('Error al cargar datos');
        }
        setClientes(await clientesRes.json());
      const inmueblesRaw = await inmueblesRes.json();
const inmueblesList = Array.isArray(inmueblesRaw) ? inmueblesRaw : inmueblesRaw?.data ?? [];
setInmuebles(inmueblesList);
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);
      } catch (err) {
        setError('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchCliente = async (id: number | undefined, setCliente: (cliente: Cliente | null) => void) => {
  if (id) {
    try {
      const res = await fetch(`/api/clientes/${id}`);
      if (!res.ok) throw new Error('Error al cargar cliente');
      
      const data = await res.json();
      console.log('CLIENTE DATA:', JSON.stringify(data, null, 2));  // ← agregá esto
      setCliente(data);
    } catch (err) {
      setError('Error al cargar cliente');
    }
  } else {
    setCliente(null);
  }
};
    fetchCliente(id_locador, setSelectedLocador);
    fetchCliente(id_locatario, setSelectedLocatario);
    fetchCliente(id_comprador, setSelectedComprador);
    fetchCliente(id_vendedor, setSelectedVendedor);
  }, [id_locador, id_locatario, id_comprador, id_vendedor]);

  useEffect(() => {
    const fetchInmueble = async () => {
      if (id_inmueble) {
        try {
          const res = await fetch(`/api/inmuebles/${id_inmueble}`);
          if (!res.ok) throw new Error('Error al cargar inmueble');
          setSelectedInmueble(await res.json());
        } catch (err) {
          setError('Error al cargar inmueble');
        }
      } else {
        setSelectedInmueble(null);
      }
    };
    fetchInmueble();
  }, [id_inmueble]);

useEffect(() => {
  if (selectedInmueble?.precio && !hasUserEditedMonto) {
    setMonto(selectedInmueble.precio.toString());
  }
}, [selectedInmueble, hasUserEditedMonto]);

  useEffect(() => {
    setIdTemplate(undefined);
    setValores({});
    setIdLocador(undefined);
    setIdLocatario(undefined);
    setIdComprador(undefined);
    setIdVendedor(undefined);
    setIdInmueble(undefined);
    setFechaInicio('');
    setFechaFin('');
    setMonto('');
  }, [tipoContrato]);

  const autoCompleteField = useCallback((campo: string): string | null => {
    const lowerCampo = campo.toLowerCase();

// LOCADOR
if (lowerCampo.includes('locador_nombre') && selectedLocador?.nombre) return selectedLocador.nombre;
if (lowerCampo.includes('locador_apellido') && selectedLocador?.apellido) return selectedLocador.apellido;
if (lowerCampo.includes('locador_email') && selectedLocador?.email) return selectedLocador.email;
if (lowerCampo.includes('locador_telefono') && selectedLocador?.telefono) return selectedLocador.telefono;
if (lowerCampo.includes('locador_tipo_documento') && selectedLocador?.tipoDocumento?.nombre) return selectedLocador.tipoDocumento.nombre;
if (lowerCampo.includes('locador_numero_documento') && selectedLocador?.numero_documento) return selectedLocador.numero_documento;
if (lowerCampo.includes('locador_descripcion') && selectedLocador?.descripcion) return selectedLocador.descripcion;
if (lowerCampo.includes('locador_activo') && selectedLocador?.activo !== undefined) return selectedLocador.activo.toString();
if (lowerCampo.includes('locador_tipo') && selectedLocador?.tiposCliente?.[0]?.tipoCliente?.nombre) return selectedLocador.tiposCliente[0].tipoCliente.nombre;

   // LOCATARIO
if (lowerCampo.includes('locatario_nombre') && selectedLocatario?.nombre) return selectedLocatario.nombre;
if (lowerCampo.includes('locatario_apellido') && selectedLocatario?.apellido) return selectedLocatario.apellido;
if (lowerCampo.includes('locatario_email') && selectedLocatario?.email) return selectedLocatario.email;
if (lowerCampo.includes('locatario_telefono') && selectedLocatario?.telefono) return selectedLocatario.telefono;
if (lowerCampo.includes('locatario_tipo_documento') && selectedLocatario?.tipoDocumento?.nombre) return selectedLocatario.tipoDocumento.nombre;
if (lowerCampo.includes('locatario_numero_documento') && selectedLocatario?.numero_documento) return selectedLocatario.numero_documento;
if (lowerCampo.includes('locatario_descripcion') && selectedLocatario?.descripcion) return selectedLocatario.descripcion;
if (lowerCampo.includes('locatario_activo') && selectedLocatario?.activo !== undefined) return selectedLocatario.activo.toString();
if (lowerCampo.includes('locatario_tipo') && selectedLocatario?.tiposCliente?.[0]?.tipoCliente?.nombre) return selectedLocatario.tiposCliente[0].tipoCliente.nombre;


    // COMPRADOR
if (lowerCampo.includes('comprador_nombre') && selectedComprador?.nombre) return selectedComprador.nombre;
if (lowerCampo.includes('comprador_apellido') && selectedComprador?.apellido) return selectedComprador.apellido;
if (lowerCampo.includes('comprador_email') && selectedComprador?.email) return selectedComprador.email;
if (lowerCampo.includes('comprador_telefono') && selectedComprador?.telefono) return selectedComprador.telefono;
if (lowerCampo.includes('comprador_tipo_documento') && selectedComprador?.tipoDocumento?.nombre) return selectedComprador.tipoDocumento.nombre;
if (lowerCampo.includes('comprador_numero_documento') && selectedComprador?.numero_documento) return selectedComprador.numero_documento;
if (lowerCampo.includes('comprador_descripcion') && selectedComprador?.descripcion) return selectedComprador.descripcion;
if (lowerCampo.includes('comprador_activo') && selectedComprador?.activo !== undefined) return selectedComprador.activo.toString();
if (lowerCampo.includes('comprador_tipo') && selectedComprador?.tiposCliente?.[0]?.tipoCliente?.nombre) return selectedComprador.tiposCliente[0].tipoCliente.nombre;


   // VENDEDOR
if (lowerCampo.includes('vendedor_nombre') && selectedVendedor?.nombre) return selectedVendedor.nombre;
if (lowerCampo.includes('vendedor_apellido') && selectedVendedor?.apellido) return selectedVendedor.apellido;
if (lowerCampo.includes('vendedor_email') && selectedVendedor?.email) return selectedVendedor.email;
if (lowerCampo.includes('vendedor_telefono') && selectedVendedor?.telefono) return selectedVendedor.telefono;
if (lowerCampo.includes('vendedor_tipo_documento') && selectedVendedor?.tipoDocumento?.nombre) return selectedVendedor.tipoDocumento.nombre;
if (lowerCampo.includes('vendedor_numero_documento') && selectedVendedor?.numero_documento) return selectedVendedor.numero_documento;
if (lowerCampo.includes('vendedor_descripcion') && selectedVendedor?.descripcion) return selectedVendedor.descripcion;
if (lowerCampo.includes('vendedor_activo') && selectedVendedor?.activo !== undefined) return selectedVendedor.activo.toString();
if (lowerCampo.includes('vendedor_tipo') && selectedVendedor?.tiposCliente?.[0]?.tipoCliente?.nombre) return selectedVendedor.tiposCliente[0].tipoCliente.nombre;

    if (lowerCampo.includes('inmueble_titulo') && selectedInmueble?.titulo) return selectedInmueble.titulo;
    if (lowerCampo.includes('inmueble_superficie_total') && selectedInmueble?.superficie_total) return selectedInmueble.superficie_total.toString();
    if (lowerCampo.includes('inmueble_superficie_cubierta') && selectedInmueble?.superficie_cubierta) return selectedInmueble.superficie_cubierta.toString();
    if (lowerCampo.includes('inmueble_cantidad_ambientes') && selectedInmueble?.cantidad_ambientes) return selectedInmueble.cantidad_ambientes.toString();
    if (lowerCampo.includes('inmueble_cantidad_banos') && selectedInmueble?.cantidad_banos) return selectedInmueble.cantidad_banos.toString();
    if (lowerCampo.includes('inmueble_cantidad_dormitorios') && selectedInmueble?.cantidad_dormitorios) return selectedInmueble.cantidad_dormitorios.toString();
    if (lowerCampo.includes('inmueble_cantidad_cocheras') && selectedInmueble?.cantidad_cocheras) return selectedInmueble.cantidad_cocheras.toString();
    if (lowerCampo.includes('inmueble_cantidad_pisos') && selectedInmueble?.cantidad_pisos) return selectedInmueble.cantidad_pisos.toString();
    if (lowerCampo.includes('inmueble_antiguedad') && selectedInmueble?.antiguedad) return selectedInmueble.antiguedad.toString();
   if (lowerCampo.includes('inmueble_precio') && selectedInmueble?.precio) return selectedInmueble.precio.toString();
    if (lowerCampo.includes('inmueble_detalles') && selectedInmueble?.detalles) return selectedInmueble.detalles || '';
    if (lowerCampo.includes('inmueble_archivado') && selectedInmueble?.archivado !== undefined) return selectedInmueble.archivado.toString();
    if (lowerCampo.includes('inmueble_direccion') && selectedInmueble?.ubicacion?.direccion) return selectedInmueble.ubicacion.direccion;
    if (lowerCampo.includes('inmueble_ciudad') && selectedInmueble?.ubicacion?.ciudad) return selectedInmueble.ubicacion.ciudad || '';
    if (lowerCampo.includes('inmueble_provincia') && selectedInmueble?.ubicacion?.provincia) return selectedInmueble.ubicacion.provincia || '';
    if (lowerCampo.includes('inmueble_barrio') && selectedInmueble?.ubicacion?.barrio?.nombre) return selectedInmueble.ubicacion.barrio.nombre || '';
    if (lowerCampo.includes('inmueble_localidad') && selectedInmueble?.ubicacion?.barrio?.localidad?.nombre) return selectedInmueble.ubicacion.barrio.localidad.nombre || '';
    if (lowerCampo.includes('inmueble_tipo') && selectedInmueble?.tipo_inmueble?.nombre) return selectedInmueble.tipo_inmueble.nombre || '';
    if (lowerCampo.includes('inmueble_estado') && selectedInmueble?.estado?.nombre) return selectedInmueble.estado.nombre || '';
    if (lowerCampo.includes('inmueble_operacion') && selectedInmueble?.operacion?.nombre) return selectedInmueble.operacion.nombre || '';
    if (lowerCampo.includes('inmueble_propietario') && selectedInmueble?.cliente?.nombre && selectedInmueble?.cliente?.apellido) {
      return `${selectedInmueble.cliente.nombre} ${selectedInmueble.cliente.apellido || ''}`.trim();
    }

    if (lowerCampo.includes('contrato_nombre') && nombre) return nombre;
    if (lowerCampo.includes('contrato_tipo') && tipoContrato) return tipoContrato === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta';
    if (lowerCampo.includes('contrato_fecha_inicio') && fecha_inicio) return fecha_inicio;
    if (lowerCampo.includes('contrato_fecha_fin') && fecha_fin) return fecha_fin;
    if (lowerCampo.includes('contrato_monto') && monto) return monto;

    return null;
  }, [selectedLocador, selectedLocatario, selectedComprador, selectedVendedor, selectedInmueble, nombre, tipoContrato, fecha_inicio, fecha_fin, monto]);

  useEffect(() => {
    if (!id_template) {
      setValores({});
      return;
    }

    const selectedTemplate = templates.find(t => t.id === id_template);
    if (!selectedTemplate?.camposVariables) {
      setValores({});
      return;
    }

    const newValores = selectedTemplate.camposVariables.reduce((acc, campo) => {
      const autoValue = autoCompleteField(campo);
      return { ...acc, [campo]: autoValue || '' };
    }, {} as { [key: string]: string });

    setValores(newValores);
  }, [
    id_template,
    templates,
    selectedLocador,
    selectedLocatario,
    selectedComprador,
    selectedVendedor,
    selectedInmueble,
    nombre,
    tipoContrato,
    fecha_inicio,
    fecha_fin,
    monto,
    autoCompleteField
  ]);

    // Validar dinámicamente fechas y monto
  // Validar dinámicamente fechas y monto
useEffect(() => {
  // Solo validar si hay valores para validar
  if (!fecha_inicio && !fecha_fin && !monto) {
    return;
  }

  const newErrors: { [key: string]: string } = {};

  // Validar que las fechas no estén vacías
  if (fecha_inicio && !fecha_fin) {
    newErrors.fecha_fin = 'La fecha de fin es obligatoria';
  }
  if (fecha_fin && !fecha_inicio) {
    newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
  }

  // Validar que fecha_fin sea posterior a fecha_inicio
  if (fecha_inicio && fecha_fin) {
    const start = new Date(fecha_inicio);
    const end = new Date(fecha_fin);
    
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (end <= start) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la de inicio';
      }
    }
  }

  // Validar monto
  if (monto) {
    const montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      newErrors.monto = 'El monto debe ser un número positivo';
    }
  }

  setFormErrors((prev) => {
    // Mantener errores que no sean de fechas/monto
    const { fecha_inicio, fecha_fin, monto, ...rest } = prev;
    return { ...rest, ...newErrors };
  });
}, [fecha_inicio, fecha_fin, monto]);
  const handleSubmit = async () => {
    const data: Contrato = {
      nombre,
      tipo_contrato: tipoContrato as 'ALQUILER_LOCACION' | 'COMPRA_VENTA',
      id_locador: tipoContrato === 'ALQUILER_LOCACION' ? id_locador : undefined,
      id_locatario: tipoContrato === 'ALQUILER_LOCACION' ? id_locatario : undefined,
      id_comprador: tipoContrato === 'COMPRA_VENTA' ? id_comprador : undefined,
      id_vendedor: tipoContrato === 'COMPRA_VENTA' ? id_vendedor : undefined,
      id_inmueble: id_inmueble!,
      id_template: id_template!,
      valores,
      fecha_inicio,
      fecha_fin,
      monto,
    };

    // 1. Validación Zod
    const result = contractSchema.safeParse(data);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString();
        if (path) errors[path] = issue.message;
      });
      setFormErrors(prev => ({ ...prev, ...errors }));

      const firstError = result.error.issues[0]?.message || 'Por favor revisa los campos obligatorios';
      showNotification('error', 'Formulario incompleto o inválido', firstError);
      return;
    }

    // 2. Validación monto máximo
    const montoNum = parseFloat(monto);
    if (montoNum > 999999999.99) {
      setFormErrors(prev => ({ ...prev, monto: 'El monto es demasiado grande' }));
      showNotification('error', 'Monto inválido', 'El monto excede el máximo permitido (999.999.999,99)');
      return;
    }

    // 3. Validación campos variables vacíos
    if (Object.values(valores).some(v => !v.trim())) {
      showNotification('warning', 'Campos incompletos', 'Por favor completa todos los campos variables antes de continuar');
      return;
    }

    // 4. Mostrar modal de confirmación
    setContractData(data);           // ← Guardamos data en estado
    setConfirmModalOpen(true);       // ← Abrimos confirmación
  };

  // 5. Esta función se ejecuta SOLO cuando el usuario confirma la creación
  const confirmCreate = async () => {
    setConfirmModalOpen(false);

    try {
      setLoading(true);
      setFormErrors({});

      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        let userMessage = errorData.error || 'No se pudo crear el contrato';

        // Mensajes más descriptivos y amigables
        if (userMessage.includes('template no encontrado')) {
          userMessage = 'La plantilla seleccionada no existe o fue eliminada. Selecciona otra.';
        } else if (userMessage.includes('tipo de plantilla no coincide')) {
          userMessage = 'El tipo de plantilla no coincide con el tipo de contrato.';
        } else if (userMessage.includes('Error al guardar') || userMessage.includes('storage')) {
          userMessage = 'Problema al guardar el archivo en el almacenamiento. Intenta nuevamente.';
        }

        throw new Error(userMessage);
      }

      const responseData = await res.json();

      showNotification(
        'success',
        '¡Contrato creado con éxito!',
        `El contrato "${nombre}" fue generado correctamente.\nPuedes descargarlo ahora o verlo en la lista de contratos.`,
        5000
      );

      // Redirigir después de mostrar el éxito
      setTimeout(() => {
        window.location.href = responseData.downloadUrl;
        router.push('/contratos');
      }, 2500);

    } catch (err: any) {
      showNotification(
        'error',
        'Error al crear el contrato',
        err.message || 'Ocurrió un problema inesperado. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clienteOptions = clientes.map(cliente => ({
    value: cliente.id_cliente,
    label: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
  }));

  const inmuebleOptions = inmuebles.map(inmueble => ({
    value: inmueble.id_inmueble,
    label: inmueble.titulo,
  }));

  const templateOptions = templates
    .filter(t => !tipoContrato || t.tipo === tipoContrato)
    .map(template => ({
      value: template.id,
      label: template.nombre,
    }));

  const isGeneralInfoComplete = !!nombre && !!tipoContrato;
  const isPartesComplete = !!id_inmueble && (
    (tipoContrato === 'ALQUILER_LOCACION' && !!id_locador && !!id_locatario && id_locador !== id_locatario) ||
    (tipoContrato === 'COMPRA_VENTA' && !!id_comprador && !!id_vendedor && id_comprador !== id_vendedor)
  );
  const isFechasMontoComplete = !!fecha_inicio && !!fecha_fin && !!monto && !formErrors.fecha_inicio && !formErrors.fecha_fin && !formErrors.monto;
  const isPrevStepComplete = isGeneralInfoComplete && isPartesComplete && isFechasMontoComplete;

  const steps = [
    { id: 1, name: 'Información General', completed: isGeneralInfoComplete },
    { id: 2, name: 'Partes', completed: isPartesComplete },
    { id: 3, name: 'Fechas y Monto', completed: isFechasMontoComplete },
    { id: 4, name: 'Template', completed: !!id_template },
  ];

  console.log('=== DEBUG TEMPLATES ===');
  console.log('Templates cargados:', templates);
  console.log('Tipo contrato seleccionado:', tipoContrato);
  console.log('Template options filtradas:', templateOptions);
  console.log('isPrevStepComplete:', isPrevStepComplete);
  console.log('isGeneralInfoComplete:', isGeneralInfoComplete);
  console.log('isPartesComplete:', isPartesComplete);
  console.log('isFechasMontoComplete:', isFechasMontoComplete);
  console.log('======================');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="bg-gradient-to-br from-white to-gray-50" style={{ borderBottom: '1px solid #e5e7eb' }}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex items-start gap-6">
            <div className="p-4 rounded-2xl shadow-sm" style={{ backgroundColor: '#63bae9' }}>
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2" style={{ color: '#686363' }}>
                Crear Nuevo Contrato
              </h1>
              <p className="text-base" style={{ color: '#969696' }}>
                Completa la información necesaria para generar tu contrato de manera profesional
              </p>

              <div className="mt-8 flex items-center gap-2 flex-wrap">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{
                      backgroundColor: step.completed ? '#e8f6fc' : 'white',
                      border: '1px solid',
                      borderColor: step.completed ? '#63bae9' : '#e5e7eb'
                    }}>
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: '#63bae9' }} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: '#969696' }} />
                      )}
                      <span className="text-sm font-medium" style={{ color: step.completed ? '#63bae9' : '#969696' }}>
                        {step.name}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-5 h-5 mx-1" style={{ color: '#969696' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div
            className="mb-6 p-5 rounded-xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
              backgroundColor: '#fff9e6',
              border: '2px solid #fcc238'
            }}
          >
            <div className="p-2 rounded-lg" style={{ backgroundColor: '#fcc238' }}>
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-base" style={{ color: '#686363' }}>Atención</p>
              <p className="text-sm mt-1" style={{ color: '#969696' }}>{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
              <div className="p-6 border-b" style={{ borderColor: '#f3f4f6' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f6fc' }}>
                    <FileText className="w-5 h-5" style={{ color: '#63bae9' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                      Información General
                    </h2>
                    <p className="text-xs" style={{ color: '#969696' }}>
                      Identificación y tipo del contrato
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                    Nombre del Contrato
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Contrato de Alquiler - Departamento 3A"
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
                    style={{
                      borderColor: formErrors.nombre ? '#ef4444' : (nombre ? '#63bae9' : '#e5e7eb'),
                      backgroundColor: formErrors.nombre ? '#fef2f2' : (nombre ? '#f0f9ff' : 'white'),
                      color: '#686363'
                    }}
                  />
                  {formErrors.nombre && (
                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{formErrors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                    Tipo de Contrato
                  </label>
                  <select
                    value={tipoContrato}
                    onChange={(e) => setTipoContrato(e.target.value as 'ALQUILER_LOCACION' | 'COMPRA_VENTA' | '')}
                    className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
                    style={{
                      borderColor: formErrors.tipo_contrato ? '#ef4444' : (tipoContrato ? '#63bae9' : '#e5e7eb'),
                      backgroundColor: formErrors.tipo_contrato ? '#fef2f2' : (tipoContrato ? '#f0f9ff' : 'white'),
                      color: '#686363'
                    }}
                  >
                    <option value="">Selecciona un tipo</option>
                    <option value="ALQUILER_LOCACION">Alquiler/Locación</option>
                    <option value="COMPRA_VENTA">Compra/Venta</option>
                  </select>
                  {formErrors.tipo_contrato && (
                    <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{formErrors.tipo_contrato}</p>
                  )}
                </div>
              </div>
            </div>

            {tipoContrato && (
              <>
                <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                  <div className="p-6 border-b" style={{ borderColor: '#f3f4f6' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f6fc' }}>
                        <User className="w-5 h-5" style={{ color: '#63bae9' }} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                          Partes del Contrato
                        </h2>
                        <p className="text-xs" style={{ color: '#969696' }}>
                          Clientes e inmueble involucrados
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {tipoContrato === 'ALQUILER_LOCACION' ? (
                      <>
                        <Combobox
                          options={clienteOptions}
                          value={id_locador}
                          onChange={setIdLocador}
                          placeholder="Selecciona el locador"
                          label={
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" style={{ color: '#63bae9' }} />
                              Locador
                            </span>
                          }
                          searchPlaceholder="Buscar locador..."
                          error={formErrors.id_locador}
                        />
                        <Combobox
                          options={clienteOptions}
                          value={id_locatario}
                          onChange={setIdLocatario}
                          placeholder="Selecciona el locatario"
                          label={
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" style={{ color: '#63bae9' }} />
                              Locatario
                            </span>
                          }
                          searchPlaceholder="Buscar locatario..."
                          error={formErrors.id_locatario}
                        />
                      </>
                    ) : (
                      <>
                        <Combobox
                          options={clienteOptions}
                          value={id_comprador}
                          onChange={setIdComprador}
                          placeholder="Selecciona el comprador"
                          label={
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" style={{ color: '#63bae9' }} />
                              Comprador
                            </span>
                          }
                          searchPlaceholder="Buscar comprador..."
                          error={formErrors.id_comprador}
                        />
                        <Combobox
                          options={clienteOptions}
                          value={id_vendedor}
                          onChange={setIdVendedor}
                          placeholder="Selecciona el vendedor"
                          label={
                            <span className="flex items-center gap-2">
                              <User className="w-4 h-4" style={{ color: '#63bae9' }} />
                              Vendedor
                            </span>
                          }
                          searchPlaceholder="Buscar vendedor..."
                          error={formErrors.id_vendedor}
                        />
                      </>
                    )}
                    <Combobox
                      options={inmuebleOptions}
                      value={id_inmueble}
                      onChange={setIdInmueble}
                      placeholder="Selecciona un inmueble"
                      label={
                        <span className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" style={{ color: '#63bae9' }} />
                          Inmueble
                        </span>
                      }
                      searchPlaceholder="Buscar inmueble..."
                      error={formErrors.id_inmueble}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                  <div className="p-6 border-b" style={{ borderColor: '#f3f4f6' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f6fc' }}>
                        <Calendar className="w-5 h-5" style={{ color: '#63bae9' }} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                          Fechas y Monto
                        </h2>
                        <p className="text-xs" style={{ color: '#969696' }}>
                          Vigencia y valor del contrato
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                        <Calendar className="w-4 h-4" style={{ color: '#63bae9' }} />
                        Fecha de Inicio
                      </label>
                      <input
                        type="date"
                        value={fecha_inicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
                        style={{
                          borderColor: formErrors.fecha_inicio ? '#ef4444' : (fecha_inicio ? '#63bae9' : '#e5e7eb'),
                          backgroundColor: formErrors.fecha_inicio ? '#fef2f2' : (fecha_inicio ? '#f0f9ff' : 'white')
                        }}
                      />
                      {formErrors.fecha_inicio && (
                        <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{formErrors.fecha_inicio}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                        <Calendar className="w-4 h-4" style={{ color: '#63bae9' }} />
                        Fecha de Fin
                      </label>
                      <input
                        type="date"
                        value={fecha_fin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
                        style={{
                          borderColor: formErrors.fecha_fin ? '#ef4444' : (fecha_fin ? '#63bae9' : '#e5e7eb'),
                          backgroundColor: formErrors.fecha_fin ? '#fef2f2' : (fecha_fin ? '#f0f9ff' : 'white')
                        }}
                      />
                      {formErrors.fecha_fin && (
                        <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{formErrors.fecha_fin}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                        <DollarSign className="w-4 h-4" style={{ color: '#63bae9' }} />
                        Monto del Contrato
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: '#969696' }}>$</span>
                       <input
  type="number"
  value={monto}
  onChange={(e) => {
    setMonto(e.target.value);
    setHasUserEditedMonto(true); // ← Marca que el usuario lo tocó
  }}
  placeholder="0.00"
  className="w-full pl-10 pr-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
  style={{
    borderColor: formErrors.monto ? '#ef4444' : (monto ? '#63bae9' : '#e5e7eb'),
    backgroundColor: formErrors.monto ? '#fef2f2' : (monto ? '#f0f9ff' : 'white'),
    color: '#686363'
  }}
  step="0.01"
  min="0"
/>
                        {formErrors.monto && (
                          <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{formErrors.monto}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                  <div className="p-6 border-b" style={{ borderColor: '#f3f4f6' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8f6fc' }}>
                        <FileType className="w-5 h-5" style={{ color: '#63bae9' }} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                          Seleccionar Plantilla
                        </h2>
                        <p className="text-xs" style={{ color: '#969696' }}>
                          Tipo de contrato a generar
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    {!isPrevStepComplete && (
                      <div className="mb-5 p-4 rounded-lg border-2 border-dashed flex items-center gap-3" style={{ borderColor: '#63bae9', backgroundColor: '#f0f9ff' }}>
                        <Lock className="w-5 h-5" style={{ color: '#63bae9' }} />
                        <p className="text-sm font-medium" style={{ color: '#63bae9' }}>
                          Completa los pasos anteriores para desbloquear esta sección
                        </p>
                      </div>
                    )}

                    <Combobox
                      options={templateOptions}
                      value={id_template}
                      onChange={setIdTemplate}
                      placeholder="Selecciona una plantilla"
                      label={
                        <span className="flex items-center gap-2">
                          <FileType className="w-4 h-4" style={{ color: '#63bae9' }} />
                          Plantilla de Contrato
                        </span>
                      }
                      searchPlaceholder="Buscar plantilla..."
                      disabled={!isPrevStepComplete}
                      error={formErrors.id_template}
                    />
                  </div>
                </div>

                {isPrevStepComplete && id_template && Object.keys(valores).length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                    <div className="p-6 border-b" style={{ borderColor: '#f3f4f6' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#fff9e6' }}>
                          <FileType className="w-5 h-5" style={{ color: '#fcc238' }} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                            Campos Variables
                          </h2>
                          <p className="text-xs" style={{ color: '#969696' }}>
                            Personaliza el contenido del contrato
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 grid md:grid-cols-2 gap-5">
                      {Object.keys(valores).map((campo) => (
                        <div key={campo}>
                          <label className="block text-sm font-semibold mb-2" style={{ color: '#686363' }}>
                            {campo}
                          </label>
                          <input
                            type="text"
                            value={valores[campo]}
                            onChange={(e) => setValores({ ...valores, [campo]: e.target.value })}
                            className="w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 focus:outline-none"
                            style={{
                              borderColor: formErrors.valores && !valores[campo] ? '#ef4444' : (valores[campo] ? '#63bae9' : '#e5e7eb'),
                              backgroundColor: formErrors.valores && !valores[campo] ? '#fef2f2' : (valores[campo] ? '#f0f9ff' : 'white'),
                              color: '#686363'
                            }}
                            placeholder={`Ingresa ${campo.toLowerCase()}`}
                          />
                          {formErrors.valores && !valores[campo] && (
                            <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>Este campo es obligatorio</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!tipoContrato && (
              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
                    <Lock className="w-5 h-5" style={{ color: '#63bae9' }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#686363' }}>
                      Continuar Formulario
                    </h2>
                    <p className="text-sm" style={{ color: '#969696' }}>
                      Selecciona el tipo de contrato para desbloquear las siguientes secciones.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="text-lg font-bold mb-4" style={{ color: '#686363' }}>
                  Resumen
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: nombre ? '#63bae9' : '#969696' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#686363' }}>Nombre</p>
                      <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                        {nombre || 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: tipoContrato ? '#63bae9' : '#969696' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#686363' }}>Tipo</p>
                      <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                        {tipoContrato ? (tipoContrato === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta') : 'Pendiente'}
                      </p>
                    </div>
                  </div>

                  {tipoContrato === 'ALQUILER_LOCACION' ? (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_locador ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Locador</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_locador ? clienteOptions.find(c => c.value === id_locador)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_locatario ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Locatario</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_locatario ? clienteOptions.find(c => c.value === id_locatario)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : tipoContrato === 'COMPRA_VENTA' ? (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_comprador ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Comprador</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_comprador ? clienteOptions.find(c => c.value === id_comprador)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_vendedor ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Vendedor</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_vendedor ? clienteOptions.find(c => c.value === id_vendedor)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : null}

                  {tipoContrato && (
                    <>
                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_inmueble ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Inmueble</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_inmueble ? inmuebleOptions.find(i => i.value === id_inmueble)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: (fecha_inicio && fecha_fin && !formErrors.fecha_inicio && !formErrors.fecha_fin) ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Vigencia</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {(fecha_inicio && fecha_fin) ? `${fecha_inicio} - ${fecha_fin}` : 'Pendiente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: monto && !formErrors.monto ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Monto</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {monto ? `$ ${parseFloat(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : 'Pendiente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                        <CheckCircle2 className="w-5 h-5 mt-0.5" style={{ color: id_template ? '#63bae9' : '#969696' }} />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: '#686363' }}>Plantilla</p>
                          <p className="text-xs mt-0.5" style={{ color: '#969696' }}>
                            {id_template ? templateOptions.find(t => t.value === id_template)?.label : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border p-6" style={{ borderColor: '#e5e7eb' }}>
                <div className="space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isPrevStepComplete || !id_template}
                    className="w-full px-6 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: '#fcc238',
                    }}
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Creando...' : 'Crear Contrato'}
                  </button>

                  <button
                    onClick={() => router.back()}
                    className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-200 border-2"
                    style={{
                      color: '#686363',
                      borderColor: '#e5e7eb',
                      backgroundColor: 'white'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
              {/* Modal de confirmación antes de crear */}
        {confirmModalOpen && (
          <Modal
            isOpen={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            onConfirm={confirmCreate}
            title="¿Crear el contrato?"
            message={`Vas a generar el contrato "${nombre}" (${tipoContrato === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta'}). Esta acción generará un archivo .docx en el almacenamiento.\n\n¿Confirmar creación?`}
            variant="warning"
            confirmText="Crear contrato"
            cancelText="Cancelar"
          />
        )}

        {/* Modal de notificación (éxito, error, etc.) */}
        {notification.isOpen && (
          <Modal
            isOpen={notification.isOpen}
            onClose={closeNotification}
            title={notification.title}
            message={notification.message}
            variant={notification.variant}
            autoClose={notification.autoClose}
          />
        )}
    </div>
  );
}