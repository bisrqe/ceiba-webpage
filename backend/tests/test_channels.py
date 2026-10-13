"""Pruebas de conectividad: verificación de webhooks, firmas, y límites de cada canal.
No se conecta a Meta ni a Telegram: CHANNEL_DRY_RUN=true guarda los envíos en OUTBOX."""
import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient

from app.channels import CHANNELS
from app.channels.base import OUTBOX, md_to_telegram_html, md_to_whatsapp
from app.main import app
from app.models import Button, Card, Reply

client = TestClient(app)


def sign(body: bytes) -> str:
    return "sha256=" + hmac.new(b"secreto-de-prueba", body, hashlib.sha256).hexdigest()


# ------------------------------------------------------------------ Web
def test_web_chat_endpoint():
    r = client.post("/api/chat", json={"session_id": "abcdef123456", "event": "start"})
    assert r.status_code == 200 and r.json()["buttons"]


def test_web_rejects_bad_session():
    assert client.post("/api/chat", json={"session_id": "x", "text": "hola"}).status_code == 422


def test_config_endpoint():
    data = client.get("/api/config").json()
    assert data["name"] == "CEIBA bot" and len(data["menu"]) >= 5


# ------------------------------------------------------------------ Meta (WhatsApp / Messenger)
@pytest.mark.parametrize("path", ["/webhooks/whatsapp", "/webhooks/messenger"])
def test_meta_verification(path):
    ok = client.get(path, params={"hub.mode": "subscribe", "hub.verify_token": "token-de-verificacion", "hub.challenge": "42"})
    assert ok.status_code == 200 and ok.text == "42"
    bad = client.get(path, params={"hub.mode": "subscribe", "hub.verify_token": "otro", "hub.challenge": "42"})
    assert bad.status_code == 403


def test_whatsapp_rejects_bad_signature():
    body = json.dumps({"entry": []}).encode()
    assert client.post("/webhooks/whatsapp", content=body, headers={"X-Hub-Signature-256": "sha256=000"}).status_code == 401


def test_whatsapp_end_to_end_text():
    OUTBOX.clear()
    body = json.dumps({"object": "whatsapp_business_account", "entry": [{"changes": [{"value": {
        "contacts": [{"wa_id": "5218100000000", "profile": {"name": "Ana"}}],
        "messages": [{"from": "5218100000000", "id": "wamid.1", "type": "text", "text": {"body": "hola"}}]}}]}]}).encode()
    r = client.post("/webhooks/whatsapp", content=body, headers={"X-Hub-Signature-256": sign(body), "Content-Type": "application/json"})
    assert r.status_code == 200
    sent = [c["json"] for c in OUTBOX if c["channel"] == "whatsapp"]
    assert sent and sent[-1]["type"] == "interactive"
    assert sent[-1]["interactive"]["type"] == "list"                    # 9 opciones → lista
    rows = sent[-1]["interactive"]["action"]["sections"][0]["rows"]
    assert len(rows) <= 10 and all(len(x["title"]) <= 24 for x in rows)


def test_whatsapp_parses_interactive_reply():
    body = {"entry": [{"changes": [{"value": {"messages": [{"from": "1", "type": "interactive",
            "interactive": {"type": "button_reply", "button_reply": {"id": "i:ver_programas", "title": "Programas"}}}]}}]}]}
    inc = CHANNELS["whatsapp"].parse(body)[0]
    assert inc.payload == "i:ver_programas"


def test_whatsapp_render_limits():
    reply = Reply(messages=["Hola **mundo**"], buttons=[Button("Botón con un título muy largo", "i:menu", "Título larguísimo de más")])
    calls = CHANNELS["whatsapp"].render("1", reply)
    btn = calls[-1]["json"]["interactive"]["action"]["buttons"][0]["reply"]
    assert len(btn["title"]) <= 20
    assert calls[-1]["json"]["interactive"]["body"]["text"] == "Hola *mundo*"


def test_whatsapp_card_uses_cta_url():
    reply = Reply(cards=[Card(title="📜 Acuerdo de París", body="Resumen", url="https://unfccc.int", url_label="👁️ Leer en línea")])
    call = CHANNELS["whatsapp"].render("1", reply)[0]["json"]
    assert call["interactive"]["type"] == "cta_url"
    assert len(call["interactive"]["action"]["parameters"]["display_text"]) <= 20


def test_messenger_end_to_end_quick_replies():
    OUTBOX.clear()
    body = json.dumps({"object": "page", "entry": [{"messaging": [{"sender": {"id": "999"}, "message": {"text": "programas"}}]}]}).encode()
    r = client.post("/webhooks/messenger", content=body, headers={"X-Hub-Signature-256": sign(body), "Content-Type": "application/json"})
    assert r.status_code == 200
    sent = [c["json"]["message"] for c in OUTBOX if c["channel"] == "messenger"]
    assert any(m.get("attachment", {}).get("payload", {}).get("template_type") == "generic" for m in sent)
    qr = sent[-1]["quick_replies"]
    assert len(qr) <= 13 and all(len(q["title"]) <= 20 for q in qr)


# ------------------------------------------------------------------ Telegram
def test_telegram_requires_secret():
    assert client.post("/webhooks/telegram", json={"message": {}}).status_code == 401


def test_telegram_start_and_callback():
    OUTBOX.clear()
    upd = {"update_id": 1, "message": {"chat": {"id": 555}, "from": {"id": 555, "first_name": "Leo"}, "text": "/start"}}
    r = client.post("/webhooks/telegram", json=upd, headers={"X-Telegram-Bot-Api-Secret-Token": "secreto-telegram"})
    assert r.status_code == 200
    last = [c for c in OUTBOX if c["channel"] == "telegram"][-1]["json"]
    kb = last["reply_markup"]["inline_keyboard"]
    assert all(len(row) <= 2 for row in kb)
    assert all(len(b["callback_data"].encode()) <= 64 for row in kb for b in row)

    OUTBOX.clear()
    cb = {"update_id": 2, "callback_query": {"id": "cbq1", "from": {"id": 555}, "message": {"chat": {"id": 555}}, "data": "i:ver_calendario"}}
    client.post("/webhooks/telegram", json=cb, headers={"X-Telegram-Bot-Api-Secret-Token": "secreto-telegram"})
    tg = [c for c in OUTBOX if c["channel"] == "telegram"]
    assert tg[0]["url"].endswith("/answerCallbackQuery")


def test_telegram_html_is_escaped():
    out = md_to_telegram_html("**Hola** <script>x</script> [sitio](https://ceiba.mx)")
    assert "<b>Hola</b>" in out and "&lt;script&gt;" in out and '<a href="https://ceiba.mx">sitio</a>' in out


def test_markdown_to_whatsapp_links():
    assert md_to_whatsapp("[Aviso](https://x.mx)") == "Aviso: https://x.mx"


# ------------------------------------------------------------------ Administración
def test_admin_reload_requires_token():
    assert client.post("/admin/reload").status_code == 401
    ok = client.post("/admin/reload", headers={"Authorization": "Bearer admin-prueba"})
    assert ok.status_code == 200 and ok.json()["documents"] >= 14
