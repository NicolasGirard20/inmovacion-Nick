# inmovacion — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. Toda regla aquí descrita debe respetarse sin excepción. Nada de lo que no esté respaldado por el código debe suponerse ni inventarse.

---

## Integración con Agentes de IA

Este proyecto cuenta con un sistema de configuración para agentes de IA. Los siguientes archivos orquestan el comportamiento automático del agente:

| Archivo | Rol |
|---------|-----|
| `.opencode/config.json` | Configuración técnica del agente: skills, triggers, rutas de scripts |
| `.agents/init.sh` | Script de bootstrap que se ejecuta al iniciar cada sesión (genera mapa del proyecto, verifica dependencias) |
| `.agents/rules/coding-rules.json` | Reglas de estilo y arquitectura en formato estructurado para validación automática de prompts |
| `.agents/skills/project-mapper/` | Skill local que mapea la estructura completa del proyecto y filtra contexto relevante |
| `.agents/skills/prompt-toolkit/` | Skill local con templates de prompts parametrizables y validador de seguridad |

### Flujo de inicio de sesión
1. El agente lee `.opencode/config.json` para conocer las skills y reglas del proyecto.
2. Ejecuta `.agents/init.sh` que regenera el mapa del proyecto si es necesario.
3. Consulta `AGENTS.md` como fuente de verdad para reglas de negocio, stack y convenciones.
4. Usa `.agents/rules/coding-rules.json` para validar que los prompts generados respeten las reglas del proyecto.
5. Antes de enviar prompts críticos, los valida contra `.agents/skills/prompt-toolkit/validator/rules.json`.

---

## Arquitectura General

- **Proyecto**: `inmovacion` — descripción pendiente.
- **Stack detectado**:
  - **Framework**: nextjs
  - **Lenguaje**: typescript
  - **Estilos**: tailwindcss
  - **UI Library**: radix-ui
  - **ORM**: prisma
  - **Auth**: next-auth
  - **App Router**: Next.js App Router

### Estructura de carpetas
```
├── AGENTS.md
├── Propuestas.md
├── README.md
├── auth.config.ts
├── auth.ts
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── prisma/
├── prisma.config.ts
├── public/
├── scripts/
├── src/
├── tsconfig.json
```

### Capas
1. **Rutas/páginas**: componentes de página.
2. **Componentes**: UI de aplicación.
3. **Estado global**: Context API.
4. **Services**: capa de acceso a datos.
5. **Helpers**: utilidades, validadores, auth.

---

## Reglas de Diseño

### Nomenclatura
- Archivos de componentes: `PascalCase.tsx`
- Services y helpers: `camelCase.ts`
- Carpetas: `kebab-case`
- Código en inglés; **labels y mensajes al usuario en español**.

### Componentes
- Estilos: **solo clases de Tailwind CSS** (si aplica).
- Librería de iconos única.
- Composición sobre herencia.

### React / TypeScript
- TypeScript estricto: **prohibido `any`**.
- Server Components por defecto; `'use client'` solo donde haga falta.

---

## Seguridad (REGLA CRÍTICA)

- **Nunca exponer secrets** en código, logs, ni respuestas de API.
- **Validación de inputs** antes de persistir.
- Base de datos: acceso únicamente vía ORM (queries parametrizadas).

## Estilo de código

- Lint antes de considerar terminado un cambio.
- Imports con path alias; evitar imports relativos profundos.
- Sin comentarios obvios; comentarios solo para lógica no evidente.

## Comandos

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run start    # servidor de producción
npm run lint     # eslint
```

---

## Mantenimiento de este documento

- Actualizar `AGENTS.md` siempre que cambien: estructura de carpetas, stack, convenciones, reglas de seguridad o comandos.
- Reflejar cambios también en `.agents/rules/coding-rules.json`.
- Si cambian rutas de skills o triggers, actualizar `.opencode/config.json`.
- Fuente de verdad para cambios estructurales: ejecutar `.agents/init.sh` para regenerar el mapa antes de redactar.
