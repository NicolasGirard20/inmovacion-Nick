**Recomendaciones de skills**

- **Plantillas de prompts**: Biblioteca de templates parametrizables + variables y ejemplos; implementarlo como archivos .md/.json reutilizables.  
- **Validador de prompts**: Reglas y sanitizadores (longitud, incoherencias, instrucciones peligrosas) que alerten antes de enviar.  
- **Auto-refinador (iterative refinement)**: Genera y compara variantes de prompt, elige la mejor mediante métricas automáticas.  
- **Banco de ejemplos (few-shot)**: Colección etiquetada de ejemplos por dominio/estilo para inserción dinámica en prompts.  
- **Gestión de contexto y memoria**: Short/long-term memory, retriever vectorial (RAG) para incluir contexto relevante al prompt.  
- **Composer dinámico de prompts**: Motor que arma prompts condicionales (bloques, bucles, ramificaciones) según meta/rol.  
- **Evaluador automático**: Tests de calidad de salida (exactitud, coherencia, toxicidad) y dashboard de métricas.  
- **Persona y tono**: Skill para aplicar estilos/personas predefinidas (formal, tutor, motivador) y switches en runtime.  
- **Clarificador proactivo**: Skill que formula preguntas de clarificación antes de ejecutar cuando el objetivo es ambiguo.  
- **Simulador de interacción agentica**: Entorno para simular pasos, rollouts y validar estrategias (útil para entrenar políticas).  
- **Controlador meta (planner)**: Descompone objetivos en sub-tasks y orquesta agentes especializados (planner → worker → verifier).  
- **Verificador de acciones (safety & verification)**: Revisión automática de resultados/acciones propuestas contra reglas y sandboxed execution.  
- **Conectores multi-externos**: Skills para integrarse con web search, bases de datos, APIs y ejecutar código seguro.  
- **Aprendizaje desde feedback**: Registro de feedback humano + ajuste de prompts/ejemplos y ranking de mejores estrategias.  
- **Ensamble agentico**: Orquestrador de múltiples agentes especializados (explorador, experto, revisor) que cooperan en una tarea.

