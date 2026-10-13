"""MÁQUINA DE ESTADOS / ÁRBOL DE DECISIÓN (nivel micro).

`route()` decide QUÉ función de cumplimiento atiende cada mensaje. No redacta
respuestas: solo elige el camino. El orden de las reglas importa y está numerado
igual que en docs/04_FLUJOS_CONVERSACIONALES.md:

  1. Botón tocado (payload)           → ruta directa, sin interpretar texto.
  2. Evento "start"                   → saludo (o saludo de regreso).
  3. Comandos globales                → borrar datos, retomar con código, menú.
  4. Reglas de DERIVACIÓN             → propuesta concreta / espacio / persona del campus.
  5. Lo que el estado actual espera   → opción de la evaluación, campus, pregunta libre.
  6. Pregunta frecuente (FAQ)         → respuesta predeterminada exacta.
  7. Intención reconocida             → su función de cumplimiento.
  8. Término del glosario             → definición.
  9. Pregunta climática               → biblioteca (RAG).
 10. Nada de lo anterior              → fallback (y derivación tras N intentos).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from ..content_loader import Content
from ..models import Incoming
from ..nlu import NLUResult
from ..nlu.intent_classifier import best_match
from ..nlu.normalizer import normalize
from .context import Session
from .states import State

GLOBAL_INTENTS = {"borrar_datos", "retomar", "menu"}
# Intenciones lo bastante claras como para salir de un flujo a medias (se conserva el avance).
INTERRUPT_MIN_CONFIDENCE = 0.6


@dataclass
class Route:
    handler: str
    args: dict[str, Any] = field(default_factory=dict)
    reason: str = ""


def _payload_route(payload: str) -> Route:
    kind, _, rest = payload.partition(":")
    if kind == "i":
        intent, _, arg = rest.partition(":")
        return Route(intent, {"arg": arg} if arg else {}, "botón")
    if kind == "q":
        qid, _, value = rest.partition(":")
        return Route("profile_answer", {"qid": qid, "value": value}, "botón")
    table = {"c": ("handoff_campus", "campus"), "lib": ("biblioteca_tema", "topic"),
             "doc": ("documento", "doc"), "prog": ("programa_detalle", "program"),
             "faq": ("faq", "faq"), "sec": ("sector_detalle", "sector")}
    if kind in table:
        handler, key = table[kind]
        return Route(handler, {key: rest}, "botón")
    return Route("fallback", reason=f"payload desconocido: {payload}")


def match_option(text: str, question: dict) -> str | None:
    """Convierte lo que la persona escribe en una opción de la pregunta actual.
    Acepta el número ("2"), el texto corto, el texto completo o el valor interno."""
    options = question.get("options", [])
    norm = normalize(text)
    if norm.isdigit() and 1 <= int(norm) <= len(options):
        return options[int(norm) - 1]["value"]
    candidates = {o["value"]: [o.get("short", ""), o.get("text", ""), o["value"]] for o in options}
    value, _ = best_match(text, candidates, min_score=0.55)
    return value


def route(session: Session, incoming: Incoming, nlu: NLUResult | None, content: Content) -> Route:
    # 1. Botón tocado
    if incoming.payload:
        return _payload_route(incoming.payload)

    # 2. Apertura del chat
    if incoming.event == "start" or (session.state_enum is State.START and not incoming.text.strip()):
        return Route("saludo", reason="inicio")

    assert nlu is not None
    ents = nlu.entities

    # 3. Comandos globales (funcionan en cualquier estado)
    if "resume_code" in ents:
        return Route("retomar", {"code": ents["resume_code"]}, "código de continuidad")
    if nlu.intent in GLOBAL_INTENTS and nlu.confidence >= INTERRUPT_MIN_CONFIDENCE:
        return Route(nlu.intent, reason="comando global")

    # 4. Reglas de derivación al secretario de campus
    if "handoff" in ents and session.state_enum is not State.PROFILE:
        return Route("derivar", {"category": ents["handoff"], "campus": ents.get("campus"),
                                 "excerpt": incoming.text[:280]}, "regla de derivación")

    # 5. Lo que el estado actual está esperando
    state = session.state_enum
    if state is State.PROFILE:
        questions = content.diagnostic["questions"]
        if session.step < len(questions):
            q = questions[session.step]
            value = ents.get("campus") if q.get("kind") == "campus" else match_option(incoming.text, q)
            if value:
                return Route("profile_answer", {"qid": q["id"], "value": value}, "respuesta de evaluación")
            if not (nlu.intent and nlu.confidence >= INTERRUPT_MIN_CONFIDENCE):
                return Route("profile_reask", reason="respuesta no reconocida")
            # Si la intención es clara, se atiende y la evaluación queda en pausa.
    if state is State.HANDOFF_CAMPUS:
        if "campus" in ents:
            return Route("handoff_campus", {"campus": ents["campus"]}, "campus recibido")
        if not (nlu.intent and nlu.confidence >= INTERRUPT_MIN_CONFIDENCE):
            return Route("handoff_reask", reason="campus no reconocido")
    if state is State.LIBRARY_QUERY and not (nlu.intent and nlu.intent not in {"pregunta_climatica", "biblioteca", "definir_termino"} and nlu.confidence >= INTERRUPT_MIN_CONFIDENCE):
        return Route("pregunta_climatica", {"query": incoming.text}, "pregunta libre de biblioteca")

    # 6. Pregunta frecuente con buena coincidencia
    if nlu.faq and nlu.faq_score >= max(0.7, nlu.confidence):
        return Route("faq", {"faq": nlu.faq}, f"FAQ ({nlu.faq_score})")

    # 7. Intención reconocida
    if nlu.intent == "definir_termino" and "term" not in ents:
        nlu.intent = None                       # "qué es" sin término conocido → sigue abajo
    if nlu.intent:
        args: dict[str, Any] = {}
        if nlu.intent == "ver_programas" and "programa" in ents:
            return Route("programa_detalle", {"program": ents["programa"]}, "programa mencionado")
        if nlu.intent == "definir_termino":
            args["term"] = ents["term"]
        if nlu.intent == "pregunta_climatica":
            args["query"] = incoming.text
        return Route(nlu.intent, args, f"intención ({nlu.confidence})")

    # 8. Término del glosario mencionado sin "qué es"
    if "term" in ents and len(normalize(incoming.text).split()) <= 4:
        return Route("definir_termino", {"term": ents["term"]}, "término del glosario")

    # 9. Puede ser una pregunta de contenido: la biblioteca decide si tiene fuente
    if nlu.faq:
        return Route("faq", {"faq": nlu.faq}, f"FAQ débil ({nlu.faq_score})")
    return Route("pregunta_climatica", {"query": incoming.text, "from_fallback": True}, "sin intención: intenta biblioteca")
