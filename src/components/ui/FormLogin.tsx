//src/app/(protected)/ui/FormLogin.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { z } from 'zod';
import { loginSchema } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Shield
} from 'lucide-react';

interface FormLoginProps {
  isVerified: boolean;
}

const FormLogin: React.FC<FormLoginProps> = ({ isVerified }) => {
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await signIn('credentials', {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        
        if (response?.error) {
          setError('Credenciales inválidas o cuenta no verificada');
        } else if (response?.ok) {
          // Hard redirect para asegurar recarga total de la sesión y cookies en cliente
          window.location.href = '/inicio';
        }
      } catch (err) {
        setError('Error de conexión. Por favor, intenta nuevamente.');
      }
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-blue/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Contenedor principal */}
      <div className="relative w-full max-w-xl md:max-w-2xl lg:max-w-3xl">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-brand-blue to-brand-blue/90 rounded-2xl shadow-lg mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-text-warm mb-2">
            GBS y Asociados
          </h1>
          <p className="text-brand-text-muted-light">
            Sistema de Gestión 
          </p>
        </div>

        {/* Card principal */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-brand-blue/5 via-brand-accent/5 to-transparent rounded-t-lg border-b border-slate-200/50">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-brand-text-warm" />
              <h2 className="text-xl font-semibold text-brand-text-warm">
                Iniciar Sesión
              </h2>
            </div>
          </CardHeader>

          <CardContent className="p-8">
            {/* Alertas de estado */}
            {isVerified && (
              <Alert className="mb-6 border-brand-blue/20 bg-brand-blue/10 max-w-xl mx-auto">
                <CheckCircle className="h-4 w-4 text-brand-blue" />
                <AlertDescription className="text-brand-text-warm">
                  ¡Perfecto! Tu correo ha sido verificado. Ya puedes iniciar sesión.
                </AlertDescription>
              </Alert>
            )}

            {error === 'Por favor, revisa la verificación de correo electrónico' && (
              <Alert variant="destructive" className="mb-6 border-red-200 max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Necesitas verificar tu correo electrónico antes de continuar. Revisa tu bandeja de entrada.
                </AlertDescription>
              </Alert>
            )}

            {error && error !== 'Por favor, revisa la verificación de correo electrónico' && (
              <Alert variant="destructive" className="mb-6 border-red-200 max-w-xl mx-auto">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {/* Formulario */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Campo Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-brand-text-warm font-medium">
                        <Mail className="h-4 w-4 text-brand-blue" />
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          className="h-12 rounded-xl border-brand-text-muted-light/20 focus:border-brand-blue focus:ring-brand-blue/20 transition-all duration-200 text-brand-text-warm placeholder-brand-text-muted-light bg-slate-50/50"
                          disabled={isPending}
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

                {/* Campo Contraseña */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-brand-text-warm font-medium">
                        <Lock className="h-4 w-4 text-brand-blue" />
                        Contraseña
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Introduce tu contraseña"
                            className="h-12 rounded-xl border-brand-text-muted-light/20 focus:border-brand-blue focus:ring-brand-blue/20 transition-all duration-200 text-brand-text-warm placeholder-brand-text-muted-light bg-slate-50/50 pr-12"
                            disabled={isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-brand-blue/10 hover:text-brand-blue rounded-lg"
                            onClick={togglePasswordVisibility}
                            disabled={isPending}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-brand-text-muted-light" />
                            ) : (
                              <Eye className="h-4 w-4 text-brand-text-muted-light" />
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

                {/* Botón de envío */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-gradient-to-r from-brand-blue to-brand-blue/90 hover:from-brand-blue/90 hover:to-brand-blue/80 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </Button>
              </form>
            </Form>

            {/* Enlaces adicionales */}
            <div className="mt-8 text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-text-muted-light/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-brand-text-muted-light">¿Necesitas ayuda?</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <a 
                  href="/forgot-password" 
                  className="block text-sm text-brand-text-warm hover:text-brand-blue hover:underline transition-colors duration-200"
                >
                  ¿Olvidaste tu contraseña?
                </a>
                <p className="text-xs text-brand-text-muted-light">
                  ¿No tienes cuenta? Contacta al administrador
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-brand-text-muted-light">
          <p>© {new Date().getFullYear()} GBS y Asociados. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default FormLogin;