#!/usr/bin/env python3
"""Descarga el texto completo de la biblioteca para el RAG (data/index/passages.jsonl).

    python scripts/ingest_bibliography.py

Ejecútalo cada vez que agregues o cambies documentos en content/bibliography.yaml.
Después reinicia el servidor o llama a POST /admin/reload.
Si un sitio bloquea la descarga, el bot sigue funcionando con el resumen y los
datos clave del catálogo.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import config  # noqa: E402
from app.content_loader import load_content  # noqa: E402
from app.rag.ingest import ingest  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

if __name__ == "__main__":
    content = load_content()
    report = ingest(content.documents, config.settings.index_dir)
    total = sum(report.values())
    print("\nResumen:")
    for doc_id, n in report.items():
        print(f"  {'✅' if n else '⚠️ '} {doc_id}: {n} fragmentos")
    print(f"\n{total} fragmentos guardados en {config.settings.index_dir / 'passages.jsonl'}")
