"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { isValidPhoneNumber } from "react-phone-number-input";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  User,
  Mail,
  Phone,
  FileText,
  CreditCard,
  AlignLeft,
} from "lucide-react";

type ClienteFormProps = {
  modo: "crear" | "editar";
  tipoClientes: { id_tipo_cliente: number; nombre: string }[];
  tipoDocumentos: { id_tipo_documento: number; nombre: string }[];
  initialData?: any;
  onSubmit: (data: any) => void;
};

const schema = z
  .object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    apellido: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono: z
      .string()
      .optional()
      .refine((value) => !value || isValidPhoneNumber(value), {
        message: "Número de teléfono inválido",
      }),
    tipoDocumentoId: z.string().optional(),
    numeroDocumento: z.string().optional(),
    tipoClienteIds: z.array(z.string()).optional(),
    descripcion: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const tipo = data.tipoDocumentoId;
    const numero = data.numeroDocumento?.trim() || "";

    if (!tipo) return;

    if (!numero) {
      ctx.addIssue({
        path: ["numeroDocumento"],
        code: z.ZodIssueCode.custom,
        message: "El número de documento es obligatorio",
      });
      return;
    }

    // ============================
    // DNI (ID 2)
    // ============================
    if (tipo === "2") {
      if (!/^\d+$/.test(numero)) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El DNI debe contener solo números",
        });
      }

      if (numero.length < 7 || numero.length > 8) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El DNI debe tener entre 7 y 8 dígitos",
        });
      }
    }

    // ============================
    // CUIT / CUIL (ID 3)
    // ============================
    if (tipo === "3") {
      if (!/^\d+$/.test(numero)) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El CUIT/CUIL debe contener solo números",
        });
      }

      if (numero.length !== 11) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El CUIT/CUIL debe tener exactamente 11 dígitos",
        });
      }

      // Validación real del CUIT/CUIL (algoritmo AFIP)
      if (numero.length === 11) {
        const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        const nums = numero.split("").map(Number);

        const suma = mult.reduce((acc, m, i) => acc + m * nums[i], 0);
        const resto = suma % 11;
        const verificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

        if (verificador !== nums[10]) {
          ctx.addIssue({
            path: ["numeroDocumento"],
            code: z.ZodIssueCode.custom,
            message: "CUIT/CUIL inválido",
          });
        }
      }
    }

    // ============================
    // PASAPORTE (ID 5)
    // ============================
    if (tipo === "5") {
      if (!/^[a-zA-Z0-9]+$/.test(numero)) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El pasaporte debe ser alfanumérico",
        });
      }

      if (numero.length < 6 || numero.length > 15) {
        ctx.addIssue({
          path: ["numeroDocumento"],
          code: z.ZodIssueCode.custom,
          message: "El pasaporte debe tener entre 6 y 15 caracteres",
        });
      }
    }
  });


type FormData = z.infer<typeof schema>;

export default function ClienteForm({
  modo,
  tipoClientes,
  tipoDocumentos,
  initialData,
  onSubmit,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...initialData,
      tipoClienteIds:
        initialData?.tipoClienteIds?.length
          ? initialData.tipoClienteIds.map(String)
          : initialData?.tiposCliente?.map((tc: any) =>
              String(tc.tipoClienteId ?? tc.tipoCliente?.id_tipo_cliente)
            ) || [],
    },
  });

  const telefono = watch("telefono");

  const submitHandler = (data: FormData) => {
    onSubmit({
      nombre: data.nombre.trim(),
      apellido: data.apellido?.trim() || null,
      email: data.email?.trim() || null,
      telefono: data.telefono || null,
      tipoDocumentoId: data.tipoDocumentoId
        ? Number(data.tipoDocumentoId)
        : null,
      numeroDocumento: data.numeroDocumento?.trim() || null,
      tipoClienteIds: data.tipoClienteIds?.map(Number) || [],
      descripcion: data.descripcion?.trim() || null,
    });
  };

  return (
    <div className="max-w-3xl mx-auto shadow-xl bg-white rounded-xl">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#63bae9]/5 via-[#fcc238]/5 to-transparent rounded-t-lg border-b p-6">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-[#63bae9]" />
          <h2 className="text-xl font-semibold text-[#686363]">
            {modo === "crear" ? "Nuevo Cliente" : "Editar Cliente"}
          </h2>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NOMBRE */}
            <div>
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-2">
                <User className="h-4 w-4 text-[#63bae9]" />
                Nombre *
              </label>
              <Input {...register("nombre")} />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nombre.message}
                </p>
              )}
            </div>

            {/* APELLIDO */}
            <div>
              <label className="text-[#686363] font-medium mb-2 block">
                Apellido
              </label>
              <Input {...register("apellido")} />
            </div>

            {/* EMAIL */}
            <div>
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-2">
                <Mail className="h-4 w-4 text-[#63bae9]" />
                Email
              </label>
              <Input type="email" {...register("email")} />
            </div>

            {/* TELÉFONO */}
            <div>
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-2">
                <Phone className="h-4 w-4 text-[#63bae9]" />
                Teléfono
              </label>
              <PhoneInput
                international
                defaultCountry="AR"
                value={telefono}
                onChange={(value) =>
                  setValue("telefono", value || "")
                }
              />
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.telefono.message}
                </p>
              )}
            </div>

            {/* TIPO DOCUMENTO */}
            <div>
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-2">
                <FileText className="h-4 w-4 text-[#63bae9]" />
                Tipo de documento
              </label>
              <select
                {...register("tipoDocumentoId")}
                className="w-full h-12 border rounded-xl px-3"
              >
                <option value="">Seleccionar</option>
                {tipoDocumentos.map((td) => (
                  <option
                    key={td.id_tipo_documento}
                    value={td.id_tipo_documento}
                  >
                    {td.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* NUMERO DOCUMENTO */}
            <div>
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-2">
                <CreditCard className="h-4 w-4 text-[#63bae9]" />
                Número de documento
              </label>
              <Input {...register("numeroDocumento")} />
              {errors.numeroDocumento && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.numeroDocumento.message}
                </p>
              )}
            </div>

            {/* MULTI TIPO CLIENTE */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-[#686363] font-medium mb-3">
                <AlignLeft className="h-4 w-4 text-[#63bae9]" />
                Tipo(s) de cliente
              </label>

              <Controller
                control={control}
                name="tipoClienteIds"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-3">
                    {tipoClientes.map((tc) => {
                      const isSelected =
                        field.value?.includes(
                          String(tc.id_tipo_cliente)
                        );

                      return (
                        <label
                          key={tc.id_tipo_cliente}
                          className={`px-4 py-2 rounded-xl border cursor-pointer transition ${isSelected
                              ? "bg-[#63bae9] text-white border-[#63bae9]"
                              : "bg-white text-[#686363] border-gray-300 hover:border-[#63bae9]"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                field.onChange([
                                  ...(field.value || []),
                                  String(tc.id_tipo_cliente),
                                ]);
                              } else {
                                field.onChange(
                                  field.value?.filter(
                                    (id: string) =>
                                      id !==
                                      String(tc.id_tipo_cliente)
                                  )
                                );
                              }
                            }}
                            className="hidden"
                          />
                          {tc.nombre}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            {/* DESCRIPCIÓN */}
            <div className="md:col-span-2">
              <label className="text-[#686363] font-medium mb-2 block">
                Descripción
              </label>
              <Textarea {...register("descripcion")} />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t">
            <Button type="submit">
              {modo === "crear"
                ? "Crear Cliente"
                : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
