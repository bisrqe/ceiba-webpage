"""Biblioteca climática (RAG): búsqueda + redacción con fuentes."""
from __future__ import annotations

import logging

from .. import config
from ..content_loader import Content
from .generator import Answer, document_card, generate
from .retriever import EmbeddingRetriever, Hit, Retriever

log = logging.getLogger(__name__)


class Library:
    def __init__(self, content: Content, expand=None):
        s = config.settings
        self.docs = {d["id"]: d for d in content.documents}
        self.persona = content.bot["bot"].get("persona", "")
        self.expand = expand or (lambda q: q)
        if s.rag_retriever == "embeddings":
            try:
                self.retriever: Retriever = EmbeddingRetriever(content.documents, s.index_dir, s.embeddings_model)
            except Exception as exc:
                log.warning("No se pudo activar embeddings (%s). Uso BM25.", exc)
                self.retriever = Retriever(content.documents, s.index_dir)
        else:
            self.retriever = Retriever(content.documents, s.index_dir)

    def search(self, query: str, k: int = 3) -> list[Hit]:
        """Solo devuelve documentos con puntaje suficiente Y que cubran al menos la mitad
        (ponderada) de la pregunta. Si nada pasa el filtro, el bot dice que no tiene fuente."""
        hits = self.retriever.search(self.expand(query), k=k, original=query)
        s = config.settings
        hits = [h for h in hits if h.score >= s.rag_min_score and h.coverage >= s.rag_min_coverage]
        # Fuentes secundarias solo si son casi tan relevantes como la primera (evita tarjetas de relleno).
        return [h for h in hits if h.score >= 0.5 * hits[0].score] if hits else []

    def ask(self, query: str, simple: bool = False) -> Answer | None:
        return generate(query, self.search(query), self.docs, self.persona, simple)


__all__ = ["Library", "Answer", "document_card"]
