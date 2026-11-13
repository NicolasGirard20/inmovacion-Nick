// Archivo: src/actions/auth-action.ts
// Descripción: Acciones de autenticación para inmovacion.
// Proyecto: inmovacion (GBS y Asociados), sistema inmobiliario.

'use server';

import { z } from "zod";
import { loginSchema, registerSchema, resetPasswordSchema } from "@/lib/zod";
import { auth, signIn } from "../../auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { nanoid } from 'nanoid';
import { sendEmailVerification } from '@/lib/mail';
import { revalidatePath } from 'next/cache';

export const loginAction = async (values: z.infer<typeof loginSchema>) => {
  try {
    await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message || "Credenciales inválidas" };
    }
    return { error: 'Ocurrió un error inesperado. Intenta nuevamente más tarde.' };
  }
};

export const registerAction = async (values: z.infer<typeof registerSchema>) => {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return { error: "No autorizado para registrar usuarios" };
    }

    const { data, success } = registerSchema.safeParse(values);

    if (!success) {
      return { error: "Datos inválidos" };
    }

    const user = await db.user.findUnique({
      where: { email: data.email },
    });

    if (user) {
      return { error: "El usuario ya existe" };
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: passwordHash,
        emailVerified: new Date(),
        phone: data.phone,
        role: data.role,
      },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.cause?.err?.message };
    }
    return { error: 'Error 500' };
  }
};

export const forgotPasswordAction = async (email: string) => {
  try {
    const parsedEmail = z.string().email().safeParse(email);
    if (!parsedEmail.success) {
      return { success: false, error: 'Introduce un correo válido' };
    }

    const user = await db.user.findUnique({
      where: { email: parsedEmail.data },
    });

    if (!user) {
      return { success: true };
    }

    const existingToken = await db.verificationToken.findFirst({
      where: { identifier: parsedEmail.data },
    });

    if (existingToken) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: existingToken.identifier,
            token: existingToken.token,
          },
        },
      });
    }

    const token = nanoid();
    await db.verificationToken.create({
      data: {
        identifier: parsedEmail.data,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 horas
      },
    });

    await sendEmailVerification(parsedEmail.data, token, true);

    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al procesar la solicitud' };
  }
};

export async function resetPasswordAction(token: string, password: string) {
  try {
    const parsedPassword = resetPasswordSchema.safeParse({
      password,
      confirmPassword: password,
    });
    if (!parsedPassword.success) {
      return {
        success: false,
        error: parsedPassword.error.issues[0]?.message ?? 'Contraseña inválida',
      };
    }

    const verificationToken = await db.verificationToken.findFirst({
      where: { token, expires: { gt: new Date() } },
    });

    if (!verificationToken) {
      return { success: false, error: 'Token inválido o expirado' };
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const hashedPassword = await bcrypt.hash(parsedPassword.data.password, 10);

    await db.user.update({
      where: { email: verificationToken.identifier },
      data: { password: hashedPassword, emailVerified: new Date() },
    });

    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    revalidatePath('/login'); // Opcional: recarga la caché de /login
    return { success: true, message: 'Contraseña restablecida con éxito' };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Error al restablecer la contraseña' };
  }
}