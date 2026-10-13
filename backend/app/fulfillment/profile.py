"""EVALUACIÓN DE PERFIL progresiva (una pregunta a la vez, con retroalimentación).

Las preguntas, opciones y reglas viven en content/diagnostic.yaml.
Flujo: evaluar_perfil → pregunta 1 → profile_answer → pregunta 2 → … → resultado
con programa sugerido y lecturas recomendadas (recommender.py).
"""
from __future__ import annotations

from ..dialogue.states import State
from ..models import Button, Reply
from ..rag import document_card
from .base import Ctx, back_to_menu, handler
from .recommender import recommend

LEVEL_LABEL = {"basico": "Básico", "intermedio": "Intermedio", "avanzado": "Avanzado"}


def _question_reply(ctx: Ctx) -> Reply:
    questions = ctx.content.diagnostic["questions"]
    q = questions[ctx.session.step]
    if q.get("kind") == "campus":
        buttons = [Button(label=c["name"], payload=f"q:campus:{c['id']}", short=c["name"].replace("Campus ", "")[:24])
                   for c in ctx.content.contacts["campuses"]]
        buttons.append(Button(label=q.get("skip_label", "Omitir"), payload="q:campus:skip", short="Prefiero no decir"))
    else:
        buttons = [Button(label=o["text"], payload=f"q:{q['id']}:{o['value']}", short=o.get("short", ""), desc=o["text"][:72])
                   for o in q["options"]]
    progress = f"({ctx.session.step + 1}/{len(questions)}) "
    return Reply(messages=[progress + q["prompt"]], buttons=buttons, meta={"question": q["id"]})


@handler("evaluar_perfil")
def evaluar_perfil(ctx: Ctx, arg: str = "", **_) -> Reply:
    s = ctx.session
    if arg == "reset":                       # botón «Repetir evaluación»
        s.step, s.answers, s.profile.completed = 0, {}, False
    resuming = arg != "reset" and (s.state_enum is State.PROFILE or (0 < s.step < len(ctx.content.diagnostic["questions"]) and not s.profile.completed))
    if not resuming:
        s.step, s.answers = 0, {}
    s.set_state(State.PROFILE)
    s.last_topic = "evaluación de perfil"
    intro = "Retomemos donde te quedaste. 🙂" if resuming and s.step > 0 else ctx.content.diagnostic["intro"].strip()
    return Reply(messages=[intro]).add(_question_reply(ctx))


@handler("profile_reask")
def profile_reask(ctx: Ctx, **_) -> Reply:
    reply = Reply(messages=["Elige una de las opciones (puedes tocar el botón o escribir su número). 👇"])
    return reply.add(_question_reply(ctx))


@handler("profile_answer")
def profile_answer(ctx: Ctx, qid: str, value: str, **_) -> Reply:
    s, questions = ctx.session, ctx.content.diagnostic["questions"]
    # Un botón viejo (de una pregunta anterior) no debe romper el flujo.
    idx = next((i for i, q in enumerate(questions) if q["id"] == qid), None)
    if idx is None:
        return evaluar_perfil(ctx)
    q = questions[idx]
    s.set_state(State.PROFILE)
    s.step = idx
    s.answers[qid] = value
    reply = Reply()

    kind = q.get("kind")
    if kind == "profile":
        s.profile.perfil = value
    elif kind == "interest":
        s.profile.interes = value
    elif kind == "stage":
        s.profile.etapa = value
    elif kind == "campus":
        s.profile.campus = None if value == "skip" else value
    elif kind == "trivia":
        ok = value == q.get("correct")
        reply.messages.append(q["feedback_ok"] if ok else q["feedback_ko"])

    s.step = idx + 1
    if s.step < len(questions):
        return reply.add(_question_reply(ctx))
    return reply.add(_finish(ctx))


def _finish(ctx: Ctx) -> Reply:
    s, cfg = ctx.session, ctx.content.diagnostic
    trivia = [q for q in cfg["questions"] if q.get("kind") == "trivia"]
    correct = sum(1 for q in trivia if s.answers.get(q["id"]) == q.get("correct"))
    rules = cfg["scoring"]
    if s.profile.etapa in rules["advanced_stages"]:
        level = "avanzado"
    elif correct >= rules["intermediate_min_correct"]:
        level = "intermedio"
    else:
        level = "basico"
    s.profile.nivel, s.profile.aciertos, s.profile.completed = level, correct, True
    s.set_state(State.MENU)
    s.step = 0
    s.last_topic = "tus recomendaciones"

    interest = s.profile.interes if s.profile.interes not in (None, "no_se") else ("semanatec" if s.profile.perfil == "aprender" else "anual")
    program = ctx.content.program(interest) or ctx.content.programs["programs"][0]
    text = cfg["result"].format(nivel=LEVEL_LABEL[level], programa=program["title"], aciertos=correct).strip()
    docs = recommend(ctx.content.documents, s.profile, already=s.recommended,
                     n=ctx.content.bot["ux"].get("max_cards_per_reply", 3))
    s.recommended += [d["id"] for d in docs if d["id"] not in s.recommended]
    reply = Reply(messages=[text, "📚 Para empezar, te recomiendo estas lecturas oficiales:"],
                  cards=[document_card(d) for d in docs])
    reply.buttons = [
        Button(label=f"{program['emoji']} Ver {program['title']}", payload=f"prog:{program['id']}", short="Ver programa"),
        Button(label="✍️ Inscribirme", payload="i:inscripcion", short="Inscribirme"),
        back_to_menu(ctx.content),
    ]
    reply.meta["profile"] = {"nivel": level, "programa": program["id"]}
    return reply
