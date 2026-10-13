"""ESTADOS de la conversación (máquina de estados).

Diagrama completo en docs/04_FLUJOS_CONVERSACIONALES.md.

    START ──saludo──► MENU ◄──────────────────────────────┐
                       │                                   │
       ┌───────────────┼───────────────┬──────────────┐    │
       ▼               ▼               ▼              ▼    │
    PROFILE        LIBRARY_QUERY   HANDOFF_CAMPUS   (respuestas de un paso:
  (pregunta 1..n)  (espera pregunta (espera campus)   programas, FAQ, calendario…)
       │            libre)              │                  │
       └──────── al terminar ───────────┴──────────────────┘
"""
from enum import Enum


class State(str, Enum):
    START = "start"                    # primera vez: aún no saluda
    MENU = "menu"                      # estado de reposo: espera cualquier intención
    PROFILE = "profile"                # evaluación progresiva en curso (usa Session.step)
    LIBRARY_QUERY = "library_query"    # espera una pregunta libre para la biblioteca
    HANDOFF_CAMPUS = "handoff_campus"  # espera que la persona diga su campus
