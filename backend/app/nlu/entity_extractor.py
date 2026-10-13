"""Extractor de ENTIDADES: programa, nivel, campus, código de continuidad y
disparadores de derivación al secretario (content/entities.yaml)."""
from __future__ import annotations

import re

from .normalizer import contains_phrase, normalize

RESUME_CODE = re.compile(r"\bceiba-([a-z0-9]{4})\b", re.IGNORECASE)


class EntityExtractor:
    def __init__(self, entities_cfg: dict, glossary_cfg: dict):
        self.cfg = entities_cfg
        self.glossary = glossary_cfg.get("terms", {})

    def _lookup(self, norm: str, group: str) -> str | None:
        best, best_len = None, 0
        for value, synonyms in (self.cfg.get(group) or {}).items():
            for syn in [value, *synonyms]:
                if contains_phrase(norm, syn) and len(syn) > best_len:
                    best, best_len = value, len(syn)
        return best

    def extract(self, text: str) -> dict[str, str]:
        norm = normalize(text)
        found: dict[str, str] = {}
        for group in ("programa", "nivel", "campus"):
            value = self._lookup(norm, group)
            if value:
                found[group] = value
        code = RESUME_CODE.search(text or "")
        if code:
            found["resume_code"] = f"CEIBA-{code.group(1).upper()}"
        trigger = self.handoff_trigger(norm)
        if trigger:
            found["handoff"] = trigger
        term = self.glossary_term(norm)
        if term:
            found["term"] = term
        return found

    def handoff_trigger(self, norm: str) -> str | None:
        """Regla de derivación: ¿la pregunta menciona la propuesta concreta del estudiante,
        un espacio del campus o una persona del campus?"""
        for category, phrases in (self.cfg.get("handoff_triggers") or {}).items():
            if any(contains_phrase(norm, p) for p in phrases):
                return category
        return None

    def glossary_term(self, norm: str) -> str | None:
        best, best_len = None, 0
        for key, item in self.glossary.items():
            for name in [item.get("term", ""), key, *item.get("alias", [])]:
                n = normalize(name.split("(")[0])
                if n and contains_phrase(norm, n) and len(n) > best_len:
                    best, best_len = key, len(n)
        return best

    def expand_query(self, text: str) -> str:
        """Añade equivalentes en inglés/francés para buscar en documentos oficiales."""
        norm = normalize(text)
        extra = [" ".join(v) for k, v in (self.cfg.get("query_expansion") or {}).items() if contains_phrase(norm, k)]
        return " ".join([text, *extra])
