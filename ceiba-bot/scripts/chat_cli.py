#!/usr/bin/env python3
"""Conversa con CEIBA bot en la terminal, sin navegador ni canales.

Ideal para que editores de contenido prueben sus cambios en content/*.yaml.

    python scripts/chat_cli.py            # conversación interactiva
    python scripts/chat_cli.py --debug    # muestra intención, confianza y estado

Para tocar un botón escribe su número (ej. 2). Escribe "salir" para terminar.
"""
from __future__ import annotations

import argparse
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.models import Incoming  # noqa: E402
from app.orchestrator import Bot  # noqa: E402
from app.storage import db  # noqa: E402


def show(reply, debug: bool) -> list:
    for m in reply.messages:
        print(f"\n🤖 {m}")
    for c in reply.cards:
        print(f"\n   ┌─ {c.title}" + (f"  [{c.tag}]" if c.tag else ""))
        for line in (c.body or "").splitlines():
            print(f"   │ {line}")
        if c.url:
            print(f"   └─ {c.url_label}: {c.url}")
    if reply.buttons:
        print()
        for i, b in enumerate(reply.buttons, 1):
            print(f"   [{i}] {b.label}")
    if debug:
        print(f"\n   · debug: {reply.meta}")
    return reply.buttons


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    db.init_db()
    bot, user = Bot(), f"cli-{uuid.uuid4().hex[:8]}"
    buttons = show(bot.handle(Incoming(channel="cli", user_id=user, event="start")), args.debug)
    while True:
        try:
            text = input("\n👤 ").strip()
        except (EOFError, KeyboardInterrupt):
            break
        if text.lower() in {"salir", "exit", "quit"}:
            break
        if text.isdigit() and 1 <= int(text) <= len(buttons):
            incoming = Incoming(channel="cli", user_id=user, payload=buttons[int(text) - 1].payload)
        else:
            incoming = Incoming(channel="cli", user_id=user, text=text)
        buttons = show(bot.handle(incoming), args.debug)


if __name__ == "__main__":
    main()
