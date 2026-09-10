/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(protected)/clientes/page.tsx
// ===============================================
// Gestión de Clientes 
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
  User,
  Trash2,
} from "lucide-react";

import { getClientes } from "@/actions/clientes/getClientes";
import { softDeleteCliente } from "@/actions/clientes/cliente-actions";

import Header from "@/components/ui/Header";
import Loading from "@/components/ui/Loading";
import ConfirmationModal from "@/components/ui/Modal";

export default function ClientesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState("nombre");
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteId, setClienteId] = useState<number | null>(null);

  const refreshClientes = useCallback(async () => {
    try {
      const data = await getClientes();
      setClientes(data.filter((c: any) => c.activo));
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/");
      return;
    }
    refreshClientes().finally(() => setLoading(false));
  }, [session, status, router, refreshClientes]);

  const confirmDelete = async () => {
    if (!clienteId) return;
    try {
      await softDeleteCliente(clienteId);
      await refreshClientes();
    } finally {
      setIsModalOpen(false);
      setClienteId(null);
    }
  };

  const filteredClientes = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clientes.filter((c) => {
      switch (filterField) {
        case "nombre":
          return c.nombre?.toLowerCase().includes(term);
        case "apellido":
          return c.apellido?.toLowerCase().includes(term);
        case "email":
          return c.email?.toLowerCase().includes(term);
        case "telefono":
          return c.telefono?.toLowerCase().includes(term);
        case "tipoCliente":
          return c.tiposCliente?.some((tc: any) =>
            (tc.tipoCliente?.nombre ?? tc.nombre)?.toLowerCase().includes(term)
          );
        default:
          return true;
      }
    });
  }, [clientes, searchTerm, filterField]);

  if (loading) return <Loading message="Cargando clientes..." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ================= HEADER ================= */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#63bae9]/10 to-[#63bae9]/5">
                <User className="h-7 w-7 text-[#63bae9]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#686363]">
                  Gestión de Clientes
                </h1>
                <p className="text-[#969696] mt-1">
                  Administra los clientes activos del sistema
                </p>
              </div>
            </div>

            <Button
              onClick={() => router.push("/clientes/crear")}
              className="gap-2 bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6"
            >
              <Plus className="h-5 w-5" />
              Crear Cliente
            </Button>
          </div>

          <div className="h-1 w-16 bg-gradient-to-r from-[#63bae9] to-[#fcc238] rounded-full" />
        </div>

        {/* ================= FILTROS ================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">

            <div className="w-full lg:w-48">
              <label className="block text-sm font-semibold text-[#686363] mb-2">
                Buscar por
              </label>
              <select
                value={filterField}
                onChange={(e) => setFilterField(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#969696]/20 bg-white text-[#686363] focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 font-medium"
              >
                <option value="nombre">Nombre</option>
                <option value="apellido">Apellido</option>
                <option value="email">Email</option>
                <option value="telefono">Teléfono</option>
                <option value="tipoCliente">Tipo de cliente</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#686363] mb-2">
                Buscar cliente
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#969696] h-5 w-5" />
                <Input
                  placeholder="Escribe para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 border-[#969696]/20 focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 text-[#686363] placeholder:text-[#969696]"
                />
              </div>
            </div>

            <Badge className="bg-[#63bae9]/10 text-[#63bae9] border border-[#63bae9]/20 px-4 py-2 rounded-full text-sm font-medium">
              {filteredClientes.length} activos
            </Badge>
          </div>
        </div>

        {/* ================= TABLA PREMIUM ================= */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#63bae9]/5 to-transparent">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#686363]">
                Lista de Clientes
              </h2>
              <span className="px-3 py-1 rounded-full bg-[#63bae9]/10 text-[#63bae9] text-sm font-medium">
                {filteredClientes.length} activos
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-8 py-4 text-left text-sm font-semibold text-[#686363]">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#686363]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredClientes.map((c) => (
                  <tr
                    key={c.id_cliente}
                    className="border-b border-gray-100 hover:bg-[#63bae9]/3 transition-colors duration-200"
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#686363]">
                          {c.nombre} {c.apellido || ""}
                        </span>
                        <span className="text-xs text-[#969696] mt-1">
                          ID: {c.id_cliente}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm text-[#686363]">
                          {c.email || "Sin email"}
                        </span>
                        <span className="text-xs text-[#969696] mt-1">
                          {c.telefono || "Sin teléfono"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-[#63bae9]/15 text-[#63bae9]">
                        {c.tiposCliente?.length > 0
                          ? c.tiposCliente.map((tc: any) => tc.tipoCliente?.nombre ?? tc.nombre).filter(Boolean).join(", ")
                          : "Sin tipo"}
                      </span>
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
                            onClick={() =>
                              router.push(`/clientes/${c.id_cliente}`)
                            }
                            className="hover:bg-[#63bae9]/10 hover:text-[#63bae9]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/clientes/editar?id=${c.id_cliente}`)
                            }
                            className="hover:bg-[#63bae9]/10 hover:text-[#63bae9]"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setClienteId(c.id_cliente);
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
        title="¿Eliminar cliente?"
        message="Esta acción lo ocultará del sistema, pero no lo borrará de la base de datos."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
