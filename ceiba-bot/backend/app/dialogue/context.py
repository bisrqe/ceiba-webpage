"""CONTEXTO de la conversación: lo que el bot recuerda de cada persona.

Se guarda como JSON en la base de datos (storage/db.py) y viaja entre mensajes.
Permite no perder el hilo: si la persona estaba en la pregunta 3 de la evaluación y
pregunta otra cosa, al volver el bot retoma en la pregunta 3.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any

from .states import State


@dataclass
class Profile:
    perfil: str | None = None        # aprender | estudiante | aliado
    interes: str | None = None       # internacionales | semanatec | anual | no_se
    nivel: str | None = None         # basico | intermedio | avanzado
    campus: str | None = None        # id de content/contacts.yaml
    etapa: str | None = None         # none | idea | design | impl
    aciertos: int = 0
    completed: bool = False

    @property
    def simple(self) -> bool:
        """Modo sencillo para el perfil «aprender» (8 a 14 años o primera vez)."""
        return self.perfil == "aprender"


@dataclass
class Session:
    user_key: str
    channel: str
    state: str = State.START.value
    step: int = 0                            # pregunta actual de la evaluación
    answers: dict[str, str] = field(default_factory=dict)
    profile: Profile = field(default_factory=Profile)
    fallback_count: int = 0
    last_topic: str | None = None            # para el saludo de regreso
    recommended: list[str] = field(default_factory=list)   # ids de lecturas ya sugeridas
    pending_handoff: dict[str, Any] | None = None           # derivación esperando campus o envío
    privacy_shown: bool = False
    turns: int = 0

    def to_json(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "Session":
        data = dict(data)
        data["profile"] = Profile(**data.get("profile", {}))
        known = {f for f in cls.__dataclass_fields__}
        return cls(**{k: v for k, v in data.items() if k in known})

    def set_state(self, state: State) -> None:
        self.state = state.value

    @property
    def state_enum(self) -> State:
        try:
            return State(self.state)
        except ValueError:
            return State.MENU
