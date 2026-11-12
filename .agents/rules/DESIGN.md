# inmovacion - Diseno y arquitectura

> Regla de referencia para decisiones arquitectonicas y visuales. Este archivo fue generado por agent-init a partir del stack detectado; debe ajustarse cuando la evidencia del proyecto cambie.

## Stack detectado

- Framework: nextjs
- Lenguaje: typescript
- Estilos: tailwindcss
- Libreria UI: radix-ui
- ORM: prisma
- Autenticacion: next-auth

## Arquitectura

- Respeta la estructura de carpetas existente y confirma cualquier cambio estructural en el codigo y los tests.
- Mantiene separadas las responsabilidades de presentacion, dominio, infraestructura y configuracion cuando el proyecto las tenga.
- Reutiliza patrones, componentes, estilos y dependencias existentes antes de crear abstracciones nuevas.
- No inventes endpoints, modelos, tokens visuales ni flujos que no esten respaldados por el proyecto o por requisitos explicitos.

## Interfaz y consistencia

- Usa la libreria de estilos e iconos detectada; no introduzcas otra sin justificarlo.
- Conserva los tokens, componentes y convenciones visuales existentes.
- Verifica estados de carga, vacio, error y responsive cuando modifiques una interfaz.

## Seguridad y calidad

- No incluyas secretos en el codigo, logs ni respuestas.
- Valida entradas antes de persistirlas.
- Ejecuta las verificaciones y el lint disponibles antes de considerar terminado un cambio.
- Actualiza esta guia si cambia el stack, la arquitectura o las convenciones visuales.

## Evidencia pendiente de validar

- Revisar la estructura real del proyecto con project-mapper-simple antes de tomar decisiones concretas.
- Reemplazar las reglas genericas por convenciones observadas en codigo, configuracion y tests.
