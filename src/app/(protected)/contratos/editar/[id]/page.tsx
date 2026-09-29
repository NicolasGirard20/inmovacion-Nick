/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/contratos/editar/[id]/page.tsx
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileText, Save, AlertCircle, Calendar, DollarSign, Building2, User, FileType, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Combobox from '@/components/ui/combobox';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  numero_documento?: string;
  descripcion?: string;
  activo?: boolean;
  tipoDocumento?: { nombre: string };
  tiposCliente?: { tipoCliente: { nombre: string } }[];
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
  id_contrato: number;
  nombre: string;
  tipo_contrato: 'ALQUILER_LOCACION' | 'COMPRA_VENTA';
  id_cliente_1: number;
  id_cliente_2: number;
  id_inmueble: number;
  id_template: number;
  valores: { [key: string]: string };
  fecha_inicio: string;
  fecha_fin: string;
  monto: number;
  cliente_1: Cliente;
  cliente_2: Cliente;
  inmueble: Inmueble;
  template: Template;
  firmado: boolean;
  activo: boolean;
  archivoPath: string;
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

export default function EditContract() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipoContrato, setTipoContrato] = useState<'ALQUILER_LOCACION' | 'COMPRA_VENTA' | ''>('');
  const [id_locador, setIdLocador] = useState<number | undefined>(undefined);
  const [id_locatario, setIdLocatario] = useState<number | undefined>(undefined);
  const [id_comprador, setIdComprador] = useState<number | undefined>(undefined);
  const [id_vendedor, setIdVendedor] = useState<number | undefined>(undefined);
  const [id_inmueble, setIdInmueble] = useState<number | undefined>(undefined);
  const [id_template, setIdTemplate] = useState<number | undefined>(undefined);
  const [valores, setValores] = useState<{ [key: string]: string }>({});
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
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
  const [hasUserEditedMonto, setHasUserEditedMonto] = useState(false);
  const router = useRouter();
  
  const params = useParams();
  const id = params.id;

    // Estado para modal de confirmación antes de guardar cambios
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // Estado para notificaciones (éxito, error, warning, etc.)
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

  // Helper para mostrar notificaciones
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
  const [contractData, setContractData] = useState<any | null>(null);

  // Stabilize selected objects using useMemo
  const stableSelectedLocador = useMemo(() => selectedLocador, [selectedLocador]);
  const stableSelectedLocatario = useMemo(() => selectedLocatario, [selectedLocatario]);
  const stableSelectedComprador = useMemo(() => selectedComprador, [selectedComprador]);
  const stableSelectedVendedor = useMemo(() => selectedVendedor, [selectedVendedor]);
  const stableSelectedInmueble = useMemo(() => selectedInmueble, [selectedInmueble]);

  // Memoizar opciones
  const clienteOptions = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: cliente.id_cliente,
        label: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
      })),
    [clientes]
  );

  const inmuebleOptions = useMemo(
    () =>
      inmuebles.map((inmueble) => ({
        value: inmueble.id_inmueble,
        label: inmueble.titulo,
      })),
    [inmuebles]
  );

  const templateOptions = useMemo(
    () =>
      templates
        .filter((t) => !tipoContrato || t.tipo === tipoContrato)
        .map((template) => ({
          value: template.id,
          label: template.nombre,
        })),
    [templates, tipoContrato]
  );

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [contratoRes, clientesRes, inmueblesRes, templatesRes] = await Promise.all([
          fetch(`/api/contracts/${id}`),
          fetch('/api/clientes'),
          fetch('/api/inmuebles'),
          fetch('/api/templates?pageSize=1000'),
        ]);

        if (!contratoRes.ok || !clientesRes.ok || !inmueblesRes.ok || !templatesRes.ok) {
          throw new Error('Error al cargar datos');
        }

        const contratoData = await contratoRes.json();
        setContrato(contratoData);
        setClientes(await clientesRes.json());
        const inmueblesRaw = await inmueblesRes.json();
const inmueblesList = Array.isArray(inmueblesRaw) 
  ? inmueblesRaw 
  : inmueblesRaw?.data ?? [];           // ← ¡Extraemos el array real!

setInmuebles(inmueblesList);
        const templatesData = await templatesRes.json();
        setTemplates(templatesData.templates || []);

        // Precargar datos del contrato
        setNombre(contratoData.nombre);
        setTipoContrato(contratoData.tipo_contrato);
        setIdInmueble(contratoData.id_inmueble);
        setIdTemplate(contratoData.id_template);
        setValores(contratoData.valores || {});
        setFechaInicio(new Date(contratoData.fecha_inicio).toISOString().split('T')[0]);
        setFechaFin(new Date(contratoData.fecha_fin).toISOString().split('T')[0]);
        setMonto(contratoData.monto.toString());

        if (contratoData.tipo_contrato === 'ALQUILER_LOCACION') {
          setIdLocador(contratoData.id_cliente_1);
          setIdLocatario(contratoData.id_cliente_2);
        } else {
          setIdComprador(contratoData.id_cliente_1);
          setIdVendedor(contratoData.id_cliente_2);
        }

        setSelectedLocador(contratoData.cliente_1);
        setSelectedLocatario(contratoData.cliente_2);
        setSelectedComprador(contratoData.cliente_1);
        setSelectedVendedor(contratoData.cliente_2);
        setSelectedInmueble(contratoData.inmueble);
      } catch (err) {
        setError('Error al cargar datos del contrato');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Memoizar fetchCliente
  const fetchCliente = useCallback(
    async (id: number | undefined, setCliente: (cliente: Cliente | null) => void) => {
      if (!id) {
        setCliente(null);
        return;
      }
      try {
        const res = await fetch(`/api/clientes/${id}`);
        if (!res.ok) throw new Error('Error al cargar cliente');
        const data = await res.json();
        setCliente(data);
      } catch (err) {
        setError('Error al cargar cliente');
        setCliente(null);
      }
    },
    []
  );

  // Actualizar clientes seleccionados
  useEffect(() => {
    fetchCliente(id_locador, setSelectedLocador);
    fetchCliente(id_locatario, setSelectedLocatario);
    fetchCliente(id_comprador, setSelectedComprador);
    fetchCliente(id_vendedor, setSelectedVendedor);
  }, [id_locador, id_locatario, id_comprador, id_vendedor, fetchCliente]);

  // Actualizar inmueble seleccionado
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

  // Autocompletado de campos variables
  const autoCompleteField = useCallback(
    (campo: string): string | null => {
      const lowerCampo = campo.toLowerCase();

      if (lowerCampo.includes('locador_nombre') && stableSelectedLocador?.nombre) return stableSelectedLocador.nombre;
      if (lowerCampo.includes('locador_apellido') && stableSelectedLocador?.apellido) return stableSelectedLocador.apellido || '';
      if (lowerCampo.includes('locador_email') && stableSelectedLocador?.email) return stableSelectedLocador.email || '';
      if (lowerCampo.includes('locador_telefono') && stableSelectedLocador?.telefono) return stableSelectedLocador.telefono || '';
if (lowerCampo.includes('locador_tipo_documento') && stableSelectedLocador?.tipoDocumento?.nombre) return stableSelectedLocador.tipoDocumento.nombre;
if (lowerCampo.includes('locador_numero_documento') && stableSelectedLocador?.numero_documento) return stableSelectedLocador.numero_documento;
      if (lowerCampo.includes('locador_descripcion') && stableSelectedLocador?.descripcion) return stableSelectedLocador.descripcion || '';
      if (lowerCampo.includes('locador_activo') && stableSelectedLocador?.activo !== undefined) return stableSelectedLocador.activo.toString();
if (lowerCampo.includes('locador_tipo') && stableSelectedLocador?.tiposCliente?.[0]?.tipoCliente?.nombre) return stableSelectedLocador.tiposCliente[0].tipoCliente.nombre;

      if (lowerCampo.includes('locatario_nombre') && stableSelectedLocatario?.nombre) return stableSelectedLocatario.nombre;
      if (lowerCampo.includes('locatario_apellido') && stableSelectedLocatario?.apellido) return stableSelectedLocatario.apellido || '';
      if (lowerCampo.includes('locatario_email') && stableSelectedLocatario?.email) return stableSelectedLocatario.email || '';
      if (lowerCampo.includes('locatario_telefono') && stableSelectedLocatario?.telefono) return stableSelectedLocatario.telefono || '';
if (lowerCampo.includes('locatario_tipo_documento') && stableSelectedLocatario?.tipoDocumento?.nombre) return stableSelectedLocatario.tipoDocumento.nombre;
if (lowerCampo.includes('locatario_numero_documento') && stableSelectedLocatario?.numero_documento) return stableSelectedLocatario.numero_documento;
      if (lowerCampo.includes('locatario_descripcion') && stableSelectedLocatario?.descripcion) return stableSelectedLocatario.descripcion || '';
      if (lowerCampo.includes('locatario_activo') && stableSelectedLocatario?.activo !== undefined) return stableSelectedLocatario.activo.toString();
      if (lowerCampo.includes('locatario_tipo') && stableSelectedLocatario?.tiposCliente?.[0]?.tipoCliente?.nombre) return stableSelectedLocatario.tiposCliente[0].tipoCliente.nombre;

      if (lowerCampo.includes('comprador_nombre') && stableSelectedComprador?.nombre) return stableSelectedComprador.nombre;
      if (lowerCampo.includes('comprador_apellido') && stableSelectedComprador?.apellido) return stableSelectedComprador.apellido || '';
      if (lowerCampo.includes('comprador_email') && stableSelectedComprador?.email) return stableSelectedComprador.email || '';
      if (lowerCampo.includes('comprador_telefono') && stableSelectedComprador?.telefono) return stableSelectedComprador.telefono || '';
      if (lowerCampo.includes('comprador_tipo_documento') && stableSelectedComprador?.tipoDocumento?.nombre) return stableSelectedComprador.tipoDocumento.nombre;
if (lowerCampo.includes('comprador_numero_documento') && stableSelectedComprador?.numero_documento) return stableSelectedComprador.numero_documento;
      if (lowerCampo.includes('comprador_descripcion') && stableSelectedComprador?.descripcion) return stableSelectedComprador.descripcion || '';
      if (lowerCampo.includes('comprador_activo') && stableSelectedComprador?.activo !== undefined) return stableSelectedComprador.activo.toString();
if (lowerCampo.includes('comprador_tipo') && stableSelectedComprador?.tiposCliente?.[0]?.tipoCliente?.nombre) return stableSelectedComprador.tiposCliente[0].tipoCliente.nombre;

      if (lowerCampo.includes('vendedor_nombre') && stableSelectedVendedor?.nombre) return stableSelectedVendedor.nombre;
      if (lowerCampo.includes('vendedor_apellido') && stableSelectedVendedor?.apellido) return stableSelectedVendedor.apellido || '';
      if (lowerCampo.includes('vendedor_email') && stableSelectedVendedor?.email) return stableSelectedVendedor.email || '';
      if (lowerCampo.includes('vendedor_telefono') && stableSelectedVendedor?.telefono) return stableSelectedVendedor.telefono || '';
 if (lowerCampo.includes('vendedor_tipo_documento') && stableSelectedVendedor?.tipoDocumento?.nombre) return stableSelectedVendedor.tipoDocumento.nombre;
if (lowerCampo.includes('vendedor_numero_documento') && stableSelectedVendedor?.numero_documento) return stableSelectedVendedor.numero_documento;
      if (lowerCampo.includes('vendedor_descripcion') && stableSelectedVendedor?.descripcion) return stableSelectedVendedor.descripcion || '';
      if (lowerCampo.includes('vendedor_activo') && stableSelectedVendedor?.activo !== undefined) return stableSelectedVendedor.activo.toString();
if (lowerCampo.includes('vendedor_tipo') && stableSelectedVendedor?.tiposCliente?.[0]?.tipoCliente?.nombre) return stableSelectedVendedor.tiposCliente[0].tipoCliente.nombre;

      if (lowerCampo.includes('inmueble_titulo') && stableSelectedInmueble?.titulo) return stableSelectedInmueble.titulo;
      if (lowerCampo.includes('inmueble_superficie_total') && stableSelectedInmueble?.superficie_total) return stableSelectedInmueble.superficie_total.toString();
      if (lowerCampo.includes('inmueble_superficie_cubierta') && stableSelectedInmueble?.superficie_cubierta) return stableSelectedInmueble.superficie_cubierta.toString();
      if (lowerCampo.includes('inmueble_cantidad_ambientes') && stableSelectedInmueble?.cantidad_ambientes) return stableSelectedInmueble.cantidad_ambientes.toString();
      if (lowerCampo.includes('inmueble_cantidad_banos') && stableSelectedInmueble?.cantidad_banos) return stableSelectedInmueble.cantidad_banos.toString();
      if (lowerCampo.includes('inmueble_cantidad_dormitorios') && stableSelectedInmueble?.cantidad_dormitorios) return stableSelectedInmueble.cantidad_dormitorios.toString();
      if (lowerCampo.includes('inmueble_cantidad_cocheras') && stableSelectedInmueble?.cantidad_cocheras) return stableSelectedInmueble.cantidad_cocheras.toString();
      if (lowerCampo.includes('inmueble_cantidad_pisos') && stableSelectedInmueble?.cantidad_pisos) return stableSelectedInmueble.cantidad_pisos.toString();
      if (lowerCampo.includes('inmueble_antiguedad') && stableSelectedInmueble?.antiguedad) return stableSelectedInmueble.antiguedad.toString();
      if (lowerCampo.includes('inmueble_precio') && stableSelectedInmueble?.precio) return stableSelectedInmueble.precio.toString();
      if (lowerCampo.includes('inmueble_detalles') && stableSelectedInmueble?.detalles) return stableSelectedInmueble.detalles || '';
      if (lowerCampo.includes('inmueble_archivado') && stableSelectedInmueble?.archivado !== undefined) return stableSelectedInmueble.archivado.toString();
      if (lowerCampo.includes('inmueble_direccion') && stableSelectedInmueble?.ubicacion?.direccion) return stableSelectedInmueble.ubicacion.direccion;
      if (lowerCampo.includes('inmueble_ciudad') && stableSelectedInmueble?.ubicacion?.ciudad) return stableSelectedInmueble.ubicacion.ciudad || '';
      if (lowerCampo.includes('inmueble_provincia') && stableSelectedInmueble?.ubicacion?.provincia) return stableSelectedInmueble.ubicacion.provincia || '';
      if (lowerCampo.includes('inmueble_barrio') && stableSelectedInmueble?.ubicacion?.barrio?.nombre) return stableSelectedInmueble.ubicacion.barrio.nombre || '';
      if (lowerCampo.includes('inmueble_localidad') && stableSelectedInmueble?.ubicacion?.barrio?.localidad?.nombre) return stableSelectedInmueble.ubicacion.barrio.localidad.nombre || '';
      if (lowerCampo.includes('inmueble_tipo') && stableSelectedInmueble?.tipo_inmueble?.nombre) return stableSelectedInmueble.tipo_inmueble.nombre || '';
      if (lowerCampo.includes('inmueble_estado') && stableSelectedInmueble?.estado?.nombre) return stableSelectedInmueble.estado.nombre || '';
      if (lowerCampo.includes('inmueble_operacion') && stableSelectedInmueble?.operacion?.nombre) return stableSelectedInmueble.operacion.nombre || '';
      if (lowerCampo.includes('inmueble_propietario') && stableSelectedInmueble?.cliente?.nombre && stableSelectedInmueble?.cliente?.apellido) {
        return `${stableSelectedInmueble.cliente.nombre} ${stableSelectedInmueble.cliente.apellido || ''}`.trim();
      }

      if (lowerCampo.includes('contrato_nombre') && nombre) return nombre;
      if (lowerCampo.includes('contrato_tipo') && tipoContrato) return tipoContrato === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta';
      if (lowerCampo.includes('contrato_fecha_inicio') && fecha_inicio) return fecha_inicio;
      if (lowerCampo.includes('contrato_fecha_fin') && fecha_fin) return fecha_fin;
      if (lowerCampo.includes('contrato_monto') && monto) return monto;

      return null;
    },
    [stableSelectedLocador, stableSelectedLocatario, stableSelectedComprador, stableSelectedVendedor, stableSelectedInmueble, nombre, tipoContrato, fecha_inicio, fecha_fin, monto]
  );

  // Actualizar valores cuando cambie la plantilla o datos relevantes
  useEffect(() => {
    if (!id_template) {
      if (Object.keys(valores).length > 0 || editedFields.size > 0) {
        setValores({});
        setEditedFields(new Set());
      }
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === id_template);
    if (!selectedTemplate?.camposVariables) {
      if (JSON.stringify(valores) !== JSON.stringify(contrato?.valores || {})) {
        setValores(contrato?.valores || {});
      }
      if (editedFields.size > 0) {
        setEditedFields(new Set());
      }
      return;
    }

    const newValores = selectedTemplate.camposVariables.reduce((acc, campo) => {
      const autoValue = autoCompleteField(campo);
      return {
        ...acc,
        [campo]: editedFields.has(campo) && valores[campo] !== undefined ? valores[campo] : autoValue || contrato?.valores[campo] || '',
      };
    }, {} as { [key: string]: string });

    // Only update if newValores is different from current valores
    if (JSON.stringify(newValores) !== JSON.stringify(valores)) {
      setValores(newValores);
    }
  }, [
    id_template,
    templates,
    autoCompleteField,
    editedFields,
    stableSelectedLocador,
    stableSelectedLocatario,
    stableSelectedComprador,
    stableSelectedVendedor,
    stableSelectedInmueble,
    nombre,
    tipoContrato,
    fecha_inicio,
    fecha_fin,
    monto,
    contrato, // Note: contrato is included, but not contrato?.valores
  ]);

    // Validar dinámicamente fechas y monto
  useEffect(() => {
    const data = {
      fecha_inicio,
      fecha_fin,
      monto,
      tipo_contrato: tipoContrato as 'ALQUILER_LOCACION' | 'COMPRA_VENTA' | '',
      id_locador,
      id_locatario,
      id_comprador,
      id_vendedor,
      id_inmueble,
      id_template,
      nombre,
    };

    const result = contractSchema.safeParse(data);
    setFormErrors((prev) => {
      // Mantener errores que no sean de fechas/monto
      const { fecha_inicio, fecha_fin, monto, ...rest } = prev;
      const newErrors: { [key: string]: string } = {};

      if (!result.success) {
        result.error.issues.forEach((issue) => {
          const path = issue.path[0];
          if (typeof path === 'string' && ['fecha_inicio', 'fecha_fin', 'monto'].includes(path)) {
            newErrors[path] = issue.message;
          }
        });
      }

      return { ...rest, ...newErrors };
    });
  }, [fecha_inicio, fecha_fin, monto, tipoContrato, id_locador, id_locatario, id_comprador, id_vendedor, id_inmueble, id_template, nombre]);

  
   // Manejar envío del formulario
    const handleSubmit = async () => {
    const data = {
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
      monto, // la API espera number
    };

    // 1. Validación con Zod
    const result = contractSchema.safeParse(data);
    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0]?.toString();
        if (path) errors[path] = issue.message;
      });
      setFormErrors(prev => ({ ...prev, ...errors }));

      const firstError = result.error.issues[0]?.message || 'Revisá los campos obligatorios';
      showNotification('error', 'Formulario incompleto o inválido', firstError);
      return;
    }

    // 2. Validación extra de monto máximo
    const montoNum = parseFloat(monto);
    if (montoNum > 999999999.99) {
      setFormErrors(prev => ({ ...prev, monto: 'El monto es demasiado grande' }));
      showNotification('error', 'Monto inválido', 'El monto excede el máximo permitido (999.999.999,99)');
      return;
    }

    // 3. Validación de campos variables vacíos
    if (Object.values(valores).some(v => !v.trim())) {
      showNotification('warning', 'Campos incompletos', 'Completá todos los campos variables antes de guardar');
      return;
    }

    // Todo OK → guardamos datos y mostramos confirmación
    setContractData(data);
    setConfirmModalOpen(true);
  };

  // Esta función se ejecuta SOLO cuando el usuario confirma
  const confirmUpdate = async () => {
    setConfirmModalOpen(false);

    if (!contractData) return;

    try {
      setLoading(true);
      setFormErrors({});
      setError(null);

      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        let userMessage = errorData.error || 'No se pudo actualizar el contrato';

        if (userMessage.includes('no encontrado')) {
          userMessage = 'El contrato no existe o fue eliminado.';
        } else if (userMessage.includes('plantilla')) {
          userMessage = 'Hubo un problema con la plantilla seleccionada.';
        }

        throw new Error(userMessage);
      }

      const responseData = await res.json();

      showNotification(
        'success',
        '¡Contrato actualizado!',
        `Los cambios en "${nombre}" se guardaron correctamente.\nPuedes descargar la versión actualizada ahora.`,
        5000
      );

      // Redirigir después de mostrar éxito
      setTimeout(() => {
        if (responseData.downloadUrl) {
          window.location.href = responseData.downloadUrl;
        }
        router.push('/contratos');
      }, 2500);

    } catch (err: any) {
      showNotification(
        'error',
        'Error al actualizar',
        err.message || 'Ocurrió un problema inesperado. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
      setContractData(null); // limpiamos
    }
  };

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

if (loading && !contrato) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-[#63bae9] rounded-full animate-spin"></div>
        <p className="text-lg font-semibold text-[#686363]">Cargando contrato...</p>
      </div>
    </div>
  );
}

  // CONTRATO FIRMADO O INACTIVO → pantalla bloqueada

// CONTRATO FIRMADO O INACTIVO → pantalla bloqueada
if (contrato && (contrato.firmado || !contrato.activo)) {
  const esFirmado = contrato.firmado;
  const motivo = esFirmado
    ? 'Este contrato ya fue firmado y no puede modificarse.' 
    : 'Este contrato está inactivo y no puede ser editado.';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div 
            className="h-2"
            style={{ 
              background: esFirmado 
                ? 'linear-gradient(90deg, #63bae9 0%, #fcc238 100%)' 
                : 'linear-gradient(90deg, #969696 0%, #686363 100%)'
            }}
          />

          <div className="px-8 py-16 sm:px-12 sm:py-20 text-center">
            <div 
              className="inline-flex p-6 rounded-2xl mb-8 shadow-lg"
              style={{ 
                backgroundColor: esFirmado ? '#e0f2fe' : '#f5f5f5',
                border: `2px solid ${esFirmado ? '#63bae9' : '#969696'}`
              }}
            >
              <Lock 
                className="w-16 h-16" 
                style={{ color: esFirmado ? '#63bae9' : '#686363' }} 
                strokeWidth={2.5}
              />
            </div>

            <h1 
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ color: '#686363' }}
            >
              Edición Bloqueada
            </h1>

            <div className="max-w-2xl mx-auto space-y-8">
              <p 
                className="text-lg sm:text-xl leading-relaxed"
                style={{ color: '#969696' }}
              >
                {motivo}
              </p>

              {esFirmado && contrato.archivoPath && (
                <div className="pt-4">
                  <a
                    href={contrato.archivoPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    style={{ backgroundColor: '#63bae9' }}
                  >
                    <FileText className="w-5 h-5" />
                    Descargar Contrato Firmado
                  </a>
                </div>
              )}

              <div className="pt-8 border-t" style={{ borderColor: '#e5e5e5' }}>
                <button
                  onClick={() => router.push('/contratos')}
                  className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  style={{ 
                    backgroundColor: '#fcc238',
                    color: '#686363'
                  }}
                >
                  Volver al Listado
                </button>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="mt-8 text-center text-sm"
          style={{ color: '#969696' }}
        >
          {esFirmado && (
            <p className="flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: '#63bae9' }} />
              Contrato procesado y archivado correctamente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

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
                Editar Contrato
              </h1>
              <p className="text-base" style={{ color: '#969696' }}>
                Modifica la información del contrato existente
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
                            onChange={(e) => {
                              setValores({ ...valores, [campo]: e.target.value });
                              setEditedFields((prev) => new Set(prev).add(campo));
                            }}
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
                    {loading ? 'Actualizando...' : 'Actualizar Contrato'}
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
              {/* Modal de confirmación antes de guardar cambios */}
        {confirmModalOpen && (
          <Modal
            isOpen={confirmModalOpen}
            onClose={() => setConfirmModalOpen(false)}
            onConfirm={confirmUpdate}
            title="¿Guardar cambios?"
            message={`Vas a actualizar el contrato "${nombre}" (${tipoContrato === 'ALQUILER_LOCACION' ? 'Alquiler/Locación' : 'Compra/Venta'}). Se generará una nueva versión del archivo.\n\n¿Confirmar?`}
            variant="warning"
            confirmText="Guardar cambios"
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