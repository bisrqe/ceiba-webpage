"""Canal web: el widget <ceiba-bot> del sitio llama a POST /api/chat.

Petición:   {"session_id": "uuid-del-navegador", "text": "hola"}
            {"session_id": "...", "payload": "i:ver_programas"}
            {"session_id": "...", "event": "start"}
Respuesta:  la `Reply` neutral en JSON (messages, buttons, cards, meta).

La web es el único canal que soporta todo sin recortes (tarjetas, muchos botones,
Markdown ligero). El widget convierte el Markdown en HTML SEGURO (escapa primero).
"""
from __future__ import annotations

import re
from typing import Any

from ..models import Incoming, Reply
from .base import Channel

SESSION_ID = re.compile(r"^[A-Za-z0-9_-]{8,64}$")


class WebChannel(Channel):
    name = "web"

    def parse(self, body: dict[str, Any]) -> list[Incoming]:
        sid = str(body.get("session_id", ""))
        if not SESSION_ID.match(sid):
            raise ValueError("session_id inválido")
        payload = body.get("payload")
        if payload is not None and (not isinstance(payload, str) or len(payload) > 64):
            raise ValueError("payload inválido")
        return [Incoming(channel=self.name, user_id=sid, text=str(body.get("text", ""))[:1000],
                         payload=payload, event="start" if body.get("event") == "start" else None)]

    def render(self, user_id: str, reply: Reply, **_: Any) -> list[dict[str, Any]]:
        return [{"json": reply.to_dict()}]
