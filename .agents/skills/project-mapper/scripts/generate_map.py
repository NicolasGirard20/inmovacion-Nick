#!/usr/bin/env python3
"""Generate a compact structural map of a source project.

Python uses the stdlib ``ast`` parser. JavaScript/TypeScript uses conservative
declaration patterns: only function declarations and clearly-shaped top-level
arrow declarations are reported, so assignments and destructuring are ignored.
For type-aware TS/TSX analysis, tree-sitter or ts-morph would be preferable,
but this skill intentionally remains dependency-free.
"""

import argparse
import ast
import fnmatch
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


LANGUAGE_MAP = {
    ".py": "python", ".js": "javascript", ".ts": "typescript",
    ".jsx": "jsx", ".tsx": "tsx", ".go": "go", ".rs": "rust",
    ".java": "java", ".kt": "kotlin", ".rb": "ruby", ".php": "php",
    ".cs": "csharp", ".cpp": "cpp", ".c": "c", ".swift": "swift",
}


def compact_symbol(symbol: Dict[str, Any], include_lines: bool) -> Dict[str, Any]:
    """Drop unstable/default fields to keep each symbol small."""
    result = {key: value for key, value in symbol.items() if value not in (None, False, [], "")}
    if not include_lines:
        result.pop("line", None)
    return result


class PythonSymbolExtractor(ast.NodeVisitor):
    """Extract actual Python definitions, never assignments or names."""

    def __init__(self, include_lines: bool):
        self.include_lines = include_lines
        self.imports: List[str] = []
        self.classes: List[Dict[str, Any]] = []
        self.functions: List[Dict[str, Any]] = []
        self.exports: List[str] = []

    def visit_Import(self, node: ast.Import) -> None:
        self.imports.extend(alias.name for alias in node.names)

    def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
        module = "." * node.level + (node.module or "")
        self.imports.append(module)

    def visit_ClassDef(self, node: ast.ClassDef) -> None:
        methods = [child.name for child in node.body
                   if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef))]
        symbol = {
            "name": node.name,
            "line": node.lineno,
            "docstring": (ast.get_docstring(node) or "")[:200] or None,
            "methods": methods,
        }
        self.classes.append(compact_symbol(symbol, self.include_lines))
        self.exports.append(node.name)
        self.generic_visit(node)

    def _function(self, node: ast.AST, is_async: bool) -> None:
        assert isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        symbol = {
            "name": node.name,
            "line": node.lineno,
            "docstring": (ast.get_docstring(node) or "")[:200] or None,
            "is_async": is_async,
            "args": [arg.arg for arg in node.args.args],
        }
        self.functions.append(compact_symbol(symbol, self.include_lines))
        if not node.name.startswith("_"):
            self.exports.append(node.name)
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
        self._function(node, False)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
        self._function(node, True)


class JSSymbolExtractor:
    """Conservative JS/TS extractor; declaration-shaped matches only."""

    IMPORT_PATTERNS = (
        r"\bimport\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|[\w$]+)\s+from\s+)?['\"]([^'\"]+)['\"]",
        r"\brequire\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
        r"\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)",
    )
    CLASS_PATTERN = re.compile(r"^[ \t]*(?:export\s+)?(?:default\s+)?class\s+([\w$]+)(?:\s+extends\s+([\w$]+))?", re.MULTILINE)
    FUNCTION_PATTERN = re.compile(r"^[ \t]*(?:export\s+)?(?:default\s+)?(?P<async>async\s+)?function\s+(?P<name>[\w$]+)", re.MULTILINE)
    # The RHS is limited to parameters or one identifier: no destructuring,
    # constants, calls, or arbitrary expressions can be mistaken for a function.
    ARROW_PATTERN = re.compile(
        r"^[ \t]*(?:export\s+)?(?:const|let|var)\s+(?P<name>[A-Za-z_$][\w$]*)\s*=\s*"
        r"(?P<async>async\s+)?(?:\([^()\n]*\)|[A-Za-z_$][\w$]*)\s*=>",
        re.MULTILINE,
    )
    METHOD_PATTERN = re.compile(
        r"^[ \t]+(?P<prefix>(?:(?:public|private|protected|static|async|get|set)\s+)*)"
        r"(?P<name>[A-Za-z_$][\w$]*)\s*\([^\)\n]*\)\s*\{",
        re.MULTILINE,
    )
    EXPORT_PATTERN = re.compile(
        r"\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([\w$]+)"
    )

    def __init__(self, content: str, include_lines: bool):
        self.content = content
        self.include_lines = include_lines
        self.imports: List[str] = []
        self.classes: List[Dict[str, Any]] = []
        self.functions: List[Dict[str, Any]] = []
        self.exports: List[str] = []

    def _symbol(self, name: str, start: int, **values: Any) -> Dict[str, Any]:
        return compact_symbol({"name": name, "line": self.content[:start].count("\n") + 1, **values}, self.include_lines)

    def extract(self) -> "JSSymbolExtractor":
        for pattern in self.IMPORT_PATTERNS:
            self.imports.extend(re.findall(pattern, self.content))
        self.imports = sorted(set(self.imports))
        for match in self.CLASS_PATTERN.finditer(self.content):
            self.classes.append(self._symbol(match.group(1), match.start(), extends=match.group(2)))
        for match in self.FUNCTION_PATTERN.finditer(self.content):
            self.functions.append(self._symbol(match.group("name"), match.start(), is_async=bool(match.group("async"))))
        for match in self.ARROW_PATTERN.finditer(self.content):
            self.functions.append(self._symbol(match.group("name"), match.start(), is_async=bool(match.group("async"))))
        reserved = {"if", "for", "while", "switch", "catch", "with"}
        for match in self.METHOD_PATTERN.finditer(self.content):
            if match.group("name") not in reserved:
                self.functions.append(self._symbol(
                    match.group("name"), match.start(),
                    is_async="async" in match.group("prefix")))
        self.functions.sort(key=lambda symbol: symbol.get("line", 0))
        self.exports = sorted(set(match.group(1) for match in self.EXPORT_PATTERN.finditer(self.content)))
        return self


class FileWalker:
    """Walk source files while applying default and user glob exclusions."""

    DEFAULT_EXCLUDES = {
        ".git/**", ".venv/**", "venv/**", "node_modules/**", "__pycache__/**",
        ".pytest_cache/**", "dist/**", "build/**", ".next/**", "out/**",
        "coverage/**", "target/**", "vendor/**", "**/*.min.js", "**/*.min.css",
        "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml",
        "bun.lockb", "*.tsbuildinfo", "*.pyc", "*.pyo", "*.so", "*.dll",
        "*.dylib", "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico", "*.svg",
        "*.woff", "*.woff2", "*.ttf", "*.eot", "*.mp3", "*.mp4", "*.zip",
        "*.tar", "*.gz", "*.rar", "*.7z", "*.pdf", "*.log", ".env", ".env.*",
        ".DS_Store",
    }

    def __init__(self, project_path: Path, excludes: Sequence[str]):
        self.project_path = project_path.resolve()
        self.excludes = set(self.DEFAULT_EXCLUDES) | set(excludes)

    def ignored(self, path: Path) -> bool:
        relative = path.relative_to(self.project_path).as_posix()
        return any(fnmatch.fnmatch(relative, pattern) or fnmatch.fnmatch(path.name, pattern)
                   for pattern in self.excludes)

    def files(self) -> Iterable[Path]:
        for root, dirs, names in os.walk(self.project_path):
            root_path = Path(root)
            dirs[:] = [name for name in dirs
                       if not name.startswith(".") and not self.ignored(root_path / name)]
            for name in names:
                path = root_path / name
                if not self.ignored(path) and path.is_file():
                    try:
                        if path.stat().st_size <= 2_000_000:
                            yield path
                    except OSError:
                        continue


class DependencyGraph:
    """Resolve local JS/TS and Python imports; omit external packages."""

    JS_EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs")
    PY_EXTENSIONS = (".py",)

    def __init__(self, project_path: Path, files: Sequence[Dict[str, Any]]):
        self.project_path = project_path
        self.files = {item["path"] for item in files}
        self.aliases = self._load_aliases()

    def _load_aliases(self) -> Dict[str, List[str]]:
        aliases: Dict[str, List[str]] = {}
        for config_name in ("tsconfig.json", "jsconfig.json"):
            config_path = self.project_path / config_name
            if not config_path.exists():
                continue
            try:
                raw = re.sub(r"/\*.*?\*/|//.*?$", "", config_path.read_text(encoding="utf-8"), flags=re.MULTILINE | re.DOTALL)
                config = json.loads(raw)
                options = config.get("compilerOptions", {})
                base = Path(options.get("baseUrl", "."))
                for key, targets in options.get("paths", {}).items():
                    aliases[key.rstrip("*")] = [str(base / target.rstrip("*")) for target in targets]
            except (OSError, json.JSONDecodeError, TypeError):
                continue
        return aliases

    def _candidates(self, source: str, importer: str) -> Iterable[str]:
        roots: List[str] = []
        if source.startswith("@/"):
            aliased = source[2:]
            roots.extend((aliased, str(Path("src") / aliased)))
        else:
            for alias, targets in self.aliases.items():
                if source.startswith(alias):
                    roots.extend(target + source[len(alias):] for target in targets)
            if source.startswith("."):
                level = len(source) - len(source.lstrip("."))
                parent = Path(importer).parent
                for _ in range(max(level - 1, 0)):
                    parent = parent.parent
                roots.append(str(parent / source[level:]))
            elif not roots:
                return
        for root in roots:
            root = root.replace("\\", "/")
            for extension in self.JS_EXTENSIONS + self.PY_EXTENSIONS + ("",):
                candidate = Path(root).with_suffix(extension) if extension else Path(root)
                yield candidate.as_posix()
                yield (Path(root) / ("index" + extension)).as_posix()
                yield (Path(root) / ("__init__" + extension)).as_posix()

    def build(self, files: Sequence[Dict[str, Any]]) -> Dict[str, List[str]]:
        graph: Dict[str, List[str]] = {}
        for item in files:
            deps: Set[str] = set()
            for source in item.get("imports", []):
                for candidate in self._candidates(source, item["path"]):
                    if candidate in self.files and candidate != item["path"]:
                        deps.add(candidate)
                        break
            graph[item["path"]] = sorted(deps)
        return graph


class ProjectMapper:
    """Coordinate walking, language extraction, graph building and output."""

    def __init__(self, project_path: Path, include_lines: bool = False,
                 light: bool = False, excludes: Sequence[str] = ()):
        self.project_path = project_path.resolve()
        self.include_lines = include_lines
        self.light = light
        self.walker = FileWalker(self.project_path, excludes)
        self.entry_points: List[str] = []

    def _summary(self, path: Path, symbols: Dict[str, Any]) -> str:
        stem = path.stem.lower()
        parts: List[str] = []
        if any(token in stem for token in ("main", "app", "index", "server", "cli")):
            parts.append("Punto de entrada")
            self.entry_points.append(path.relative_to(self.project_path).as_posix())
        elif any(token in stem for token in ("test", "spec")):
            parts.append("Archivo de tests")
        if symbols["classes"]:
            parts.append("Clases: " + ", ".join(c["name"] for c in symbols["classes"][:3]))
        public = [f["name"] for f in symbols["functions"] if not f["name"].startswith("_")]
        if public:
            parts.append("Funciones: " + ", ".join(public[:5]))
        return " | ".join(parts) or f"Archivo {path.suffix or 'sin extensión'}"

    def _extract(self, content: str, path: Path) -> Dict[str, Any]:
        language = LANGUAGE_MAP.get(path.suffix.lower(), "unknown")
        if language == "python":
            try:
                extractor = PythonSymbolExtractor(self.include_lines)
                extractor.visit(ast.parse(content))
                return {key: getattr(extractor, key) for key in ("imports", "classes", "functions", "exports")}
            except SyntaxError:
                pass
        elif language in ("javascript", "typescript", "jsx", "tsx"):
            extractor = JSSymbolExtractor(content, self.include_lines).extract()
            return {key: getattr(extractor, key) for key in ("imports", "classes", "functions", "exports")}
        return {"imports": [], "classes": [], "functions": [], "exports": []}

    def _architecture(self, files: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
        directories = sorted({Path(item["path"]).parts[0] for item in files
                              if len(Path(item["path"]).parts) > 1})
        groups = {"core_modules": [], "utils": [], "tests": [], "config": [], "infrastructure": []}
        for directory in directories:
            name = directory.lower()
            if any(token in name for token in ("src", "app", "lib", "core", "module", "component", "package")):
                groups["core_modules"].append(directory)
            elif any(token in name for token in ("test", "spec", "e2e")):
                groups["tests"].append(directory)
            elif any(token in name for token in ("util", "helper", "tool", "script", "shared", "common")):
                groups["utils"].append(directory)
            elif any(token in name for token in ("config", "setting", "env", "docker", "k8s")):
                groups["config"].append(directory)
            elif any(token in name for token in ("infra", "deploy", "terraform", "ansible")):
                groups["infrastructure"].append(directory)
        return {"entry_points": self.entry_points or ["(detectar manualmente)"], **groups,
                "all_directories": directories}

    def generate_map(self) -> Dict[str, Any]:
        files: List[Dict[str, Any]] = []
        total_symbols = 0
        for path in self.walker.files():
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
            except OSError:
                continue
            rel_path = path.relative_to(self.project_path).as_posix()
            language = LANGUAGE_MAP.get(path.suffix.lower(), "unknown")
            symbols = self._extract(content, path)
            total_symbols += len(symbols["classes"]) + len(symbols["functions"])
            item = {
                "path": rel_path,
                "language": language,
                "size_lines": len(content.splitlines()),
                "summary": self._summary(path, symbols),
                "imports": sorted(set(symbols["imports"])),
                "exports": sorted(set(symbols["exports"])),
                "classes": symbols["classes"],
                "functions": symbols["functions"],
                "complexity": "low" if len(content.splitlines()) < 30 else "medium" if len(content.splitlines()) < 100 else "high",
            }
            if self.light:
                item = {key: item[key] for key in ("path", "summary", "imports", "exports", "complexity")}
            files.append(item)

        files.sort(key=lambda item: item["path"])
        graph = DependencyGraph(self.project_path, files).build(files)
        return {
            "project_name": self.project_path.name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_files": len(files),
            "total_symbols": total_symbols,
            "architecture": self._architecture(files),
            "files": files,
            "dependency_graph": graph,
            "metadata": {"mapper_version": "3.0.0", "languages_found": sorted(set(item.get("language", "unknown") for item in files))},
        }


def main() -> None:
    parser = argparse.ArgumentParser(description="Project Mapper para Antigravity")
    parser.add_argument("--project", "-p", default=".", help="Ruta al proyecto")
    parser.add_argument("--output", "-o", required=True, help="Ruta de salida del JSON")
    parser.add_argument("--force", "-f", action="store_true", help="Forzar regeneración")
    parser.add_argument("--max-age-hours", type=float, default=2.0)
    parser.add_argument("--light", action="store_true", help="Solo path, summary, imports, exports y complexity")
    parser.add_argument("--include-lines", action="store_true", help="Incluir líneas en clases y funciones")
    parser.add_argument("--exclude", action="append", default=[], help="Patrón glob adicional a ignorar; se puede repetir")
    args = parser.parse_args()
    project_path, output_path = Path(args.project).resolve(), Path(args.output).resolve()

    if not args.force and output_path.exists():
        try:
            existing = json.loads(output_path.read_text(encoding="utf-8"))
            generated = datetime.fromisoformat(existing["generated_at"].replace("Z", "+00:00"))
            if (datetime.now(timezone.utc) - generated).total_seconds() / 3600 < args.max_age_hours:
                print(f"Mapa reciente ({output_path}); use --force para regenerar.")
                return
        except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError):
            pass

    project_map = ProjectMapper(project_path, args.include_lines, args.light, args.exclude).generate_map()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(project_map, indent=2, ensure_ascii=False)
    output_path.write_text(serialized + "\n", encoding="utf-8")
    size_kb = len((serialized + "\n").encode("utf-8")) / 1024
    print(f"Mapa generado: {output_path}")
    print(f"Archivos procesados: {project_map['total_files']}")
    print(f"Símbolos reales detectados: {project_map['total_symbols']}")
    print(f"Tamaño JSON: {size_kb:.1f} KB")
    print(f"Tokens estimados: ~{len(serialized) // 4}")


if __name__ == "__main__":
    main()