// Archivo: src/app/usuarios/page.tsx
// Descripción: Página para gestionar usuarios (listado y creación).
// Proyecto: inmovacion (GBS y Asociados), sistema inmobiliario.

"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/Badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Eye, Edit, UserCheck, UserX, Trash2, Users, LayoutGrid, LayoutList } from "lucide-react"
import { getUsers } from "@/actions/getUsers"
import { deactivateUser, deleteUser, activateUser } from "@/actions/user-actions"
import type { User } from "../../../../types/user"
import Loading from "@/components/ui/Loading"
import Modal from "@/components/ui/Modal"

export default function UsersPage() {
  const { data: session, status } = useSession()
  const loggedInUserEmail = session?.user?.email
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"table" | "cards">("table")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [actionType, setActionType] = useState<'delete' | 'deactivate' | 'activate' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && user.status === "active") ||
        (filterStatus === "inactive" && user.status === "inactive")
      return matchesSearch && matchesStatus
    })
  }, [users, searchTerm, filterStatus])

  const refreshUsers = useCallback(async () => {
    try {
      const usersData = await getUsers()
      const validUsers: User[] = usersData.map((user: any) => ({
        id: user.id,
        name: user.name || "Sin nombre",
        email: user.email || "sin@email.com",
        phone: user.phone || undefined,
        role: user.role || "user",
        status: user.status || "active",
        password: user.password || "sincontraseña",
        createdAt: user.createdAt || new Date(),
        updatedAt: user.updatedAt || new Date(),
      }))
      setUsers(validUsers)
    } catch (error) {
      console.error("Error al cargar usuarios:", error)
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/")
      return
    }
    if (session.user?.role !== "admin") {
      router.push("/")
      return
    }

    const fetchUsers = async () => {
      try {
        await refreshUsers()
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [session, status, router, refreshUsers])

  const handleDelete = useCallback(
    (id: string) => {
      setUserId(id)
      setActionType('delete')
      setIsModalOpen(true)
    },
    []
  )

  const handleDeactivate = useCallback(
    (id: string) => {
      setUserId(id)
      setActionType('deactivate')
      setIsModalOpen(true)
    },
    []
  )

  const handleActivate = useCallback(
    (id: string) => {
      setUserId(id)
      setActionType('activate')
      setIsModalOpen(true)
    },
    []
  )

  const handleConfirmAction = useCallback(async () => {
    if (!userId || !actionType) return

    try {
      if (actionType === 'delete') {
        await deleteUser(userId)
      } else if (actionType === 'deactivate') {
        await deactivateUser(userId)
      } else if (actionType === 'activate') {
        await activateUser(userId)
      }
      await refreshUsers()
    } catch (error) {
      console.error(`Error en acción ${actionType}:`, error)
    }
    setIsModalOpen(false)
    setActionType(null)
    setUserId(null)
  }, [userId, actionType, refreshUsers])

  // Función para obtener la configuración del modal según el tipo de acción
  const getModalConfig = () => {
    switch (actionType) {
      case 'delete':
        return {
          title: "¿Eliminar este usuario?",
          message: "Se eliminará permanentemente el usuario. Esta acción no se puede deshacer.",
          confirmText: "Eliminar",
          variant: "danger" as const
        }
      case 'deactivate':
        return {
          title: "¿Desactivar este usuario?",
          message: "El usuario no podrá acceder al sistema hasta que se reactive.",
          confirmText: "Desactivar",
          variant: "warning" as const
        }
      case 'activate':
        return {
          title: "¿Activar este usuario?",
          message: "El usuario podrá acceder nuevamente al sistema.",
          confirmText: "Activar",
          variant: "info" as const
        }
      default:
        return {
          title: "Confirmación",
          message: "Por favor confirma esta acción.",
          confirmText: "Confirmar",
          variant: "info" as const
        }
    }
  }

  const modalConfig = getModalConfig()

  if (loading) {
    return <Loading message="Cargando usuarios..." />
  }

  const TableView = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#63bae9]/5 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#686363]">Lista de Usuarios</h2>
          <span className="px-3 py-1 rounded-full bg-[#63bae9]/10 text-[#63bae9] text-sm font-medium">
            {filteredUsers.length} usuarios
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-8 py-4 text-left text-sm font-semibold text-[#686363]">Usuario</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">Contacto</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">Rol</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-[#686363]">Creación</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-[#686363]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 hover:bg-[#63bae9]/3 transition-colors duration-200"
              >
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#686363]">{user.name}</span>
                    <span className="text-xs text-[#969696] mt-1">ID: {user.id}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm text-[#686363]">{user.email}</span>
                    <span className="text-xs text-[#969696] mt-1">{user.phone || "Sin teléfono"}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      user.role === "admin"
                        ? "bg-[#63bae9]/15 text-[#63bae9]"
                        : "bg-[#969696]/15 text-[#686363]"
                    }`}
                  >
                    {user.role === "admin" ? "Administrador" : "Usuario"}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      user.status === "active"
                        ? "bg-[#fcc238]/20 text-[#686363]"
                        : "bg-[#969696]/15 text-[#686363]"
                    }`}
                  >
                    {user.status === "active" ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-[#969696]">
                  {new Date(user.createdAt).toLocaleDateString("es-ES")}
                </td>
                <td className="px-6 py-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 p-0 hover:bg-[#63bae9]/10 text-[#686363] transition-colors duration-200">
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border border-gray-100 shadow-lg">
                      <DropdownMenuItem
                        onClick={() => router.push(`/usuarios/${user.id}`)}
                        className="text-[#686363] hover:bg-[#63bae9]/10 hover:text-[#63bae9] cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/usuarios/editar?id=${user.id}`)}
                        className="text-[#686363] hover:bg-[#63bae9]/10 hover:text-[#63bae9] cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      {user.status === "active" ? (
                        user.email === loggedInUserEmail ? (
                          <DropdownMenuItem
                            className="text-[#969696] cursor-not-allowed"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            No puedes desactivarte
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(user.id)}
                            className="text-[#fcc238] hover:bg-[#fcc238]/10 cursor-pointer"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Desactivar
                          </DropdownMenuItem>
                        )
                      ) : (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleActivate(user.id)}
                            className="text-[#63bae9] hover:bg-[#63bae9]/10 cursor-pointer"
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(user.id)}
                            className="text-[#fcc238] hover:bg-[#fcc238]/10 cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const CardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredUsers.map((user) => (
        <div
          key={user.id}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#63bae9]/20 transition-all duration-300 p-6"
        >
          <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
            <div className="flex-1">
              <h3 className="font-semibold text-[#686363] text-lg">{user.name}</h3>
              <p className="text-sm text-[#969696] mt-1">{user.email}</p>
            </div>
            <span
              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                user.status === "active"
                  ? "bg-[#fcc238]/20 text-[#686363]"
                  : "bg-[#969696]/15 text-[#686363]"
              }`}
            >
              {user.status === "active" ? "Activo" : "Inactivo"}
            </span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#969696]">Rol</span>
              <span className={user.role === "admin" ? "text-[#63bae9] font-semibold" : "text-[#686363]"}>
                {user.role === "admin" ? "Administrador" : "Usuario"}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#969696]">Teléfono</span>
              <span className="text-[#686363]">{user.phone || "No registrado"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#969696]">Creado</span>
              <span className="text-[#686363]">{new Date(user.createdAt).toLocaleDateString("es-ES")}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-5 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/usuarios/${user.id}`)}
              className="flex-1 border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white font-medium transition-all duration-200"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/usuarios/editar?id=${user.id}`)}
              className="flex-1 border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white font-medium transition-all duration-200"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-[#686363] hover:bg-gray-50 bg-transparent transition-colors duration-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border border-gray-100 shadow-lg">
                {user.status === "active" ? (
                  user.email === loggedInUserEmail ? (
                    <DropdownMenuItem
                      className="text-[#969696] cursor-not-allowed"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      No puedes desactivarte
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleDeactivate(user.id)}
                      className="text-[#fcc238] hover:bg-[#fcc238]/10 cursor-pointer"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Desactivar
                    </DropdownMenuItem>
                  )
                ) : (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleActivate(user.id)}
                      className="text-[#63bae9] hover:bg-[#63bae9]/10 cursor-pointer"
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      className="text-[#fcc238] hover:bg-[#fcc238]/10 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#63bae9]/10 to-[#63bae9]/5">
                <Users className="h-7 w-7 text-[#63bae9]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#686363]">Gestión de Usuarios</h1>
                <p className="text-[#969696] mt-1">Administra los usuarios del sistema</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/usuarios/nuevo")}
              className="gap-2 bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-6"
            >
              <Plus className="h-5 w-5" />
              Crear Usuario
            </Button>
          </div>
          <div className="h-1 w-16 bg-gradient-to-r from-[#63bae9] to-[#fcc238] rounded-full" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-[#686363] mb-2">Buscar usuario</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#969696] h-5 w-5" />
                <Input
                  placeholder="Nombre, correo o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 border-[#969696]/20 focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 text-[#686363] placeholder:text-[#969696]"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-sm font-semibold text-[#686363] mb-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#969696]/20 bg-white text-[#686363] focus:border-[#63bae9] focus:ring-2 focus:ring-[#63bae9]/20 font-medium"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg border border-[#969696]/10">
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "table"
                    ? "bg-white text-[#63bae9] shadow-sm"
                    : "text-[#969696] hover:text-[#686363]"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Tabla
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                  viewMode === "cards"
                    ? "bg-white text-[#63bae9] shadow-sm"
                    : "text-[#969696] hover:text-[#686363]"
                }`}
              >
                <LayoutList className="h-4 w-4" />
                Tarjetas
              </button>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#63bae9]/10 to-[#969696]/5 mb-4">
                <Users className="h-12 w-12 text-[#969696]" />
              </div>
              <h3 className="text-xl font-semibold text-[#686363] mb-2">No se encontraron usuarios</h3>
              <p className="text-[#969696] mb-6 max-w-md">
                {searchTerm || filterStatus !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primer usuario para gestionar el sistema"}
              </p>
              {!searchTerm && filterStatus === "all" && (
                <Button
                  onClick={() => router.push("/usuarios/nuevo")}
                  className="gap-2 bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/90 font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Crear Primer Usuario
                </Button>
              )}
            </div>
          </div>
        ) : viewMode === "table" ? (
          <TableView />
        ) : (
          <CardsView />
        )}

        {/* Modal de confirmación */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setActionType(null)
            setUserId(null)
          }}
          onConfirm={handleConfirmAction}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText="Cancelar"
          variant={modalConfig.variant}
        />
      </div>
    </div>
  )
}