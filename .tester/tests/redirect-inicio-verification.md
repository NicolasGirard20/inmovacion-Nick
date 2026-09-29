# Verificación — Redirect a /inicio + menú de navegación en Header

Fecha: 2026-09-29
Resultado: APROBADO (con riesgos menores, ver abajo)

## Requisitos
1. Login y signup deben redirigir a `/inicio` al procesarse correctamente.
2. En la página estática (`page.tsx`), cuando el user NO está logueado, el menú
   de navegación debe mostrar ítems con enlaces a los submenús.

## Verificaciones por archivo

### 1. src/components/ui/FormLogin.tsx (línea 68)
- Antes: `window.location.href = '/'`
- Ahora: `window.location.href = '/inicio'`
- ✅ Se redirige al login exitoso a `/inicio`. Cumple req. 1.
- Ruta `/inicio` existe: `src/app/(protected)/inicio/page.tsx`.

### 2. src/middleware.ts (línea 65)
- Antes: `new URL("/")` → Ahora: `new URL("/inicio", nextUrl)`.
- Redirige auth autenticado que intenta ir a `/login` → `/inicio`. ✅ Coherente.
- Nota: `/inicio` NO está en `publicRoutes`; queda protegida. Aceptable porque
  redirects/login aplican solo a usuarios autenticados.

### 3. src/components/ui/RegisterForm.tsx (línea 63)
- Antes: `router.push("/usuarios")` → Ahora: `router.push("/inicio")`.
- ✅ Signup redirige a `/inicio`. Cumple req. 1.

### 4. src/app/(protected)/usuarios/nuevo/page.tsx (línea 106)
- Antes: `setTimeout(() => router.push("/usuarios"), 1500)`
- Ahora: `setTimeout(() => router.push("/inicio"), 1500)`.
- ✅ Redirige tras alta de usuario a `/inicio`. Cumple req. 1 en el caso de
  creación de usuarios desde el panel admin (se considera signup interno).

### 5. src/components/ui/Header.tsx
- Íconos agregados: `Building2`, `Scale`, `Mail` (todos de `lucide-react`, ya
  usados también en `page.tsx`, import válido).
- Bloque user NO logueado: agrega un `<nav hidden md:flex>` con 4 ítems:
  - Inicio → `/` (ícono Home)
  - Propiedades → `/propiedades` (ícono Building2)
  - Servicios → `#servicios` (ícono Scale)
  - Contacto → `#contacto` (ícono Mail)
- Se conserva botón "Iniciar sesión".
- ✅ Cumple req. 2: se muestran ítems con enlaces a submenús cuando NO logueado.
- Comprobación de destinos:
  - `/propiedades` existe: `src/app/propiedades/page.tsx` (página pública).
  - `#servicios` y `#contacto` existen en `page.tsx` (sections id="servicios" y
    id="contacto"). ✅ Los anchors apuntan a secciones de la página estática.

## TypeScript
- `tsc --noEmit` arroja errores **preexistentes** en otras rutas API y en
  `RegisterForm.tsx:168` (`Control<...>` vs `Control<any>`) — NO introducidos por
  estas modificaciones (el cambio de RegisterForm es en la línea 63, no en la 168).
- Los 4 archivos de redirección y el Header no introducen errores de tipado nuevos.

## Fallos reproducibles
Ninguno.

## Cobertura faltante y riesgos
- Riesgo bajo: la ruta `/inicio` está protegida (no en `publicRoutes`). Para el
  registro normal esto es correcto porque quien crea una cuenta espera una sesión
  autenticada. Si por alguna vía un usuario no autenticado llegara a `/inicio`,
  el middleware lo redirige a `/login` (correcto).
- Riesgo: en `usuarios/nuevo/page.tsx` el alta de un nuevo usuario admin redirige
  a `/inicio` en vez de `/usuarios`. Esto cambia el flujo del panel admin
  (el botón cancelar/volver sigue a `/usuarios`). No es un error funcional, pero
  el UX del admin puede desear permanecer en la lista. A validar con el usuario.
- `npm run lint` / `next lint` no disponibles en entorno (problema preexistente
  de Next 16/TS 7.0.2); validación parcial en lint.

## Recomendaciones
- Confirmar con el usuario si el alta de usuario admin debe ir a `/inicio` o
  mantener `/usuarios` (solo un caso de uso distinto; no bloquea el requisito).
