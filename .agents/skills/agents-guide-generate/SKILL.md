---
name: agents-guide-generate
description: >-
  Genera o actualiza un archivo AGENTS.md a partir del contexto real del proyecto,
  usando la arquitectura y el mapeo de project-mapper y las reglas de validación,
  sanitización y coherencia de prompt-toolkit. Debe producir una guía de diseño,
  seguridad, arquitectura, convenciones y estructura del repositorio sin inventar
  detalles que no estén respaldados por el código.
---

# Agents Guide Generator

## Objetivo
Crear o actualizar un archivo `AGENTS.md` en la raíz del proyecto que funcione como fuente de verdad para agentes y desarrolladores. La guía debe reflejar la arquitectura real del repositorio, sus convenciones de diseño, sus reglas de seguridad y la estructura de carpetas, sin inventar nombres, tecnologías o patrones que no existan en el proyecto.

## Cuándo activar esta skill
Activa esta skill cuando:

- El usuario pide "creá un AGENTS.md", "armá la guía del proyecto", "actualizá las reglas del repo", "generá la architecture doc", o similar.
- Se necesita dejar documentada la estructura del proyecto, sus convenciones y sus reglas de trabajo para agentes.
- El repositorio ya tiene un `AGENTS.md` y necesita ser actualizado o reescrito según el estado real del código.
- El usuario quiere que el agente haga una guía de arquitectura y diseño basada en el proyecto real, no en suposiciones.

No la uses para tareas triviales o para crear documentos de estilo libre sin respaldo del código.

## Reglas de base

1. Nunca inventes tecnologías, rutas, stack, patrones ni convenciones si no están confirmados por el proyecto.
2. Usa la evidencia del código y del mapa del proyecto como fuente principal.
3. Si el proyecto ya tiene un `AGENTS.md`, úsalo como referencia de estructura, pero actualízalo con la realidad del repositorio actual.
4. No crees un `DESIGN.md`; la guía de diseño debe vivir en `AGENTS.md`.
5. Antes de leer carpetas grandes como `node_modules` o archivos de lockfile como `pnpm-lock.yaml`, revisa si existe una necesidad acotada. En general evita hacerlo.

## Flujo obligatorio

### Paso 1: Obtener el mapa real del proyecto
Usa la skill `project-mapper`.

Ejecuta, si no existe un mapa reciente o si hace falta contexto real del repositorio:

```bash
python3 .agents/project-mapper/scripts/generate_map.py --project . --output .agents/project-mapper/resources/project_map.json --force
```

Luego inyecta solo el contexto relevante a la tarea:

```bash
python3 .agents/project-mapper/scripts/inject_relevant.py --map .agents/project-mapper/resources/project_map.json --query "estructura del proyecto, arquitectura, rutas, capas, dependencias, patrones de diseño y convenciones del repositorio" --output .agents/project-mapper/resources/context_task.json --max-files 15
```

Si el contexto es demasiado largo, aplica compresión de forma excepcional:

```bash
python3 .agents/project-mapper/scripts/compress_context.py --input .agents/project-mapper/resources/project_map.json --output .agents/project-mapper/resources/project_map_compressed.json --ratio 0.4
```

### Paso 2: Validar el prompt de generación con prompt-toolkit
Antes de generar la guía, usa la skill `prompt-toolkit` para validar la instrucción que se enviará al modelo o la que el agente mismo va a ejecutar.

Revisa:
- `templates/` para reutilizar un template de generación si aplica.
- `validator/rules.json` y los scripts de validación.
- Política de longitud, coherencia y detección de inyección.

Si el prompt del agente presenta problemas de coherencia, un texto demasiado largo o instrucciones peligrosas o contradictorias, corrígelo antes de seguir.

### Paso 3: Inspeccionar el proyecto con evidencia
Se deben verificar al menos estas fuentes reales:

- Estructura de carpetas relevantes.
- Archivos principales de configuración (`package.json`, `tsconfig.json`, `next.config.*`, `tailwind.config.*`, etc.).
- Archivos de aplicación y rutas relevantes.
- Contexts, providers, hooks, utilidades, tipos de dominio.
- Reglas de seguridad visibles en el repo y en el flujo de trabajo actual.

Nunca generes la documentación a partir de un supuesto de arquitectura sin comprobarlo en el código.

### Paso 4: Redactar el `AGENTS.md`
El archivo debe seguir una estructura similar a este patrón:

```md
# Nombre del Proyecto — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. Toda regla aquí descrita debe respetarse sin excepción.

---

## Project Mapper — Skill nativa obligatoria

### Trigger y activación
- ...

### Flujo de trabajo obligatorio
- ...

---

## Arquitectura General
- Descripción del proyecto y su stack.
- Estructura de carpetas real.
- Capa de presentación, dominio, utilidades, providers, etc.
- Rutas, módulos y role del app.

### Manejo de estado
- Context API, Zustand, Redux, localStorage, etc.

### Modelos de datos
- Interfaces, tipos, entidades, helpers de dominio.

---

## Reglas de Diseño

### Convenciones de nomenclatura
- archivos, carpetas, componentes, funciones, variables

### Convenciones de componentes
- pattern de UI, styling, props, composition

### Convenciones de React / TypeScript
- hooks, context, strict mode, imports, types, etc.

---

## Seguridad (REGLA CRÍTICA)
- Nunca exponer secretos.
- Nunca loguear info sensible.
- Validación de inputs.
- Criterios para credenciales, storage y env.
- Reglas de CORS/CSRF en backend futuro.

---

## Logging
- Herramienta de logging oficial.
- Regla de DEV / producción.
- Cuándo usar cada nivel.

---

## Estilo de código
- lints, formatting, imports, no any, no comentarios innecesarios.

---

## Comandos
```bash
npm run dev
npm run build
npm run test
npm run lint
```
```

### Requisitos mínimos del contenido
El AGENTS.md resultante debe incluir, como mínimo:

- Arquitectura del proyecto real: estructura de carpetas, capas del sistema y organización.
- Patrones de diseño detectados.
- Reglas de consistencia para preservar la arquitectura en futuras funcionalidades o refactors.
- Consideraciones anti-alucinación frontend: estilos, tokens, UI library, nomenclatura, convenciones visuales.
- Seguridad aplicada al proyecto actual: manejo de secrets, storage, inputs, autenticación demo, logging, variables de entorno.
- Reglas de mantenimiento del documento y de actualización del AGENTS.md cuando el proyecto cambie.

### Reglas para redactar la documentación
- Usa español para la parte de UX, labels y reglas de producto, salvo que el código o la herramienta estén en inglés.
- Mantén el código y las variables en inglés, pero la documentación y mensajes al usuario en español.
- Describe con precisión qué tecnologías y patrones existen realmente.
- No insistas en elementos inexistentes del stack.
- Si no hay backend, no lo describas como si existiera.
- Si no hay pruebas, no las prometas como parte de la arquitectura actual.
- Si hay un login demo con credenciales hardcodeadas, indicá claramente que es solo para demostración y que no es apto para producción.

### Salida esperada
La skill debe producir un archivo `AGENTS.md` bien estructurado, consistente con el repo y usable como guía operativa para agentes.

## Validación final antes de guardar
Antes de escribir el archivo final, revisa:

1. Que el contenido esté basado en evidencia del repositorio.
2. Que no responda a suposiciones ni invente rutas o tecnologías.
3. Que incluya arquitectura, reglas de diseño, seguridad y estructura.
4. Que siga una lógica clara y usable para agentes.
5. Que el prompt de generación haya sido validado con `prompt-toolkit`.

Si algo no está respaldado por el proyecto, corrígelo antes de guardar.

## Output final
Genera o actualiza el archivo `AGENTS.md` en la raíz del proyecto, manteniendo la documentación alineada con la arquitectura real y con la estructura del repo, y respetando la prioridad de `project-mapper` como fuente de contexto y de `prompt-toolkit` como guardrail de calidad del prompt.
