#!/usr/bin/env python3
"""Registra (o consulta) el webhook de Telegram con el secreto de .env.

    python scripts/set_telegram_webhook.py           # registra PUBLIC_BASE_URL/webhooks/telegram
    python scripts/set_telegram_webhook.py --info    # muestra el estado actual del webhook

Requiere en .env: TELEGRAM_BOT_TOKEN, TELEGRAM_SECRET_TOKEN y PUBLIC_BASE_URL (https).
"""
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import config  # noqa: E402

if __name__ == "__main__":
    s = config.settings
    if not s.telegram_bot_token:
        sys.exit("Falta TELEGRAM_BOT_TOKEN en .env")
    base = f"https://api.telegram.org/bot{s.telegram_bot_token}"
    if "--info" in sys.argv:
        print(httpx.get(f"{base}/getWebhookInfo", timeout=15).json())
        sys.exit(0)
    if not s.public_base_url.startswith("https://"):
        sys.exit("PUBLIC_BASE_URL debe ser https:// (Telegram no acepta http)")
    r = httpx.post(f"{base}/setWebhook", timeout=15, json={
        "url": f"{s.public_base_url.rstrip('/')}/webhooks/telegram",
        "secret_token": s.telegram_secret_token,
        "allowed_updates": ["message", "callback_query"],
        "drop_pending_updates": True,
    })
    print(r.json())
