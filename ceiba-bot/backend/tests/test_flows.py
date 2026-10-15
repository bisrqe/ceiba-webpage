"""Pruebas de flujos completos (máquina de estados + cumplimiento)."""
from app.content_loader import get_content


def payloads(reply):
    return [b.payload for b in reply.buttons]


def test_greeting_shows_menu_and_privacy(talk):
    r = talk(event="start")
    assert "CEIBA bot" in r.messages[0]
    assert any("borrar mis datos" in m for m in r.messages)
    assert "i:evaluar_perfil" in payloads(r)


def test_full_profile_evaluation(talk):
    talk(event="start")
    r = talk(payload="i:evaluar_perfil")
    assert r.meta["state"] == "profile" and "(1/6)" in r.messages[-1]
    talk(payload="q:perfil:estudiante")
    talk(payload="q:interes:internacionales")
    r = talk(payload="q:t1:a")
    assert any("Exacto" in m for m in r.messages)          # retroalimentación inmediata
    talk(payload="q:t2:c")
    talk(payload="q:etapa:idea")
    r = talk(payload="q:campus:monterrey")
    assert r.meta["profile"] == {"nivel": "intermedio", "programa": "internacionales"}
    assert 1 <= len(r.cards) <= 3                              # lecturas recomendadas como tarjetas
    assert r.meta["state"] == "menu"


def test_profile_accepts_typed_answers_and_advanced_rule(talk):
    talk(payload="i:evaluar_perfil")
    talk("2")                                   # «Soy universitario/a» por número
    talk("crear mi iniciativa")                 # por texto corto
    talk("aún no lo sé")
    talk("aún no lo sé")
    talk("ya se implementa")
    r = talk(payload="q:campus:skip")
    assert r.meta["profile"]["nivel"] == "avanzado"   # etapa impl → avanzado aunque falle los retos


def test_profile_resumes_after_interruption(talk):
    talk(payload="i:evaluar_perfil")
    talk(payload="q:perfil:aprender")
    r = talk("¿cuándo es la semana tec?")              # interrupción con intención clara
    assert r.meta["handler"] == "ver_calendario"
    r = talk(payload="i:evaluar_perfil")
    assert "Retomemos" in r.messages[0] and "(2/6)" in r.messages[-1]


def test_unrecognized_profile_answer_reasks(talk):
    talk(payload="i:evaluar_perfil")
    r = talk("mmm")
    assert r.meta["handler"] == "profile_reask"


def test_handoff_rule_asks_campus_then_gives_contact(talk):
    r = talk("¿puedo usar el auditorio para mi proyecto?")
    assert r.meta["handler"] == "derivar" and r.meta["state"] == "handoff_campus"
    r = talk("campus monterrey")
    assert r.meta["handler"] == "handoff_campus"
    assert r.cards and "Campus Monterrey" in r.cards[0].title
    assert "i:handoff_send" in payloads(r)
    r = talk(payload="i:handoff_send")
    assert "folio" in r.messages[0]


def test_handoff_uses_known_campus(talk):
    talk(payload="i:evaluar_perfil")
    for p in ["q:perfil:estudiante", "q:interes:anual", "q:t1:a", "q:t2:a", "q:etapa:none", "q:campus:puebla"]:
        talk(payload=p)
    r = talk("¿mi propuesta es viable?")
    assert r.meta["handler"] == "derivar" and r.meta["state"] == "menu"   # no pregunta campus: ya lo conoce
    assert "Puebla" in r.cards[0].title


def test_faq_pending_answer_does_not_invent(talk):
    r = talk("¿cuánto dinero dan?")
    assert r.meta["handler"] == "faq"
    assert "todavía no está publicado" in r.messages[0]


def test_faq_confirmed_cites_source(talk):
    r = talk(payload="faq:duracion_anual")
    assert "agosto a diciembre" in r.messages[0] and "Fuente" in " ".join(r.messages)


def test_library_question_is_grounded(talk):
    r = talk("¿qué dice el acuerdo de parís sobre 1.5 grados?")
    assert r.meta["handler"] == "pregunta_climatica"
    assert r.meta["sources"][0] == "acuerdo_paris"
    assert "1.5 °C" in " ".join(r.messages)


def test_library_free_question_mode(talk):
    talk(payload="lib:libre")
    r = talk("qué es el balance mundial")
    assert r.meta["handler"] == "pregunta_climatica"
    assert "acuerdo_paris" in r.meta["sources"] or "cop28" in r.meta["sources"]


def test_unknown_topic_falls_back_then_hands_off(talk):
    r = talk("receta de pastel de chocolate")
    assert r.meta["handler"] in {"pregunta_climatica", "fallback"} and not r.cards
    r = talk("¿quién ganó el mundial?")
    assert any("Parece que no estoy logrando" in m for m in r.messages)


def test_calendar_marks_current_month(talk):
    r = talk(payload="i:ver_calendario")
    assert "estás aquí" in r.messages[0]


def test_glossary_simple_mode_for_kids(talk):
    talk(payload="i:evaluar_perfil")
    talk(payload="q:perfil:aprender")
    talk(payload="i:menu")
    r = talk("¿qué es la cmnucc?")
    simple = get_content().glossary["terms"]["cmnucc"]["simple"]
    assert simple in r.messages[0]


def test_resume_code_across_devices(talk, bot):
    import re
    import uuid

    from app.models import Incoming
    talk(payload="i:evaluar_perfil")
    for p in ["q:perfil:estudiante", "q:interes:semanatec", "q:t1:a", "q:t2:c", "q:etapa:idea", "q:campus:skip"]:
        talk(payload=p)
    r = talk(payload="i:codigo")
    code = re.search(r"CEIBA-[A-Z0-9]{4}", r.messages[0]).group(0)
    other = Incoming(channel="web", user_id=f"tablet-{uuid.uuid4().hex[:8]}", text=f"retomar {code}")
    r2 = bot.handle(other)
    assert "Recuperé tu perfil" in r2.messages[0]
    assert any("Intermedio" in m for m in r2.messages)


def test_delete_data(talk):
    talk("hola")
    r = talk("borrar mis datos")
    assert r.meta.get("deleted") is True


def test_long_messages_are_chunked(bot):
    from app.orchestrator import split_long
    parts = split_long("Frase uno. " * 80, 200)
    assert len(parts) > 1 and all(len(p) <= 210 for p in parts)
