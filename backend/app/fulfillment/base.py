"""Piezas comunes de las funciones de cumplimiento (fulfillment).

Una función de cumplimiento recibe el contexto (`Ctx`) y argumentos, y devuelve una
`Reply`. Se registra con el decorador `@handler("nombre_de_intencion")`.

    @handler("ver_calendario")
    def ver_calendario(ctx: Ctx) -> Reply:
        ...

Los TEXTOS se toman de content/*.yaml. Si te encuentras escribiendo un texto largo
en Python, probablemente debería ir en un YAML.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from ..content_loader import Content
from ..dialogue.context import Session
from ..models import Button, Incoming, Reply

HANDLERS: dict[str, Callable[..., Reply]] = {}


def handler(name: str):
    def deco(fn: Callable[..., Reply]) -> Callable[..., Reply]:
        HANDLERS[name] = fn
        return fn
    return deco


@dataclass
class Ctx:
    session: Session
    content: Content
    incoming: Incoming
    library: object            # rag.Library (evita import circular)
    is_new: bool = False


def menu_buttons(content: Content, key: str = "main") -> list[Button]:
    items = content.menus.get(key, [])
    return [Button(label=i["label"], payload=f"i:{i['intent']}", short=i.get("short", ""), desc=i.get("desc", "")) for i in items]


def back_to_menu(content: Content) -> Button:
    f = content.menus["footer"][0]
    return Button(label=f["label"], payload=f"i:{f['intent']}", short=f.get("short", "Menú"))


def pick(simple: bool, item: dict, full: str = "text", easy: str = "simple") -> str:
    """Elige la versión sencilla o completa de un texto según el perfil."""
    return str(item.get(easy) if simple and item.get(easy) else item.get(full, "")).strip()
