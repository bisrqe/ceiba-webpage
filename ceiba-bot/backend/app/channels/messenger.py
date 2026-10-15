"""Canal Facebook Messenger (Messenger Platform de Meta).

Configuración paso a paso: docs/03_CONECTIVIDAD.md → «Messenger».
Variables (.env): MESSENGER_PAGE_TOKEN, META_APP_SECRET, META_VERIFY_TOKEN, META_GRAPH_VERSION.

Límites que respeta:
  · Texto ≤ 2000 caracteres, sin formato (se quitan los ** y _).
  · Respuestas rápidas: máximo 13, título ≤ 20.
  · Plantilla genérica (tarjetas): máximo 10, título y subtítulo ≤ 80, botones ≤ 3.
"""
from __future__ import annotations

from typing import Any

from .. import config
from ..models import Incoming, Reply
from .base import Channel, clip, md_to_plain

FINAL_PROMPT = "¿Qué quieres hacer ahora?"


class MessengerChannel(Channel):
    name = "messenger"

    @property
    def endpoint(self) -> str:
        return f"https://graph.facebook.com/{config.settings.meta_graph_version}/me/messages"

    def parse(self, body: dict[str, Any]) -> list[Incoming]:
        out: list[Incoming] = []
        if body.get("object") != "page":
            return out
        for entry in body.get("entry", []):
            for ev in entry.get("messaging", []):
                sender = ev.get("sender", {}).get("id", "")
                msg = ev.get("message", {})
                if msg.get("is_echo"):
                    continue
                if "postback" in ev:
                    payload = ev["postback"].get("payload", "")
                    out.append(Incoming(channel=self.name, user_id=sender, payload=None if payload == "GET_STARTED" else payload,
                                        event="start" if payload == "GET_STARTED" else None))
                elif msg.get("quick_reply"):
                    out.append(Incoming(channel=self.name, user_id=sender, payload=msg["quick_reply"].get("payload")))
                elif "text" in msg:
                    out.append(Incoming(channel=self.name, user_id=sender, text=msg["text"]))
        return out

    def _call(self, to: str, message: dict[str, Any]) -> dict[str, Any]:
        return {"url": self.endpoint, "params": {"access_token": config.settings.messenger_page_token},
                "json": {"recipient": {"id": to}, "messaging_type": "RESPONSE", "message": message}}

    def render(self, user_id: str, reply: Reply, **_: Any) -> list[dict[str, Any]]:
        texts = [md_to_plain(t) for t in reply.messages]
        last = texts.pop() if reply.buttons and not reply.cards and texts else None
        calls = [self._call(user_id, {"text": clip(t, 2000)}) for t in texts]
        if reply.cards:
            elements = []
            for c in reply.cards[:10]:
                el: dict[str, Any] = {"title": clip(md_to_plain(c.title), 80), "subtitle": clip(md_to_plain(c.body or c.tag), 80)}
                if c.url:
                    el["buttons"] = [{"type": "web_url", "url": c.url, "title": clip(c.url_label.replace("👁️ ", ""), 20)}]
                elements.append(el)
            calls.append(self._call(user_id, {"attachment": {"type": "template", "payload": {"template_type": "generic", "elements": elements}}}))
        if reply.buttons:
            qr = [{"content_type": "text", "title": b.short_label(20), "payload": b.payload} for b in reply.buttons[:13]]
            calls.append(self._call(user_id, {"text": clip(last or FINAL_PROMPT, 2000), "quick_replies": qr}))
        return calls
