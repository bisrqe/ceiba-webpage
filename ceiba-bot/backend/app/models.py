"""Formato NEUTRAL de mensajes.

Todos los canales (web, WhatsApp, Telegram, Messenger) convierten lo que reciben a
`Incoming` y convierten la `Reply` del bot a su propio formato. Así la lógica del bot
se escribe una sola vez y no sabe de qué canal viene cada mensaje.

Esquema de `payload` (lo que manda un botón al tocarlo). Máximo 64 bytes por
limitación de Telegram:
    i:<intención>[:<argumento>]   → ejecuta una intención         p. ej. i:ver_programas
    q:<pregunta>:<valor>          → responde la evaluación         p. ej. q:perfil:estudiante
    c:<campus>                    → elige campus para derivación   p. ej. c:monterrey
    lib:<tema>                    → tema de la biblioteca          p. ej. lib:tratados
    doc:<id>                      → detalle de una lectura         p. ej. doc:acuerdo_paris
    prog:<id> · faq:<id> · sec:<id> → detalle de programa, pregunta frecuente, sector
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass
class Incoming:
    channel: str                 # web | whatsapp | telegram | messenger | cli
    user_id: str                 # id del canal (se guarda HASHEADO, nunca en claro)
    text: str = ""               # texto escrito por la persona
    payload: str | None = None   # id del botón tocado (ver esquema arriba)
    event: str | None = None     # "start" al abrir el chat, None en mensajes normales
    display_name: str | None = None
    raw: dict[str, Any] = field(default_factory=dict)


@dataclass
class Button:
    label: str                   # texto completo (web, Telegram)
    payload: str                 # qué hace al tocarlo
    short: str = ""              # texto corto (WhatsApp/Messenger, ≤ 20 o 24 caracteres)
    desc: str = ""               # descripción (filas de lista en WhatsApp, ≤ 72)

    def short_label(self, limit: int = 20) -> str:
        text = self.short or self.label
        return text if len(text) <= limit else text[: limit - 1] + "…"


@dataclass
class Card:
    """Tarjeta enriquecida (lectura recomendada, contacto, programa)."""
    title: str
    body: str = ""
    tag: str = ""                # etiqueta pequeña: "Básico · Tratado · EN"
    url: str | None = None
    url_label: str = "Abrir"
    download_url: str | None = None
    buttons: list[Button] = field(default_factory=list)


@dataclass
class Reply:
    messages: list[str] = field(default_factory=list)   # burbujas de texto (Markdown ligero)
    buttons: list[Button] = field(default_factory=list) # respuestas rápidas
    cards: list[Card] = field(default_factory=list)
    meta: dict[str, Any] = field(default_factory=dict)  # intención, confianza, estado (para depurar)

    def add(self, other: "Reply") -> "Reply":
        self.messages += other.messages
        self.buttons += other.buttons
        self.cards += other.cards
        self.meta.update(other.meta)
        return self

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
