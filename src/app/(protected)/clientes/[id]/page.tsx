// =============================================================
// Archivo: src/app/(protected)/clientes/[id]/page.tsx
// Ver detalle del cliente
// =============================================================

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import Loading from "@/components/ui/Loading"; // ✅ AGREGADO

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ArrowLeft, User, Edit, AlertCircle } from "lucide-react";

export default function ClienteDetallePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();

  const [cliente, setCliente] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const id = params.id;

  // ================================
  // Validar sesión
  // ================================
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [status, session, router]);

  // ================================
  // Cargar cliente
  // ================================
  useEffect(() => {
    async function loadCliente() {
      try {
        const res = await fetch(`/api/clientes/${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Error al obtener cliente");

        setCliente(data);
      } catch (err: any) {
        setErrorMessage(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadCliente();
  }, [id]);

  // ✅ MISMO LOADING QUE EN LA LISTA
  if (loading)
    return (
      <Loading message="Cargando detalle del cliente..." />
    );

  if (errorMessage)
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );

  if (!cliente)
    return (
      <p className="p-6 text-red-600">
        Cliente no encontrado.
      </p>
    );

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">
      <div className="container mx-auto p-4 max-w-4xl">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-[#63bae9]" />
            <h1 className="text-3xl font-bold text-[#686363]">
              Detalle del Cliente
            </h1>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="border-[#63bae9] text-[#63bae9]"
            >
              <Link href="/clientes">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Link>
            </Button>

            <Button
              asChild
              className="bg-[#63bae9] text-white hover:bg-[#63bae9]/90"
            >
              <Link href={`/clientes/editar?id=${cliente.id_cliente}`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          </div>
        </div>

        {/* CARD */}
        <Card className="border-[#969696]/30 shadow-md">
          <CardContent className="p-6 space-y-4">

            <h2 className="text-lg font-semibold text-[#686363] mb-4">
              Información general
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <Data label="Nombre" value={cliente.nombre} />
              <Data label="Apellido" value={cliente.apellido} />
              <Data label="Email" value={cliente.email} />
              <Data label="Teléfono" value={cliente.telefono} />

              <Data
                label="Tipo de documento"
                value={cliente.tipoDocumento?.nombre}
              />

              <Data
                label="Número de documento"
                value={cliente.numero_documento}
              />

              <Data
                label="Tipo(s) de Cliente"
                value={
                  cliente.tiposCliente?.length
                    ? cliente.tiposCliente
                        .map((tc: any) => tc.tipoCliente?.nombre)
                        .join(", ")
                    : null
                }
              />

              <Data
                label="Estado"
                value={cliente.activo ? "Activo" : "Inactivo"}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-[#686363] mt-4">
                Descripción
              </h3>
              <p className="text-[#686363] bg-gray-50 p-3 rounded-md border border-[#969696]/20">
                {cliente.descripcion || "Sin descripción"}
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =============================================
// Componente auxiliar
// =============================================
function Data({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-[#969696]">{label}</span>
      <span className="font-medium text-[#686363]">
        {value ?? "—"}
      </span>
    </div>
  );
}
