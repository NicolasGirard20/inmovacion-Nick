# Product Requirements Document — inmovación

> **Estado:** Aprobado — `READY`  
> **Versión:** 1.0  
> **Fecha:** 2026-09-29  
> **Alcance:** Rediseño del layout del backoffice (header, sidebar y dashboard de Inicio)

------------------------------------------------------------------------

## 1. Resumen del objetivo

Trasladar a un nuevo layout el backoffice de Inversor, compuesto por un header superior, una sidebar izquierda y una página Inicio / dashboard, respetando permisos por rol, agrupación funcional y las convenciones del stack existente.

------------------------------------------------------------------------

## 2. Requisitos funcionales

### RF-01 — Selector de grupo en header (solo admin)
- El header superior debe incluir un selector de grupo funcional con, al menos, las opciones:
  * **Inmobiliaria**
  * **Abogacía**
- El selector es visible **únicamente para usuarios con rol `admin`**.
- La opción seleccionada persiste durante toda la sesión del usuario.
- El grupo activo afecta al contenido del sidebar y a las métricas del dashboard.

**Criterios de aceptación**
- [ ] Solo los `admin` ven y pueden interactuar con el selector.
- [ ] El valor seleccionado se mantiene al navegar entre páginas.
- [ ] Al cambiar el grupo, el sidebar se actualiza inmediatamente sin recarga.

------------------------------------------------------------------------

### RF-02 — Sidebar izquierdo dinámico por rol y grupo
- El sidebar presenta los siguientes items base para todo usuario autenticado:
  * **Inicio**
  * **Usuarios**
  * **Cerrar sesión**
- Además, debe exponer items dinámicos según el **grupo activo** del admin:
  * **Inmobiliaria:** Clientes, Propiedades, Proveedores, Pagos a Proveedores, Rendiciones, Contratos, Cobranzas a Clientes
  * **Abogacía:** EnDesarrollo (placeholder)
- **No se incluyen** secciones ni links del sitio público dentro del sidebar del backoffice.

**Criterios de aceptación**
- [ ] Un `admin` con grupo *Inmobiliaria* ve los 7 ítems dinámicos más los base.
- [ ] Un `admin` con grupo *Abogacía* ve el placeholder más los base.
- [ ] Un usuario `user` (no admin) ve solo los ítems estipulados en RF-07.

------------------------------------------------------------------------

### RF-03 — Comportamiento del sidebar
- **Desktop (>768 px aprox.):** el sidebar se muestra abierto por defecto.
- **Mobile (≤768 px aprox.):** el sidebar se comporta como un overlay cerrable.
- En mobile debe existir un botón hamburguesa en el header que permita abrir/cerrar el menú.
- El estado abierto/cerrado es **local al componente** y **no persiste** en localStorage ni en sesión.

**Criterios de aceptación**
- [ ] Al cargar en escritorio, el sidebar está expandido.
- [ ] En mobile, el menú oculto hasta tocar el botón hamburguesa.
- [ ] Al hacer click fuera del overlay en mobile, el menú se cierra.

------------------------------------------------------------------------

### RF-04 — Dashboard Inicio: bienvenida
- Toda usuario autenticado (cualquier rol o grupo) debe ver la sección de bienvenida en la página Inicio.
- La bienvenida debe incluir el nombre del usuario loggeado.

**Criterios de aceptación**
- [ ] Al acceder a `/inicio`, el usuario ve su nombre en la bienvenida.
- [ ] La bienvenida se renderiza sin importar rol o grupo.

------------------------------------------------------------------------

### RF-05 — Dashboard Inicio: métricas / KPIs
- Si el usuario tiene el grupo **Inmobiliaria** activo, el dashboard debe mostrar **3–4 KPIs reales** calculados a partir de datos existentes en la base de datos.
- Si el grupo es **Abogacía**, la sección de métricas debe mostrar un estado vacío con mensaje *"En desarrollo"*.
- Si el rol es **user** (sin capacidad de grupo), el dashboard **no muestra métricas**.

**Criterios de aceptación**
- [ ] Admin + Inmobiliaria: al menos 3 KPIs visibles con datos reales.
- [ ] Admin + Abogacía: placeholder de desarrollo visible.
- [ ] User: ausencia total de bloque de métricas.

------------------------------------------------------------------------

### RF-06 — Accesos directos basados en historial de navegación
- El dashboard debe sugerir módulos de acceso directo basados en el **historial de navegación del usuario**.
- Filtros aplicables:
  * Últimos **30 días**
  * Solo **módulos principales** (no rutas secundarias ni páginas de detalle)

**Criterios de aceptación**
- [ ] Se muestran hasta N accesos directos (máximo sugerido: 5).
- [ ] Solo se consideran rutas correspondientes a módulos principales.
- [ ] Si no hay historial en los últimos 30 días, se muestra mensaje informativo vacío.

------------------------------------------------------------------------

### RF-07 — Sidebar para rol `user`
- Los usuarios con rol `user` (no administrador) deben ver un sidebar reducido compuesto únicamente por:
  * **Inicio**
  * **Cerrar sesión**
- No deben ver el selector de grupo (RF-01) ni ítems dinámicos de cualquier grupo.

**Criterios de aceptación**
- [ ] Un usuario `user` solo ve Inicio y Cerrar sesión en el sidebar.
- [ ] No tiene acceso al selector de grupo.

------------------------------------------------------------------------

### RF-08 — Sidebar para rol `admin` (sin secciones públicas)
- Los usuarios con rol `admin` tienen sidebar completo según su grupo activo.
- **Bajo ninguna circunstancia** deben aparecer secciones o links del sitio público (landing, catálogo, contacto, etc.) dentro del sidebar del backoffice.

**Criterios de aceptación**
- [ ] Ningún ítem del sidebar apunta a rutas o secciones del sitio público.

------------------------------------------------------------------------

### RF-09 — Tracking de navegación
- Se requiere una **nueva tabla en base de datos** para registrar el historial de navegación de los usuarios.
- Campos mínimos sugeridos:
  * `id`
  * `userId` (referencia al usuario que navegó)
  * `route` (ruta accedida)
  * `module` (clasificación a módulo principal, para RF-06)
  * `createdAt`

**Criterios de aceptación**
- [ ] La tabla existe en el esquema de Prisma.
- [ ] Se registra al menos una fila por cada visita a un módulo principal.

------------------------------------------------------------------------

## 3. Atributos de calidad

| Atributo | Definición |
|----------|------------|
| **Seguridad** | El selector de grupo y los ítems protegidos del sidebar deben respetar estrictamente los roles entregados por `next-auth`. Nunca confiar en parámetros de URL para definir permisos. |
| **Rendimiento** | El sidebar y el selector deben ser Server Components salvo lógica interactiva mínima. Los KPIs deben cargar en < 500 ms optimizando agregaciones de Prisma. |
| **Accesibilidad** | El sidebar mobile debe ser cerrable con teclado (`Escape`) y con foco atrapado en el overlay. Contraste suficiente para la paleta actual. |
| **Observabilidad / mantenibilidad** | El tracking de navegación debe ser no intrusivo y desacoplable. Cada KPI debe tener un fallback de error visual. |

------------------------------------------------------------------------

## 4. Restricciones y reglas de negocio

- **Restricciones técnicas**
  * Stack: Next.js App Router, TypeScript en modo estricto, Tailwind CSS, Prisma, next-auth v5.
  * Server Components por defecto; `'use client'` solo donde sea indispensable.
  * Prohibido usar `any`.
  * No exponer secrets en código ni en respuestas de API.
  * Acceso a base de datos únicamente mediante Prisma (queries parametrizadas).

- **Reglas de negocio**
  * Solo `admin` puede alternar entre grupos; el resto de usuarios no tienen visibilidad de esta funcionalidad.
  * El sitio público se navega desde el header de la landing; **no se replica** en el sidebar del backoffice.
  * El estado del sidebar en mobile/desktop no debe persistir; es transitorio por acción del usuario.

------------------------------------------------------------------------

## 5. Fuera de alcance y dependencias

### Fuera de alcance
- CRUD de usuarios ni modificaciones profundas al módulo de usuarios existente.
- Desarrollo de las subpáginas de cada módulo del sidebar (Clientes, Propiedades, etc.) más allá de su declaración en el menú.
- Funcionalidades del grupo **Abogacía** (se declaran como placeholder).
- Secciones del sitio público.

### Dependencias
- Esquema de roles (`admin`, `user`) vigente en `next-auth`.
- Existencia de datos agregables para los KPIs de Inmobiliaria.
- Aprobación de la nueva tabla de tracking de navegación (RF-09) y migración correspondiente en Prisma.

------------------------------------------------------------------------

## 6. Paleta de colores a respetar

| Color | Hex | Uso sugerido |
|-------|-----|--------------|
| Azul principal | `#63bae9` | Selectores activos, acentos de header, links principales |
| Amarillo | `#fcc238` | Alertas leves, banners de estado, badges de métricas |
| Grises | (base Tailwind) | Fondos, bordes, texto secundario |

------------------------------------------------------------------------

## 7. Trazabilidad

| ID | Necesidad de usuario |
|----|----------------------|
| RF-01 | Los administradores operan en dos ramas de negocio distintas y necesitan cambiar de contexto sin salir del backoffice. |
| RF-02 | Cada rol debe ver únicamente lo que puede operar, evitando ruido cognitivo. |
| RF-03 | Exigencia de usabilidad en dispositivos móviles sin penalizar la experiencia desktop. |
| RF-04 | Todo usuario debe sentirse identificado al ingresar al sistema. |
| RF-05 | Inmobiliaria requiere visión operativa inmediata; Abogacía aún no tiene métricas definidas. |
| RF-06 | Reducir fricción permitiendo regresar rápidamente a módulos frecuentes. |
| RF-07 | El rol `user` tiene permisos restringidos que deben reflejarse en el layout. |
| RF-08 | Mantener separación absoluta entre el sitio público y el backoffice administrativo. |
| RF-09 | Habilitar RF-06 y futuros análisis de uso con una tabla de tracking propia. |

------------------------------------------------------------------------

*Documento generado por Product Owner. Cualquier cambio de alcance requiere nueva aprobación.*
