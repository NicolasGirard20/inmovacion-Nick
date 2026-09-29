// src/app/(protected)/usuarios/nuevo/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import RegisterForm from "@/components/ui/RegisterForm"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Modal from '@/components/ui/Modal'

export default function NewUserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    if (session.user?.role !== "admin") {
      router.push("/usuarios")
      return
    }
  }, [session, status, router])

  const handleCancel = () => {
    if (isFormDirty) {
      setIsModalOpen(true)
    } else {
      router.push("/usuarios")
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white font-sans">
      <div className="container mx-auto px-4 py-4 sm:py-6 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200 hover:scale-105 shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a usuarios
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-[#63bae9]" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#686363] tracking-tight">
                Crear Nuevo Usuario
              </h1>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {showSuccess && (
          <Alert className="mb-6 max-w-2xl mx-auto shadow-lg border-[#63bae9]/20 bg-[#63bae9]/10">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363] text-sm">
              El usuario ha sido creado exitosamente. Redirigiendo...
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto shadow-lg border-red-200 bg-red-50/50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              {errorMessage}
            </AlertDescription>
            <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => setErrorMessage(null)}
                className="h-12 bg-gradient-to-r from-[#63bae9] to-[#63bae9]/90 hover:from-[#63bae9]/90 hover:to-[#63bae9]/80 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Intentar Nuevamente
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/usuarios")}
                className="h-12 border-[#969696]/50 text-[#686363] hover:bg-[#63bae9]/10 hover:text-[#63bae9] rounded-xl font-medium text-sm transition-all duration-200 transform hover:scale-105"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Usuarios
              </Button>
            </div>
          </Alert>
        )}

        {/* Formulario */}
        {!showSuccess && !errorMessage && (
          <RegisterForm
            onSuccess={() => {
              setShowSuccess(true)
              setTimeout(() => router.push("/inicio"), 1500)
            }}
            onError={(message) => setErrorMessage(message)}
            onFormDirtyChange={(isDirty) => setIsFormDirty(isDirty)}
          />
        )}
      </div>

      {/* Modal de confirmación */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => router.push("/usuarios")}
        title="Confirmar Cancelación"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?"
        confirmText="Salir sin guardar"
        cancelText="Continuar editando"
        variant="warning"
      />
    </div>
  )
}