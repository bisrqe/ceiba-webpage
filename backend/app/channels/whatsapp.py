"""Canal WhatsApp (WhatsApp Business Platform · Cloud API de Meta).

Configuración paso a paso: docs/03_CONECTIVIDAD.md → «WhatsApp».
Variables (.env): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, META_APP_SECRET,
                  META_VERIFY_TOKEN, META_GRAPH_VERSION.

Límites de la plataforma que este adaptador respeta:
  · Botones de respuesta: máximo 3, título ≤ 20 caracteres.
  · Lista: máximo 10 filas, título ≤ 24, descripción ≤ 72; botón que abre la lista ≤ 20.
  · Cuerpo de mensaje interactivo ≤ 1024; texto normal ≤ 4096.
  · Botón con enlace (cta_url): texto ≤ 20.
  · Ventana de 24 h: solo puedes responder libremente dentro de las 24 h posteriores al
    último mensaje de la persona. Fuera de esa ventana se requieren plantillas aprobadas.
"""
from __future__ import annotations

from typing import Any

from .. import config
from ..models import Button, Card, Incoming, Reply
from .base import Channel, clip, md_to_whatsapp

LIST_BUTTON = "Ver opciones"        # EDITA AQUÍ el texto del botón que abre la lista (≤ 20)
FINAL_PROMPT = "¿Qué quieres hacer ahora?"


class WhatsAppChannel(Channel):
    name = "whatsapp"

    @property
    def endpoint(self) -> str:
        s = config.settings
        return f"https://graph.facebook.com/{s.meta_graph_version}/{s.whatsapp_phone_number_id}/messages"

    # ------------------------------------------------------------ entrada
    def parse(self, body: dict[str, Any]) -> list[Incoming]:
        out: list[Incoming] = []
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                names = {c.get("wa_id"): c.get("profile", {}).get("name") for c in value.get("contacts", [])}
                for msg in value.get("messages", []):        # los "statuses" (entregado/leído) se ignoran
                    sender, kind = msg.get("from", ""), msg.get("type")
                    inc = Incoming(channel=self.name, user_id=sender, display_name=names.get(sender), raw={"id": msg.get("id")})
                    if kind == "text":
                        inc.text = msg.get("text", {}).get("body", "")
                    elif kind == "interactive":
                        it = msg.get("interactive", {})
                        reply = it.get("button_reply") or it.get("list_reply") or {}
                        inc.payload = reply.get("id")
                    elif kind == "button":                   # respuesta rápida de una plantilla
                        inc.payload = msg.get("button", {}).get("payload")
                    else:
                        inc.text = ""                        # audio, imagen, etc.: se responde con el menú
                        inc.raw["unsupported"] = kind
                    out.append(inc)
        return out

    # ------------------------------------------------------------ salida
    def _msg(self, to: str, payload: dict[str, Any]) -> dict[str, Any]:
        return {"url": self.endpoint, "headers": {"Authorization": f"Bearer {config.settings.whatsapp_token}"},
                "json": {"messaging_product": "whatsapp", "recipient_type": "individual", "to": to, **payload}}

    def _text(self, to: str, text: str) -> dict[str, Any]:
        return self._msg(to, {"type": "text", "text": {"body": clip(md_to_whatsapp(text), 4096), "preview_url": False}})

    def _card(self, to: str, card: Card) -> dict[str, Any]:
        body = md_to_whatsapp(f"*{card.title}*" + (f"\n_{card.tag}_" if card.tag else "") + (f"\n{card.body}" if card.body else ""))
        if not card.url:
            return self._text(to, body)
        return self._msg(to, {"type": "interactive", "interactive": {
            "type": "cta_url", "body": {"text": clip(body, 1024)},
            "action": {"name": "cta_url", "parameters": {"display_text": clip(card.url_label.replace("👁️ ", ""), 20), "url": card.url}},
        }})

    def _buttons(self, to: str, prompt: str, buttons: list[Button]) -> dict[str, Any]:
        body = {"text": clip(md_to_whatsapp(prompt), 1024)}
        if len(buttons) <= 3:
            action = {"buttons": [{"type": "reply", "reply": {"id": b.payload, "title": b.short_label(20)}} for b in buttons]}
            return self._msg(to, {"type": "interactive", "interactive": {"type": "button", "body": body, "action": action}})
        rows = [{"id": b.payload[:200], "title": b.short_label(24), **({"description": clip(b.desc, 72)} if b.desc else {})}
                for b in buttons[:10]]
        action = {"button": LIST_BUTTON, "sections": [{"title": "Opciones", "rows": rows}]}
        return self._msg(to, {"type": "interactive", "interactive": {"type": "list", "body": body, "action": action}})

    def render(self, user_id: str, reply: Reply, **_: Any) -> list[dict[str, Any]]:
        texts = list(reply.messages)
        calls: list[dict[str, Any]] = []
        prompt = FINAL_PROMPT
        if reply.buttons and not reply.cards and texts:
            prompt = texts.pop()                     # los botones viajan con la última burbuja
        calls += [self._text(user_id, t) for t in texts]
        calls += [self._card(user_id, c) for c in reply.cards]
        if reply.buttons:
            calls.append(self._buttons(user_id, prompt, reply.buttons))
        return calls
