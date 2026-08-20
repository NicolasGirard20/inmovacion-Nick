# My Wallet — Reglas de Diseño y Arquitectura

> Este documento es la fuente de verdad para cualquier agente o desarrollador que trabaje en este proyecto. **Toda regla aquí descrita debe respetarse sin excepción.**

---

## Project Mapper — Skill nativa obligatoria

### Trigger y activación

Esta skill debe activarse automáticamente cuando:

1. El usuario inicia una nueva sesión de trabajo y no existe un mapa reciente (< 2 horas).
2. El usuario pide: "mapea el proyecto", "entendé la estructura", "explicame el código".
3. La tarea implica leer o modificar más de 2 archivos.
4. El usuario menciona: refactor, arquitectura, dependencias, módulos, estructura.
5. El agente detecta que está leyendo los mismos archivos múltiples veces.

No activar la skill cuando:

- La tarea es trivial (ej. cambiar un string o formatear código).
- Solo se edita 1 archivo que ya está abierto en contexto.
- El usuario dice explícitamente "no uses el mapper".

### Regla especial

Antes de leer la carpeta `node_modules` o el archivo `pnpm-lock.yaml` (si es que existen), el agente debe consultar esta skill y decidir si existe una necesidad real y acotada. En general, se debe evitar leer esos archivos salvo que la tarea lo requiera estrictamente.

### Flujo de trabajo obligatorio

#### Paso 0: Consultar la existencia de las skills project-mapper y prompt-toolkit

Revisar

#### Paso 1: Generar el mapa del proyecto

Ejecutar siempre al inicio si no hay mapa reciente:

```bash
python3 .agents/skills/project-mapper/scripts/generate_map.py --project . --output .agents/skills/project-mapper/resources/project_map.json --force
```

#### Paso 2: Inyectar contexto relevante

Ejecutar automáticamente después del paso 1 y antes de cada tarea concreta para filtrar solo los archivos necesarios:

```bash
python3 .agents/skills/project-mapper/scripts/inject_relevant.py --map .agents/project-mapper/resources/project_map.json --query "descripción de tu tarea aquí" --output .agents/skills/project-mapper/resources/context_task.json
```

Se puede limitar la cantidad de archivos con flags como `--max-files 10` o `--dep-depth 2` cuando sea necesario.

#### Paso 3: Comprimir contexto

Ejecutar solo si el mapa o el contexto inyectado son demasiado grandes (>4000 tokens estimados) o si el contexto se volvió demasiado largo:

```bash
python3 .agents/skills/project-mapper/scripts/compress_context.py --input .agents/skills/project-mapper/resources/project_map.json --output .agents/project-mapper/resources/project_map_compressed.json --ratio 0.4
```

Se puede ajustar a `0.3` para compresión más agresiva o `0.6` para ser más conservador.

#### Paso 4: Actualizar AGENTS.md

Si el proyecto cambia o el mapa del proyecto indica que la arquitectura, rutas, dependencias o convenciones ya no coinciden con la guía actual, el agente debe actualizar `AGENTS.md` para reflejar esa nueva realidad.

La actualización debe incluir:

- Arquitectura del proyecto: estructura de carpetas, capas del sistema y organización del código.
- Patrones de diseño detectados en la aplicación.
- Reglas de consistencia para preservar la misma arquitectura en futuras funcionalidades o refactors.
- Consideraciones anti-alucinación frontend: estilos, tokens visuales, nomenclatura, UI library y convenciones para evitar inventar interfaz incongruente.

En resumen, el agente no debe crear o modificar `DESIGN.md`; debe mantener actualizada la información de `AGENTS.md` según el proyecto real.

---

## Arquitectura General
