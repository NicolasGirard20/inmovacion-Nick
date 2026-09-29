/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/propiedades/nuevo/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { FileSignature,ArrowLeft } from "lucide-react";

import FormularioInmueble from "@/components/FormularioInmueble";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Modal from "@/components/ui/Modal";


export default function NuevoInmueblePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  type ModalVariant = "success" | "error" | "warning" | "info";

interface ModalConfig {
  title: string;
  message: string;
  variant: ModalVariant;
  onConfirm?: () => void;
  onCancel?: () => void;
}
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

  const crearInmuebleMutation = useMutation({
  mutationFn: async (payload: any) => {
    const res = await fetch("/api/inmuebles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errorMessage = "Error al crear el inmueble";
      try {
        const errData = await res.json();
        errorMessage = errData.error || errorMessage;
      } catch {}
      throw new Error(errorMessage);
    }

    return res.json(); // ← este es el inmueble creado
  },

  // 🔥 ESTO ES LO IMPORTANTE
  onSuccess: (nuevoInmueble) => {

    // agregar al cache instantáneamente
    queryClient.setQueriesData(
      { queryKey: ["inmuebles"], exact: false },
      (oldData: any) => {

        if (!oldData) return oldData;

        // formato paginado
        if (oldData.data) {
          return {
            ...oldData,
            data: [nuevoInmueble, ...oldData.data],
            total: (oldData.total || 0) + 1,
          };
        }

        // formato array simple
        if (Array.isArray(oldData)) {
          return [nuevoInmueble, ...oldData];
        }

        return oldData;
      }
    );

    // sincronizar en background (sin await)
    queryClient.invalidateQueries({ queryKey: ["inmuebles"] });
  },
});


  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <header className="bg-white shadow-sm border-b">
  <div className="max-w-5xl mx-auto px-8 py-8 flex items-center gap-6">

    {/* 🔹 BOTÓN VOLVER */}
    <Button
      asChild
      variant="outline"
      size="sm"
      className="border-[#63bae9] text-[#63bae9]"
    >
      <Link href="/propiedades">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver
      </Link>
    </Button>

    {/* 🔹 ICONO */}
    <div className="p-3 rounded-xl bg-[#e8f6fc]">
      <FileSignature className="w-7 h-7 text-[#63bae9]" />
    </div>

    {/* 🔹 TITULO */}
    <div>
      <h1 className="text-3xl font-bold text-gray-700">
        Nuevo Inmueble
      </h1>
      <p className="text-sm mt-1 text-gray-500">
        Agrega los detalles del nuevo inmueble
      </p>
    </div>
  </div>
</header>


      <main className="max-w-5xl mx-auto px-8 py-10">
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <FormularioInmueble
 submitHandler={async (formData, imagenes) => {
  // 1. Subir imágenes nuevas y preparar solo URLs reales
  const uploadedImages = [];

  for (const img of imagenes) {
    if (img.url && !img.url.startsWith("blob:")) {
      uploadedImages.push({
        url: img.url,
        principal: !!img.principal,
      });
      continue;
    }

    if (img.file instanceof File) {
      const uploadForm = new FormData();
      uploadForm.append("file", img.file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadForm,
      });

      if (!res.ok) {
  let errMsg = "Error al subir imagen";
  try {
    const errData = await res.json();
    errMsg = errData.error || errMsg;
  } catch {}

  setModalConfig({
    title: "Error",
    message: errMsg,
    variant: "error",
  });

  setModalOpen(true);
  return;
}


      const data = await res.json();

      if (!data?.url || !data.url.startsWith("http")) {
        throw new Error("No se recibió una URL válida de Cloudinary");
      }

      uploadedImages.push({
        url: data.url,
        principal: !!img.principal,
      });
    }
  }

  if (uploadedImages.length === 0) {
    throw new Error("Debe subir al menos una imagen válida");
  }

  // 2. Helpers seguros
  const getString = (key: string): string => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };

  const getNumber = (key: string): number | null => {
    const value = formData.get(key);
    if (typeof value !== "string" || value.trim() === "") return null;
    const num = Number(value.trim());
    return isNaN(num) ? null : num;
  };

  // 3. Payload completo
  const payload = {
    titulo: getString("titulo"),
    direccion: getString("direccion"),
    ciudad: getString("ciudad"),
    provincia: getString("provincia"),
    barrio: getString("barrio"),
    detalles: getString("detalles"),

    id_cliente: getNumber("id_cliente"),
    id_tipo_inmueble: getNumber("id_tipo_inmueble"),
    id_estado: getNumber("id_estado"),
    id_operacion: getNumber("id_operacion"),

    superficie_total: getNumber("superficie_total"),
    superficie_cubierta: getNumber("superficie_cubierta"),
    precio: getNumber("precio"),

    cantidad_ambientes: getNumber("cantidad_ambientes"),
    cantidad_banos: getNumber("cantidad_banos"),
    cantidad_dormitorios: getNumber("cantidad_dormitorios"),
    cantidad_cocheras: getNumber("cantidad_cocheras"),
    cantidad_pisos: getNumber("cantidad_pisos"),
    antiguedad: getNumber("antiguedad"),

    imagenes: uploadedImages,
  };

  // 4. Validaciones previas (evita 400 del backend)
  if (!payload.id_cliente || payload.id_cliente <= 0) {
    throw new Error("Debe seleccionar un propietario válido");
  }
  if (!payload.id_tipo_inmueble) {
    throw new Error("Debe seleccionar un tipo de inmueble");
  }
  if (!payload.id_estado) {
    throw new Error("Debe seleccionar un estado");
  }
  if (!payload.titulo) {
    throw new Error("El título es obligatorio");
  }
  if (!payload.precio || payload.precio <= 0) {
    throw new Error("El precio debe ser mayor a 0");
  }

  console.log("Payload enviado →", JSON.stringify(payload, null, 2));

  // 5. Guardar y manejar éxito/error con modal
  try {
  await crearInmuebleMutation.mutateAsync(payload);

  setModalConfig({
    title: "Inmueble creado",
    message: "El inmueble se creó correctamente.",
    variant: "success",
    onConfirm: () => {
      setModalOpen(false);
      router.push("/propiedades");
    },
  });

  setModalOpen(true);

} catch (err: any) {
  setModalConfig({
    title: "Error",
    message: err.message || "No se pudo crear el inmueble",
    variant: "error",
  });

  setModalOpen(true);
}

}}
  onCancel={() => router.push("/propiedades")}
/>

        </div>
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