// Archivo: src/lib/zod.ts
// Descripción: Esquemas de validación para Inmovación (GBS y Asociados)

import { z, object, string, number } from "zod";

// Expresión regular para validar números de teléfono
const phoneRegex = /^\+?[\d\s\-\(\)\.]{7,20}$/;

export const passwordFieldSchema = string()
  .min(1, "La contraseña es requerida")
  .min(8, "Mínimo 8 caracteres")
  .max(32, "Máximo 32 caracteres");

export const loginSchema = object({
  email: string().min(1, "El correo electrónico es requerido").email("Introduce un correo válido"),
  password: passwordFieldSchema,
});

export const registerSchema = object({
  email: string().min(1, "El correo electrónico es requerido").email("Introduce un correo válido"),
  password: passwordFieldSchema,
  confirmPassword: string().min(1, "Confirma tu contraseña").min(8).max(32),
  name: string().min(1, "El nombre es requerido").max(32),
  phone: string().min(1).max(20).regex(phoneRegex, "Formato de teléfono inválido"),
  role: z.enum(["user", "admin"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const changePasswordSchema = object({
  currentPassword: string().min(1, "La contraseña actual es requerida"),
  newPassword: passwordFieldSchema,
  confirmPassword: string().min(1, "Confirma tu contraseña").min(8).max(32),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: string().min(1, "El correo es requerido").email("Introduce un correo válido"),
});

export const resetPasswordSchema = z.object({
  password: string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const editUserSchema = z.object({
  name: string().min(1).max(32),
  email: string().min(1).email().toLowerCase(),
  phone: string().min(1).max(20).regex(phoneRegex),
  role: z.enum(["user", "admin"]),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;

// =================== ESCHEMA INMUEBLES ===================

export const inmuebleSchema = object({
  titulo: string().min(3, "El título debe tener al menos 3 caracteres"),
  id_tipo_inmueble: number().min(1, "Selecciona un tipo de inmueble"),
  id_estado: number().min(1, "Selecciona un estado"),
  id_cliente: number().min(1, "Selecciona un cliente"),
  id_barrio: number().min(1, "Selecciona un barrio"),
  direccion: string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: string().min(3, "La ciudad debe tener al menos 3 caracteres"),
  provincia: string().min(3, "La provincia debe tener al menos 3 caracteres"),
  superficie_total: number().min(1, "La superficie total debe ser mayor a 0"),
  superficie_cubierta: number().min(0, "La superficie cubierta no puede ser negativa").optional(),
  cantidad_ambientes: number().min(0).optional(),
  cantidad_banios: number().min(0).optional(),
  cantidad_cocheras: number().min(0).optional(),
  cantidad_pisos: number().min(0).optional(),
  antiguedad: number().min(0).optional(),
  precio: number().min(0).optional(),
  detalles: string().optional(),
  id_operacion: number().optional(),
});

export type InmuebleFormValues = z.infer<typeof inmuebleSchema>;
// =============================================================
// PROVEEDORES — ESQUEMA FINAL COMPATIBLE CON REACT HOOK FORM
// =============================================================

export const proveedorSchema = z.object({
  nombre_razon_social: z
    .string()
    .trim()
    .min(3, "Debe tener mínimo 3 caracteres")
    .max(150),

  cuit_cuil: z
    .string()
    .transform(v => v.replace(/[^0-9]/g, ""))   // Limpia guiones
    .refine(v => /^[0-9]{11}$/.test(v), {
      message: "El CUIT/CUIL debe tener exactamente 11 dígitos",
    }),

  // ❗ IMPORTANTE: YA NO DEVUELVE null  
  // SOLO "" o string
  correo_contacto: z.string().optional().or(z.literal("")),

  telefono_contacto: z.string().optional().or(z.literal("")),

  direccion: z.string().optional().or(z.literal("")),

  // RHF usa string, Prisma usa number → se convierte en la API
  tipoServicioId: z
    .string()
    .min(1, "Seleccione un tipo de servicio"),

  datos_bancarios: z.string().optional().or(z.literal("")),

  observaciones: z.string().optional().or(z.literal("")),
});

export type ProveedorFormValues = z.infer<typeof proveedorSchema>;
