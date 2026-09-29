//src/app/(protected)/usuarios/perfil/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  Calendar, 
  Edit, 
  Mail, 
  Phone, 
  Shield, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  Building,
  ArrowLeft,
  Lock
} from "lucide-react";
import { getUserById } from "@/actions/user-actions";
import type { User } from "../../../../../types/user";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para manejar la navegación hacia atrás con fallback
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    // Chequea autenticación
    if (!session) {
      router.push("/"); // Redirigir a home si no está logueado
      return;
    }

    // Fetch usuario
    const fetchUser = async () => {
      try {
        const userData = await getUserById(session.user.id);
        setUser(userData as User);
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setError("No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    if (session.user.id) {
      fetchUser();
    } else {
      setError("ID de usuario no disponible");
      setLoading(false);
    }
  }, [session, status, router]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-8">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            
            {/* Main card skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card className="shadow-xl border-0">
                  <CardHeader className="space-y-4 pb-6">
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-24 w-24 rounded-full" />
                      <div className="space-y-3">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="shadow-xl border-0">
                  <CardContent className="p-6">
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          
          <Alert variant="destructive" className="max-w-md mx-auto shadow-lg">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || "Error al cargar el perfil"}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Utilerías para badges dinámicos
  const getRoleInfo = (role: string) => {
    switch (role) {
      case "admin":
        return { 
          label: "Administrador", 
          className: "bg-[#63bae9] text-white hover:bg-[#63bae9]/90", 
          icon: Shield 
        };
      default:
        return { 
          label: "Usuario", 
          className: "bg-[#969696]/20 text-[#686363] hover:bg-[#969696]/30", 
          icon: Users 
        };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "active":
        return { 
          label: "Activo", 
          className: "bg-[#fcc238] text-[#686363] hover:bg-[#fcc238]/90" 
        };
      default:
        return { 
          label: "Inactivo", 
          className: "bg-red-100 text-red-800 border-red-200" 
        };
    }
  };

  const roleInfo = getRoleInfo(user.role);
  const statusInfo = getStatusInfo(user.status);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="border-[#63bae9] text-[#63bae9] hover:bg-[#63bae9] hover:text-white transition-all duration-200 hover:scale-105 shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-[#63bae9]" />
              <h1 className="text-3xl font-bold text-[#686363] tracking-tight">
                Mi Perfil
              </h1>
            </div>
            <p className="text-[#969696] ml-9">
              Información completa de <span className="font-medium text-[#686363]">{user.name}</span>
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-[#63bae9]/5 via-[#fcc238]/5 to-transparent rounded-t-lg border-b border-slate-200/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <Avatar className="h-24 w-24 shadow-lg ring-4 ring-white transition-transform duration-300 hover:scale-105">
                    <AvatarFallback className="bg-gradient-to-br from-[#63bae9] to-[#63bae9]/80 text-white text-2xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3 flex-1">
                    <div>
                      <CardTitle className="text-2xl text-[#686363] font-bold tracking-tight">
                        {user.name}
                      </CardTitle>
                      <CardDescription className="text-[#969696] mt-1 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusInfo.className}>
                        <UserCheck className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <Badge className={roleInfo.className}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-[#63bae9]/10 rounded-lg">
                      <Users className="h-4 w-4 text-[#63bae9]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#686363]">
                      Información de Contacto
                    </h3>
                  </div>
                  <Separator className="bg-[#969696]/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">Email</span>
                      </div>
                      <p className="text-[#686363] font-medium">{user.email}</p>
                    </div>
                    
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">Teléfono</span>
                      </div>
                      <p className="text-[#686363] font-medium">{user.phone || "No especificado"}</p>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-[#fcc238]/10 rounded-lg">
                      <Shield className="h-4 w-4 text-[#fcc238]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#686363]">
                      Información del Sistema
                    </h3>
                  </div>
                  <Separator className="bg-[#969696]/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">ID de Usuario</span>
                      </div>
                      <p className="text-[#686363] font-medium font-mono text-sm">{user.id}</p>
                    </div>
                    
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">Rol del Sistema</span>
                      </div>
                      <Badge className={roleInfo.className}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Timeline Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#686363]">
                      Cronología
                    </h3>
                  </div>
                  <Separator className="bg-[#969696]/20" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">Fecha de Registro</span>
                      </div>
                      <p className="text-[#686363] font-medium">
                        {new Date(user.createdAt).toLocaleDateString("es-ES", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    
                    <div className="group p-4 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all duration-200 border border-transparent hover:border-[#63bae9]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-4 w-4 text-[#63bae9]" />
                        <span className="text-sm font-medium text-[#969696]">Última Actualización</span>
                      </div>
                      <p className="text-[#686363] font-medium">
                        {new Date(user.updatedAt).toLocaleDateString("es-ES", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#686363] flex items-center gap-2">
                  <Edit className="h-5 w-5 text-[#63bae9]" />
                  Acciones del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#63bae9] to-[#63bae9]/90 text-white hover:from-[#63bae9]/90 hover:to-[#63bae9]/80 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <Link href={`/usuarios/editar?id=${user.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#fcc238] to-[#fcc238]/90 text-white hover:from-[#fcc238]/90 hover:to-[#fcc238]/80 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <Link href="/usuarios/cambiar-contrasena">
                    <Lock className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* User Stats Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#686363] flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#fcc238]" />
                  Estado del Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100/50">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#63bae9] to-[#63bae9]/80 text-white mb-4">
                    <RoleIcon className="h-8 w-8" />
                  </div>
                  <h4 className="font-semibold text-[#686363] mb-2">{roleInfo.label}</h4>
                  <Badge className={statusInfo.className}>
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="text-xs text-[#969696] text-center">
                  Usuario registrado hace {Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} días
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}