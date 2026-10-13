"""Clasificador de INTENCIONES basado en reglas y similitud de palabras.

Por qué reglas y no un modelo de IA por defecto:
  · Es predecible y auditable: cualquier editor ve en content/intents.yaml por qué
    el bot entendió lo que entendió.
  · Funciona sin internet, sin costo por mensaje y sin enviar datos a terceros.
  · Si en el futuro se necesita más flexibilidad, se puede sustituir esta clase por
    un clasificador con embeddings o un LLM manteniendo la misma interfaz `classify()`.

Puntaje (0 a 1) de cada intención:
  · keyword: si una palabra clave aparece completa → 0.6 + 0.1 por cada clave extra (tope 0.95).
    Las claves de varias palabras pesan más que las de una sola.
  · ejemplos: proporción de palabras del ejemplo que aparecen en el mensaje × 0.8
    (los ejemplos de una sola palabra útil valen la mitad, para que "hacer" no gane solo).
  Se toma el mayor de los dos.
"""
from __future__ import annotations

from dataclasses import dataclass

from .normalizer import contains_phrase, normalize, tokens


@dataclass
class IntentScore:
    intent: str
    score: float
    matched: str = ""


class IntentClassifier:
    def __init__(self, intents_cfg: dict):
        self.intents: dict = intents_cfg.get("intents", {})
        self.threshold: float = float(intents_cfg.get("threshold", 0.45))
        # Precalcula tokens de los ejemplos.
        self._examples = {
            name: [set(tokens(ex)) for ex in cfg.get("examples", []) if tokens(ex)]
            for name, cfg in self.intents.items()
        }

    def rank(self, text: str) -> list[IntentScore]:
        norm = normalize(text)
        msg_tokens = set(tokens(text))
        results: list[IntentScore] = []
        for name, cfg in self.intents.items():
            hits = [k for k in cfg.get("keywords", []) if contains_phrase(norm, k)]
            kw_score = 0.0
            if hits:
                longest = max(len(normalize(h).split()) for h in hits)
                kw_score = min(0.95, 0.55 + 0.05 * longest + 0.1 * (len(hits) - 1))
            ex_score = 0.0
            for ex in self._examples.get(name, []):
                overlap = len(ex & msg_tokens) / len(ex)
                weight = 0.8 if len(ex) >= 2 else 0.4
                ex_score = max(ex_score, overlap * weight)
            score = max(kw_score, ex_score)
            if score > 0:
                results.append(IntentScore(name, round(score, 3), hits[0] if hits else "ejemplo"))
        results.sort(key=lambda r: r.score, reverse=True)
        return results

    def classify(self, text: str) -> IntentScore | None:
        ranking = self.rank(text)
        if ranking and ranking[0].score >= self.threshold:
            return ranking[0]
        return None


def best_match(text: str, candidates: dict[str, list[str]], min_score: float = 0.5) -> tuple[str | None, float]:
    """Compara `text` con varias listas de frases (p. ej. preguntas frecuentes y sus variantes).

    Devuelve (id, puntaje) del mejor candidato o (None, 0). Lo usan FAQ y opciones de botones.
    """
    norm = normalize(text)
    msg_tokens = set(tokens(text))
    best_id, best = None, 0.0
    for cid, phrases in candidates.items():
        for phrase in phrases:
            if not phrase:
                continue
            if contains_phrase(norm, phrase):
                score = 0.9 if len(normalize(phrase).split()) > 1 else 0.7
            else:
                ptoks = set(tokens(phrase))
                if not ptoks:
                    continue
                score = len(ptoks & msg_tokens) / len(ptoks) * 0.85
            if score > best:
                best_id, best = cid, score
    return (best_id, round(best, 3)) if best >= min_score else (None, 0.0)
