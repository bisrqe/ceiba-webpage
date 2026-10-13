"""SERVIDOR WEB de CEIBA bot (FastAPI).

Arranque local:   uvicorn app.main:app --reload --app-dir backend
Documentación interactiva de la API: http://localhost:8000/docs

Rutas:
  GET  /health                     → estado del servicio (para monitoreo)
  GET  /api/config                 → nombre del bot y menú principal (lo usa el widget)
  POST /api/chat                   → canal web (widget <ceiba-bot>)
  GET  /webhooks/whatsapp          → verificación del webhook de Meta
  POST /webhooks/whatsapp          → mensajes entrantes de WhatsApp
  GET  /webhooks/messenger         → verificación del webhook de Meta
  POST /webhooks/messenger         → mensajes entrantes de Messenger
  POST /webhooks/telegram          → actualizaciones de Telegram
  POST /admin/reload               → recarga content/*.yaml sin reiniciar (requiere ADMIN_TOKEN)
  /widget/*  y  /demo/             → archivos del widget y página de prueba
"""
from __future__ import annotations

import hmac
import json
import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool

from . import config
from .channels import CHANNELS
from .content_loader import reload_content
from .models import Incoming
from .orchestrator import get_bot
from .security import verify_meta_signature, verify_telegram_secret
from .storage import db

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("ceiba-bot")


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.init_db()
    get_bot()                         # carga contenido e índice de la biblioteca al arrancar
    log.info("CEIBA bot listo (entorno=%s, dry_run=%s, llm=%s)", config.settings.env,
             config.settings.channel_dry_run, config.settings.llm_provider)
    yield


app = FastAPI(title="CEIBA bot", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=config.settings.allowed_origins,
                   allow_methods=["GET", "POST"], allow_headers=["Content-Type"])


# ---------------------------------------------------------------- Utilidades
@app.get("/health")
def health() -> dict:
    return {"ok": True, "env": config.settings.env}


@app.get("/api/config")
def api_config() -> dict:
    c = get_bot().content
    return {
        "name": c.bot["bot"]["name"],
        "typing": {k: c.bot["ux"][k] for k in ("typing_delay_ms_per_char", "typing_delay_max_ms")},
        "menu": [{"label": i["label"], "payload": f"i:{i['intent']}"} for i in c.menus["main"]],
    }


# ---------------------------------------------------------------- Canal web
@app.post("/api/chat")
def api_chat(body: dict) -> dict:
    try:
        incoming = CHANNELS["web"].parse(body)[0]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return get_bot().handle(incoming).to_dict()


# ---------------------------------------------------------------- Procesamiento común de webhooks
async def _process(channel_name: str, incoming: Incoming) -> None:
    channel = CHANNELS[channel_name]
    try:
        reply = await run_in_threadpool(get_bot().handle, incoming)
        await channel.send(incoming.user_id, reply, callback_query_id=incoming.raw.get("callback_query_id"))
    except Exception:
        log.exception("Error procesando mensaje de %s", channel_name)


def _meta_verify(mode: str | None, token: str | None, challenge: str | None) -> PlainTextResponse:
    """Meta llama a esta ruta UNA vez al registrar el webhook. Debe devolver hub.challenge."""
    expected = config.settings.meta_verify_token
    if mode == "subscribe" and expected and token and hmac.compare_digest(token, expected):
        return PlainTextResponse(challenge or "")
    raise HTTPException(status_code=403, detail="Token de verificación incorrecto")


async def _meta_receive(request: Request, background: BackgroundTasks, channel_name: str,
                        signature: str | None) -> dict:
    raw = await request.body()
    if not verify_meta_signature(raw, signature):
        raise HTTPException(status_code=401, detail="Firma inválida")
    for incoming in CHANNELS[channel_name].parse(json.loads(raw or b"{}")):
        background.add_task(_process, channel_name, incoming)
    return {"ok": True}           # responder rápido (<5 s) evita que Meta reintente el envío


# ---------------------------------------------------------------- WhatsApp
@app.get("/webhooks/whatsapp")
def whatsapp_verify(request: Request) -> PlainTextResponse:
    q = request.query_params
    return _meta_verify(q.get("hub.mode"), q.get("hub.verify_token"), q.get("hub.challenge"))


@app.post("/webhooks/whatsapp")
async def whatsapp_receive(request: Request, background: BackgroundTasks,
                           x_hub_signature_256: str | None = Header(default=None)) -> dict:
    return await _meta_receive(request, background, "whatsapp", x_hub_signature_256)


# ---------------------------------------------------------------- Messenger
@app.get("/webhooks/messenger")
def messenger_verify(request: Request) -> PlainTextResponse:
    q = request.query_params
    return _meta_verify(q.get("hub.mode"), q.get("hub.verify_token"), q.get("hub.challenge"))


@app.post("/webhooks/messenger")
async def messenger_receive(request: Request, background: BackgroundTasks,
                            x_hub_signature_256: str | None = Header(default=None)) -> dict:
    return await _meta_receive(request, background, "messenger", x_hub_signature_256)


# ---------------------------------------------------------------- Telegram
@app.post("/webhooks/telegram")
async def telegram_receive(request: Request, background: BackgroundTasks,
                           x_telegram_bot_api_secret_token: str | None = Header(default=None)) -> dict:
    if not verify_telegram_secret(x_telegram_bot_api_secret_token):
        raise HTTPException(status_code=401, detail="Secreto inválido")
    for incoming in CHANNELS["telegram"].parse(await request.json()):
        background.add_task(_process, "telegram", incoming)
    return {"ok": True}


# ---------------------------------------------------------------- Administración
@app.post("/admin/reload")
def admin_reload(authorization: str | None = Header(default=None)) -> dict:
    token = config.settings.admin_token
    if not token or not authorization or not hmac.compare_digest(authorization, f"Bearer {token}"):
        raise HTTPException(status_code=401, detail="No autorizado")
    try:
        content = reload_content()
    except Exception as exc:          # YAML con error: se conserva la versión anterior
        raise HTTPException(status_code=400, detail=f"Contenido inválido, se conserva el anterior: {exc}")
    get_bot().reload(content)
    return {"ok": True, "documents": len(content.documents)}


# ---------------------------------------------------------------- Archivos estáticos
app.mount("/widget", StaticFiles(directory=config.FRONTEND_DIR / "widget"), name="widget")
app.mount("/demo", StaticFiles(directory=config.FRONTEND_DIR / "demo", html=True), name="demo")


@app.get("/")
def root() -> RedirectResponse:
    return RedirectResponse("/demo/")
