// =============================================================
// Archivo: src/app/(protected)/proveedores/editar/page.tsx
// Descripción: Editar proveedor
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";



import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Building2,
} from "lucide-react";

import ProveedorForm from "@/components/ProveedorForm";
import type { ProveedorFormValues } from "@/lib/zod";

export default function EditarProveedorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");

  const [proveedor, setProveedor] = useState<any>(null);
  const [tiposServicio, setTiposServicio] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ================================
  // Validar sesión
  // ================================
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [status, session, router]);

  // ================================
  // Cargar proveedor + catálogo
  // ================================
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const [resProveedor, resTipos] = await Promise.all([
          fetch(`/api/proveedores/${id}`),
          fetch("/api/tipos-servicio"),
        ]);

        if (!resProveedor.ok) {
          throw new Error("Proveedor no encontrado.");
        }

        const proveedorData = await resProveedor.json();
        const tiposData = await resTipos.json();

        setProveedor(proveedorData);
        setTiposServicio(tiposData);

      } catch (error: any) {
        setErrorMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // ================================
  // Submit (Actualizar)
  // ================================
  const handleSubmit = async (data: ProveedorFormValues) => {
    try {
      setErrorMessage(null);

      const res = await fetch(`/api/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Error al actualizar.");
      }

      setShowSuccess(true);
      setTimeout(() => router.push(`/proveedores/${id}`), 1500);

    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ================================
  // LOADING PROFESIONAL CONSISTENTE
  // ================================
  if (loading)
    return (
      <div className="min-h-screen bg-white font-sans">
        <Loading message="Cargando datos del proveedor..." />
      </div>
    );

  if (!proveedor) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <p className="p-6 text-red-600">
          No se encontró el proveedor o hubo un error.
        </p>
      </div>
    );
  }

  // ================================
  // Inicializar datos del formulario
  // ================================
  const initialData = {
    nombre_razon_social: proveedor.nombre_razon_social,
    cuit_cuil: proveedor.cuit_cuil || "",
    correo_contacto: proveedor.correo_contacto || "",
    telefono_contacto: proveedor.telefono_contacto || "",
    direccion: proveedor.direccion || "",
    tipoServicioId: proveedor.tipoServicioId
      ? String(proveedor.tipoServicioId)
      : "",
    datos_bancarios: proveedor.datos_bancarios || "",
    observaciones: proveedor.observaciones || "",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="container mx-auto p-4 max-w-5xl">

        {/* Volver */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#63bae9] text-[#63bae9]"
          >
            <Link href={`/proveedores/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-[#63bae9]" />
            <h1 className="text-2xl font-bold text-[#686363]">
              Editar Proveedor
            </h1>
          </div>
        </div>

        {/* Éxito */}
        {showSuccess && (
          <Alert className="mb-6 bg-[#63bae9]/10 border-[#63bae9]/30">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363]">
              Proveedor actualizado correctamente. Redirigiendo…
            </AlertDescription>
          </Alert>
        )}

        {/* Error */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        {!showSuccess && (
          <ProveedorForm
            modo="editar"
            tiposServicio={tiposServicio}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        )}

      </div>
    </div>
  );
}
