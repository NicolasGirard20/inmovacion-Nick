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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
