"""Configuración común de las pruebas: base de datos temporal y canales en modo simulado."""
import os
import sys
import tempfile
from pathlib import Path

import pytest

_TMP = tempfile.mkdtemp(prefix="ceiba-bot-tests-")
os.environ.update({
    "DATABASE_PATH": str(Path(_TMP) / "test.sqlite3"),
    "CHANNEL_DRY_RUN": "true",
    "LLM_PROVIDER": "none",
    "RAG_RETRIEVER": "bm25",
    "APP_ENV": "test",
    "META_APP_SECRET": "secreto-de-prueba",
    "META_VERIFY_TOKEN": "token-de-verificacion",
    "TELEGRAM_SECRET_TOKEN": "secreto-telegram",
    "ADMIN_TOKEN": "admin-prueba",
    "RATE_LIMIT_PER_MINUTE": "1000",
})
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.storage import db  # noqa: E402

db.init_db()


@pytest.fixture
def bot():
    from app.orchestrator import Bot
    return Bot()


@pytest.fixture
def talk(bot):
    """talk("texto") o talk(payload="i:menu") → Reply. Cada prueba usa una persona distinta."""
    import uuid

    from app.models import Incoming
    user = f"test-{uuid.uuid4().hex[:10]}"

    def _talk(text: str = "", payload: str | None = None, event: str | None = None):
        return bot.handle(Incoming(channel="web", user_id=user, text=text, payload=payload, event=event))
    return _talk
