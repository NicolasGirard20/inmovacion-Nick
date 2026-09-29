/* eslint-disable @typescript-eslint/no-explicit-any */
// ===============================================
// Archivo: src/app/(protected)/proveedores/[id]/page.tsx
// Vista detallada de un proveedor
// ===============================================

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";

// UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Icons
import { ArrowLeft, Building, Edit, Trash2 } from "lucide-react";

// Actions
import { getProveedorById, softDeleteProveedor } from "@/actions/proveedores/proveedor-actions";

// Components

import Loading from "@/components/ui/Loading";
import ConfirmationModal from "@/components/ui/Modal";

export default function ProveedorDetallePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const id = Number(params.id);

  const [proveedor, setProveedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal eliminar
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==============================
  // Cargar datos del Proveedor
  // ==============================
  const loadProveedor = async () => {
    try {
      const data = await getProveedorById(id);
      setProveedor(data);
    } catch (error) {
      console.error("Error cargando proveedor:", error);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    loadProveedor().finally(() => setLoading(false));
  }, [session, status]);

  // ==============================
  // LOADING PROFESIONAL CONSISTENTE
  // ==============================
  if (loading)
    return (
      <div className="min-h-screen bg-background">
        <Loading message="Cargando proveedor..." />
      </div>
    );

  // ==============================
  // ERROR / NO ENCONTRADO
  // ==============================
  if (!proveedor)
    return (
      <div className="min-h-screen bg-background">
        <p className="p-6 text-red-600">
          No se encontró el proveedor.
        </p>
      </div>
    );

  // ==============================
  // Confirmar eliminación soft
  // ==============================
  const confirmDelete = async () => {
    try {
      await softDeleteProveedor(id);
      router.push("/proveedores");
    } catch (error) {
      console.error("Error eliminando proveedor:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      <div className="container mx-auto px-4 py-8">

        {/* Volver */}
        <Button
          variant="ghost"
          className="mb-6 text-[#686363] hover:text-[#63bae9]"
          onClick={() => router.push("/proveedores")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>

        {/* Encabezado */}
        <Card className="mb-8 border-[#969696]/20 shadow-md">
          <CardHeader className="bg-[#63bae9]/5">
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-[#63bae9]" />
              <CardTitle className="text-2xl font-bold text-[#686363]">
                {proveedor.nombre_razon_social}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="text-[#686363] space-y-2">
            <p>
              <strong>CUIT/CUIL:</strong> {proveedor.cuit_cuil}
            </p>
            <p>
              <strong>Teléfono:</strong> {proveedor.telefono_contacto || "Sin teléfono"}
            </p>
            <p>
              <strong>Correo:</strong> {proveedor.correo_contacto || "—"}
            </p>
            <p>
              <strong>Dirección:</strong> {proveedor.direccion || "—"}
            </p>
            <p>
              <strong>Tipo de Servicio:</strong> {proveedor.tipoServicio?.nombre || "—"}
            </p>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="mb-8 border-[#969696]/20 shadow-sm">
          <CardHeader>
            <CardTitle className="text-[#686363]">
              Información Adicional
            </CardTitle>
          </CardHeader>

          <CardContent className="text-[#686363] space-y-2">
            <p>
              <strong>Datos Bancarios:</strong> {proveedor.datos_bancarios || "—"}
            </p>
            <p>
              <strong>Observaciones:</strong> {proveedor.observaciones || "—"}
            </p>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex gap-4">

          <Button
            className="bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/80"
            onClick={() =>
              router.push(`/proveedores/editar?id=${proveedor.id_proveedor}`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>

          <Button
            variant="destructive"
            className="gap-2 bg-red-500/80 hover:bg-red-600"
            onClick={() => setIsModalOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>

      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar proveedor?"
        message="Esto lo ocultará del sistema, pero NO lo borra de la base de datos."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
