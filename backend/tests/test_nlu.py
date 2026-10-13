"""Pruebas de comprensión (intenciones y entidades).

Si agregas frases a content/intents.yaml, agrega aquí un caso para que nadie lo
rompa sin darse cuenta. Formato: (mensaje, intención esperada).
"""
import pytest

from app.content_loader import get_content
from app.nlu import NLU
from app.nlu.normalizer import normalize

nlu = NLU(get_content())

CASES = [
    ("hola", "saludo"),
    ("Buenas tardes, quiero información", "saludo"),
    ("¿Qué programas tienen?", "ver_programas"),
    ("quiero hacer el diagnóstico", "evaluar_perfil"),
    ("no sé por dónde empezar", "evaluar_perfil"),
    ("¿cuándo es la semana tec?", "ver_calendario"),
    ("¿cómo me inscribo?", "inscripcion"),
    ("quiero hablar con una persona", "contacto_humano"),
    ("¿qué dice el Acuerdo de París?", "pregunta_climatica"),
    ("¿qué pasó en la COP29?", "pregunta_climatica"),
    ("recomiéndame una lectura", "biblioteca"),
    ("borrar mis datos", "borrar_datos"),
    ("muchas gracias", "agradecimiento"),
    ("¿qué tipos de iniciativa hay?", "ver_iniciativas"),
]


@pytest.mark.parametrize("text,expected", CASES)
def test_intents(text, expected):
    assert nlu.understand(text).intent == expected


def test_normalize_keeps_decimals():
    assert normalize("¿Qué es el límite de 1.5 °C?") == "que es el limite de 1.5 c"


def test_entities_campus_and_program():
    ents = nlu.understand("soy de mty y me interesa la semana tec").entities
    assert ents["campus"] == "monterrey"
    assert ents["programa"] == "semanatec"


def test_resume_code():
    assert nlu.understand("retomar ceiba-ab12").entities["resume_code"] == "CEIBA-AB12"


@pytest.mark.parametrize("text,category", [
    ("¿pueden revisar mi propuesta?", "propuesta_concreta"),
    ("¿puedo usar el auditorio?", "espacio_campus"),
    ("¿con qué profesora hablo?", "persona_campus"),
])
def test_handoff_triggers(text, category):
    assert nlu.understand(text).entities["handoff"] == category


def test_faq_match():
    r = nlu.understand("¿cuánto dinero dan?")
    assert r.faq == "monto"


def test_glossary_term():
    assert nlu.understand("¿qué significa incidencia?").entities["term"] == "incidencia"
