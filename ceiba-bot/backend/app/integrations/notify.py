"""AVISOS SALIENTES: cuando el bot deriva a una persona, avisa a la secretaría.

Destinos (variable NOTIFY_TARGETS en .env, separados por coma):
  email   → correo a la secretaría del campus (SMTP institucional o Gmail/Outlook con contraseña de aplicación)
  webhook → POST JSON firmado a cualquier URL: Google Apps Script → Google Sheets,
            Make, Zapier, n8n, Power Automate o tu propio CRM
  slack   → mensaje a un canal de Slack (Incoming Webhook)

Solo se envía lo mínimo: campus, motivo y la pregunta (con correos y teléfonos ocultos).
El aviso sale únicamente cuando la persona toca «📨 Enviar mi pregunta» (consentimiento explícito).
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import smtplib
from email.message import EmailMessage

import httpx

from .. import config
from ..security import redact

log = logging.getLogger(__name__)

CATEGORY_LABEL = {
    "propuesta_concreta": "Pregunta sobre su propuesta concreta",
    "espacio_campus": "Pregunta sobre un espacio del campus",
    "persona_campus": "Pregunta sobre una persona del campus",
    "fallback": "El bot no pudo resolver la duda",
    "manual": "Solicitó hablar con una persona",
}


def _email(to: str, subject: str, body: str) -> bool:
    s = config.settings
    if not (s.smtp_host and s.smtp_from and to):
        log.warning("Aviso por correo omitido: falta SMTP_HOST, SMTP_FROM o el correo del campus")
        return False
    msg = EmailMessage()
    msg["From"], msg["To"], msg["Subject"] = s.smtp_from, to, subject
    msg.set_content(body)
    with smtplib.SMTP(s.smtp_host, s.smtp_port, timeout=15) as smtp:
        smtp.starttls()
        if s.smtp_user:
            smtp.login(s.smtp_user, s.smtp_password)
        smtp.send_message(msg)
    return True


def _webhook(payload: dict) -> bool:
    s = config.settings
    if not s.notify_webhook_url:
        return False
    body = json.dumps(payload, ensure_ascii=False).encode()
    headers = {"Content-Type": "application/json"}
    if s.notify_webhook_secret:   # el receptor puede verificar que el aviso viene del bot
        headers["X-Ceiba-Signature"] = "sha256=" + hmac.new(s.notify_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    httpx.post(s.notify_webhook_url, content=body, headers=headers, timeout=10, follow_redirects=True).raise_for_status()
    return True


def _slack(text: str) -> bool:
    s = config.settings
    if not s.slack_webhook_url:
        return False
    httpx.post(s.slack_webhook_url, json={"text": text}, timeout=10).raise_for_status()
    return True


def notify_handoff(*, handoff_id: int, campus: dict, category: str, excerpt: str, channel: str, fallback_email: str | None) -> bool:
    """Devuelve True si al menos un destino recibió el aviso."""
    s = config.settings
    if s.channel_dry_run:
        log.info("[DRY RUN] Aviso de derivación #%s a %s (%s)", handoff_id, campus.get("name"), category)
        return True
    reason = CATEGORY_LABEL.get(category, category)
    question = redact(excerpt)
    subject = f"[CEIBA bot] Derivación #{handoff_id} · {campus.get('name')} · {reason}"
    body = (f"Una persona pidió apoyo a través de CEIBA bot ({channel}).\n\n"
            f"Campus: {campus.get('name')}\nMotivo: {reason}\nPregunta: {question}\n\n"
            "La persona recibió tus datos de contacto y te escribirá directamente. "
            "Este aviso no incluye datos personales.")
    payload = {"type": "handoff", "id": handoff_id, "campus": campus.get("id"), "campus_name": campus.get("name"),
               "category": category, "reason": reason, "question": question, "channel": channel}
    delivered = False
    for target in s.notify_targets:
        try:
            if target == "email":
                delivered |= _email(campus.get("email") or fallback_email or "", subject, body)
            elif target == "webhook":
                delivered |= _webhook(payload)
            elif target == "slack":
                delivered |= _slack(f"*{subject}*\n{question}")
        except Exception as exc:   # un destino caído no debe tumbar la conversación
            log.error("Falló el aviso por %s: %s", target, exc)
    return delivered
