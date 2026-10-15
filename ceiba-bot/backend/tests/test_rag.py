"""Pruebas de la biblioteca (RAG): que encuentre la fuente correcta y que NO invente.

`GOLDEN` es el «examen» del bot: pregunta → documento que debe aparecer primero.
Cuando agregues documentos, agrega aquí 1 o 2 preguntas que deban encontrarlos.
"""
import pytest

from app.content_loader import get_content
from app.dialogue.context import Profile
from app.fulfillment.recommender import recommend
from app.nlu import NLU
from app.rag import Library

content = get_content()
library = Library(content, expand=NLU(content).extractor.expand_query)

GOLDEN = [
    ("¿Qué dice el Acuerdo de París sobre 1.5 grados?", "acuerdo_paris"),
    ("¿Qué son las contribuciones determinadas a nivel nacional?", "acuerdo_paris"),
    ("¿Cuándo entró en vigor el Protocolo de Kioto?", "protocolo_kioto"),
    ("¿Qué pasó en la COP29 sobre financiamiento climático?", "cop29"),
    ("¿Dónde será la COP31?", "cop31"),
    ("¿Qué es el SBSTA?", "organos_cmnucc"),
    ("¿Cómo se organiza una COP como país anfitrión?", "how_to_cop"),
    ("¿Cuándo sale el informe de síntesis del AR7 del IPCC?", "ipcc_ar7"),
    ("¿En qué año se creó la CMNUCC en Río?", "cmnucc_convencion"),
    ("¿Qué se decidió sobre pérdidas y daños en Dubái?", "cop28"),
]


@pytest.mark.parametrize("question,doc_id", GOLDEN)
def test_golden_questions(question, doc_id):
    hits = library.search(question)
    assert hits, f"Sin resultados para: {question}"
    assert hits[0].doc_id == doc_id, f"{question} → {[h.doc_id for h in hits]}"


@pytest.mark.parametrize("question", ["receta de pastel de chocolate", "¿quién ganó el mundial?", "precio del dólar"])
def test_out_of_scope_returns_nothing(question):
    assert library.ask(question) is None


def test_extractive_answer_only_uses_key_facts():
    ans = library.ask("¿Cuándo entró en vigor el Protocolo de Kioto?")
    facts = content.document("protocolo_kioto")["key_facts"]
    assert any(f in ans.messages[0] for f in facts)
    assert ans.cards[0].url.startswith("https://unfccc.int")


def test_recommender_respects_level_and_interest():
    p = Profile(perfil="estudiante", interes="internacionales", nivel="basico")
    docs = recommend(content.documents, p, n=3)
    assert all(d["level"] in {"basico", "intermedio"} for d in docs)
    assert all("internacionales" in d["programs"] for d in docs)


def test_recommender_kids_never_get_advanced():
    p = Profile(perfil="aprender", nivel="avanzado")
    docs = recommend(content.documents, p, n=5)
    assert docs and all(d["level"] != "avanzado" for d in docs)


def test_recommender_does_not_repeat():
    p = Profile(perfil="estudiante", nivel="intermedio")
    first = recommend(content.documents, p, n=3)
    second = recommend(content.documents, p, already=[d["id"] for d in first], n=3)
    assert not {d["id"] for d in first} & {d["id"] for d in second}
