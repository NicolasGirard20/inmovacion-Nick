// =============================================================
// Archivo: src/app/(protected)/proveedores/crear/page.tsx
// Crear nuevo proveedor
// =============================================================

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";


import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CheckCircle, ArrowLeft, FileText, AlertCircle } from "lucide-react";

import ProveedorForm from "@/components/ProveedorForm";
import type { ProveedorFormValues } from "@/lib/zod";

export default function CrearProveedorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tiposServicio, setTiposServicio] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // ================================
  // Validar sesión
  // ================================
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
  }, [status, session, router]);

  // ================================
  // Cargar tipos de servicio
  // ================================
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/tipos-servicio");
        const data = await res.json();
        setTiposServicio(data);
      } catch (err) {
        console.error("Error cargando tipos de servicio:", err);
        setErrorMessage("No se pudieron cargar los tipos de servicio.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // ================================
  // Submit
  // ================================
  const handleSubmit = async (data: ProveedorFormValues) => {
    try {
      setErrorMessage(null);

      const res = await fetch("/api/proveedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Error al registrar el proveedor");
      }

      setShowSuccess(true);
      setTimeout(() => router.push("/proveedores"), 1500);

    } catch (e: any) {
      setErrorMessage(e.message);
    }
  };

  // ================================
  // LOADING PROFESIONAL CONSISTENTE
  // ================================
  if (loading)
    return (
      <div className="min-h-screen bg-white font-sans">
        <Loading message="Cargando formulario del proveedor..." />
      </div>
    );

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
            <Link href="/proveedores">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#63bae9]" />
            <h1 className="text-2xl font-bold text-[#686363]">
              Crear Proveedor
            </h1>
          </div>
        </div>

        {/* Éxito */}
        {showSuccess && (
          <Alert className="mb-6 bg-[#63bae9]/10 border-[#63bae9]/30">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363]">
              Proveedor creado correctamente. Redirigiendo…
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
            tiposServicio={tiposServicio}
            modo="crear"
            onSubmit={handleSubmit}
            onFormDirtyChange={setIsDirty}
          />
        )}

      </div>
    </div>
  );
}
