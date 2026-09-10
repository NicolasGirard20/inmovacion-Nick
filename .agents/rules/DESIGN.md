# DESIGN.md — Arquitectura y Diseño de inmovacion

> Documento de diseño arquitectónico y de interfaz para el proyecto **inmovacion** (GBS y Asociados).

---

## 1. Arquitectura del Proyecto

### 1.1 Estructura de Carpetas
```
├── AGENTS.md
├── auth.config.ts          # Configuración base de autenticación para Edge/Middleware
├── auth.ts                 # Configuración principal de Auth.js con Prisma Adapter y Providers
├── prisma/                 # Esquemas y migraciones de base de datos
├── public/                 # Recursos estáticos (imágenes, logos)
├── src/
│   ├── actions/            # Server Actions (mutaciones, auth, entidades)
│   ├── app/                # Next.js App Router (rutas públicas y agrupadas)
│   │   ├── (auth)/         # Rutas de autenticación (/login, /forgot-password, /reset-password)
│   │   ├── (protected)/    # Rutas protegidas (módulos de gestión: clientes, pagos, cobranzas, etc.)
│   │   ├── api/            # Route Handlers REST
│   │   ├── layout.tsx      # Root Layout con SessionProvider y QueryProvider
│   │   └── page.tsx        # Landing page pública con Header y secciones informativas
│   ├── components/         # Componentes React
│   │   ├── ui/             # Componentes de diseño base (Shadcn/Radix + Tailwind)
│   │   └── [Entity]Form.tsx# Formularios y componentes de dominio
│   ├── lib/                # Utilidades, configuración de DB Prisma, validadores Zod, mailers
│   ├── providers/          # Providers de contexto de cliente (QueryProvider, etc.)
│   └── middleware.ts       # Middleware de NextAuth para control de acceso y redirecciones
```

### 1.2 Capas del Sistema
1. **Presentación (App Router & UI Components)**:
   - Server Components por defecto para fetching y layouts.
   - Client Components (`'use client'`) solo cuando hay interactividad (formularios, menús, estados dinámicos).
2. **Autenticación y Seguridad (Auth.js / NextAuth v5)**:
   - Estrategia JWT con cookies httpOnly.
   - Middleware de protección para rutas privadas.
   - Sesión propagada desde Server Components (`await auth()`) hacia `SessionProvider`.
3. **Acceso a Datos y Negocio (Server Actions & API Routes)**:
   - Server Actions tipadas con Zod y persistencia vía Prisma ORM.
   - Manejo de transacciones y queries parametrizadas.

---

## 2. Patrones de Diseño

- **Server-Driven Auth State**: La autenticación se verifica en el servidor (`auth()`) y se inyecta en el cliente mediante `SessionProvider` para evitar destellos (FOUC) o estados de carga falsos.
- **Controlled Forms con React Hook Form + Zod**: Validación de esquema síncrona en cliente y asíncrona en Server Actions.
- **Modular Action Handlers**: Server Actions agrupadas por entidad en `src/actions/` con retorno uniforme `{ success?: boolean, error?: string, ... }`.
- **Atomic / Primitives UI Components**: Componentes UI reutilizables construidos sobre Radix UI y Tailwind CSS en `src/components/ui/`.

---

## 3. Reglas de Consistencia

- **TypeScript Estricto**: No usar `any`. Tipar explícitamente props, retornos y esquemas.
- **Nomenclatura**:
  - Componentes: `PascalCase.tsx`
  - Utilidades y acciones: `camelCase.ts`
  - Carpetas: `kebab-case`
- **Idioma**: Código, variables y comentarios técnicos en inglés/español consistente; **mensajes, botones y labels al usuario SIEMPRE en español**.
- **Manejo de Errores**: Nunca exponer errores internos ni stack traces al cliente; presentar mensajes amigables al usuario.

---

## 4. Consideraciones Anti-Alucinación Frontend

- **Paleta de Colores Institucional**:
  - Azul principal: `#63bae9` (hover: `#4ca8d8`, fondos suaves: `#e8f6fc` o `bg-brand-primary/10`)
  - Acento dorado / amarillo: `#fcc238` (fondos suaves: `#fff9e6` o `bg-brand-accent/10`)
  - Texto principal: `#686363` / `#4a4a4a` / `#2e2e2e`
  - Texto secundario / muted: `#969696`
  - Bordes: `#e5e7eb` / `border-gray-100`
- **Librería de Iconos**: Exclusivamente `lucide-react`.
- **Estado de Carga (Loading States)**: Usar componentes Skeleton o placeholders que repliquen la geometría del componente final en lugar de mostrar estados por defecto (ej. evitar mostrar botón "Iniciar sesión" mientras la sesión está cargando).
