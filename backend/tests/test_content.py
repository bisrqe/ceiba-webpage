"""El contenido editable debe pasar el validador (mismo chequeo que corre en GitHub Actions)."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def test_content_is_valid():
    r = subprocess.run([sys.executable, str(ROOT / "scripts" / "validate_content.py")], capture_output=True, text=True)
    assert r.returncode == 0, r.stdout
