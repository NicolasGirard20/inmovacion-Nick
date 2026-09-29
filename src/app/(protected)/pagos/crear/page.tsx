// ===============================================
// Archivo: src/app/(protected)/pagos/crear/page.tsx
// ===============================================

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Loading from "@/components/ui/Loading"; // ✅ AGREGADO

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { CheckCircle, ArrowLeft, FileText, AlertCircle } from "lucide-react";

import PagoProveedorForm from "@/components/PagoProveedorForm";

// Define the type locally if not exported from the module
type PagoProveedorFormValues = {
  proveedorId: string;
  medioPagoId: string;
  estadoPagoId: string;
  concepto: string;
  importe: number;
  comprobante?: string;
  responsable: string;
};

export default function CrearPagoProveedorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mediosPago, setMediosPago] = useState([]);
  const [estadosPago, setEstadosPago] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // ---------------------------
  // Validar sesión
  // ---------------------------
  useEffect(() => {
    if (status === "loading") return;
    if (!session) router.push("/");
  }, [status, session, router]);

  // ---------------------------
  // Cargar catálogos
  // ---------------------------
  useEffect(() => {
    async function loadData() {
      try {
        const [proveRes, medioRes, estadoRes] = await Promise.all([
          fetch("/api/proveedores"),
          fetch("/api/medio-pago"),
          fetch("/api/estado-pago"),
        ]);

        setProveedores(await proveRes.json());
        setMediosPago(await medioRes.json());
        setEstadosPago(await estadoRes.json());
      } catch (e) {
        console.error("Error cargando datos:", e);
        setErrorMessage("No se pudieron cargar los datos del formulario.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // ---------------------------
  // LOADING PROFESIONAL CONSISTENTE
  // ---------------------------
  if (loading)
    return (
      <div className="min-h-screen bg-white font-sans">
        <Loading message="Cargando formulario de pago..." />
      </div>
    );

  // ---------------------------
  // Submit
  // ---------------------------
  const handleSubmit = async (data: PagoProveedorFormValues) => {
    try {
      setErrorMessage(null);

      const res = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proveedorId: Number(data.proveedorId),
          medioPagoId: Number(data.medioPagoId),
          estadoPagoId: Number(data.estadoPagoId),
          concepto: data.concepto,
          importe: Number(data.importe),
          comprobante: data.comprobante || null,
          responsable: data.responsable,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success)
        throw new Error(result.message || "Error al registrar el pago");

      setShowSuccess(true);
      setTimeout(() => router.push("/pagos"), 1500);

    } catch (e: any) {
      setErrorMessage(e.message);
    }
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
            <Link href="/pagos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-[#63bae9]" />
            <h1 className="text-2xl font-bold text-[#686363]">
              Registrar Pago a Proveedor
            </h1>
          </div>
        </div>

        {/* Éxito */}
        {showSuccess && (
          <Alert className="mb-6 bg-[#63bae9]/10 border-[#63bae9]/30">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription>
              Pago registrado correctamente.
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
          <PagoProveedorForm
            proveedores={proveedores}
            mediosPago={mediosPago}
            estadosPago={estadosPago}
            modo="crear"
            onSubmit={handleSubmit}
            onFormDirtyChange={setIsDirty}
          />
        )}

      </div>
    </div>
  );
}
