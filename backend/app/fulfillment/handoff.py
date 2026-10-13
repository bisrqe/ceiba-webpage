"""DERIVACIÓN a una persona (niveles 2 y 3 de atención).

Regla (content/entities.yaml → handoff_triggers): si la pregunta menciona la
PROPUESTA CONCRETA del estudiante, un ESPACIO del campus o una PERSONA del campus,
el bot no responde por su cuenta. Identifica el campus (o lo pregunta) y entrega el
contacto de la secretaría correspondiente. Si la persona lo autoriza, avisa a la
secretaría (integrations/notify.py).
"""
from __future__ import annotations

from ..dialogue.states import State
from ..integrations.notify import notify_handoff
from ..models import Button, Card, Reply
from ..storage import db
from .base import Ctx, back_to_menu, handler

PENDING = "Por definir"


def contact_card(campus: dict, general: dict) -> Card:
    """Tarjeta de contacto. Si un dato del campus falta, usa el contacto general de CEIBA."""
    email = campus.get("email") or general.get("email")
    phone = campus.get("phone") or general.get("phone")
    wa = campus.get("whatsapp") or general.get("whatsapp")
    hours = campus.get("hours") or general.get("hours")
    lines = [
        f"👤 {campus.get('secretary') or 'Secretaría del campus'}",
        f"✉️ {email or PENDING}",
        f"📞 {phone or PENDING}",
        f"🕘 {hours or PENDING}",
    ]
    if campus.get("location"):
        lines.append(f"📍 {campus['location']}")
    card = Card(title=f"🤝 {campus['name']}", body="\n".join(lines), tag="Nivel 2 · Secretaría de campus")
    if wa:
        card.url, card.url_label = f"https://wa.me/{wa}", "💬 Escribir por WhatsApp"
    elif email:
        card.url, card.url_label = f"mailto:{email}", "✉️ Enviar correo"
    return card


def campus_buttons(ctx: Ctx) -> list[Button]:
    return [Button(label=c["name"], payload=f"c:{c['id']}", short=c["name"].replace("Campus ", "")[:20])
            for c in ctx.content.contacts["campuses"]]


@handler("derivar")
def derivar(ctx: Ctx, category: str = "manual", campus: str | None = None, excerpt: str = "", **_) -> Reply:
    s = ctx.session
    s.pending_handoff = {"category": category, "excerpt": excerpt}
    campus_id = campus or s.profile.campus
    if campus_id and ctx.content.campus(campus_id):
        return handoff_campus(ctx, campus=campus_id)
    s.set_state(State.HANDOFF_CAMPUS)
    return Reply(messages=[ctx.content.msg("handoff_ask_campus")], buttons=campus_buttons(ctx))


@handler("handoff_reask")
def handoff_reask(ctx: Ctx, **_) -> Reply:
    return Reply(messages=["No reconocí el campus. Elige uno de la lista, por favor. 👇"], buttons=campus_buttons(ctx))


@handler("handoff_campus")
def handoff_campus(ctx: Ctx, campus: str, **_) -> Reply:
    s = ctx.session
    info = ctx.content.campus(campus) or ctx.content.campus("otro")
    s.profile.campus = info["id"] if info["id"] != "otro" else s.profile.campus
    s.set_state(State.MENU)
    pending = s.pending_handoff or {"category": "manual", "excerpt": ""}
    pending["campus"] = info["id"]
    s.pending_handoff = pending
    intro = ctx.content.msg("handoff_done", campus=info["name"]) if pending.get("category") not in ("manual", "fallback") \
        else f"Este es el contacto de la secretaría de **{info['name']}**:"
    reply = Reply(messages=[intro],
                  cards=[contact_card(info, ctx.content.contacts["general"])])
    if pending.get("excerpt"):
        reply.messages.append("¿Quieres que le envíe tu pregunta a la secretaría para que ya tenga el contexto? "
                              "Solo comparto el campus y el texto de tu pregunta, sin tus datos de contacto.")
        reply.buttons.append(Button(label="📨 Sí, enviar mi pregunta", payload="i:handoff_send", short="Enviar pregunta"))
    reply.buttons.append(back_to_menu(ctx.content))
    s.last_topic = f"contacto de {info['name']}"
    return reply


@handler("handoff_send")
def handoff_send(ctx: Ctx, **_) -> Reply:
    s = ctx.session
    pending = s.pending_handoff
    if not pending or not pending.get("campus"):
        return Reply(messages=["No tengo una pregunta pendiente de enviar."], buttons=[back_to_menu(ctx.content)])
    info = ctx.content.campus(pending["campus"]) or ctx.content.campus("otro")
    hid = db.log_handoff(s.user_key, info["id"], pending.get("category"), pending.get("excerpt", ""), notified=False)
    ok = notify_handoff(handoff_id=hid, campus=info, category=pending.get("category", "manual"),
                        excerpt=pending.get("excerpt", ""), channel=s.channel,
                        fallback_email=ctx.content.contacts["general"].get("email"))
    s.pending_handoff = None
    msg = (f"✅ Listo, envié tu pregunta (folio #{hid}). La secretaría de {info['name']} la tendrá a la mano cuando la contactes."
           if ok else "No pude enviar el aviso en este momento, pero ya tienes el contacto directo arriba. 🙏")
    return Reply(messages=[msg], buttons=[back_to_menu(ctx.content)])


@handler("contacto_humano")
def contacto_humano(ctx: Ctx, **_) -> Reply:
    general = ctx.content.contacts["general"]
    levels = ctx.content.contacts["support_levels"]
    lines = ["Así nos organizamos para atenderte:"]
    lines += [f"**Nivel {lv['level']} · {lv['who']}:** {lv['scope']}." for lv in levels]
    reply = Reply(messages=["\n".join(lines)])
    social = [f"[{x['name']}]({x['url']})" for x in ctx.content.contacts.get("social", []) if x.get("url")]
    body = [f"✉️ {general.get('email') or PENDING}", f"📞 {general.get('phone') or PENDING}", f"🕘 {general.get('hours') or PENDING}"]
    if social:
        body.append("🌐 " + " · ".join(social))
    card = Card(title=f"🌳 {general['name']}", body="\n".join(body), tag="Nivel 3 · Coordinación CEIBA")
    if general.get("whatsapp"):
        card.url, card.url_label = f"https://wa.me/{general['whatsapp']}", "💬 WhatsApp"
    elif general.get("email"):
        card.url, card.url_label = f"mailto:{general['email']}", "✉️ Correo"
    reply.cards.append(card)
    reply.buttons = [Button(label="🏫 Contacto de mi campus", payload="i:derivar", short="Mi campus"), back_to_menu(ctx.content)]
    return reply
