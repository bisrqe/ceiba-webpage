"""ORQUESTADOR (middleware): el «cerebro central» del bot.

Recorrido de cada mensaje, sin importar el canal:

  canal ──Incoming──► 1. límite de mensajes
                      2. carga el contexto de la persona (storage/db.py)
                      3. NLU: intención + entidades (nlu/)
                      4. máquina de estados: elige la función (dialogue/state_machine.py)
                      5. cumplimiento: arma la respuesta (fulfillment/)
                      6. post-proceso: divide textos largos, botones de navegación
                      7. guarda contexto y registro
  canal ◄──Reply──────┘

No hay textos aquí: todo sale de content/*.yaml.
"""
from __future__ import annotations

import logging
import re

from . import config
from .content_loader import Content, get_content
from .dialogue.state_machine import route
from .fulfillment import HANDLERS, Ctx
from .fulfillment.base import back_to_menu
from .models import Incoming, Reply
from .nlu import NLU
from .rag import Library
from .security import RateLimiter, hash_user_id
from .storage import db

log = logging.getLogger(__name__)

NO_RESET = {"fallback", "profile_reask", "handoff_reask"}


def split_long(text: str, limit: int) -> list[str]:
    """Chunking: divide respuestas largas en burbujas cortas sin romper viñetas."""
    if len(text) <= limit:
        return [text]
    out: list[str] = []
    for block in re.split(r"\n{2,}", text):
        if len(block) <= limit:
            out.append(block)
            continue
        current = ""
        for piece in re.split(r"(?<=[.!?])\s+|\n(?=•)", block):
            if current and len(current) + len(piece) + 1 > limit:
                out.append(current.strip())
                current = ""
            current += ("\n" if piece.startswith("•") else " ") + piece
        if current.strip():
            out.append(current.strip())
    return [o for o in out if o]


class Bot:
    def __init__(self, content: Content | None = None):
        self.limiter = RateLimiter(config.settings.rate_limit_per_minute)
        self.reload(content)

    def reload(self, content: Content | None = None) -> None:
        self.content = content or get_content()
        self.nlu = NLU(self.content)
        self.library = Library(self.content, expand=self.nlu.extractor.expand_query)

    def handle(self, incoming: Incoming) -> Reply:
        user_key = hash_user_id(incoming.channel, incoming.user_id)
        if not self.limiter.allow(user_key):
            return Reply(messages=["Vas muy rápido 😅. Espera unos segundos y vuelve a escribirme."])

        session, is_new = db.load_session(user_key, incoming.channel)
        understood = None if (incoming.payload or incoming.event) else self.nlu.understand(incoming.text)
        decision = route(session, incoming, understood, self.content)
        fn = HANDLERS.get(decision.handler) or HANDLERS["fallback"]
        ctx = Ctx(session=session, content=self.content, incoming=incoming, library=self.library, is_new=is_new)

        try:
            reply = fn(ctx, **decision.args)
        except Exception:
            log.exception("Error en el handler %s", decision.handler)
            reply = Reply(messages=["Tuve un problema técnico con esa solicitud. 🙏 Intenta de nuevo o elige otra opción."],
                          buttons=[back_to_menu(self.content)])

        # Aviso de privacidad la primera vez, aunque la persona no haya saludado.
        if not session.privacy_shown and decision.handler != "saludo" and not reply.meta.get("deleted"):
            url = self.content.contacts["general"].get("privacy_url") or self.content.bot["bot"]["website"]
            reply.messages.append(self.content.msg("privacy_notice", privacy_url=url))
            session.privacy_shown = True

        if session.state == "start":           # tras el primer intercambio, la conversación queda en reposo
            session.state = "menu"
        self._postprocess(reply)
        # Cualquier respuesta entendida reinicia el contador de «no entendí».
        # (pregunta_climatica lo maneja ella misma porque puede terminar en fallback).
        if decision.handler not in NO_RESET and decision.handler != "pregunta_climatica":
            session.fallback_count = 0
        session.turns += 1

        if not reply.meta.get("deleted"):
            db.save_session(session)
            if incoming.text:
                db.log_message(user_key, "in", incoming.text, understood.intent if understood else None,
                               understood.confidence if understood else None)
            db.log_message(user_key, "out", " | ".join(reply.messages)[:2000], decision.handler)

        reply.meta.update({
            "handler": decision.handler, "reason": decision.reason, "state": session.state,
            "intent": understood.intent if understood else None,
            "confidence": understood.confidence if understood else None,
        })
        return reply

    def _postprocess(self, reply: Reply) -> None:
        limit = int(self.content.bot["ux"].get("max_paragraph_chars", 420))
        reply.messages = [part for m in reply.messages if m for part in split_long(m.strip(), limit)]
        seen, buttons = set(), []
        for b in reply.buttons:                      # sin botones repetidos
            if b.payload not in seen:
                seen.add(b.payload)
                buttons.append(b)
        if not buttons:
            buttons = [back_to_menu(self.content)]
        reply.buttons = buttons


_bot: Bot | None = None


def get_bot() -> Bot:
    global _bot
    if _bot is None:
        _bot = Bot()
    return _bot
