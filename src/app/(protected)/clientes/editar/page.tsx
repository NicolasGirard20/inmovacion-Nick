// =============================================================
// Archivo: src/app/(protected)/clientes/editar/page.tsx
// Descripción: Editar cliente
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import Header from "@/components/ui/Header";
import Loading from "@/components/ui/Loading"; // ✅ AGREGADO

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  UserCog,
} from "lucide-react";

import ClienteForm from "@/components/ClienteForm";

export default function EditarClientePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const id = params.get("id");

  const [cliente, setCliente] = useState<any>(null);
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
  // Cargar cliente + catálogos
  // ================================
  useEffect(() => {
    async function loadData() {
      if (!id) return;

      try {
        const [resCliente, resTipoClientes, resTipoDocumentos] =
          await Promise.all([
            fetch(`/api/clientes/${id}`),
            fetch("/api/tipo-cliente"),
            fetch("/api/tipo-documento"),
          ]);

        if (!resCliente.ok) throw new Error("Cliente no encontrado.");

        const clienteData = await resCliente.json();
        const tipoClientesData = await resTipoClientes.json();
        const tipoDocumentosData = await resTipoDocumentos.json();

        setCliente(clienteData);
        setTipoClientes(tipoClientesData);
        setTipoDocumentos(tipoDocumentosData);
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
  const handleSubmit = async (data: any) => {
    try {
      setErrorMessage(null);

      const res = await fetch(`/api/clientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Error al actualizar.");
      }

      setShowSuccess(true);
      setTimeout(() => router.push(`/clientes/${id}`), 1500);

    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // ================================
  // LOADING PROFESIONAL (CONSISTENTE)
  // ================================
  if (loading)
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <Loading message="Cargando datos del cliente..." />
      </div>
    );

  if (!cliente) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header />
        <p className="p-6 text-red-600">
          No se encontró el cliente o hubo un error.
        </p>
      </div>
    );
  }

  // ================================
  // Inicializar datos del formulario
  // ================================
  const initialData = {
    nombre: cliente.nombre,
    apellido: cliente.apellido || "",
    email: cliente.email || "",
    telefono: cliente.telefono || "",
    tipoDocumentoId: cliente.tipoDocumentoId || "",
    numeroDocumento: cliente.numero_documento || "",
    tipoClienteIds: cliente.tiposCliente
      ? cliente.tiposCliente.map((tc: any) => String(tc.tipoClienteId ?? tc.tipoCliente?.id_tipo_cliente))
      : [],
    descripcion: cliente.descripcion || "",
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="bg-white border-b border-[#969696]/50 w-full">
        <Header />
      </div>

      <div className="container mx-auto p-4 max-w-5xl">

        {/* Volver */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#63bae9] text-[#63bae9]"
          >
            <Link href={`/clientes/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-[#63bae9]" />
            <h1 className="text-2xl font-bold text-[#686363]">
              Editar Cliente
            </h1>
          </div>
        </div>

        {/* Éxito */}
        {showSuccess && (
          <Alert className="mb-6 bg-[#63bae9]/10 border-[#63bae9]/30">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363]">
              Cliente actualizado correctamente. Redirigiendo…
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
          <ClienteForm
            modo="editar"
            tipoClientes={tipoClientes}
            tipoDocumentos={tipoDocumentos}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
