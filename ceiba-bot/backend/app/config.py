"""Configuración técnica leída de variables de entorno (archivo .env).

⚠️ No escribas claves ni tokens en este archivo. Van en `.env` (que NO se sube a
GitHub). La plantilla con explicación de cada variable está en `.env.example`.

Los TEXTOS del bot no viven aquí: están en content/*.yaml.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]          # raíz del repositorio
CONTENT_DIR = ROOT / "content"
DATA_DIR = ROOT / "data"
FRONTEND_DIR = ROOT / "frontend"


def _load_dotenv(path: Path) -> None:
    """Lector mínimo de .env (evita una dependencia extra). No sobrescribe variables ya definidas."""
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        value = value.split(" #", 1)[0].strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


_load_dotenv(ROOT / ".env")


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "si", "sí", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


def _path(name: str, default: Path) -> Path:
    """Rutas relativas se resuelven desde la raíz del repo (no desde donde se ejecuta el comando)."""
    p = Path(os.getenv(name, str(default)))
    return p if p.is_absolute() else ROOT / p


def _list(name: str, default: str = "") -> list[str]:
    return [x.strip() for x in os.getenv(name, default).split(",") if x.strip()]


@dataclass(frozen=True)
class Settings:
    # --- General -------------------------------------------------------------
    env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    public_base_url: str = field(default_factory=lambda: os.getenv("PUBLIC_BASE_URL", "http://localhost:8000"))
    allowed_origins: list[str] = field(default_factory=lambda: _list("ALLOWED_ORIGINS", "http://localhost:8000"))
    admin_token: str = field(default_factory=lambda: os.getenv("ADMIN_TOKEN", ""))
    user_hash_salt: str = field(default_factory=lambda: os.getenv("USER_HASH_SALT", "cambia-esta-sal"))

    # --- Datos y privacidad --------------------------------------------------
    database_path: Path = field(default_factory=lambda: _path("DATABASE_PATH", DATA_DIR / "ceiba_bot.sqlite3"))
    log_messages: bool = field(default_factory=lambda: _bool("LOG_MESSAGES", True))
    retention_days: int = field(default_factory=lambda: _int("RETENTION_DAYS", 180))
    resume_code_days: int = field(default_factory=lambda: _int("RESUME_CODE_DAYS", 30))
    rate_limit_per_minute: int = field(default_factory=lambda: _int("RATE_LIMIT_PER_MINUTE", 30))

    # --- Canales -------------------------------------------------------------
    channel_dry_run: bool = field(default_factory=lambda: _bool("CHANNEL_DRY_RUN", True))
    meta_graph_version: str = field(default_factory=lambda: os.getenv("META_GRAPH_VERSION", "v23.0"))
    meta_app_secret: str = field(default_factory=lambda: os.getenv("META_APP_SECRET", ""))
    meta_verify_token: str = field(default_factory=lambda: os.getenv("META_VERIFY_TOKEN", ""))
    whatsapp_token: str = field(default_factory=lambda: os.getenv("WHATSAPP_TOKEN", ""))
    whatsapp_phone_number_id: str = field(default_factory=lambda: os.getenv("WHATSAPP_PHONE_NUMBER_ID", ""))
    messenger_page_token: str = field(default_factory=lambda: os.getenv("MESSENGER_PAGE_TOKEN", ""))
    telegram_bot_token: str = field(default_factory=lambda: os.getenv("TELEGRAM_BOT_TOKEN", ""))
    telegram_secret_token: str = field(default_factory=lambda: os.getenv("TELEGRAM_SECRET_TOKEN", ""))

    # --- Avisos de derivación (handoff) --------------------------------------
    notify_targets: list[str] = field(default_factory=lambda: _list("NOTIFY_TARGETS", ""))
    smtp_host: str = field(default_factory=lambda: os.getenv("SMTP_HOST", ""))
    smtp_port: int = field(default_factory=lambda: _int("SMTP_PORT", 587))
    smtp_user: str = field(default_factory=lambda: os.getenv("SMTP_USER", ""))
    smtp_password: str = field(default_factory=lambda: os.getenv("SMTP_PASSWORD", ""))
    smtp_from: str = field(default_factory=lambda: os.getenv("SMTP_FROM", ""))
    notify_webhook_url: str = field(default_factory=lambda: os.getenv("NOTIFY_WEBHOOK_URL", ""))
    notify_webhook_secret: str = field(default_factory=lambda: os.getenv("NOTIFY_WEBHOOK_SECRET", ""))
    slack_webhook_url: str = field(default_factory=lambda: os.getenv("SLACK_WEBHOOK_URL", ""))

    # --- Biblioteca / RAG ----------------------------------------------------
    rag_retriever: str = field(default_factory=lambda: os.getenv("RAG_RETRIEVER", "bm25"))      # bm25 | embeddings
    rag_min_score: float = field(default_factory=lambda: float(os.getenv("RAG_MIN_SCORE", "1.2")))
    rag_min_coverage: float = field(default_factory=lambda: float(os.getenv("RAG_MIN_COVERAGE", "0.5")))
    embeddings_model: str = field(default_factory=lambda: os.getenv("EMBEDDINGS_MODEL", "paraphrase-multilingual-MiniLM-L12-v2"))
    llm_provider: str = field(default_factory=lambda: os.getenv("LLM_PROVIDER", "none"))        # none | anthropic | openai_compatible
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", ""))
    llm_api_key: str = field(default_factory=lambda: os.getenv("LLM_API_KEY", ""))
    llm_base_url: str = field(default_factory=lambda: os.getenv("LLM_BASE_URL", ""))
    llm_timeout_s: float = field(default_factory=lambda: float(os.getenv("LLM_TIMEOUT_S", "20")))

    @property
    def index_dir(self) -> Path:
        return DATA_DIR / "index"


settings = Settings()
