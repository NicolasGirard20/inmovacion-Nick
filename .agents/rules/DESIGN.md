---
trigger: always_on
---

# inmovacion — Guía de Diseño, Arquitectura y Convenciones

> Este documento es la **fuente de verdad técnica y visual** para cualquier agente o desarrollador que trabaje en `inmovacion`. Toda regla y convención aquí descrita debe respetarse sin excepción. Nada de lo que no esté respaldado por el código debe suponerse ni inventarse.

---

## 1. Visión y Propósito del Proyecto

**inmovacion** (GBS y Asociados) es una plataforma integral de **gestión inmobiliaria y jurídica** orientada a la administración eficiente de inmuebles, clientes (propietarios e inquilinos), proveedores, contratos de locación y compra-venta, cobranzas, pagos y rendiciones de cuentas con indexación por IPC, generación automatizada de recibos PDF, reportes en Excel y procesamiento de plantillas de contrato en formato Word (`.docx`).

---

## 2. Stack Tecnológico

| Capa | Tecnología / Paquete | Rol en el Proyecto |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | Arquitectura basada en React Server Components (RSC) y Server Actions. |
| **Librería UI** | React 19 | Motor de renderizado con compatibilidad para Concurrent Features. |
| **Lenguaje** | TypeScript | Tipado estricto en toda la aplicación (**prohibido el uso de `any`**). |
| **Estilos** | Tailwind CSS v4 + `tw-animate-css` | Utilidades de estilo, diseño responsive y temas claro/oscuro mediante variables OKLCH. |
| **Componentes UI** | Radix UI + CVA + `clsx` + `tailwind-merge` | Primitivas accesibles y combinables (`src/components/ui/`). |
| **Iconografía** | `lucide-react` | Librería estándar de iconos en toda la aplicación. |
| **ORM & DB** | Prisma ORM + `@prisma/adapter-pg` + PostgreSQL | Modelado de datos, migraciones y queries parametrizadas (`src/generated/prisma`). |
| **Autenticación** | NextAuth v5 (Beta) + `bcryptjs` | Control de sesiones, hashing de contraseñas y middleware de protección de rutas por roles (`admin`, `user`). |
| **Formularios & Validación** | `react-hook-form` + `@hookform/resolvers` + `zod` | Manejo de estado de formularios y validación estricta de esquemas (`src/lib/zod.ts`). |
| **Data Fetching & Cache** | TanStack React Query (`@tanstack/react-query`) | Caché en cliente y sincronización asíncrona (`src/providers/QueryProvider.tsx`). |
| **Almacenamiento** | Supabase Storage (`@supabase/supabase-js`) | Almacenamiento en la nube para comprobantes, imágenes de inmuebles y archivos. |
| **Documentos & Reportes** | `pdf-lib`, `jspdf`, `pdfkit`, `exceljs`, `docxtemplater`, `pizzip` | Generación de recibos PDF, reportes Excel y combinación de contratos Word. |
| **Notificaciones** | `react-hot-toast` | Alertas flotantes (toasts) de éxito, advertencia y error para feedback al usuario. |
| **Emails** | `resend`, `nodemailer`, `@emailjs/nodejs` | Envío de correos para verificación de cuenta y recuperación de contraseña. |

---

## 3. Arquitectura y Estructura del Código

### 3.1 Estructura de Directorios Principal
```
src/
├── actions/                  # Server Actions organizadas por dominio
│   ├── clientes/             # getClientes, cliente-actions, getTipoDocumento, getTipoClientes
│   ├── pagos/                # pagos-actions, validaciones, getEstadoPagos, getMediosPagos
│   ├── proveedores/          # getProveedores, proveedor-actions
│   ├── servicios/            # getTiposServicios
│   ├── auth-action.ts        # Acciones de autenticación y registro
│   ├── getUsers.ts           # Consultas de usuarios
│   └── user-actions.ts       # Mutaciones de perfil y usuarios
├── app/
│   ├── (auth)/               # Rutas públicas de autenticación (login, forgot-password, reset-password)
│   ├── (protected)/          # Backoffice protegido por sesión y rol
│   │   ├── admin/            # Panel de administración
│   │   ├── clientes/         # Listado, alta y edición de clientes
│   │   ├── cobranzas/        # Gestión y modificación de cobranzas a clientes
│   │   ├── contratos/        # Creación, edición y preview de contratos
│   │   ├── dashboard/        # Dashboard de bienvenida y KPIs operativos
│   │   ├── pagos/            # Pagos a proveedores
│   │   ├── propiedades/      # Gestión de inmuebles, subida de imágenes y filtros
│   │   ├── proveedores/      # Directorio y estados de proveedores
│   │   ├── rendiciones/      # Rendición de cuentas e indexación IPC
│   │   ├── servicios/        # Catálogo de servicios
│   │   ├── templates/        # Gestión de plantillas de contratos .docx
│   │   └── usuarios/         # Administración de usuarios y perfiles
│   ├── api/                  # Endpoints REST para downloads (PDF/Excel), IPC y webhooks
│   ├── globals.css           # Configuración de Tailwind CSS v4, temas OKLCH y utilidades de animación
│   ├── layout.tsx            # Layout raíz de la aplicación
│   ├── page.tsx              # Landing page pública
│   └── providers.tsx         # Contenedor de providers globales
├── components/
│   ├── ui/                   # Componentes base (Button, Card, Modal, Input, Select, Table, Badge, Form...)
│   ├── ClienteForm.tsx       # Formularios de dominio específico
│   ├── DocxViewer.tsx        # Visor de documentos Word
│   ├── Filtros.tsx           # Filtros dinámicos de búsqueda
│   ├── FormularioInmueble.tsx# Formulario de alta/edición de inmuebles
│   ├── InmuebleCard.tsx      # Tarjeta de presentación de propiedades
│   ├── PagoProveedorForm.tsx # Formulario de pago a proveedores
│   ├── ProveedorForm.tsx     # Formulario de alta/edición de proveedores
│   └── SubirImagenes.tsx     # Componente para carga de fotografías
├── db/                       # Consultas especializadas y helpers de base de datos
├── generated/prisma/         # Cliente de Prisma generado localmente
├── lib/
│   ├── db.ts                 # Instancia Singleton de PrismaClient con adapter pg
│   ├── excelGenerator.ts     # Utilidad de exportación a Excel
│   ├── mail.ts               # Lógica de envío de correos transaccionales
│   ├── pdfGenerator.ts       # Generador de recibos y liquidaciones PDF
│   ├── supabase-storage.ts   # Cliente y métodos de subida a Supabase Storage
│   ├── utils.ts              # Helper de combinación de clases CSS (cn)
│   └── zod.ts                # Esquemas de validación Zod unificados
├── middleware.ts             # Middleware de NextAuth para control de accesos y rutas públicas/protegidas
├── providers/
│   └── QueryProvider.tsx     # Configuración del cliente React Query
└── types/                    # Tipos e interfaces globales de TypeScript
```

### 3.2 Capas de Responsabilidad
1. **Páginas y Vistas (`src/app/`)**: Componentes de layout y página. Los Server Components deben cargar datos iniciales; los Client Components (`'use client'`) se reservan para formularios, modales y widgets interactivos.
2. **Componentes UI (`src/components/ui/`)**: Bloques de construcción visual atómicos y reutilizables basados en Radix UI.
3. **Lógica de Negocio y Acceso a Datos (`src/actions/` y `src/app/api/`)**:
   - Preferir **Server Actions** (`src/actions/`) para mutaciones y formularios.
   - Usar **Route Handlers** (`src/app/api/`) para endpoints que requieren devolver flujos binarios (PDFs, Excels, subida de archivos multipart).
4. **Validaciones de Dominio (`src/lib/zod.ts`)**: Esquemas Zod que actúan como contrato único entre el cliente y el servidor.
5. **Capa de Datos (`src/lib/db.ts`)**: Instancia única del cliente Prisma; todas las consultas a la base de datos se realizan a través de Prisma con queries parametrizadas.

---

## 4. Sistema de Diseño y Tokens Visuales

### 4.1 Paleta de Colores de la Marca
- **Azul Principal (`--color-brand-primary` / `#63bae9`)**: Acciones primarias, cabeceras, enlaces destacados, bordes activos y botones principales.
- **Azul Oscuro (`--color-brand-primary-dark` / `#3d3d3d`)**: Hover states de acciones primarias y fondos de navegación oscura.
- **Amarillo Acento (`--color-brand-accent` / `#fcc238`)**: Alertas leves, badges de estado pendiente, botones secundarios destacados e indicadores de atención.
- **Texto Principal (`--color-brand-text` / `#2e2e2e`)**: Tipografía de títulos y cuerpo principal en modo claro.
- **Texto Secundario / Muted (`--color-brand-text-muted` / `#6b6b6b`)**: Subtítulos, descripciones secundarias y metadatos.
- **Fondo de Marca (`--color-brand-bg` / `#f8f9fa`)**: Fondo general de páginas y contenedores de tarjetas.

### 4.2 Tokens Semánticos (Variables CSS en `globals.css`)
- **Fondo y Superficies**: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`.
- **Estados Semánticos**: `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`.
- **Bordes y Controles**: `--border`, `--input`, `--ring`, `--radius: 0.625rem`.
- **Modo Oscuro (`.dark`)**: Paleta basada en OKLCH con contraste validado para interfaces nocturnas.

### 4.3 Tipografía
- **Títulos y Encabezados (`h1`, `h2`, `h3`, `.serif`)**: Fuente con serifa elegante (`var(--font-crimson-pro)`).
- **Cuerpo y UI**: Tipografía Sans-Serif clara y altamente legible.

### 4.4 Clases de Animación y Efectos Predefinidos
- `animate-fade-in-up`, `animate-fade-in`, `animate-slide-in-left`, `animate-slide-in-right`, `animate-fade-slide-up`.
- `card-hover`: Elevación suave con `transform: translateY(-8px)` y sombra con tinte azul.
- `gradient-text`: Degradado aplicado al texto corporativo.

---

## 5. Reglas de Frontend y Componentes

1. **Server Components por Defecto**:
   - Todo componente debe ser Server Component a menos que use hooks (`useState`, `useEffect`, `useForm`, `useQuery`), eventos del DOM (`onClick`, `onChange`) o APIs del navegador.
   - Declarar `'use client'` estrictamente en la primera línea de los archivos que lo requieran.
2. **Formularios Estandarizados**:
   - Emplear siempre `react-hook-form` junto a `@hookform/resolvers/zod`.
   - Utilizar los esquemas exportados de `src/lib/zod.ts` para tipar e inferir las interfaces (`z.infer<typeof schema>`).
   - Evitar valores `null` en inputs de texto; inicializar siempre con string vacío `""`.
3. **Manejo de Estados de UI**:
   - Toda vista con carga asíncrona debe contemplar su respectivo **esqueleto (`Skeleton`)** o indicador de carga (`Loading`).
   - Si no existen registros, mostrar siempre un **estado vacío informativo** con llamada a la acción si corresponde.
   - En caso de error, desplegar alertas amigables y notificaciones via `react-hot-toast`.
4. **Diseño Responsive**:
   - Mobile first: layouts fluidos utilizables en pantallas de 320px hasta monitores ultra-wide.
   - Sidebar en móvil: overlay cerrable mediante botón hamburguesa y tecla `Escape`.
   - Sidebar en escritorio: panel expandido fijo.

---

## 6. Reglas de Backend, Datos y Seguridad

### 6.1 Acceso a Base de Datos
- **Exclusividad Prisma**: Toda consulta o mutación DEBE realizarse mediante `db` importado de `src/lib/db.ts`. Prohibido el uso de strings SQL concatenados.
- **Manejo de Relaciones**: Respetar las relaciones declaradas en `prisma/schema.prisma` (ej. `ClienteTipo`, `InmuebleImagen`, `Contrato`, `RendicionCobranza`).
- **Transacciones**: Emplear `db.$transaction([...])` cuando una operación involucre múltiples mutaciones interdependientes (ej. generar recibo y marcar cobranza como pagada).

### 6.2 Seguridad (REGLA CRÍTICA)
- **Cero Secretos en Código**: Prohibido hardcodear credenciales, API keys, tokens o strings de conexión en el repositorio. Usar siempre variables de entorno (`process.env.*`).
- **Validación en Servidor**: Todo Server Action y Route Handler debe validar los datos recibidos contra el esquema Zod antes de persistir o procesar la petición.
- **Protección de Rutas**: Control de acceso mediante `src/middleware.ts` y verificación de rol (`admin` vs `user`) en Server Actions críticas.
- **Sanitización de Logs**: Nunca imprimir contraseñas en texto plano, tokens sensibles ni datos personales no anonimizados en los logs.

---

## 7. Convenciones de Código y Nomenclatura

- **Componentes React**: `PascalCase.tsx` (ej. `FormularioInmueble.tsx`, `PagoProveedorForm.tsx`).
- **Archivos de Lógica, Acciones y Helpers**: `camelCase.ts` (ej. `excelGenerator.ts`, `clienteActions.ts`, `pdfGenerator.ts`).
- **Rutas y Carpetas**: `kebab-case` (ej. `forgot-password`, `medio-pago`, `tipo-documento`).
- **Idioma del Código**:
  - Código, variables, nombres de funciones e interfaces: **Inglés** o términos de dominio consistentes con la base de datos (ej. `fetchClients`, `createContract`, `inmuebleId`).
  - **Textos de Interfaz de Usuario (Labels, Botones, Mensajes, Notificaciones, Errores)**: **Estrictamente en Español**.
- **TypeScript Estricto**:
  - Prohibido el tipo `any`. Usar tipos específicos, genéricos o `unknown` con type guards si la estructura es dinámica.
  - Usar path alias `@/...` en lugar de imports relativos profundos (ej. `import { db } from "@/lib/db"`).

---

## 8. Comandos de Desarrollo y Operación

```bash
npm run dev      # Iniciar servidor de desarrollo con Turbopack
npm run build    # Compilar aplicación para producción
npm run start    # Iniciar servidor compilado en producción
npm run lint     # Ejecutar validaciones estáticas con ESLint
```

---

## 9. Mantenimiento y Sincronización

- Siempre que se modifique la estructura del proyecto, dependencias o reglas de arquitectura, actualizar este archivo `DESIGN.md`, `AGENTS.md` y `.agents/rules/coding-rules.json`.
- Para validar el mapa del proyecto, ejecutar `.agents/init.sh` o el script de `project-mapper`.
