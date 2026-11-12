<!-- agent-init:start -->
# Actualizar `.agents/`

Si detectás algo repetitivo, un error o un cambio de diseño, corregilo en `.agents/`:

| Qué | Dónde |
| :--- | :--- |
| Reglas de estilo, nomenclatura o seguridad | `.agents/rules/coding-rules.json` |
| Referencia de diseño | `.agents/rules/DESIGN.md` |
| Repetitivo, error o cambio de diseño detectado | `.agents/rules/LEARNINGS.md` |
| Una skill falla o está desactualizada | `.agents/skills/<skill>/SKILL.md` |

Registrar con:
`python3 .agents/skills/agent-init/scripts/update_agents_md.py --category <repetitive|error|design> --text "..."`
<!-- agent-init:end -->
