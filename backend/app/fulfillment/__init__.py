"""Funciones de cumplimiento. Importar `handlers` registra todas en HANDLERS."""
from . import handlers  # noqa: F401
from .base import HANDLERS, Ctx

__all__ = ["HANDLERS", "Ctx"]
