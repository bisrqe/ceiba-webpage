"""Canal Telegram (Bot API).

Configuración paso a paso: docs/03_CONECTIVIDAD.md → «Telegram».
Variables (.env): TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_TOKEN.

Límites que respeta:
  · callback_data de cada botón ≤ 64 bytes (por eso los payloads son cortos).
  · Texto ≤ 4096 caracteres. Formato con parse_mode=HTML (se escapa el contenido).
  · Teclado en línea: 2 botones por fila para que quepan en pantallas de celular.
"""
from __future__ import annotations

from typing import Any

from .. import config
from ..models import Button, Incoming, Reply
from .base import Channel, clip, md_to_telegram_html

FINAL_PROMPT = "¿Qué quieres hacer ahora?"
PER_ROW = 2


class TelegramChannel(Channel):
    name = "telegram"

    def _url(self, method: str) -> str:
        return f"https://api.telegram.org/bot{config.settings.telegram_bot_token}/{method}"

    def parse(self, body: dict[str, Any]) -> list[Incoming]:
        if "callback_query" in body:
            cq = body["callback_query"]
            chat = cq.get("message", {}).get("chat", {})
            return [Incoming(channel=self.name, user_id=str(chat.get("id", cq.get("from", {}).get("id"))),
                             payload=cq.get("data"), display_name=cq.get("from", {}).get("first_name"),
                             raw={"callback_query_id": cq.get("id")})]
        msg = body.get("message") or body.get("edited_message")
        if not msg:
            return []
        text = msg.get("text", "")
        inc = Incoming(channel=self.name, user_id=str(msg["chat"]["id"]), text=text,
                       display_name=msg.get("from", {}).get("first_name"))
        if text.strip() == "/start":
            inc.text, inc.event = "", "start"
        return [inc]

    @staticmethod
    def _keyboard(buttons: list[Button], url_button: dict | None = None) -> dict[str, Any]:
        rows: list[list[dict]] = [[url_button]] if url_button else []
        cb = [{"text": clip(b.label, 60), "callback_data": b.payload.encode()[:64].decode(errors="ignore")} for b in buttons]
        rows += [cb[i:i + PER_ROW] for i in range(0, len(cb), PER_ROW)]
        return {"inline_keyboard": rows}

    def _send(self, chat_id: str, text: str, markup: dict | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"chat_id": chat_id, "text": clip(md_to_telegram_html(text), 4096),
                                   "parse_mode": "HTML", "disable_web_page_preview": True}
        if markup:
            payload["reply_markup"] = markup
        return {"url": self._url("sendMessage"), "json": payload}

    def render(self, user_id: str, reply: Reply, callback_query_id: str | None = None, **_: Any) -> list[dict[str, Any]]:
        calls: list[dict[str, Any]] = []
        if callback_query_id:      # quita el «relojito» del botón tocado
            calls.append({"url": self._url("answerCallbackQuery"), "json": {"callback_query_id": callback_query_id}})
        texts = list(reply.messages)
        last = texts.pop() if reply.buttons and not reply.cards and texts else None
        calls += [self._send(user_id, t) for t in texts]
        for card in reply.cards:
            body = f"**{card.title}**" + (f"\n_{card.tag}_" if card.tag else "") + (f"\n{card.body}" if card.body else "")
            markup = {"inline_keyboard": [[{"text": card.url_label, "url": card.url}]]} if card.url else None
            calls.append(self._send(user_id, body, markup))
        if reply.buttons:
            calls.append(self._send(user_id, last or FINAL_PROMPT, self._keyboard(reply.buttons)))
        return calls
