// =============================================================
// Archivo: src/app/(protected)/clientes/crear/page.tsx
// =============================================================
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Loading from "@/components/ui/Loading"; // ✅ AGREGADO

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CheckCircle, ArrowLeft, UserPlus, AlertCircle } from "lucide-react";

import ClienteForm from "@/components/ClienteForm";

export default function CrearClientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tipoClientes, setTipoClientes] = useState<any[]>([]);
  const [tipoDocumentos, setTipoDocumentos] = useState<any[]>([]);
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
  // Cargar catálogos
  // ================================
  useEffect(() => {
    async function loadData() {
      try {
        const [resClientes, resDocumentos] = await Promise.all([
          fetch("/api/tipo-cliente"),
          fetch("/api/tipo-documento"),
        ]);

        if (!resClientes.ok || !resDocumentos.ok) {
          throw new Error("Error al cargar catálogos");
        }

        const clientesData = await resClientes.json();
        const documentosData = await resDocumentos.json();

        setTipoClientes(clientesData);
        setTipoDocumentos(documentosData);
      } catch (err: any) {
        console.error("Error cargando catálogos:", err);
        setErrorMessage("No se pudieron cargar los catálogos.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ================================
  // Submit (Crear cliente)
  // ================================
  const handleSubmit = async (formData: any) => {
    try {
      setErrorMessage(null);

      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al crear cliente");
      }

      setShowSuccess(true);

      setTimeout(() => {
        router.push("/clientes");
      }, 1500);

    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  // ✅ MISMO LOADING QUE EN LOS OTROS PAGES
  if (loading) {
    return (
      <Loading message="Cargando formulario de cliente..." />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="container mx-auto p-4 max-w-5xl">

        {/* VOLVER + TÍTULO */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#63bae9] text-[#63bae9]"
          >
            <Link href="/clientes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-[#63bae9]" />
            <h1 className="text-2xl font-bold text-[#686363]">
              Crear Cliente
            </h1>
          </div>
        </div>

        {/* ÉXITO */}
        {showSuccess && (
          <Alert className="mb-6 bg-[#63bae9]/10 border-[#63bae9]/30">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription>
              Cliente creado correctamente. Redirigiendo…
            </AlertDescription>
          </Alert>
        )}

        {/* ERROR */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* FORM */}
        {!showSuccess && (
          <ClienteForm
            modo="crear"
            tipoClientes={tipoClientes}
            tipoDocumentos={tipoDocumentos}
            initialData={{
              nombre: "",
              apellido: "",
              email: "",
              telefono: "",
              tipoDocumentoId: "",
              numeroDocumento: "",
              tipoClienteIds: [],
              descripcion: "",
            }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
