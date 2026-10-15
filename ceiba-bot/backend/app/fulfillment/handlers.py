"""FUNCIONES DE CUMPLIMIENTO (fulfillment): una por intención.

Cada función arma la respuesta de una intención con el contenido de content/*.yaml.
Índice (intención → función → archivo de contenido que usa):

  saludo, menu, despedida, agradecimiento → bot.yaml, menus.yaml
  que_es_ceiba                             → programs.yaml (about)
  ver_programas, programa_detalle          → programs.yaml
  biblioteca, biblioteca_tema, documento   → bibliography.yaml, menus.yaml (library_topics)
  pregunta_climatica                       → bibliography.yaml + RAG (rag/)
  ver_iniciativas, sector_detalle          → initiatives.yaml
  ver_calendario                           → calendar.yaml
  faq_menu, faq                            → faq.yaml
  definir_termino                          → glossary.yaml
  mi_progreso, codigo, retomar             → contexto guardado (storage/db.py)
  inscripcion                              → contacts.yaml (form_url) / bot.yaml (website)
  borrar_datos                             → storage/db.py
  fallback                                 → bot.yaml
  (evaluación de perfil → profile.py · derivación y contacto → handoff.py)

AGREGAR UNA INTENCIÓN: (1) agrégala en content/intents.yaml, (2) escribe aquí una
función con @handler("nombre"), (3) agrega una prueba en backend/tests/.
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

from ..dialogue.states import State
from ..models import Button, Card, Reply
from ..rag import document_card
from ..storage import db
from . import handoff, profile  # noqa: F401  (registra sus handlers)
from .base import Ctx, back_to_menu, handler, menu_buttons, pick
from .recommender import recommend

TZ = ZoneInfo("America/Mexico_City")      # EDITA AQUÍ si el programa opera en otra zona horaria
LEVEL_LABEL = {"basico": "Básico", "intermedio": "Intermedio", "avanzado": "Avanzado"}
PERFIL_LABEL = {"aprender": "Aprender lo básico", "estudiante": "Estudiante universitario/a", "aliado": "Docente, familia o aliado/a"}


def _web(ctx: Ctx, anchor: str = "") -> str:
    return ctx.content.bot["bot"]["website"].rstrip("/") + anchor


# ------------------------------------------------------------------ Conversación básica
@handler("saludo")
def saludo(ctx: Ctx, **_) -> Reply:
    s, c = ctx.session, ctx.content
    s.set_state(State.MENU)
    if not ctx.is_new and s.turns > 1 and s.last_topic:
        nombre = f", {ctx.incoming.display_name}" if ctx.incoming.display_name else ""
        reply = Reply(messages=[c.msg("greeting_returning", nombre_coma=nombre, ultimo_tema=s.last_topic)])
    else:
        reply = Reply(messages=[c.msg("greeting")])
    if not s.privacy_shown:
        url = c.contacts["general"].get("privacy_url") or _web(ctx, "#privacidad")
        reply.messages.append(c.msg("privacy_notice", privacy_url=url))
        s.privacy_shown = True
    reply.buttons = menu_buttons(c)
    return reply


@handler("menu")
def menu(ctx: Ctx, **_) -> Reply:
    ctx.session.set_state(State.MENU)
    return Reply(messages=[ctx.content.msg("menu_prompt")], buttons=menu_buttons(ctx.content))


@handler("despedida")
def despedida(ctx: Ctx, **_) -> Reply:
    ctx.session.set_state(State.MENU)
    return Reply(messages=[ctx.content.msg("goodbye")], buttons=[back_to_menu(ctx.content)])


@handler("agradecimiento")
def agradecimiento(ctx: Ctx, **_) -> Reply:
    return Reply(messages=["¡Con gusto! 🌱 ¿Te ayudo con algo más?"], buttons=menu_buttons(ctx.content)[:4] + [back_to_menu(ctx.content)])


@handler("que_es_ceiba")
def que_es_ceiba(ctx: Ctx, **_) -> Reply:
    about, simple = ctx.content.programs["about"], ctx.session.profile.simple
    ctx.session.last_topic = "qué es CEIBA"
    msgs = [
        f"🌳 **CEIBA** significa *{about['acronym']}*.",
        f"**Misión:** {pick(simple, about['mision'])}",
        f"**Visión (meta):** {pick(simple, about['vision'])}",
    ]
    return Reply(messages=msgs, buttons=[Button("🌎 Ver programas", "i:ver_programas", "Ver programas"),
                                         Button("📝 Evaluar mi perfil", "i:evaluar_perfil", "Evaluar perfil"),
                                         back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Programas
@handler("ver_programas")
def ver_programas(ctx: Ctx, **_) -> Reply:
    simple = ctx.session.profile.simple
    ctx.session.last_topic = "los programas"
    cards = [Card(title=f"{p['emoji']} {p['title']}", body=pick(simple, p, "summary"), tag="Programa",
                  buttons=[Button("Ver detalles", f"prog:{p['id']}", "Ver detalles")])
             for p in ctx.content.programs["programs"]]
    buttons = [Button(f"{p['emoji']} {p['title']}", f"prog:{p['id']}", p["title"].split(":")[0][:20]) for p in ctx.content.programs["programs"]]
    return Reply(messages=["CEIBA tiene tres formas de participar:"], cards=cards, buttons=buttons + [back_to_menu(ctx.content)])


@handler("programa_detalle")
def programa_detalle(ctx: Ctx, program: str = "", arg: str = "", **_) -> Reply:
    p = ctx.content.program(program or arg)
    if not p:
        return ver_programas(ctx)
    simple = ctx.session.profile.simple
    ctx.session.last_topic = p["title"]
    msgs = [f"{p['emoji']} **{p['title']}**\n{pick(simple, p, 'summary')}", f"**¿Para quién?** {p['audience'].strip()}"]
    msgs.append("\n".join(f"• {h}" for h in p.get("highlights", [])))
    docs = recommend(ctx.content.documents, ctx.session.profile, topic=(p.get("reading_tags") or [None])[0],
                     already=ctx.session.recommended, n=2)
    reply = Reply(messages=msgs, cards=[Card(title="🌐 Más información en el sitio", body="Detalles completos, sesiones y medición.",
                                             url=_web(ctx, p.get("web_anchor", "")), url_label="Abrir sitio")])
    if p.get("link"):
        reply.cards.append(Card(title="🔗 Enlace oficial", url=p["link"], url_label="Abrir"))
    if docs:
        reply.messages.append("📚 Lecturas útiles para este programa:")
        reply.cards += [document_card(d) for d in docs]
        ctx.session.recommended += [d["id"] for d in docs if d["id"] not in ctx.session.recommended]
    reply.buttons = [Button("✍️ Inscribirme", "i:inscripcion", "Inscribirme"),
                     Button("📅 Fechas", "i:ver_calendario", "Fechas"), back_to_menu(ctx.content)]
    return reply


# ------------------------------------------------------------------ Biblioteca (RAG)
@handler("biblioteca")
def biblioteca(ctx: Ctx, **_) -> Reply:
    ctx.session.last_topic = "la biblioteca climática"
    topics = ctx.content.menus["library_topics"]
    buttons = [Button(t["label"], f"lib:{t['topic']}", t.get("short", "")) for t in topics]
    n = len(ctx.content.documents)
    return Reply(messages=[f"📚 Tengo **{n} documentos oficiales** de la ONU (CMNUCC) y del IPCC. ¿Qué tema te interesa?"],
                 buttons=buttons + [back_to_menu(ctx.content)])


@handler("biblioteca_tema")
def biblioteca_tema(ctx: Ctx, topic: str, **_) -> Reply:
    s = ctx.session
    if topic == "libre":
        s.set_state(State.LIBRARY_QUERY)
        return Reply(messages=["🔎 Escribe tu pregunta. Por ejemplo: *¿qué dice el Acuerdo de París sobre 1.5 °C?* "
                               "Te respondo solo con lo que dicen los documentos oficiales."],
                     buttons=[back_to_menu(ctx.content)])
    docs = recommend(ctx.content.documents, s.profile, topic=topic, already=s.recommended,
                     n=ctx.content.bot["ux"].get("max_cards_per_reply", 3))
    s.recommended += [d["id"] for d in docs if d["id"] not in s.recommended]
    s.last_topic = f"lecturas de {topic}"
    nivel = LEVEL_LABEL.get(s.profile.nivel or "", "")
    intro = f"Según tu nivel **{nivel}**, te sugiero empezar por:" if nivel else "Te sugiero empezar por:"
    return Reply(messages=[intro], cards=[document_card(d) for d in docs],
                 buttons=[Button("➕ Más lecturas", f"lib:{topic}", "Más lecturas"),
                          Button("🔎 Hacer una pregunta", "lib:libre", "Hacer pregunta"), back_to_menu(ctx.content)])


@handler("documento")
def documento(ctx: Ctx, doc: str, **_) -> Reply:
    d = ctx.content.document(doc)
    if not d:
        return biblioteca(ctx)
    facts = "\n".join(f"• {f}" for f in d.get("key_facts", []))
    return Reply(messages=[f"**{d['title_es']}**\n{facts}"], cards=[document_card(d)], buttons=[back_to_menu(ctx.content)])


@handler("pregunta_climatica")
def pregunta_climatica(ctx: Ctx, query: str = "", from_fallback: bool = False, **_) -> Reply:
    s = ctx.session
    answer = ctx.library.ask(query or ctx.incoming.text, simple=s.profile.simple)
    if answer is None:
        if from_fallback:
            return fallback(ctx)
        return Reply(messages=[ctx.content.msg("no_source")],
                     buttons=[Button("📚 Ver biblioteca", "i:biblioteca", "Biblioteca"),
                              Button("🤝 Hablar con alguien", "i:contacto_humano", "Hablar con alguien"),
                              back_to_menu(ctx.content)])
    s.fallback_count = 0
    s.recommended += [d for d in answer.doc_ids if d not in s.recommended]
    s.last_topic = "tu pregunta de la biblioteca"
    stay = s.state_enum is State.LIBRARY_QUERY
    buttons = [Button("🔎 Otra pregunta", "lib:libre", "Otra pregunta")] if stay else [Button("📚 Biblioteca", "i:biblioteca", "Biblioteca")]
    return Reply(messages=answer.messages, cards=answer.cards, buttons=buttons + [back_to_menu(ctx.content)],
                 meta={"rag_mode": answer.mode, "sources": answer.doc_ids})


# ------------------------------------------------------------------ Iniciativas
@handler("ver_iniciativas")
def ver_iniciativas(ctx: Ctx, **_) -> Reply:
    simple = ctx.session.profile.simple
    ctx.session.last_topic = "los tipos de iniciativa"
    sectors = ctx.content.initiatives["sectors"]
    lines = ["💡 Una iniciativa puede nacer desde tres sectores:"]
    lines += [f"{x['emoji']} **{x['title']}:** {pick(simple, x, 'def')}" for x in sectors]
    buttons = [Button(f"{x['emoji']} {x['title']}", f"sec:{x['id']}", x["title"][:20]) for x in sectors]
    return Reply(messages=["\n".join(lines)], buttons=buttons + [back_to_menu(ctx.content)])


@handler("sector_detalle")
def sector_detalle(ctx: Ctx, sector: str, **_) -> Reply:
    x = next((y for y in ctx.content.initiatives["sectors"] if y["id"] == sector), None)
    if not x:
        return ver_iniciativas(ctx)
    lines = [f"{x['emoji']} **{x['title']}** · tres tipos:"]
    for t in x["types"]:
        note = " _(texto por validar)_" if t.get("status") == "prop" else ""
        lines.append(f"• **{t['title']}**{note}. Ejemplo: {t['example']}")
    return Reply(messages=["\n".join(lines), "¿Ya tienes una idea? En el sitio puedes escribirla y llevarla a tu inscripción."],
                 cards=[Card(title="✏️ Escribir mi idea", url=_web(ctx, "#iniciativas"), url_label="Abrir sitio")],
                 buttons=[Button("✍️ Inscribirme", "i:inscripcion", "Inscribirme"), back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Calendario
@handler("ver_calendario")
def ver_calendario(ctx: Ctx, **_) -> Reply:
    cal = ctx.content.calendar
    today = datetime.now(TZ).date()
    months = cal["months"]
    idx = next((i for i, m in enumerate(months) if m["m"] == today.month), 0)
    current = months[idx]
    ctx.session.last_topic = "el calendario"
    lines = [f"📅 Ciclo **{cal['cycle']}**. Estás en el {cal['periods'][current['period']].split('·')[0].strip().lower()}: "
             f"{cal['periods'][current['period']].split('·', 1)[1].strip()}."]
    for offset in range(0, 4):
        m = months[(idx + offset) % len(months)]
        events = []
        for e in m["events"]:
            when = ""
            if e.get("date"):
                d = datetime.fromisoformat(e["date"]).date()
                when = f" ({d.day}" + (f" al {datetime.fromisoformat(e['date_end']).date().day}" if e.get("date_end") else "") + f" de {m['name'].lower()})"
            events.append(e["label"] + when)
        marker = " ← estás aquí" if offset == 0 else ""
        lines.append(f"**{m['name']}**{marker}: " + ("; ".join(events) if events else "sin eventos programados"))
    return Reply(messages=["\n".join(lines)],
                 cards=[Card(title="🗓️ Calendario completo", body="Ciclo de agosto a julio con todos los eventos.",
                             url=_web(ctx, "#calendario"), url_label="Ver en el sitio")],
                 buttons=[Button("🌎 Programas", "i:ver_programas", "Programas"), back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Preguntas frecuentes
@handler("faq_menu")
def faq_menu(ctx: Ctx, **_) -> Reply:
    faqs = ctx.content.faq["faqs"]
    buttons = [Button(f["question"], f"faq:{f['id']}", f["question"][:24], desc=f.get("category", "")) for f in faqs[:9]]
    return Reply(messages=["❓ Estas son las dudas más comunes. Elige una o escribe la tuya:"], buttons=buttons + [back_to_menu(ctx.content)])


@handler("faq")
def faq(ctx: Ctx, faq: str = "", **_) -> Reply:
    item = ctx.content.faq_item(faq)
    if not item:
        return faq_menu(ctx)
    ctx.session.last_topic = item["question"]
    ctx.session.fallback_count = 0
    if not item.get("answer"):
        return Reply(messages=[f"**{item['question']}**\n{ctx.content.msg('pending_data')}"],
                     buttons=[Button("🤝 Preguntar a una persona", "i:contacto_humano", "Preguntar a alguien"),
                              Button("❓ Otras preguntas", "i:faq_menu", "Otras preguntas"), back_to_menu(ctx.content)])
    source = f"\n_Fuente: {item['source']}_" if item.get("source") else ""
    return Reply(messages=[f"**{item['question']}**\n{item['answer'].strip()}{source}"],
                 buttons=[Button("❓ Otras preguntas", "i:faq_menu", "Otras preguntas"), back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Glosario
@handler("definir_termino")
def definir_termino(ctx: Ctx, term: str = "", **_) -> Reply:
    item = ctx.content.glossary["terms"].get(term)
    if not item:
        return pregunta_climatica(ctx, query=ctx.incoming.text)
    simple = ctx.session.profile.simple
    text = item["simple"] if simple else item["def"]
    return Reply(messages=[f"📖 **{item['term']}:** {text}"],
                 buttons=[Button("📚 Leer más", "i:biblioteca", "Leer más"), back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Progreso y continuidad
@handler("mi_progreso")
def mi_progreso(ctx: Ctx, **_) -> Reply:
    p = ctx.session.profile
    if not p.completed:
        return Reply(messages=["Aún no tengo tu perfil. Son 6 preguntas rápidas. 🙂"],
                     buttons=[Button("📝 Evaluar mi perfil", "i:evaluar_perfil", "Evaluar mi perfil"), back_to_menu(ctx.content)])
    program = ctx.content.program(p.interes or "") or {}
    campus = ctx.content.campus(p.campus or "") or {}
    lines = ["📊 **Tu progreso**",
             f"• Perfil: {PERFIL_LABEL.get(p.perfil or '', '—')}",
             f"• Nivel sugerido: {LEVEL_LABEL.get(p.nivel or '', '—')}",
             f"• Programa de interés: {program.get('title', 'Explorando')}",
             f"• Campus: {campus.get('name', 'Sin indicar')}",
             f"• Lecturas sugeridas: {len(ctx.session.recommended)} de {len(ctx.content.documents)}"]
    pending = [d for d in ctx.content.documents if d["id"] not in ctx.session.recommended]
    nxt = recommend(pending, p, n=1) if pending else []
    reply = Reply(messages=["\n".join(lines)])
    if nxt:
        reply.messages.append("👉 Tu siguiente lectura recomendada:")
        reply.cards.append(document_card(nxt[0]))
        ctx.session.recommended.append(nxt[0]["id"])
    reply.buttons = [Button("📱 Continuar en otro dispositivo", "i:codigo", "Otro dispositivo"),
                     Button("🔁 Repetir evaluación", "i:evaluar_perfil:reset", "Repetir evaluación"), back_to_menu(ctx.content)]
    return reply


@handler("codigo")
def codigo(ctx: Ctx, **_) -> Reply:
    db.save_session(ctx.session)                # asegura que exista la fila antes de asignar el código
    code = db.issue_resume_code(ctx.session.user_key)
    from .. import config
    return Reply(messages=[ctx.content.msg("resume_code", codigo=code, dias=config.settings.resume_code_days)],
                 buttons=[back_to_menu(ctx.content)])


@handler("retomar")
def retomar(ctx: Ctx, code: str = "", **_) -> Reply:
    if not code:
        return Reply(messages=["Escribe tu código, por ejemplo: **CEIBA-7K3P**"], buttons=[back_to_menu(ctx.content)])
    other = db.session_by_resume_code(code)
    if not other:
        return Reply(messages=[ctx.content.msg("resume_fail")], buttons=menu_buttons(ctx.content))
    s = ctx.session
    s.profile, s.recommended, s.answers, s.last_topic = other.profile, other.recommended, other.answers, other.last_topic
    s.privacy_shown = True
    s.set_state(State.MENU)
    return Reply(messages=[ctx.content.msg("resume_ok")]).add(mi_progreso(ctx))


# ------------------------------------------------------------------ Inscripción
@handler("inscripcion")
def inscripcion(ctx: Ctx, **_) -> Reply:
    url = ctx.content.contacts["general"].get("form_url") or _web(ctx, "#participa")
    ctx.session.last_topic = "tu inscripción"
    p = ctx.session.profile
    tip = f" Te sugiero marcar el nivel **{LEVEL_LABEL[p.nivel]}**." if p.nivel else ""
    msg = ("✍️ La inscripción se hace en el formulario oficial del sitio, que pide tu consentimiento de privacidad "
           f"(y el de tu tutor si eres menor de 18).{tip} Por seguridad, no tomo tus datos personales por chat.")
    return Reply(messages=[msg], cards=[Card(title="📝 Formulario de inscripción", body="Toma unos 3 minutos.", url=url, url_label="Abrir formulario")],
                 buttons=[Button("❓ ¿Qué pide el formulario?", "faq:formulario_pide", "Qué pide"), back_to_menu(ctx.content)])


# ------------------------------------------------------------------ Privacidad
@handler("borrar_datos")
def borrar_datos(ctx: Ctx, **_) -> Reply:
    db.delete_user(ctx.session.user_key)
    # meta["deleted"] indica al orquestador que NO vuelva a guardar esta sesión.
    return Reply(messages=[ctx.content.msg("data_deleted")], buttons=[back_to_menu(ctx.content)], meta={"deleted": True})


# ------------------------------------------------------------------ Sin comprensión
@handler("fallback")
def fallback(ctx: Ctx, **_) -> Reply:
    s = ctx.session
    s.fallback_count += 1
    db.log_unmatched(ctx.incoming.text, s.state)
    limit = ctx.content.bot["ux"].get("fallbacks_before_handoff", 2)
    if s.fallback_count >= limit:
        s.fallback_count = 0
        reply = Reply(messages=[ctx.content.msg("fallback_repeated")])
        # Sin «enviar mi pregunta»: un mensaje no entendido rara vez le sirve a la secretaría.
        return reply.add(handoff.derivar(ctx, category="fallback", excerpt=""))
    return Reply(messages=[ctx.content.msg("fallback")], buttons=menu_buttons(ctx.content))
