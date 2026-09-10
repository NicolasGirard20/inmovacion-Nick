// src/middleware.ts

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "../auth.config";

// Inicializa NextAuth como middleware.
// "middleware" aquí es una función que valida la sesión de usuario.
const { auth: middleware } = NextAuth(authConfig);

// Rutas que NO requieren estar logueado.
const publicRoutes = [
  "/",
  "/usuarios/nuevo",
  "/login",
  "/api/auth/verify-email",
  "/forgot-password",
  "/api/auth/reset-password",
  "/reset-password",
  "/propiedades",
];

// Exportamos nuestro middleware personalizado.
export default middleware((req) => {
  const { nextUrl, auth } = req;

  // Si hay usuario, auth.user existe.
  const isLoggedIn = !!auth?.user;

  console.log({
    isLoggedIn,
    pathname: nextUrl.pathname,
  });

  /* -------------------------------------------------------------
     🛑 1) NUEVO: NO interferir con rutas API
     --------------------------------------------------------------
     Esto evita que al llamar rutas como /api/inmuebles
     NextAuth intente devolver HTML en lugar de JSON.
    
     ¡Esta línea corrige el error "Unexpected token '<'..."!
     ------------------------------------------------------------- */
  if (nextUrl.pathname.startsWith("/api/")) {
    console.log("Middleware: Skipping API route:", nextUrl.pathname);
    return NextResponse.next();
  }

  /* -------------------------------------------------------------
     🛡️ 2) Proteger solo páginas (no API)
     --------------------------------------------------------------
     - Si la ruta NO es pública
     - Y el usuario NO está logueado
     → Redirigimos a /login
     ------------------------------------------------------------- */
  if (!publicRoutes.includes(nextUrl.pathname) && !isLoggedIn) {
    console.log("Middleware: Redirecting to login from:", nextUrl.pathname);
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  /* -------------------------------------------------------------
     🔄 3) Redirigir si ya está autenticado e intenta ir a /login
     ------------------------------------------------------------- */
  if (isLoggedIn && nextUrl.pathname === "/login") {
    console.log("Middleware: Authenticated user accessing /login, redirecting to /");
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Si no hubo ninguna condición que bloquee,
  // simplemente permitimos avanzar.
  return NextResponse.next();
});

/* -------------------------------------------------------------
   ⚙️ Configuración del matcher
   --------------------------------------------------------------
   Define en qué rutas se ejecuta el middleware.
   Evita procesar archivos estáticos como .css, .png, etc.
------------------------------------------------------------- */
export const config = {
  matcher: [
    // Aplica a todas las rutas excepto:
    // archivos estáticos, _next, assets, etc.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",

    // Aplica también a /api/* y /trpc/*
    "/(api|trpc)(.*)",
  ],
};
