/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/(protected)/pagos/page.tsx
// ===============================================
// Gestión de Pagos a Proveedores 
// ===============================================

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Trash2,
} from "lucide-react";

import { getPagos, deletePago } from "@/actions/pagos/pagos-actions";


import Loading from "@/components/ui/Loading";
import ConfirmationModal from "@/components/ui/Modal";

export default function PagosProveedoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pagos, setPagos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("proveedor");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagoId, setPagoId] = useState<number | null>(null);

  // =======================
  // RECARGAR PAGOS
  // =======================
  const refreshPagos = useCallback(async () => {
    try {
      const data = await getPagos();
      const activos = (data || []).filter((p: any) => p.estado !== false);
      setPagos(activos);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
    }
  }, []);

  // =======================
  // VALIDAR SESIÓN
  // =======================
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/");
      return;
    }

    refreshPagos().finally(() => setLoading(false));
  }, [session, status, router, refreshPagos]);

  // =======================
  // ELIMINAR
  // =======================
  const confirmDelete = async () => {
    if (!pagoId) return;

    try {
      await deletePago(pagoId);
      await refreshPagos();
    } finally {
      setIsModalOpen(false);
      setPagoId(null);
    }
  };

  // =======================
  // FILTRO
  // =======================
  const filteredPagos = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return pagos.filter((p) => {
      switch (filterField) {
        case "proveedor":
          return p.proveedor?.nombre_razon_social
            ?.toLowerCase()
            .includes(term);
        case "concepto":
          return p.concepto?.toLowerCase().includes(term);
        case "medioPago":
          return p.medioPago?.nombre?.toLowerCase().includes(term);
        case "estadoPago":
          return p.estadoPago?.nombre?.toLowerCase().includes(term);
        default:
          return true;
      }
    });
  }, [pagos, searchTerm, filterField]);

  if (loading) return <Loading message="Cargando pagos..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ================= HEADER ================= */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#63bae9]/10 to-[#63bae9]/5">
                <FileText className="h-7 w-7 text-[#63bae9]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#686363]">
                  Pagos a Proveedores
                </h1>
                <p className="text-[#969696] mt-1">
                  Administra los pagos activos del sistema
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/pagos/crear")}
              className="gap-2 bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6"
            >
              <Plus className="h-5 w-5" />
              Registrar Pago
            </Button>
          </div>

          <div className="h-1 w-16 bg-gradient-to-r from-[#63bae9] to-[#fcc238] rounded-full" />
        </div>

        {/* ================= FILTROS ================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">

            <div className="w-full lg:w-56">
              <label className="block text-sm font-semibold text-[#686363] mb-2">
                Buscar por
              </label>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#969696]/20 bg-white text-[#686363] focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 font-medium"
              >
                <option value="proveedor">Proveedor</option>
                <option value="concepto">Concepto</option>
                <option value="medioPago">Medio de pago</option>
                <option value="estadoPago">Estado</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#686363] mb-2">
                Buscar pago
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#969696] h-5 w-5" />
                <Input
                  placeholder="Escribe para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 border-[#969696]/20 focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 text-[#686363]"
                />
              </div>
            </div>

            <Badge className="bg-[#63bae9]/10 text-[#63bae9] border border-[#63bae9]/20 px-4 py-2 rounded-full text-sm font-medium">
              {filteredPagos.length} activos
            </Badge>

          </div>
        </div>

        {/* ================= TABLA PREMIUM ================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#63bae9]/5 to-transparent">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#686363]">
                Lista de Pagos
              </h2>
              <span className="px-3 py-1 rounded-full bg-[#63bae9]/10 text-[#63bae9] text-sm font-medium">
                {filteredPagos.length} activos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-8 py-4 text-left text-sm font-semibold text-[#686363]">
                    Proveedor
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Concepto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Importe
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Medio
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#686363]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPagos.map((p) => (
                  <tr
                    key={p.id_pago}
                    className="border-b border-gray-100 hover:bg-[#63bae9]/3 transition-colors duration-200"
                  >
                    <td className="px-8 py-5 font-semibold text-[#686363]">
                      {p.proveedor?.nombre_razon_social}
                    </td>

                    <td className="px-6 py-5 text-[#686363]">
                      {p.concepto}
                    </td>

                    <td className="px-6 py-5 text-[#686363] font-medium">
                      ${p.importe}
                    </td>

                    <td className="px-6 py-5 text-[#686363]">
                      {p.medioPago?.nombre}
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#63bae9]/15 text-[#63bae9]">
                        {p.estadoPago?.nombre}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-[#686363]">
                      {new Date(p.fecha_pago).toLocaleDateString("es-AR")}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-9 w-9 p-0 hover:bg-[#63bae9]/10 text-[#686363]"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                          align="end"
                          className="border border-gray-100 shadow-lg"
                        >
                          <DropdownMenuItem
                            onClick={() => router.push(`/pagos/${p.id_pago}`)}
                            className="hover:bg-[#63bae9]/10 hover:text-[#63bae9]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/pagos/editar?id=${p.id_pago}`)
                            }
                            className="hover:bg-[#63bae9]/10 hover:text-[#63bae9]"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setPagoId(p.id_pago);
                              setIsModalOpen(true);
                            }}
                            className="text-[#fcc238] hover:bg-[#fcc238]/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar pago?"
        message="Esta acción lo ocultará del sistema, pero no lo borrará de la base de datos."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
