"""BASE DE DATOS (SQLite por defecto).

Tablas:
  users     → una fila por persona y canal: contexto de conversación (JSON) y código de continuidad.
  messages  → historial (solo si LOG_MESSAGES=true), con correos y teléfonos ocultos.
  handoffs  → derivaciones a secretarías: campus, motivo, si se notificó.
  unmatched → mensajes que el bot no entendió (para mejorar content/intents.yaml).

Privacidad: el id del canal (número de WhatsApp, id de Telegram) NUNCA se guarda en
claro: se guarda un hash HMAC con USER_HASH_SALT (ver security.hash_user_id).

Para migrar a PostgreSQL: reemplaza `connect()` y conserva las mismas funciones.
"""
from __future__ import annotations

import json
import secrets
import sqlite3
import string
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterator

from .. import config
from ..dialogue.context import Session
from ..security import redact

_lock = threading.Lock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  user_key TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  session_json TEXT NOT NULL,
  resume_code TEXT UNIQUE,
  resume_expires TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key TEXT NOT NULL,
  direction TEXT NOT NULL,            -- in | out
  text TEXT,
  intent TEXT,
  confidence REAL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS handoffs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key TEXT NOT NULL,
  campus TEXT,
  category TEXT,
  excerpt TEXT,
  notified INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS unmatched (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  state TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_key);
"""


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _path() -> Path:
    p = config.settings.database_path
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    with _lock:
        conn = sqlite3.connect(_path())
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()


def init_db() -> None:
    with connect() as c:
        c.executescript(SCHEMA)


# ---------------------------------------------------------------- Sesiones
def load_session(user_key: str, channel: str) -> tuple[Session, bool]:
    """Devuelve (sesión, es_nueva)."""
    with connect() as c:
        row = c.execute("SELECT session_json FROM users WHERE user_key=?", (user_key,)).fetchone()
    if row:
        return Session.from_json(json.loads(row["session_json"])), False
    return Session(user_key=user_key, channel=channel), True


def save_session(session: Session) -> None:
    payload = json.dumps(session.to_json(), ensure_ascii=False)
    with connect() as c:
        c.execute(
            """INSERT INTO users(user_key, channel, session_json, created_at, updated_at)
               VALUES(?,?,?,?,?)
               ON CONFLICT(user_key) DO UPDATE SET session_json=excluded.session_json, updated_at=excluded.updated_at""",
            (session.user_key, session.channel, payload, now(), now()),
        )


def delete_user(user_key: str) -> None:
    with connect() as c:
        for table in ("users", "messages", "handoffs"):
            c.execute(f"DELETE FROM {table} WHERE user_key=?", (user_key,))


# ---------------------------------------------------------------- Continuidad entre dispositivos
def issue_resume_code(user_key: str) -> str:
    alphabet = string.ascii_uppercase.replace("O", "").replace("I", "") + "23456789"
    expires = (datetime.now(timezone.utc) + timedelta(days=config.settings.resume_code_days)).isoformat()
    with connect() as c:
        for _ in range(10):
            code = "CEIBA-" + "".join(secrets.choice(alphabet) for _ in range(4))
            try:
                c.execute("UPDATE users SET resume_code=?, resume_expires=? WHERE user_key=?", (code, expires, user_key))
                return code
            except sqlite3.IntegrityError:
                continue
    raise RuntimeError("No se pudo generar un código único")


def session_by_resume_code(code: str) -> Session | None:
    with connect() as c:
        row = c.execute("SELECT session_json, resume_expires FROM users WHERE resume_code=?", (code.upper(),)).fetchone()
    if not row or (row["resume_expires"] and row["resume_expires"] < now()):
        return None
    return Session.from_json(json.loads(row["session_json"]))


# ---------------------------------------------------------------- Registros
def log_message(user_key: str, direction: str, text: str, intent: str | None = None, confidence: float | None = None) -> None:
    if not config.settings.log_messages:
        return
    with connect() as c:
        c.execute("INSERT INTO messages(user_key, direction, text, intent, confidence, created_at) VALUES(?,?,?,?,?,?)",
                  (user_key, direction, redact(text)[:2000], intent, confidence, now()))


def log_unmatched(text: str, state: str) -> None:
    with connect() as c:
        c.execute("INSERT INTO unmatched(text, state, created_at) VALUES(?,?,?)", (redact(text)[:500], state, now()))


def log_handoff(user_key: str, campus: str | None, category: str | None, excerpt: str, notified: bool) -> int:
    with connect() as c:
        cur = c.execute("INSERT INTO handoffs(user_key, campus, category, excerpt, notified, created_at) VALUES(?,?,?,?,?,?)",
                        (user_key, campus, category, redact(excerpt)[:500], int(notified), now()))
        return int(cur.lastrowid)


def purge_old() -> int:
    """Borra historial más antiguo que RETENTION_DAYS. Ejecútalo a diario (scripts/purge_old_data.py)."""
    limit = (datetime.now(timezone.utc) - timedelta(days=config.settings.retention_days)).isoformat()
    with connect() as c:
        n = c.execute("DELETE FROM messages WHERE created_at < ?", (limit,)).rowcount
        n += c.execute("DELETE FROM unmatched WHERE created_at < ?", (limit,)).rowcount
        n += c.execute("DELETE FROM handoffs WHERE created_at < ?", (limit,)).rowcount
    return n
