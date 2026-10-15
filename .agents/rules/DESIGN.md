---
trigger: always_on
---

# Guía de Diseño y Arquitectura

Este documento es una referencia base. El agente debe describir la arquitectura real del proyecto antes de introducir patrones, dependencias o decisiones visuales nuevas.

## Arquitectura

- Respeta la estructura de carpetas y las convenciones detectadas por `agent-init`.
- Mantén separadas las responsabilidades de presentación, dominio, infraestructura y configuración cuando el stack lo permita.
- Prefiere patrones ya presentes en el proyecto sobre abstracciones nuevas.

## Consistencia

- Reutiliza componentes, estilos, utilidades y librerías existentes.
- No inventes endpoints, modelos, tokens visuales ni flujos de negocio sin respaldo en el código o en requisitos explícitos.
- Documenta las decisiones que cambien la arquitectura o el contrato público.

## Frontend

- Conserva el sistema de diseño existente y sus tokens visuales.
- Verifica los estados responsive, de carga, vacío y error cuando una vista sea modificada.
- Usa los iconos y componentes proporcionados por las dependencias ya instaladas.
