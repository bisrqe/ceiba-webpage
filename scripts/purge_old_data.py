#!/usr/bin/env python3
"""Borra historial más antiguo que RETENTION_DAYS (.env). Prográmalo a diario (cron,
GitHub Actions programado o la tarea programada de tu proveedor de hosting).

    python scripts/purge_old_data.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app import config  # noqa: E402
from app.storage import db  # noqa: E402

if __name__ == "__main__":
    db.init_db()
    n = db.purge_old()
    print(f"Registros eliminados (más de {config.settings.retention_days} días): {n}")
