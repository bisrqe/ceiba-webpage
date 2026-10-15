"""RECUPERACIÓN (la «R» de RAG): encuentra qué documentos de la biblioteca responden
una pregunta.

Dos niveles de búsqueda:
  1. Catálogo  → metadatos en español de content/bibliography.yaml (título, resumen,
                 datos clave, palabras clave). Siempre disponible.
  2. Pasajes   → texto completo descargado y troceado por scripts/ingest_bibliography.py
                 (data/index/passages.jsonl). Opcional.

Algoritmo por defecto: BM25 (búsqueda por palabras, sin dependencias ni internet).
Limitación conocida: BM25 no entiende sinónimos ni cruza idiomas. Por eso:
  · las preguntas se expanden con equivalentes en inglés/francés (entities.yaml → query_expansion);
  · si necesitas búsqueda semántica real, activa RAG_RETRIEVER=embeddings (ver docs/05).
"""
from __future__ import annotations

import json
import logging
import math
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from ..nlu.normalizer import tokens

log = logging.getLogger(__name__)


def stem(word: str) -> str:
    """Raíz muy simple para español e inglés: quita plurales. Suficiente para BM25."""
    if len(word) > 7 and word.endswith(("ciones", "siones")):
        return word[:-3] + "n"                 # negociaciones → negociacion
    if len(word) > 4 and word.endswith("s") and not word.endswith("ss"):
        return word[:-1]                       # tratados → tratado, agreements → agreement
    return word


# Palabras de pregunta que no aportan tema ("¿dónde será…?", "¿qué dice…?").
QUESTION_WORDS = {"donde", "cuando", "quien", "quienes", "cual", "cuales", "como", "cuanto", "cuantos", "sera",
                  "fue", "son", "paso", "dice", "dicen", "saber", "explica", "explicame", "significa", "decidio",
                  "habla", "trata", "hizo", "hace", "ser", "esta", "estan", "tiene", "what", "when", "where", "who"}


def analyze(text: str) -> list[str]:
    return [stem(t) for t in tokens(text) if t not in QUESTION_WORDS]


@dataclass
class Hit:
    doc_id: str
    score: float
    kind: str          # catalog | passage
    text: str = ""
    coverage: float = 1.0   # qué proporción (ponderada) de la pregunta aparece en el documento


class BM25:
    def __init__(self, docs: list[list[str]], k1: float = 1.4, b: float = 0.75):
        self.docs, self.k1, self.b = docs, k1, b
        self.avgdl = sum(map(len, docs)) / max(len(docs), 1)
        df: Counter = Counter()
        for d in docs:
            df.update(set(d))
        n = len(docs)
        self.idf = {t: math.log(1 + (n - f + 0.5) / (f + 0.5)) for t, f in df.items()}
        self.tf = [Counter(d) for d in docs]

    def scores(self, query: list[str]) -> list[float]:
        out = []
        for tf, doc in zip(self.tf, self.docs):
            s = 0.0
            for t in set(query):
                if t in tf:
                    f = tf[t]
                    s += self.idf[t] * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * len(doc) / self.avgdl))
            out.append(s)
        return out


def catalog_text(doc: dict) -> str:
    keywords = " ".join(doc.get("keywords", []))
    return " ".join([
        doc.get("title", ""), doc.get("title_es", ""), doc.get("summary_es", ""),
        " ".join(doc.get("key_facts", [])), keywords, keywords,   # palabras clave pesan doble
    ])


class Retriever:
    def __init__(self, documents: list[dict], index_dir: Path):
        self.documents = documents
        self._cat_ids = [d["id"] for d in documents]
        self._cat = BM25([analyze(catalog_text(d)) for d in documents])
        self.passages: list[dict] = []
        path = index_dir / "passages.jsonl"
        if path.exists():
            with path.open(encoding="utf-8") as fh:
                self.passages = [json.loads(line) for line in fh if line.strip()]
            log.info("Biblioteca: %d pasajes cargados de %s", len(self.passages), path)
        self._pas = BM25([analyze(p["text"]) for p in self.passages]) if self.passages else None

    def coverage(self, query_terms: list[str], doc_terms: set[str]) -> float:
        """Cobertura ponderada por rareza: evita que una sola palabra común («mundial»)
        haga creer al bot que tiene la respuesta a «¿quién ganó el mundial?».
        Las palabras que no existen en la biblioteca pesan lo máximo."""
        if not query_terms:
            return 0.0
        ceiling = max(self._cat.idf.values(), default=1.0) + 1
        weights = {t: self._cat.idf.get(t, ceiling) for t in set(query_terms)}
        total = sum(weights.values())
        return sum(w for t, w in weights.items() if t in doc_terms) / total if total else 0.0

    def search(self, query: str, k: int = 3, original: str | None = None) -> list[Hit]:
        q = analyze(query)
        q_orig = analyze(original) if original else q
        if not q:
            return []
        best: dict[str, Hit] = {}
        for i, (doc_id, s) in enumerate(zip(self._cat_ids, self._cat.scores(q))):
            if s > 0:
                terms = set(self._cat.docs[i])
                cov = max(self.coverage(q_orig, terms), self.coverage(q, terms))
                best[doc_id] = Hit(doc_id, s, "catalog", coverage=cov)
        if self._pas:
            for i, (p, s) in enumerate(zip(self.passages, self._pas.scores(q))):
                s *= 0.8                                  # el catálogo curado tiene prioridad
                if s > 0 and (p["doc_id"] not in best or s > best[p["doc_id"]].score):
                    terms = set(self._pas.docs[i])
                    cov = max(self.coverage(q_orig, terms), self.coverage(q, terms))
                    best[p["doc_id"]] = Hit(p["doc_id"], s, "passage", p["text"], cov)
        return sorted(best.values(), key=lambda h: h.score, reverse=True)[:k]


class EmbeddingRetriever(Retriever):
    """Búsqueda semántica multilingüe (opcional, RAG_RETRIEVER=embeddings).

    Requiere `pip install sentence-transformers numpy`. Descarga el modelo la primera
    vez. Entiende sinónimos y cruza idiomas (pregunta en español, documento en inglés).
    ⚠️ No se ejecuta en las pruebas automáticas (CI); pruébalo localmente antes de
    activarlo en producción.
    """

    def __init__(self, documents: list[dict], index_dir: Path, model_name: str):
        super().__init__(documents, index_dir)
        from sentence_transformers import SentenceTransformer  # import diferido: dependencia opcional
        import numpy as np

        self._np = np
        self._model = SentenceTransformer(model_name)
        self._units = [("catalog", d["id"], catalog_text(d)) for d in documents]
        self._units += [("passage", p["doc_id"], p["text"]) for p in self.passages]
        self._matrix = self._model.encode([u[2] for u in self._units], normalize_embeddings=True)

    def search(self, query: str, k: int = 3, original: str | None = None) -> list[Hit]:
        qv = self._model.encode([query], normalize_embeddings=True)[0]
        sims = self._matrix @ qv
        best: dict[str, Hit] = {}
        for (kind, doc_id, text), s in zip(self._units, sims):
            s = float(s) * 10                             # escala comparable con RAG_MIN_SCORE
            if doc_id not in best or s > best[doc_id].score:
                best[doc_id] = Hit(doc_id, s, kind, text if kind == "passage" else "")
        return sorted(best.values(), key=lambda h: h.score, reverse=True)[:k]
