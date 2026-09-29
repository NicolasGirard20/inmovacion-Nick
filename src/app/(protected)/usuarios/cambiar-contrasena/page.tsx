//src/app/(protected)/usuarios/cambiar-contrasena/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Lock, 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Building 
} from "lucide-react";
import Modal from '@/components/ui/Modal';
import { changePassword } from "@/actions/user-actions";
import { registerSchema } from "@/lib/zod"; // Importa el esquema desde zod.ts

// Esquema de validación para cambio de contraseña
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: registerSchema.shape.password, // Reutiliza las reglas de password de registerSchema
  confirmPassword: registerSchema.shape.confirmPassword, // Reutiliza las reglas de confirmPassword
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface LoadingState {
  isSubmitting: boolean;
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isSubmitting: false,
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Agregar log para depurar la sesión
  console.log("Session Status:", sessionStatus, "Session Data:", session);

  // Redirigir si no está autenticado
  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-6">
            <Skeleton className="h-10 w-40" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    console.log("No session, redirecting to /login");
    router.push("/login");
    return null;
  }

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      setLoadingState((prev) => ({ ...prev, isSubmitting: true }));
      setErrorState({ hasError: false, message: "" });
      
      console.log("Submitting changePassword for userId:", session.user.id);
      await changePassword(session.user.id, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      setSuccessMessage("Contraseña actualizada exitosamente");
      
      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push("/usuarios/perfil");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error en onSubmit:", error);
      setErrorState({
        hasError: true,
        message: error.message || "Error al cambiar la contraseña. Por favor, intenta nuevamente.",
      });
    } finally {
      setLoadingState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setIsModalOpen(true);
    } else {
      router.push("/usuarios/perfil");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200 hover:scale-105 shadow-md"
          >
            <Link href="/usuarios/perfil">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al perfil
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-[#63bae9]" />
              <h1 className="text-3xl font-bold text-[#686363] tracking-tight">
                Cambiar Contraseña
              </h1>
            </div>
            <p className="text-[#969696] ml-9">
              Actualiza tu contraseña de forma segura
            </p>
          </div>
        </div>

        {/* Alertas */}
        {errorState.hasError && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto shadow-lg border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {errorState.message}
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-6 max-w-2xl mx-auto shadow-lg border-[#63bae9]/20 bg-[#63bae9]/10">
            <CheckCircle className="h-4 w-4 text-[#63bae9]" />
            <AlertDescription className="text-[#686363]">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl max-w-2xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-[#63bae9]/5 via-[#fcc238]/5 to-transparent rounded-t-lg border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Lock className="h-6 w-6 text-[#63bae9]" />
                <h2 className="text-xl font-semibold text-[#686363]">
                  Formulario de Cambio de Contraseña
                </h2>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                          <Lock className="h-4 w-4 text-[#63bae9]" />
                          Contraseña Actual
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password"
                            className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50"
                            placeholder="Ingresa tu contraseña actual"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                          {form.formState.errors.currentPassword?.message && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {form.formState.errors.currentPassword?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                          <Lock className="h-4 w-4 text-[#63bae9]" />
                          Nueva Contraseña
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password"
                            className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50"
                            placeholder="Ingresa tu nueva contraseña"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm flex items-center gap-1">
                          {form.formState.errors.newPassword?.message && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {form.formState.errors.newPassword?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                          <Lock className="h-4 w-4 text-[#63bae9]" />
                          Confirmar Nueva Contraseña
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="password"
                            className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50"
                            placeholder="Confirma tu nueva contraseña"
                          />
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
                </div>

                <Separator className="my-8 bg-[#969696]/20" />

                {/* Botones de acción */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-6 rounded-xl border-[#969696]/50 text-[#686363] hover:bg-[#969696]/10 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                    onClick={handleCancel}
                    disabled={loadingState.isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    className="h-12 px-8 bg-gradient-to-r from-[#63bae9] to-[#63bae9]/90 text-white hover:from-[#63bae9]/90 hover:to-[#63bae9]/80 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
                    disabled={loadingState.isSubmitting || !form.formState.isDirty}
                  >
                    {loadingState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                </div>

                {/* Indicador de cambios */}
                {form.formState.isDirty && (
                  <div className="text-center text-sm text-[#fcc238] bg-[#fcc238]/10 p-3 rounded-lg border border-[#fcc238]/20 mt-4">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Tienes cambios sin guardar
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Modal de confirmación */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => router.push("/usuarios/perfil")}
          title="Confirmar Cancelación"
          message="Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?"
          confirmText="Salir sin guardar"
          cancelText="Volver al formulario"
          variant="danger"
        />
      </div>
    </div>
  );
}