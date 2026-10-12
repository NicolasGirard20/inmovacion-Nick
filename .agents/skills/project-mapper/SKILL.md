---
name: project-mapper
description: Genera un indice liviano del proyecto y selecciona solo el contexto relevante para tareas que involucran multiples archivos.
---

# Project Mapper

## Objetivo

Reducir lecturas y consumo de tokens mediante un mapa estructurado del proyecto.
El mapa es un indice de navegacion; no reemplaza la lectura de los archivos
fuente relevantes.

La activacion debe decidirla el agente consumidor segun el alcance de la tarea.
Esta skill no debe forzar su ejecucion para cambios locales o consultas que
puedan resolverse con un archivo ya identificado.

## Cuándo activar

Activar cuando:

- La tarea involucra mas de dos archivos.
- Se necesita entender estructura, arquitectura, modulos o dependencias.
- Se solicita mapear o entender el proyecto.
- Se realiza un refactor transversal.
- Se desconoce donde se implementa un comportamiento.
- Se repiten lecturas o busquedas sobre los mismos archivos.

No activar cuando:

- La tarea cambia un archivo ya identificado.
- La consulta puede resolverse con el archivo abierto.
- Solo se modifica un string, formato o valor local.
- El usuario solicita explicitamente no usar el mapper.

## Seguridad y alcance

- Resolver primero la raiz del proyecto y la ubicacion de la skill.
- Buscar la skill en este orden:
  `.agents/skills/project-mapper/`
  `local/.agents/skills/project-mapper/`
- La instalacion valida debe contener:
  `SKILL.md`,
  `scripts/generate_map.py`,
  `scripts/inject_relevant.py`.
- No leer `node_modules`, archivos binarios, builds, logs, archivos minificados
  ni lockfiles sin justificacion.
- No leer `pnpm-lock.yaml` sin avisar al usuario y obtener confirmacion.
- No inferir arquitectura que no este respaldada por archivos, imports,
  configuracion o tests.
- El mapa no autoriza a leer todos los archivos que contiene.

Si la skill no esta disponible, informar:

> No puedo iniciar el plan porque la skill project-mapper no esta presente en
> el proyecto.

No producir un plan parcial si el mapper es obligatorio para la tarea.

## Reutilizacion de artefactos

Usar estos artefactos dentro de `resources/`:

- `project_map.json`: indice del proyecto.
- `context_task.json`: seleccion de contexto para una tarea concreta.
- `project_map_compressed.json`: alternativa comprimida, solo cuando sea necesaria.

Reutilizar `project_map.json` si existe y tiene menos de dos horas.

Reutilizar `context_task.json` solo si corresponde a la misma tarea o a una
consulta equivalente. Verificar su antiguedad y su consulta antes de usarlo.

Regenerar el mapa sin `--force` cuando:

- No existe.
- Esta obsoleto.
- Hubo cambios externos relevantes.
- El contexto reutilizado no encuentra la implementacion esperada.

Usar `--force` solo si el usuario lo solicita o si una regeneracion normal no
detecta cambios importantes.

## Generacion del mapa

Ejecutar desde la raiz del proyecto.

Linux/macOS:

```bash
python3 <skill>/scripts/generate_map.py \
  --project . \
  --output <skill>/resources/project_map.json
```

Windows:

```powershell
python <skill>\scripts\generate_map.py `
  --project . `
  --output <skill>\resources\project_map.json
```

Preferir una salida liviana cuando el proyecto sea grande:

```bash
python3 <skill>/scripts/generate_map.py \
  --project . \
  --output <skill>/resources/project_map.json \
  --light
```

Usar `--include-lines` solo si se necesitan lineas de clases o funciones para
localizar una implementacion concreta.

## Seleccion de contexto

La consulta debe ser corta, especifica y normalizada. Incluir:

- El comportamiento que se quiere entender o modificar.
- Nombres de dominio, archivos o simbolos conocidos.
- El tipo de cambio esperado.

Eliminar saludos, contexto repetido y explicaciones narrativas.

Configuracion inicial recomendada:

```bash
python3 <skill>/scripts/inject_relevant.py \
  --map <skill>/resources/project_map.json \
  --query "comportamiento y simbolos relevantes" \
  --output <skill>/resources/context_task.json \
  --max-files 8 \
  --dep-depth 1 \
  --min-score 2 \
  --map-token-limit 2500 \
  --context-token-limit 4000 \
  --max-expansion-ratio 3
```

Usar `--light` en la primera pasada cuando solo sea necesario localizar
archivos.

No usar `--include-dependents` por defecto. Activarlo solo para analizar:

- Impactos de una modificacion.
- Callers.
- Contratos publicos.
- Eventos.
- Dependencias inversas.

## Expansion progresiva

Seguir este orden:

1. Consultar el mapa.
2. Leer los archivos con mayor relevancia.
3. Leer un test, caller o contrato representativo.
4. Verificar imports y dependencias directas.
5. Expandir solo si existe una incertidumbre concreta.

No aumentar mas de una vez `--max-files`, `--dep-depth` o los limites de tokens.
Toda expansion debe indicar:

- Que incertidumbre resuelve.
- Que archivos adicionales incorpora.
- Por que no puede resolverse con el contexto actual.

Mantener siempre la seleccion minima que permita validar el diagnostico.

## Metricas de eficiencia

Conservar y revisar:

- `efficiency.status`
- `map_tokens`
- `context_tokens`
- Expansion de dependencias
- Cantidad de archivos seleccionados

Interpretacion:

- `OK`: leer los archivos seleccionados y sus tests relevantes.
- `WARN`: reducir archivos, dependencias o usar `--light` antes de leer mas.
- `BYPASS`: reformular una vez la consulta usando nombres de archivos o
  simbolos observados. Si vuelve a ocurrir, detener la exploracion y explicar
  el bloqueo.

Nunca resolver un `BYPASS` leyendo globalmente todo el proyecto.

## Compresion

Comprimir solo despues de reducir archivos y dependencias.

Usar `compress_context.py` cuando el mapa o el contexto sigan superando el
presupuesto y la informacion necesaria no pueda reducirse mas:

```bash
python3 <skill>/scripts/compress_context.py \
  --input <skill>/resources/project_map.json \
  --output <skill>/resources/project_map_compressed.json \
  --ratio 0.4
```

Preferir:

1. Reducir `--max-files`.
2. Reducir `--dep-depth`.
3. Usar `--light`.
4. Reformular la consulta.
5. Comprimir como ultimo recurso.

## Lectura posterior

Leer `context_task.json` como indice, no como una orden de leer todos sus
archivos.

Priorizar:

1. Archivos que implementan directamente el comportamiento.
2. Tests relacionados.
3. Contratos, interfaces o tipos.
4. Callers relevantes.
5. Configuracion estrictamente necesaria.

Usar busquedas directas solo para verificar archivos o simbolos ya identificados
por el contexto inyectado.

## Reglas de diseño frontend

Si existe `.agents/rules/DESIGN.md` o
`local/.agents/rules/DESIGN.md`, consultarlo antes de proponer cambios de
frontend.

Si existen otros archivos de reglas en esas carpetas, enumerarlos y consultar
los que sean aplicables al cambio. No asumir que solo `DESIGN.md` define las
convenciones del proyecto.

No crear ni actualizar `DESIGN.md` automaticamente. Solo hacerlo si el usuario
lo solicita o si forma parte explicita del alcance.

## Registro del diagnostico

El resultado del analisis debe indicar:

- Si el mapper fue activado y por que.
- Si se reutilizaron o regeneraron artefactos.
- La consulta utilizada.
- Los archivos seleccionados.
- Las metricas de eficiencia.
- Cualquier expansion aplicada y su justificacion.
- Las incertidumbres que permanezcan sin resolver.

El objetivo es que los agentes posteriores reciban rutas y hallazgos concretos
sin tener que repetir la exploracion.
