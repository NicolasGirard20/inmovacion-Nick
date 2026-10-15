---
name: agent-init
description: >-
  Scaffolding automático de configuración de agentes para cualquier proyecto.
  Detecta el stack tecnológico, genera .opencode/config.json, .agents/rules/coding-rules.json,
  DESIGN.md unificado con reglas de negocio, arquitectura y diseño. Se activa automáticamente en la primera sesión
  de un proyecto nuevo.
---

# Agent Init — Scaffolding de Configuración de Agentes

## Objetivo
Inicializar la configuración de agentes de IA en cualquier proyecto nuevo de forma automática,
detectando el stack tecnológico y generando los archivos específicos del proyecto.

## Cuándo activar esta skill
- En la PRIMERA sesión de trabajo en un proyecto nuevo.
- Cuando el usuario pide "inicializar configuración de agentes", "scaffolding", "setup del proyecto".
- Cuando `.opencode/config.json` no existe en el proyecto.

## Flujo de trabajo

### Paso 1: Detectar stack
Ejecuta `detect_stack.py` que lee `package.json` y detecta:
- Framework (Next.js, React, Vue, Angular)
- ORM (Prisma, Drizzle, TypeORM)
- Estilos (Tailwind, Styled Components, Emotion)
- UI Library (shadcn, Radix, MUI, Ant Design)
- Auth (NextAuth, Clerk, JWT custom)
- Testing (Jest, Vitest)

### Paso 2: Elegir template
Según el stack detectado, elige el template más adecuado:
- `nextjs-prisma/` → Next.js + Prisma + Tailwind + shadcn/ui
- `react-vite/` → React + Vite + Tailwind
- `vanilla-ts/` → Genérico TypeScript
- `dotnet-mvc/` → ASP.NET MVC / .NET Framework + Razor

Si el framework detectado **no tiene template dedicado** (Angular, Vue, Svelte, Astro, Solid, Nuxt, Remix), se usa el **fallback generativo**: `generate_framework_rules.py` genera un `coding-rules.json` y un `DESIGN.md` con reglas específicas del framework.

### Paso 3: Generar archivos
- `.opencode/config.json` → Configuración técnica del agente
- `.agents/rules/coding-rules.json` → Reglas estructuradas del proyecto
- `.agents/rules/DESIGN.md` → Documento unificado de negocio, arquitectura, diseño y convenciones

### Paso 4: Generar mapa inicial
Ejecuta `project-mapper` para generar el primer mapa del proyecto.

## Salida esperada
```
.opencode/config.json
.agents/rules/coding-rules.json
.agents/rules/DESIGN.md
.agents/skills/project-mapper/resources/project_map.json
```

## Validación
- Verificar que los JSON generados sean válidos.
- Verificar que `.agents/rules/DESIGN.md` exista y tenga las secciones mínimas.
- Verificar que `DESIGN.md` no se haya sobrescrito si ya estaba personalizado.
- Si el stack no coincide con ningún template, se genera configuración genérica.