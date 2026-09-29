#!/usr/bin/env python3
"""
Inyección selectiva de contexto para Antigravity.
Extrae solo los archivos/símbolos relevantes para una tarea específica.
"""

import sys
import json
import argparse
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Set

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass


class RelevantContextInjector:
    """Inyecta solo el contexto relevante para una tarea dada."""
    
    def __init__(self, map_path: Path):
        with open(map_path, 'r', encoding='utf-8') as f:
            self.project_map = json.load(f)
        
        self.files = {f['path']: f for f in self.project_map.get('files', [])}
        self.dependency_graph = self.project_map.get('dependency_graph', {})
        self.reverse_graph = self._build_reverse_graph()

    def _build_reverse_graph(self) -> Dict[str, Set[str]]:
        reverse: Dict[str, Set[str]] = {path: set() for path in self.files}
        for source, dependencies in self.dependency_graph.items():
            for dependency in dependencies:
                if dependency in reverse:
                    reverse[dependency].add(source)
        return reverse

    @staticmethod
    def _normalize(text: str) -> str:
        text = unicodedata.normalize('NFKD', text)
        text = ''.join(char for char in text if not unicodedata.combining(char))
        return re.sub(r'[^a-z0-9_$]+', ' ', text.lower()).strip()

    @classmethod
    def _terms(cls, query: str) -> Set[str]:
        stop_words = {
            'a', 'al', 'con', 'como', 'de', 'del', 'el', 'en', 'la', 'las',
            'los', 'para', 'por', 'que', 'una', 'un', 'y', 'the', 'and',
            'for', 'from', 'in', 'of', 'to', 'with', 'update', 'change',
        }
        return {term for term in cls._normalize(query).split() if term not in stop_words and len(term) > 1}

    @classmethod
    def _field_terms(cls, values: List[str]) -> Set[str]:
        terms: Set[str] = set()
        for value in values:
            normalized = cls._normalize(value)
            terms.update(normalized.split())
            # Make camelCase and snake_case names searchable as a whole and by parts.
            terms.update(part.lower() for part in re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?=[A-Z]|$)|\d+', value))
        return terms
    
    def score_relevance(self, file_data: Dict, query: str) -> float:
        """Puntúa qué tan relevante es un archivo para la query."""
        query_terms = self._terms(query)
        if not query_terms:
            return 0.0
        
        score = 0.0
        
        # 1. Match en nombre de archivo
        path_terms = self._field_terms([file_data['path']])
        score += 3.0 * len(query_terms & path_terms)
        
        # 2. Match en summary
        summary_terms = self._field_terms([file_data.get('summary', '')])
        score += 2.5 * len(query_terms & summary_terms)
        
        # 3. Match en exports
        export_terms = self._field_terms(file_data.get('exports', []))
        score += 2.0 * len(query_terms & export_terms)
        
        # 4. Match en funciones/clases
        functions = [f['name'] if isinstance(f, dict) else f
                     for f in file_data.get('functions', [])]
        function_terms = self._field_terms(functions)
        score += 1.5 * len(query_terms & function_terms)

        classes = [c['name'] if isinstance(c, dict) else c
                   for c in file_data.get('classes', [])]
        score += 1.5 * len(query_terms & self._field_terms(classes))
        
        # 5. Match en imports (dependencias)
        import_terms = self._field_terms(file_data.get('imports', []))
        score += 1.0 * len(query_terms & import_terms)
        
        # 6. Bonus por complejidad si hay match
        if score > 0 and file_data.get('complexity') == 'high':
            score += 0.5
        
        # 7. Bonus para entry points
        if file_data['path'] in self.project_map.get('architecture', {}).get('entry_points', []):
            score += 0.3
        
        return score
    
    def get_relevant_files(self, query: str, top_k: int = 10) -> List[Dict]:
        """Obtiene los archivos más relevantes para la query."""
        scored = []
        
        for path, file_data in self.files.items():
            score = self.score_relevance(file_data, query)
            if score > 0:
                scored.append((score, file_data))
        
        # Ordenar por relevancia
        scored.sort(key=lambda x: (-x[0], x[1]['path']))
        
        # Tomar top_k
        return [f for _, f in scored[:top_k]]
    
    def get_dependency_chain(self, file_paths: List[str], depth: int = 2,
                             include_dependents: bool = False) -> Set[str]:
        """Obtiene dependencias y, opcionalmente, archivos que dependen de ellas."""
        result = set(file_paths)
        current = set(file_paths)
        
        for _ in range(depth):
            next_level = set()
            for path in current:
                deps = set(self.dependency_graph.get(path, []))
                if include_dependents:
                    deps.update(self.reverse_graph.get(path, set()))
                for dep in deps:
                    if dep in self.files and dep not in result:
                        next_level.add(dep)
                        result.add(dep)
            current = next_level
            if not current:
                break
        
        return result

    @staticmethod
    def _estimated_tokens(value: Any) -> int:
        return len(json.dumps(value, ensure_ascii=False)) // 4

    def assess_efficiency(self, query: str, context: Dict[str, Any],
                          map_token_limit: int = 4000,
                          context_token_limit: int = 4000,
                          max_expansion_ratio: float = 3.0) -> Dict[str, Any]:
        """Diagnostica si la selección probablemente sea poco eficiente."""
        query_terms = self._terms(query)
        direct_matches = context['direct_matches']
        total_files = context['total_relevant_files']
        expansion_ratio = total_files / max(direct_matches, 1)
        warnings: List[str] = []
        recommendations: List[str] = []

        map_tokens = self._estimated_tokens(self.project_map)
        if map_tokens > map_token_limit:
            warnings.append('project_map grande para una selección frecuente')
            recommendations.append('comprimir el mapa o usar --light')
        if len(query_terms) < 2:
            warnings.append('consulta con poca información para ranking léxico')
            recommendations.append('describir dominio, archivo, símbolo o comportamiento')
        if direct_matches == 0:
            warnings.append('no se encontraron coincidencias directas')
            recommendations.append('reformular la consulta o no usar el mapper')
        if context['estimated_tokens'] > context_token_limit:
            warnings.append('contexto seleccionado supera el presupuesto de tokens')
            recommendations.append('reducir --max-files/--dep-depth o usar --light')
        if expansion_ratio > max_expansion_ratio and direct_matches > 0:
            warnings.append('las dependencias expanden demasiado la selección')
            recommendations.append('probar --no-deps o reducir --dep-depth')

        generated_at = self.project_map.get('generated_at')
        if generated_at:
            try:
                timestamp = datetime.fromisoformat(generated_at.replace('Z', '+00:00'))
                age_hours = (datetime.now(timezone.utc) - timestamp).total_seconds() / 3600
                if age_hours > 2:
                    warnings.append('mapa posiblemente obsoleto')
                    recommendations.append('regenerar project_map.json')
            except ValueError:
                warnings.append('fecha de generación del mapa no válida')

        status = 'BYPASS' if direct_matches == 0 else ('WARN' if warnings else 'OK')
        return {
            'status': status,
            'warnings': warnings,
            'recommendations': recommendations,
            'metrics': {
                'query_terms': len(query_terms),
                'map_tokens_estimated': map_tokens,
                'context_tokens_estimated': context['estimated_tokens'],
                'direct_matches': direct_matches,
                'total_relevant_files': total_files,
                'dependency_expansion_ratio': round(expansion_ratio, 2),
            },
        }
    
    def build_context(self, query: str, include_dependencies: bool = True, 
                     dep_depth: int = 2, max_files: int = 15,
                     include_dependents: bool = False, light: bool = False,
                     min_score: float = 0.0, map_token_limit: int = 4000,
                     context_token_limit: int = 4000,
                     max_expansion_ratio: float = 3.0) -> Dict[str, Any]:
        """Construye el contexto relevante para la tarea."""
        
        # 1. Archivos directamente relevantes
        relevant = [file_data for file_data in self.get_relevant_files(query, top_k=max_files)
                if self.score_relevance(file_data, query) >= min_score]
        relevant_paths = [f['path'] for f in relevant]
        
        # 2. Agregar dependencias si se solicita
        if include_dependencies:
            dep_paths = self.get_dependency_chain(
                relevant_paths, depth=dep_depth, include_dependents=include_dependents)
            all_paths = dep_paths
        else:
            all_paths = set(relevant_paths)
        
        # 3. Construir resultado
        context_files = []
        for path in sorted(all_paths):
            if path in self.files:
                f = self.files[path]
                # Simplificar para inyección de contexto
                context_file = {
                    'path': f['path'],
                    'summary': f['summary'],
                    'exports': f.get('exports', []),
                    'dependencies': self.dependency_graph.get(f['path'], []),
                    'complexity': f.get('complexity'),
                    'language': f.get('language'),
                }
                if not light:
                    context_file['functions'] = f.get('functions', [])
                    context_file['classes'] = f.get('classes', [])
                context_files.append(context_file)
        
        # 4. Detectar patrones de arquitectura relevantes
        arch = self.project_map.get('architecture', {})
        relevant_dirs = set()
        for f in context_files:
            parts = Path(f['path']).parts
            if len(parts) > 1:
                relevant_dirs.add(parts[0])
        
        context = {
            'query': query,
            'generated_at': self.project_map.get('generated_at'),
            'project_name': self.project_map.get('project_name'),
            'relevant_architecture': {
                'entry_points': [ep for ep in arch.get('entry_points', []) 
                               if any(ep.startswith(d) for d in relevant_dirs)],
                'core_modules': [m for m in arch.get('core_modules', []) 
                              if m in relevant_dirs],
            },
            'files': context_files,
            'total_relevant_files': len(context_files),
            'direct_matches': len(relevant_paths),
            'dependency_includes': len(all_paths) - len(relevant_paths),
            'injection_strategy': 'selective-light' if light else 'selective',
            'estimated_tokens': len(json.dumps(context_files, ensure_ascii=False)) // 4,
        }
        context['efficiency'] = self.assess_efficiency(
            query, context, map_token_limit, context_token_limit,
            max_expansion_ratio)
        return context


def main():
    parser = argparse.ArgumentParser(description='Inyecta contexto relevante para una tarea')
    parser.add_argument('--map', '-m', type=str, required=True, help='Ruta al mapa del proyecto')
    parser.add_argument('--query', '-q', type=str, required=True, help='Descripción de la tarea')
    parser.add_argument('--output', '-o', type=str, required=True, help='Archivo de salida JSON')
    parser.add_argument('--max-files', type=int, default=15, help='Máximo de archivos relevantes')
    parser.add_argument('--dep-depth', type=int, default=2, help='Profundidad de dependencias')
    parser.add_argument('--no-deps', action='store_true', help='No incluir dependencias')
    parser.add_argument('--include-dependents', action='store_true',
                        help='Incluir archivos que dependen de los seleccionados')
    parser.add_argument('--light', action='store_true',
                        help='Excluir detalle de funciones y clases')
    parser.add_argument('--min-score', type=float, default=0.0,
                        help='Puntaje mínimo de relevancia')
    parser.add_argument('--map-token-limit', type=int, default=4000,
                        help='Umbral de advertencia para el tamaño estimado del mapa')
    parser.add_argument('--context-token-limit', type=int, default=4000,
                        help='Presupuesto de advertencia para el contexto seleccionado')
    parser.add_argument('--max-expansion-ratio', type=float, default=3.0,
                        help='Máxima relación entre archivos seleccionados y coincidencias directas')
    
    args = parser.parse_args()

    if args.max_files < 1:
        parser.error('--max-files debe ser mayor que 0')
    if args.dep_depth < 0:
        parser.error('--dep-depth no puede ser negativo')
    if args.min_score < 0:
        parser.error('--min-score no puede ser negativo')
    if args.map_token_limit < 1 or args.context_token_limit < 1:
        parser.error('los límites de tokens deben ser mayores que 0')
    if args.max_expansion_ratio < 1:
        parser.error('--max-expansion-ratio debe ser mayor o igual que 1')
    
    map_path = Path(args.map).resolve()
    output_path = Path(args.output).resolve()
    
    if not map_path.exists():
        print(f"❌ Error: No existe el mapa {map_path}")
        print(f"   Generá uno primero con generate_map.py")
        sys.exit(1)
    
    injector = RelevantContextInjector(map_path)
    context = injector.build_context(
        query=args.query,
        include_dependencies=not args.no_deps,
        dep_depth=args.dep_depth,
        max_files=args.max_files,
        include_dependents=args.include_dependents,
        light=args.light,
        min_score=args.min_score,
        map_token_limit=args.map_token_limit,
        context_token_limit=args.context_token_limit,
        max_expansion_ratio=args.max_expansion_ratio,
    )
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(context, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Contexto relevante generado: {output_path}")
    print(f"   🎯 Query: '{args.query}'")
    print(f"   📁 Archivos directos: {context['direct_matches']}")
    print(f"   🔗 Dependencias incluidas: {context['dependency_includes']}")
    print(f"   📊 Total archivos en contexto: {context['total_relevant_files']}")
    print(f"   🔢 Tokens estimados: ~{context['estimated_tokens']}")
    print(f"   💡 Estrategia: {context['injection_strategy']}")
    efficiency = context['efficiency']
    print(f"   ⚖️ Eficiencia: {efficiency['status']}")
    for warning in efficiency['warnings']:
        print(f"   ⚠️ {warning}")
    for recommendation in efficiency['recommendations']:
        print(f"   💡 Recomendación: {recommendation}")


if __name__ == '__main__':
    main()