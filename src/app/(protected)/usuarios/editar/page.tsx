// EditUserPage Component - src/app/(protected)/usuarios/editar/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Mail, 
  Shield, 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Edit3, 
  Building 
} from "lucide-react";
import Modal from '@/components/ui/Modal';
import { getUserById, updateUser } from "@/actions/user-actions";
import { PhoneInputField } from "@/components/ui/PhoneInputField";

// Esquema de validación
const editUserSchema = z.object({
  name: z.string()
    .min(1, "El nombre es requerido")
    .max(32, "El nombre no puede exceder 32 caracteres"),
  email: z.string()
    .min(1, "El correo es requerido")
    .email("Introduce un correo válido")
    .toLowerCase(),
  phone: z.string()
    .min(1, "El teléfono es requerido")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^[\d\s\-\+\(\)]+$/, "Formato de teléfono inválido"),
  role: z.enum(["user", "admin"], { 
    message: "Debe seleccionar un rol válido" 
  }),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

interface LoadingState {
  isLoading: boolean;
  isSubmitting: boolean;
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  const { data: session, status: sessionStatus } = useSession();
  
  const [user, setUser] = useState<EditUserFormValues | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isSubmitting: false
  });
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    message: ""
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "user",
    },
  });

  // Check de autorización en el cliente
  useEffect(() => {
    if (sessionStatus === "loading" || !userId) return;

    if (!session) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin" && session.user.id !== userId) {
      setErrorState({
        hasError: true,
        message: "No autorizado para editar este usuario.",
      });
      setTimeout(() => router.push("/usuarios/perfil"), 2000);
    }
  }, [sessionStatus, session, userId, router]);

  // Cargar datos del usuario
  useEffect(() => {
    if (userId) {
      const fetchUser = async () => {
        try {
          setLoadingState(prev => ({ ...prev, isLoading: true }));
          setErrorState({ hasError: false, message: "" });
          
          const userData = await getUserById(userId);
          setUser(userData);
          form.reset(userData);
          
          setLoadingState(prev => ({ ...prev, isLoading: false }));
        } catch (error) {
          console.error("Error al cargar usuario:", error);
          setErrorState({
            hasError: true,
            message: "Error al cargar los datos del usuario. Por favor, intenta nuevamente."
          });
          setLoadingState(prev => ({ ...prev, isLoading: false }));
        }
      };
      
      fetchUser();
    }
  }, [userId, form]);

  const onSubmit = async (values: EditUserFormValues) => {
    if (!userId) return;
    
    try {
      setLoadingState(prev => ({ ...prev, isSubmitting: true }));
      setErrorState({ hasError: false, message: "" });
      
      await updateUser(userId, values);
      
      setSuccessMessage("Usuario actualizado exitosamente");
      
      // Redirigir después de un breve delay para mostrar el mensaje de éxito
      setTimeout(() => {
        router.push("/usuarios");
      }, 1500);
      
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setErrorState({
        hasError: true,
        message: "Error al actualizar el usuario. Por favor, intenta nuevamente."
      });
    } finally {
      setLoadingState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleCancel = () => {
    if (form.formState.isDirty) {
      setIsModalOpen(true);
    } else {
      router.push("/usuarios");
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/usuarios")}
              className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200 hover:scale-105 shadow-md"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a usuarios
            </Button>
          </div>
          <Alert variant="destructive" className="max-w-md mx-auto shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudo encontrar el ID del usuario a editar.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

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
            <Link href="/usuarios">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a usuarios
            </Link>
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-[#63bae9]" />
              <h1 className="text-3xl font-bold text-[#686363] tracking-tight">
                Editar Usuario
              </h1>
            </div>
            <p className="text-[#969696] ml-9">
              Actualiza la información de <span className="font-medium text-[#686363]">{user?.name || "Usuario"}</span>
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
                <Edit3 className="h-6 w-6 text-[#63bae9]" />
                <h2 className="text-xl font-semibold text-[#686363]">
                  Información del Usuario
                </h2>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {loadingState.isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24 bg-slate-200/50" />
                    <Skeleton className="h-12 w-full bg-slate-100/50 rounded-xl" />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-4">
                  <Skeleton className="h-12 w-24 bg-slate-100/50 rounded-xl" />
                  <Skeleton className="h-12 w-36 bg-slate-100/50 rounded-xl" />
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                            <User className="h-4 w-4 text-[#63bae9]" />
                            Nombre Completo
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50"
                              placeholder="Ingresa el nombre completo"
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
                          <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                            <Mail className="h-4 w-4 text-[#63bae9]" />
                            Correo Electrónico
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 text-[#686363] placeholder-[#969696] bg-slate-50/50"
                              placeholder="correo@ejemplo.com"
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
                      placeholder="+54 9 11 2345 6789"
                      disabled={loadingState.isSubmitting}
                    />

                    {session?.user.role === "admin" && (
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2 text-[#686363] font-medium">
                              <Shield className="h-4 w-4 text-[#63bae9]" />
                              Rol del Usuario
                            </FormLabel>
                            <FormControl>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="h-12 rounded-xl border-[#969696]/20 focus:border-[#63bae9] focus:ring-[#63bae9]/20 transition-all duration-200 bg-slate-50/50 text-[#686363]">
                                  <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-[#969696]" />
                                      Usuario
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="admin">
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
                    )}
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
            )}
          </CardContent>
        </Card>

        {/* Modal de confirmación */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={() => router.push("/usuarios")}
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