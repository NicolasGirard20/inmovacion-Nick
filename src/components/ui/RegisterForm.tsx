//src/components/ui/RegisterForm.tsx
"use client"

import { useState, useTransition } from "react"
import type { z } from "zod"
import { registerSchema } from "@/lib/zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { registerAction } from "@/actions/auth-action"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, User, Mail, Lock, Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"
import { PhoneInputField } from "@/components/ui/PhoneInputField"

type RegisterFormValues = z.infer<typeof registerSchema>

interface RegisterFormProps {
  onSuccess: () => void
  onError: (message: string) => void
  onFormDirtyChange?: (isDirty: boolean) => void
}

export default function RegisterForm({ onSuccess, onError, onFormDirtyChange }: RegisterFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      role: "user",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setError(null)
    setSuccessMessage(null)
    startTransition(async () => {
      try {
        const response = await registerAction(values)
        if (response.error) {
          setError(response.error)
          onError(response.error)
        } else {
          setSuccessMessage("Usuario creado exitosamente")
          setTimeout(() => {
            onSuccess()
            form.reset()
            setSuccessMessage(null)
            router.push("/inicio")
          }, 1500)
        }
      } catch (err) {
        const errorMessage = "Error inesperado. Por favor, intenta nuevamente."
        setError(errorMessage)
        onError(errorMessage)
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl rounded-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#63bae9]/5 via-[#fcc238]/5 to-transparent rounded-t-lg border-b border-slate-200/50 p-6">
        <div className="flex items-center space-x-3">
          <User className="h-6 w-6 text-[#63bae9]" />
          <h2 className="text-xl font-semibold text-[#686363]">
            Crear nuevo Usuario
          </h2>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8 space-y-6">
        {/* Alertas */}
        {successMessage && (
          <Alert className="border-[#63bae9]/20 bg-[#63bae9]/10 max-w-2xl mx-auto">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363] text-sm">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50/50 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
                      <User className="h-4 w-4 text-[#63bae9]" />
                      Nombre de usuario
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Juan Pérez"
                        {...field}
                        type="text"
                        disabled={isPending}
                        className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                      {form.formState.errors.name?.message && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {form.formState.errors.name?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
                      <Mail className="h-4 w-4 text-[#63bae9]" />
                      Correo electrónico
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="usuario@empresa.com"
                        {...field}
                        type="email"
                        disabled={isPending}
                        className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                      {form.formState.errors.email?.message && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {form.formState.errors.email?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Campo de teléfono usando PhoneInputField */}
              <PhoneInputField
                control={form.control}
                name="phone"
                label="Teléfono"
                placeholder="Ej: +54 9 11 2345 6789"
                disabled={isPending}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
                      <Lock className="h-4 w-4 text-[#63bae9]" />
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                          disabled={isPending}
                          className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50 pr-12 text-sm sm:text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[#63bae9]/10 hover:text-[#63bae9] rounded-lg"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isPending}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-[#969696]" />
                          ) : (
                            <Eye className="h-4 w-4 text-[#969696]" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                      {form.formState.errors.password?.message && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {form.formState.errors.password?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
                      <Lock className="h-4 w-4 text-[#63bae9]" />
                      Confirmar contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repite tu contraseña"
                          {...field}
                          disabled={isPending}
                          className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50 pr-12 text-sm sm:text-base"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-[#63bae9]/10 hover:text-[#63bae9] rounded-lg"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isPending}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-[#969696]" />
                          ) : (
                            <Eye className="h-4 w-4 text-[#969696]" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                      {form.formState.errors.confirmPassword?.message && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {form.formState.errors.confirmPassword?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-[#686363] font-medium text-sm sm:text-base">
                      <Shield className="h-4 w-4 text-[#63bae9]" />
                      Rol
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                        <SelectTrigger className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 text-[#686363] bg-slate-50/50 text-sm sm:text-base">
                          <SelectValue placeholder="Selecciona un rol" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#969696]/20 rounded-xl shadow-lg">
                          <SelectItem
                            value="user"
                            className="text-[#686363] hover:bg-[#63bae9]/10 focus:bg-[#63bae9]/10 rounded-lg m-1 text-sm sm:text-base"
                          >
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-[#969696]" />
                              Usuario
                            </div>
                          </SelectItem>
                          <SelectItem
                            value="admin"
                            className="text-[#686363] hover:bg-[#63bae9]/10 focus:bg-[#63bae9]/10 rounded-lg m-1 text-sm sm:text-base"
                          >
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-[#63bae9]" />
                              Administrador
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                      {form.formState.errors.role?.message && (
                        <AlertCircle className="h-3 w-3" />
                      )}
                      {form.formState.errors.role?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-8 bg-[#969696]/20" />

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-6 rounded-xl border-[#969696]/50 text-[#686363] hover:bg-[#969696]/10 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                onClick={() => router.push("/usuarios")}
                disabled={isPending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="h-12 px-8 bg-gradient-to-r from-[#63bae9] to-[#63bae9]/90 hover:from-[#63bae9]/90 hover:to-[#63bae9]/80 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Usuario"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}