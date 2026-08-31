// Archivo: src/lib/mail.ts
// Descripción: Envío de correos para inmovacion.
// Proyecto: inmovacion (GBS y Asociados), sistema inmobiliario.

import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend(): Resend | null {
  if (resendInstance) return resendInstance;
  const apiKey = process.env.AUTH_RESEND_KEY;
  if (!apiKey) {
    console.warn(
      '[mail] AUTH_RESEND_KEY no configurada o vacía; el envío de emails está deshabilitado.'
    );
    return null;
  }
  resendInstance = new Resend(apiKey);
  return resendInstance;
}

export const sendEmailVerification = async (email: string, token: string, isResetPassword: boolean = false) => {
  const resend = getResend();
  if (!resend) {
    console.warn(`[mail] No se envió email a ${email}: AUTH_RESEND_KEY no configurada.`);
    return { error: true };
  }

  try {
        let subject = '';
        let htmlContent = '';

        if (isResetPassword) {
            subject = 'Restablecimiento de contraseña';
            htmlContent = `<p>Haz clic aquí para restablecer tu contraseña:</p><a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}">Restablecer contraseña</a>`;
        } else {
            subject = 'Verificación de correo electrónico';
            htmlContent = `<p>Verifica tu correo electrónico</p><a href="${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}">VERIFICAR CORREO ELECTRÓNICO</a>`;
        }

        await resend.emails.send({
            from: 'NextAuth js <onboarding@resend.dev>',
            to: email,
            subject: subject,
            html: htmlContent,
        });

        return { success: true };
    } catch (error) {
        console.log(error);
        return { error: true };
    }
};