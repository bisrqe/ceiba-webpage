"""ENRUTADOR DE RECOMENDACIONES: elige qué lecturas sugerir según el perfil.

Puntaje transparente (se puede explicar a la persona y auditar):
  +3  el nivel del documento coincide con el nivel de la persona
  +1  el nivel es adyacente (básico↔intermedio, intermedio↔avanzado)
  +2  el documento sirve para el programa de interés
  +1  el documento tiene la etiqueta del tema pedido
  -5  ya se le recomendó antes (para no repetir)
Desempate: documentos más recientes primero.

Para cambiar qué se recomienda NO edites este archivo: ajusta `level`, `programs`
y `tags` de cada documento en content/bibliography.yaml.
"""
from __future__ import annotations

from ..dialogue.context import Profile

ORDER = ["basico", "intermedio", "avanzado"]


def person_level(profile: Profile) -> str:
    if profile.perfil == "aprender":
        return "basico"
    return profile.nivel or "basico"


def score(doc: dict, profile: Profile, topic: str | None, already: list[str]) -> float:
    lvl = person_level(profile)
    s = 0.0
    if doc.get("level") == lvl:
        s += 3
    elif doc.get("level") in ORDER and abs(ORDER.index(doc["level"]) - ORDER.index(lvl)) == 1:
        s += 1
    if profile.interes and profile.interes in doc.get("programs", []):
        s += 2
    if topic and topic in doc.get("tags", []):
        s += 1
    if doc["id"] in already:
        s -= 5
    return s + doc.get("year", 0) / 10000           # desempate por año


def recommend(documents: list[dict], profile: Profile, topic: str | None = None,
              already: list[str] | None = None, n: int = 3) -> list[dict]:
    already = already or []
    pool = [d for d in documents if not topic or topic in d.get("tags", [])] or documents
    # Al perfil «aprender» (8 a 14 años o primera vez) no se le recomiendan documentos avanzados.
    if profile.perfil == "aprender":
        pool = [d for d in pool if d.get("level") != "avanzado"] or pool
    ranked = sorted(pool, key=lambda d: score(d, profile, topic, already), reverse=True)
    return ranked[:n]
