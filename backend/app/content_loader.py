"""Carga los archivos de content/*.yaml y los expone al resto del código.

El contenido se lee al arrancar y puede recargarse sin reiniciar con
POST /admin/reload (requiere ADMIN_TOKEN). Si un YAML tiene un error de formato,
la recarga falla y el bot sigue usando la versión anterior (no se cae).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from . import config

FILES = [
    "bot", "menus", "intents", "entities", "contacts", "faq", "programs",
    "diagnostic", "initiatives", "calendar", "glossary", "bibliography",
]


@dataclass
class Content:
    bot: dict[str, Any]
    menus: dict[str, Any]
    intents: dict[str, Any]
    entities: dict[str, Any]
    contacts: dict[str, Any]
    faq: dict[str, Any]
    programs: dict[str, Any]
    diagnostic: dict[str, Any]
    initiatives: dict[str, Any]
    calendar: dict[str, Any]
    glossary: dict[str, Any]
    bibliography: dict[str, Any]

    # ---- Accesos frecuentes ------------------------------------------------
    def msg(self, key: str, **vars: Any) -> str:
        """Mensaje de bot.yaml → messages, con variables sustituidas."""
        template = str(self.bot["messages"].get(key, "")).strip()
        vars.setdefault("bot", self.bot["bot"]["name"])
        try:
            return template.format(**vars)
        except (KeyError, IndexError):
            return template

    def program(self, pid: str) -> dict[str, Any] | None:
        return next((p for p in self.programs["programs"] if p["id"] == pid), None)

    def campus(self, cid: str) -> dict[str, Any] | None:
        return next((c for c in self.contacts["campuses"] if c["id"] == cid), None)

    def document(self, did: str) -> dict[str, Any] | None:
        return next((d for d in self.bibliography["documents"] if d["id"] == did), None)

    def faq_item(self, fid: str) -> dict[str, Any] | None:
        return next((f for f in self.faq["faqs"] if f["id"] == fid), None)

    @property
    def documents(self) -> list[dict[str, Any]]:
        return self.bibliography["documents"]


def load_content(content_dir: Path | None = None) -> Content:
    base = content_dir or config.CONTENT_DIR
    data: dict[str, Any] = {}
    for name in FILES:
        path = base / f"{name}.yaml"
        with path.open(encoding="utf-8") as fh:
            data[name] = yaml.safe_load(fh) or {}
    return Content(**data)


_content: Content | None = None


def get_content() -> Content:
    global _content
    if _content is None:
        _content = load_content()
    return _content


def reload_content() -> Content:
    """Recarga en caliente. Si falla, conserva el contenido anterior y relanza el error."""
    global _content
    fresh = load_content()
    _content = fresh
    return fresh
