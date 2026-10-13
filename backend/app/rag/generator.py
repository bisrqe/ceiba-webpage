"""GENERACIÓN (la «G» de RAG): redacta la respuesta usando SOLO las fuentes encontradas.

Dos modos (variable LLM_PROVIDER en .env):
  · none (por defecto) → respuesta EXTRACTIVA: cita los datos clave verificados del
    catálogo o el fragmento del documento. Cero alucinaciones, cero costo.
  · anthropic | openai_compatible → un modelo de lenguaje redacta en tono amable,
    con instrucciones estrictas de usar únicamente el contexto y citar [n].
    Si el modelo falla, no cita o responde SIN_FUENTE, el bot vuelve al modo extractivo.

`openai_compatible` sirve para cualquier API con el formato /chat/completions
(OpenAI, Ollama local con Llama/Mistral, vLLM, LM Studio, etc.).
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field

import httpx

from .. import config
from ..models import Card
from ..nlu.normalizer import tokens
from .retriever import Hit

log = logging.getLogger(__name__)

LEVEL_LABEL = {"basico": "Básico", "intermedio": "Intermedio", "avanzado": "Avanzado"}
TYPE_LABEL = {"tratado": "Tratado", "conferencia": "Conferencia", "guia": "Guía",
              "ciencia": "Ciencia", "institucional": "Institucional"}


@dataclass
class Answer:
    messages: list[str]
    cards: list[Card] = field(default_factory=list)
    doc_ids: list[str] = field(default_factory=list)
    mode: str = "extractive"


def document_card(doc: dict) -> Card:
    """Tarjeta visual de una lectura (en lugar de pegar la URL cruda)."""
    tag = " · ".join(filter(None, [LEVEL_LABEL.get(doc.get("level"), ""), TYPE_LABEL.get(doc.get("type"), ""),
                                    str(doc.get("lang", "")).upper()]))
    icon = {"tratado": "📜", "conferencia": "🏛️", "guia": "📘", "ciencia": "📊"}.get(doc.get("type"), "📄")
    return Card(
        title=f"{icon} {doc.get('title_es') or doc['title']}",
        body=str(doc.get("summary_es", "")).strip(),
        tag=tag,
        url=doc["url"],
        url_label="👁️ Leer PDF en línea" if doc.get("pdf") else "👁️ Leer en línea",
        download_url=doc["url"] if doc.get("pdf") else None,
    )


def _relevant_facts(doc: dict, query: str, n: int = 2) -> list[str]:
    q = set(tokens(query))
    facts = doc.get("key_facts", [])
    ranked = sorted(facts, key=lambda f: len(q & set(tokens(f))), reverse=True)
    return ranked[:n] if ranked else []


def extractive(query: str, hits: list[Hit], docs: dict[str, dict]) -> Answer:
    top = docs[hits[0].doc_id]
    lines = [f"📌 Encontré esto en **{top.get('title_es') or top['title']}**:"]
    for fact in _relevant_facts(top, query):
        lines.append(f"• {fact}")
    if hits[0].kind == "passage" and hits[0].text:
        snippet = hits[0].text.strip().replace("\n", " ")
        snippet = snippet[:320].rsplit(" ", 1)[0] + "…"
        lang = str(top.get("lang", "")).upper()
        lines.append(f"Fragmento del documento original ({lang}): «{snippet}»")
    cards = [document_card(docs[h.doc_id]) for h in hits[:2]]
    return Answer(["\n".join(lines)], cards, [h.doc_id for h in hits[:2]], "extractive")


SYSTEM_RULES = """
REGLAS ESTRICTAS:
1. Responde SOLO con información del CONTEXTO. No uses conocimiento propio.
2. Cita cada afirmación con su número de fuente entre corchetes, por ejemplo [1].
3. Si el CONTEXTO no responde la pregunta, contesta exactamente: SIN_FUENTE
4. Máximo 3 párrafos cortos en español de México. Usa **negritas** para conceptos clave.
5. No inventes fechas, cifras, nombres ni enlaces.
""".strip()


def _build_prompt(query: str, hits: list[Hit], docs: dict[str, dict], simple: bool) -> str:
    blocks = []
    for i, h in enumerate(hits, 1):
        d = docs[h.doc_id]
        facts = " ".join(d.get("key_facts", []))
        extra = f" Fragmento: {h.text[:1200]}" if h.kind == "passage" else ""
        blocks.append(f"[{i}] {d.get('title_es') or d['title']} ({d['url']}). {d.get('summary_es', '')} {facts}{extra}")
    audience = "Explica como para alguien de 8 a 14 años." if simple else "Explica para estudiantes universitarios."
    return "CONTEXTO:\n" + "\n".join(blocks) + f"\n\n{audience}\nPREGUNTA: {query}"


def _call_llm(system: str, prompt: str) -> str:
    s = config.settings
    if s.llm_provider == "anthropic":
        r = httpx.post(
            (s.llm_base_url or "https://api.anthropic.com") + "/v1/messages",
            headers={"x-api-key": s.llm_api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": s.llm_model, "max_tokens": 600, "system": system,
                  "messages": [{"role": "user", "content": prompt}]},
            timeout=s.llm_timeout_s,
        )
        r.raise_for_status()
        return "".join(part.get("text", "") for part in r.json().get("content", []))
    if s.llm_provider == "openai_compatible":
        r = httpx.post(
            s.llm_base_url.rstrip("/") + "/chat/completions",
            headers={"Authorization": f"Bearer {s.llm_api_key}"} if s.llm_api_key else {},
            json={"model": s.llm_model, "temperature": 0.2, "max_tokens": 600,
                  "messages": [{"role": "system", "content": system}, {"role": "user", "content": prompt}]},
            timeout=s.llm_timeout_s,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    raise ValueError(f"LLM_PROVIDER desconocido: {s.llm_provider}")


def generate(query: str, hits: list[Hit], docs: dict[str, dict], persona: str, simple: bool = False) -> Answer | None:
    """Devuelve una respuesta con fuentes, o None si no hay fuente suficiente."""
    if not hits:
        return None
    if config.settings.llm_provider == "none":
        return extractive(query, hits, docs)
    try:
        text = _call_llm(f"{persona}\n\n{SYSTEM_RULES}", _build_prompt(query, hits, docs, simple)).strip()
    except Exception as exc:  # red, cuota, credenciales: nunca dejamos a la persona sin respuesta
        log.warning("LLM no disponible (%s); uso modo extractivo", exc)
        return extractive(query, hits, docs)
    if "SIN_FUENTE" in text:
        return None
    if not re.search(r"\[\d+\]", text):
        log.info("El LLM respondió sin citar; uso modo extractivo por seguridad")
        return extractive(query, hits, docs)
    cards = [document_card(docs[h.doc_id]) for h in hits]      # mismas fuentes [1], [2], [3] del texto
    return Answer([text], cards, [h.doc_id for h in hits], "llm")
