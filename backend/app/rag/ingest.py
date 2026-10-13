"""INGESTA: descarga los documentos de la biblioteca, extrae el texto y lo trocea.

Se ejecuta con:  python scripts/ingest_bibliography.py
Resultado:       data/index/passages.jsonl  (una línea JSON por fragmento)

Respeta a los servidores: identifica al bot con User-Agent, espera entre descargas y
solo procesa documentos con `ingest: true` en content/bibliography.yaml.
Los PDF requieren `pip install pypdf`; si no está instalado, se omiten con aviso.
"""
from __future__ import annotations

import io
import json
import logging
import re
import time
from html.parser import HTMLParser
from pathlib import Path

import httpx

log = logging.getLogger(__name__)

USER_AGENT = "CEIBA-bot-ingest/1.0 (+https://github.com/; uso educativo)"   # EDITA AQUÍ: pon la URL del repo
CHUNK_CHARS = 900
OVERLAP = 150
SKIP_TAGS = {"script", "style", "nav", "header", "footer", "noscript", "svg", "form", "aside"}


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self._skip += 1
        elif tag in {"p", "li", "h1", "h2", "h3", "h4", "br", "tr", "div"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip:
            self.parts.append(data)


def html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    text = "".join(parser.parts)
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    lines = [ln.strip() for ln in text.split("\n")]
    return "\n".join(ln for ln in lines if len(ln) > 40)     # descarta menús y migas de pan


def pdf_to_text(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        log.warning("pypdf no está instalado: se omite el PDF (pip install pypdf)")
        return ""
    reader = PdfReader(io.BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def chunk(text: str, size: int = CHUNK_CHARS, overlap: int = OVERLAP) -> list[str]:
    text = re.sub(r"\n{2,}", "\n", text).strip()
    chunks, start = [], 0
    while start < len(text):
        end = min(len(text), start + size)
        if end < len(text):
            cut = text.rfind(". ", start + size // 2, end)
            end = cut + 1 if cut != -1 else end
        piece = text[start:end].strip()
        if len(piece) > 120:
            chunks.append(piece)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return chunks


def drop_boilerplate(texts: dict[str, str]) -> dict[str, str]:
    """Quita líneas que se repiten en 2 o más documentos (menús, noticias laterales, avisos
    del sitio). Así el índice solo guarda el contenido propio de cada página."""
    seen: dict[str, int] = {}
    for text in texts.values():
        for line in set(text.split("\n")):
            seen[line] = seen.get(line, 0) + 1
    return {doc_id: "\n".join(ln for ln in text.split("\n") if seen.get(ln, 0) < 2) for doc_id, text in texts.items()}


def ingest(documents: list[dict], out_dir: Path, delay_s: float = 1.5) -> dict[str, int]:
    out_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, int] = {}
    texts: dict[str, str] = {}
    lines: list[str] = []
    with httpx.Client(headers={"User-Agent": USER_AGENT}, timeout=40, follow_redirects=True) as client:
        for doc in documents:
            if not doc.get("ingest"):
                continue
            try:
                resp = client.get(doc["url"])
                resp.raise_for_status()
            except httpx.HTTPError as exc:
                log.warning("No se pudo descargar %s: %s", doc["id"], exc)
                report[doc["id"]] = 0
                continue
            is_pdf = "pdf" in resp.headers.get("content-type", "") or doc.get("pdf")
            texts[doc["id"]] = pdf_to_text(resp.content) if is_pdf else html_to_text(resp.text)
            if not texts[doc["id"]].strip():
                log.warning("%s: la página no devolvió texto legible (¿protección anti-bots o contenido con JavaScript?)", doc["id"])
            time.sleep(delay_s)
    for doc_id, text in drop_boilerplate(texts).items():
        pieces = chunk(text)
        for i, piece in enumerate(pieces):
            lines.append(json.dumps({"doc_id": doc_id, "chunk_id": i, "text": piece}, ensure_ascii=False))
        report[doc_id] = len(pieces)
        log.info("%s → %d fragmentos", doc_id, len(pieces))
    (out_dir / "passages.jsonl").write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
    return report
