# inmovacion — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. Toda regla aquí descrita debe respetarse sin excepción. Nada de lo que no esté respaldado por el código debe suponerse ni inventarse.

---

## Integración con Agentes de IA

Este proyecto cuenta con un sistema de configuración para agentes de IA. Los siguientes archivos orquestan el comportamiento automático del agente:

| Archivo | Rol |
|---------|-----|
| `.opencode/config.json` | Configuración técnica del agente: skills, triggers, rutas de scripts |
| `.agents/init.sh` / `.agents/init.py` | Script de bootstrap que se ejecuta al iniciar cada sesión (genera mapa del proyecto, verifica dependencias) |
| `.agents/rules/DESIGN.md` | Guía de diseño visual, arquitectura, stack y convenciones técnicas |
| `.agents/rules/coding-rules.json` | Reglas de estilo y arquitectura en formato estructurado para validación automática de prompts |
| `PRODUCT_REQUIREMENTS.md` | Requerimientos funcionales de producto, criterios de aceptación y alcance |
| `.agents/skills/project-mapper/` | Skill local que mapea la estructura completa del proyecto y filtra contexto relevante |
| `.agents/skills/prompt-toolkit/` | Skill local con templates de prompts parametrizables y validador de seguridad |

### Flujo de inicio de sesión
1. El agente lee `.opencode/config.json` para conocer las skills y reglas del proyecto.
2. Ejecuta `.agents/init.sh` (o `.agents/init.py`) que regenera el mapa del proyecto si es necesario.
3. Consulta `.agents/rules/DESIGN.md` y `AGENTS.md` como fuentes de verdad para reglas de negocio, stack y convenciones.
4. Usa `.agents/rules/coding-rules.json` para validar que las implementaciones respeten las directrices del proyecto.
5. Antes de enviar prompts o ejecutar tareas críticas, valida el contexto contra las reglas del proyecto.

---

## Arquitectura General

- **Proyecto**: `inmovacion` (GBS y Asociados) — Gestión inmobiliaria y jurídica (inmuebles, clientes, contratos, cobranzas, pagos a proveedores, rendiciones con IPC, recibos PDF y reportes Excel).
- **Stack detectado y configurado**:
  - **Framework**: Next.js 16 (App Router) + React 19
  - **Lenguaje**: TypeScript (Strict Mode)
  - **Estilos**: Tailwind CSS v4 + `tw-animate-css` (variables semánticas OKLCH)
  - **UI Library**: Radix UI Primitives (`@radix-ui/*`) + CVA + `clsx` + `tailwind-merge`
  - **Iconografía**: `lucide-react`
  - **ORM & DB**: Prisma ORM + `@prisma/adapter-pg` + PostgreSQL (`src/generated/prisma`)
  - **Auth**: NextAuth v5 Beta (`auth.ts`, `auth.config.ts`, `src/middleware.ts`)
  - **Formularios & Validación**: `react-hook-form` + `@hookform/resolvers` + `zod` (`src/lib/zod.ts`)
  - **Data Fetching & Cache**: TanStack React Query (`@tanstack/react-query`)
  - **Storage**: Supabase Storage (`src/lib/supabase-storage.ts`)
  - **Documentos & Reportes**: PDFKit / jsPDF / pdf-lib, ExcelJS, DocxTemplater / PizZip

### Estructura de carpetas
```
├── AGENTS.md
├── PRODUCT_REQUIREMENTS.md
├── Propuestas.md
├── README.md
├── auth.config.ts
├── auth.ts
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma/
├── public/
├── scripts/
├── src/
│   ├── actions/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (protected)/
│   │   ├── api/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/
│   │   └── ...
│   ├── db/
│   ├── generated/prisma/
│   ├── lib/
│   ├── middleware.ts
│   ├── providers/
│   └── types/
└── tsconfig.json
```

### Capas
1. **Rutas/páginas (`src/app/`)**: Server Components para carga inicial y layouts; Client Components para interactividad puntual.
2. **Componentes (`src/components/`)**: UI modular dividida en componentes base (`src/components/ui/`) y formularios de dominio.
3. **Lógica de negocio y Server Actions (`src/actions/`)**: Acciones organizadas por dominio (`clientes`, `pagos`, `proveedores`, `servicios`, `auth`).
4. **Route Handlers (`src/app/api/`)**: Endpoints dedicados para streams de archivos (PDF, Excel, IPC, templates).
5. **Servicios y Helpers (`src/lib/`)**: Cliente Prisma (`db.ts`), validadores Zod (`zod.ts`), exportadores PDF/Excel, Supabase Storage y correo.

---

## Reglas de Diseño y Estilo

### Nomenclatura
- Archivos de componentes: `PascalCase.tsx`
- Server Actions, services y helpers: `camelCase.ts`
- Carpetas y rutas: `kebab-case`
- Código, variables y funciones en inglés; **labels, botones y mensajes al usuario estrictamente en español**.

### Componentes y UI
- Estilos: **solo clases de Tailwind CSS v4** con tokens semánticos de `globals.css`.
- Paleta: Azul marca (`#63bae9`), Amarillo acento (`#fcc238`), Grises y modos claro/oscuro.
- Iconografía única: `lucide-react`.
- Estados visuales obligatorios: Skeleton en carga asíncrona, estado vacío descriptivo y toast/alertas amigables ante errores.

### React / TypeScript
- TypeScript estricto: **prohibido `any`**.
- Server Components por defecto; `'use client'` solo en componentes interactivos con estado o hooks.
- Formularios gestionados exclusivamente con `react-hook-form` y validación Zod.

---

## Seguridad (REGLA CRÍTICA)

- **Nunca exponer secrets**, tokens ni strings de conexión en código, logs ni respuestas de API.
- **Validación obligatoria de inputs** con Zod antes de persistir o procesar en servidor.
- Base de datos: acceso únicamente vía Prisma ORM (queries parametrizadas con `db`).
- Control de acceso y protección de rutas gestionado por `src/middleware.ts` y roles (`admin` / `user`).

---

## Comandos

```bash
npm run dev      # desarrollo con Turbopack
npm run build    # build de producción
npm run start    # servidor de producción
npm run lint     # eslint
```

---

## Mantenimiento de este documento

- Mantener sincronizados `AGENTS.md`, `.agents/rules/DESIGN.md` y `.agents/rules/coding-rules.json`.
- Si cambian rutas de skills o triggers, actualizar `.opencode/config.json`.
- Para regenerar el mapa del proyecto, ejecutar `.agents/init.sh`.
