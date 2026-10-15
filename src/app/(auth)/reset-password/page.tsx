// Archivo: src/app/(auth)/reset-password/page.tsx
// Descripción: Página para restablecer contraseña.
// Proyecto: inmovacion (GBS y Asociados), sistema inmobiliario.

'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResetPasswordForm from '@/components/ui/ResetPasswordForm';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccess) {
      timer = setTimeout(() => {
        router.push('/login?message=Contraseña restablecida con éxito');
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showSuccess, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold text-gray-900">
            Restablecer contraseña
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showSuccess ? (
            <div className="text-green-600 text-center font-semibold">
              ¡Contraseña restablecida con éxito! Serás redirigido en 3 segundos...
            </div>
          ) : (
            <Suspense fallback={<p className="text-center text-sm text-gray-500">Cargando...</p>}>
              {errorMessage && (
                <p className="mb-4 text-center text-sm text-red-600">{errorMessage}</p>
              )}
              <ResetPasswordForm onSuccess={() => setShowSuccess(true)} onError={(msg) => setErrorMessage(msg)} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


