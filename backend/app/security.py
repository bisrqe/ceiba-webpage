"""Seguridad: firmas de webhooks, límite de mensajes, hash de identificadores y
ocultamiento de datos personales en registros.

Ninguna de estas funciones se edita para cambiar contenido. Sus parámetros se
configuran en .env (META_APP_SECRET, TELEGRAM_SECRET_TOKEN, USER_HASH_SALT,
RATE_LIMIT_PER_MINUTE).
"""
from __future__ import annotations

import hashlib
import hmac
import re
import threading
import time

from . import config

EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE = re.compile(r"(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)")


def hash_user_id(channel: str, raw_id: str) -> str:
    """El número de WhatsApp o id de Telegram se guarda como hash irreversible."""
    digest = hmac.new(config.settings.user_hash_salt.encode(), f"{channel}:{raw_id}".encode(), hashlib.sha256)
    return f"{channel}:{digest.hexdigest()[:32]}"


def redact(text: str) -> str:
    """Oculta correos y teléfonos antes de guardar texto en la base de datos o en logs."""
    text = EMAIL.sub("[correo]", text or "")
    return PHONE.sub("[teléfono]", text)


def verify_meta_signature(raw_body: bytes, header: str | None) -> bool:
    """WhatsApp y Messenger firman cada webhook: X-Hub-Signature-256: sha256=<HMAC del cuerpo con el App Secret>."""
    secret = config.settings.meta_app_secret
    if not secret:
        return config.settings.env != "production"     # en desarrollo se permite sin firma; en producción NUNCA
    if not header or not header.startswith("sha256="):
        return False
    expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header.split("=", 1)[1])


def verify_telegram_secret(header: str | None) -> bool:
    """Telegram reenvía el `secret_token` que registraste con setWebhook en X-Telegram-Bot-Api-Secret-Token."""
    secret = config.settings.telegram_secret_token
    if not secret:
        return config.settings.env != "production"
    return bool(header) and hmac.compare_digest(secret, header)


class RateLimiter:
    """Ventana deslizante en memoria: máximo N mensajes por minuto por persona.
    Con varias instancias del servidor, usa Redis (ver docs/07_DESPLIEGUE.md)."""

    def __init__(self, per_minute: int):
        self.per_minute = per_minute
        self._hits: dict[str, list[float]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            hits = [t for t in self._hits.get(key, []) if now - t < 60]
            allowed = len(hits) < self.per_minute
            if allowed:
                hits.append(now)
            self._hits[key] = hits
            return allowed
