"""Interfaz común de los CANALES (frontend conversacional).

Cada canal hace tres cosas:
  parse(body)          → convierte el webhook del proveedor en una lista de `Incoming`
  render(user, reply)  → convierte la `Reply` neutral en las llamadas que entiende el proveedor
  send(user, reply)    → ejecuta esas llamadas (o las escribe en data/outbox.jsonl si CHANNEL_DRY_RUN=true)

Orden de salida en canales de mensajería (WhatsApp, Telegram, Messenger):
  1. burbujas de texto  2. tarjetas  3. un mensaje final con los botones.
Si no hay tarjetas, los botones se adjuntan a la última burbuja (menos mensajes).
"""
from __future__ import annotations

import html
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any

import httpx

from .. import config
from ..models import Incoming, Reply

log = logging.getLogger(__name__)
OUTBOX: list[dict[str, Any]] = []          # memoria para pruebas en modo DRY RUN

MD_BOLD = re.compile(r"\*\*(.+?)\*\*")
MD_LINK = re.compile(r"\[([^\]]+)\]\((https?://[^)\s]+|mailto:[^)\s]+)\)")


def md_to_whatsapp(text: str) -> str:
    """**negritas** → *negritas* (formato de WhatsApp); [texto](url) → texto: url"""
    text = MD_LINK.sub(lambda m: f"{m.group(1)}: {m.group(2)}", text)
    return MD_BOLD.sub(r"*\1*", text)


def md_to_plain(text: str) -> str:
    """Messenger no interpreta formato: se quitan los símbolos."""
    text = MD_LINK.sub(lambda m: f"{m.group(1)}: {m.group(2)}", text)
    text = MD_BOLD.sub(r"\1", text)
    return re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"\1", text)


def md_to_telegram_html(text: str) -> str:
    """Telegram con parse_mode=HTML: se escapa primero para evitar inyección de etiquetas."""
    links: list[tuple[str, str]] = []

    def keep(m: re.Match) -> str:
        links.append((m.group(1), m.group(2)))
        return f"\x00{len(links) - 1}\x00"

    text = html.escape(MD_LINK.sub(keep, text), quote=False)
    text = MD_BOLD.sub(r"<b>\1</b>", text)
    text = re.sub(r"(?<!\w)_(.+?)_(?!\w)", r"<i>\1</i>", text)
    for i, (label, url) in enumerate(links):
        text = text.replace(f"\x00{i}\x00", f'<a href="{html.escape(url)}">{html.escape(label)}</a>')
    return text


def clip(text: str, limit: int) -> str:
    return text if len(text) <= limit else text[: limit - 1] + "…"


class Channel(ABC):
    name = "base"

    @abstractmethod
    def parse(self, body: dict[str, Any]) -> list[Incoming]: ...

    @abstractmethod
    def render(self, user_id: str, reply: Reply, **kw: Any) -> list[dict[str, Any]]:
        """Devuelve una lista de {"url": ..., "json": ...} listas para enviarse."""

    async def send(self, user_id: str, reply: Reply, **kw: Any) -> None:
        calls = self.render(user_id, reply, **kw)
        if config.settings.channel_dry_run:
            for call in calls:
                OUTBOX.append({"channel": self.name, **call})
            path = config.DATA_DIR / "outbox.jsonl"
            path.parent.mkdir(parents=True, exist_ok=True)
            with path.open("a", encoding="utf-8") as fh:
                for call in calls:
                    safe = {k: v for k, v in call.items() if k != "url"}      # no escribir tokens de la URL
                    fh.write(json.dumps({"channel": self.name, **safe}, ensure_ascii=False) + "\n")
            return
        async with httpx.AsyncClient(timeout=15) as client:
            for call in calls:          # en orden: el proveedor muestra los mensajes en secuencia
                resp = await client.post(call["url"], json=call["json"], headers=call.get("headers"), params=call.get("params"))
                if resp.status_code >= 400:
                    log.error("%s respondió %s: %s", self.name, resp.status_code, resp.text[:300])
