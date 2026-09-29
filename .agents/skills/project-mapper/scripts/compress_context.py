#!/usr/bin/env python3
"""Reduce project maps deterministically, with optional LLMLingua support.

Deterministic compression is the default because it is reproducible, fast and
does not require downloading a model. LLMLingua remains available through
``--llmlingua`` for agents that explicitly need linguistic compression.
"""

import argparse
import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, List

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

try:
    # pyrefly: ignore [missing-import]
    from llmlingua import PromptCompressor
    LLMLINGUA_AVAILABLE = True
except ImportError:
    LLMLINGUA_AVAILABLE = False
    PromptCompressor = None


class ContextCompressor:
    """Compress maps while preserving their public structure."""

    def __init__(self, model_name: str = None, use_llmlingua2: bool = True,
                 use_llmlingua: bool = False):
        self.compressor = None
        if use_llmlingua and LLMLINGUA_AVAILABLE:
            try:
                self.compressor = PromptCompressor(
                    model_name=model_name or
                    "microsoft/llmlingua-2-bert-base-multilingual-cased-meetingbank",
                    use_llmlingua2=use_llmlingua2,
                )
                print("LLMLingua-2 cargado correctamente")
            except Exception as error:
                print(f"Aviso: no se pudo cargar LLMLingua ({error}); usando modo determinista")
        elif use_llmlingua:
            print("Aviso: LLMLingua no está instalado; usando modo determinista")

    @staticmethod
    def _compact_map(original: Dict[str, Any], ratio: float,
                     light: bool = True) -> Dict[str, Any]:
        """Keep important files and filter the graph to the retained paths."""
        result = deepcopy(original)
        files = original.get("files", [])
        entry_points = set(original.get("architecture", {}).get("entry_points", []))
        keep_count = max(1, min(len(files), int(len(files) * ratio))) if files else 0

        prioritized = sorted(
            files,
            key=lambda file_data: (
                file_data.get("path") in entry_points,
                {"high": 3, "medium": 2, "low": 1}.get(file_data.get("complexity"), 0),
                len(file_data.get("exports", [])),
                file_data.get("path", ""),
            ),
            reverse=True,
        )
        by_path = {file_data.get("path"): file_data for file_data in files}
        selected_paths = {path for path in entry_points if path in by_path}
        graph = original.get("dependency_graph", {})
        pending = list(selected_paths)
        while pending:
            path = pending.pop()
            for dependency in graph.get(path, []):
                if dependency in by_path and dependency not in selected_paths:
                    selected_paths.add(dependency)
                    pending.append(dependency)
        selected = [file_data for file_data in prioritized
                    if file_data.get("path") in selected_paths]
        selected.extend(file_data for file_data in prioritized
                        if file_data.get("path") not in selected_paths
                        and len(selected) < keep_count)
        if light:
            selected = [
                {key: file_data.get(key) for key in
                 ("path", "summary", "imports", "exports", "complexity")}
                for file_data in selected
            ]

        result["files"] = sorted(selected, key=lambda file_data: file_data.get("path", ""))
        result["total_files"] = len(result["files"])
        # Keep the original count because light mode intentionally removes symbol details.
        result["total_symbols"] = original.get("total_symbols", 0)

        kept_paths = {file_data["path"] for file_data in result["files"]}
        graph = original.get("dependency_graph", {})
        result["dependency_graph"] = {
            path: [dependency for dependency in dependencies if dependency in kept_paths]
            for path, dependencies in graph.items()
            if path in kept_paths
        }
        return result

    def _fallback_compress(self, data: Dict[str, Any], ratio: float) -> Dict[str, Any]:
        return self._compact_map(data, ratio, light=True)

    def _llmlingua_compress(self, text: str, ratio: float) -> str:
        try:
            result = self.compressor.compress_prompt_llmlingua2(
                text, rate=ratio,
                force_tokens=["path", "exports", "imports", "dependency_graph", "summary"],
            )
            return result["compressed_prompt"]
        except Exception as error:
            print(f"Aviso: error en LLMLingua ({error}); usando modo determinista")
            return ""

    def compress_map(self, input_path: Path, ratio: float = 0.4) -> Dict[str, Any]:
        if not 0.1 <= ratio <= 0.9:
            raise ValueError("ratio debe estar entre 0.1 y 0.9")
        original_data = json.loads(input_path.read_text(encoding="utf-8"))
        original_text = json.dumps(original_data, ensure_ascii=False)
        original_tokens = len(original_text) // 4
        print(f"Tokens originales estimados: ~{original_tokens}")
        print(f"Ratio objetivo: {ratio * 100:.0f}%")

        compressed_data: Dict[str, Any]
        method = "deterministic"
        if self.compressor:
            try:
                compressed_data = json.loads(self._llmlingua_compress(original_text, ratio))
                method = "llmlingua-2"
            except (json.JSONDecodeError, TypeError):
                compressed_data = self._fallback_compress(original_data, ratio)
        else:
            compressed_data = self._fallback_compress(original_data, ratio)

        compressed_text = json.dumps(compressed_data, ensure_ascii=False)
        compressed_tokens = len(compressed_text) // 4
        metadata = compressed_data.setdefault("metadata", {})
        metadata["compression"] = {
            "original_tokens_estimate": original_tokens,
            "compressed_tokens_estimate": compressed_tokens,
            "target_ratio": ratio,
            "actual_ratio": round(compressed_tokens / original_tokens, 2) if original_tokens else 0,
            "method": method,
        }
        return compressed_data


def main() -> None:
    parser = argparse.ArgumentParser(description="Comprime mapas de proyecto")
    parser.add_argument("--input", "-i", required=True, help="Mapa JSON de entrada")
    parser.add_argument("--output", "-o", required=True, help="Mapa JSON de salida")
    parser.add_argument("--ratio", "-r", type=float, default=0.4,
                        help="Proporción de archivos conservados (0.1-0.9)")
    parser.add_argument("--model", "-m", default=None, help="Modelo LLMLingua alternativo")
    parser.add_argument("--llmlingua", action="store_true",
                        help="Usar LLMLingua opcionalmente; por defecto es determinista")
    args = parser.parse_args()
    if not 0.1 <= args.ratio <= 0.9:
        parser.error("--ratio debe estar entre 0.1 y 0.9")

    input_path, output_path = Path(args.input).resolve(), Path(args.output).resolve()
    if not input_path.exists():
        parser.error(f"No existe el mapa de entrada: {input_path}")

    compressor = ContextCompressor(model_name=args.model, use_llmlingua=args.llmlingua)
    compressed = compressor.compress_map(input_path, ratio=args.ratio)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(compressed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    meta = compressed["metadata"]["compression"]
    print(f"Mapa comprimido guardado: {output_path}")
    print(f"Tokens: ~{meta['original_tokens_estimate']} -> ~{meta['compressed_tokens_estimate']}")
    print(f"Ratio real: {meta['actual_ratio'] * 100:.1f}%")
    print(f"Método: {meta['method']}")


if __name__ == "__main__":
    main()