#!/usr/bin/env python3
"""Revisa content/*.yaml ANTES de subir cambios. Lo ejecuta también GitHub Actions.

    python scripts/validate_content.py           # errores (bloquean) y avisos (informativos)
    python scripts/validate_content.py --strict  # los avisos también fallan (útil antes de producción)

Qué revisa:
  · que cada YAML se pueda leer (comillas, sangrías, dos puntos)
  · que los botones apunten a intenciones existentes y respeten los límites de WhatsApp
  · que los campus coincidan entre contacts.yaml y entities.yaml
  · que cada documento de la biblioteca tenga los campos obligatorios y un enlace https
  · que las preguntas frecuentes confirmadas (status: done) citen su fuente
  · avisos: datos pendientes (null) que conviene llenar antes de publicar
"""
from __future__ import annotations

import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
C = ROOT / "content"
errors: list[str] = []
warnings: list[str] = []


def load(name: str) -> dict:
    try:
        return yaml.safe_load((C / f"{name}.yaml").read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        errors.append(f"{name}.yaml no se puede leer: {exc}")
        return {}


def main() -> int:
    strict = "--strict" in sys.argv
    bot, menus, intents, entities = load("bot"), load("menus"), load("intents"), load("entities")
    contacts, faq, programs, diag = load("contacts"), load("faq"), load("programs"), load("diagnostic")
    calendar, bib, glossary = load("calendar"), load("bibliography"), load("glossary")
    if errors:
        return report(strict)

    # ---- Menús
    known_intents = set(intents.get("intents", {})) | {"menu"}
    handlers_extra = {"inscripcion", "mi_progreso", "contacto_humano", "faq_menu"}
    for group in ("main", "footer"):
        for item in menus.get(group, []):
            if item.get("intent") not in known_intents | handlers_extra:
                errors.append(f"menus.yaml → '{item.get('id')}': la intención '{item.get('intent')}' no existe en intents.yaml")
            if len(item.get("short", "")) > 20:
                errors.append(f"menus.yaml → '{item.get('id')}': `short` tiene {len(item['short'])} caracteres (máximo 20 por WhatsApp)")
            if len(item.get("desc", "")) > 72:
                errors.append(f"menus.yaml → '{item.get('id')}': `desc` excede 72 caracteres")
    if len(menus.get("main", [])) > 10:
        errors.append("menus.yaml → `main` tiene más de 10 botones (WhatsApp muestra máximo 10 en una lista)")
    lib_topics = {t["topic"] for t in menus.get("library_topics", [])}

    # ---- Diagnóstico
    for q in diag.get("questions", []):
        for o in q.get("options", []):
            if len(o.get("short", "")) > 24:
                errors.append(f"diagnostic.yaml → '{q['id']}/{o['value']}': `short` excede 24 caracteres")
            if len(o.get("text", "")) > 72:
                warnings.append(f"diagnostic.yaml → '{q['id']}/{o['value']}': `text` excede 72 (WhatsApp lo recortará)")
        if q.get("kind") == "trivia" and q.get("correct") not in {o["value"] for o in q.get("options", [])}:
            errors.append(f"diagnostic.yaml → '{q['id']}': `correct` no coincide con ninguna opción")

    # ---- Campus
    contact_ids = {c["id"] for c in contacts.get("campuses", [])}
    entity_ids = set((entities.get("campus") or {}).keys())
    if contact_ids != entity_ids:
        errors.append(f"Campus distintos entre contacts.yaml {sorted(contact_ids)} y entities.yaml {sorted(entity_ids)}")
    for c in contacts.get("campuses", []):
        if c["id"] != "otro" and not (c.get("email") or c.get("phone") or c.get("whatsapp")):
            warnings.append(f"contacts.yaml → campus '{c['id']}' sin correo, teléfono ni WhatsApp (EDITA AQUÍ)")
    for key in ("email", "phone", "privacy_url"):
        if not contacts.get("general", {}).get(key):
            warnings.append(f"contacts.yaml → general.{key} está pendiente (EDITA AQUÍ)")

    # ---- FAQ
    ids = set()
    for f in faq.get("faqs", []):
        if f["id"] in ids:
            errors.append(f"faq.yaml → id repetido '{f['id']}'")
        ids.add(f["id"])
        if f.get("status") == "done" and not f.get("source"):
            errors.append(f"faq.yaml → '{f['id']}' está confirmada (done) pero no cita `source`")
        if f.get("answer") is None:
            warnings.append(f"faq.yaml → '{f['id']}' sin respuesta todavía (el bot dirá que el dato no está publicado)")

    # ---- Programas y calendario
    prog_ids = {p["id"] for p in programs.get("programs", [])}
    for m in calendar.get("months", []):
        for e in m.get("events", []):
            if e.get("cat") not in prog_ids:
                errors.append(f"calendar.yaml → evento '{e.get('label')}' tiene cat '{e.get('cat')}' que no existe en programs.yaml")

    # ---- Biblioteca
    required = ["id", "title", "title_es", "publisher", "year", "type", "lang", "level", "tags", "url", "summary_es", "key_facts"]
    seen = set()
    for d in bib.get("documents", []):
        for field in required:
            if field not in d or d[field] in (None, "", []):
                errors.append(f"bibliography.yaml → '{d.get('id', '?')}': falta `{field}`")
        if d.get("id") in seen:
            errors.append(f"bibliography.yaml → id repetido '{d['id']}'")
        seen.add(d.get("id"))
        if not str(d.get("url", "")).startswith("https://"):
            errors.append(f"bibliography.yaml → '{d.get('id')}': el enlace debe empezar con https://")
        if d.get("level") not in {"basico", "intermedio", "avanzado"}:
            errors.append(f"bibliography.yaml → '{d.get('id')}': level inválido '{d.get('level')}'")
        for t in d.get("tags", []):
            if t not in lib_topics:
                errors.append(f"bibliography.yaml → '{d.get('id')}': tag '{t}' no existe en menus.yaml → library_topics")
        for p in d.get("programs", []):
            if p not in prog_ids:
                errors.append(f"bibliography.yaml → '{d.get('id')}': programa '{p}' no existe")
        if d.get("added_by") == "sugerencia":
            warnings.append(f"bibliography.yaml → '{d.get('id')}' es una sugerencia: valídala y cambia added_by a user")

    # ---- Glosario
    for key, item in (glossary.get("terms") or {}).items():
        if not item.get("def") or not item.get("simple"):
            errors.append(f"glossary.yaml → '{key}' necesita `def` y `simple`")

    if not bot.get("bot", {}).get("website", "").startswith("http"):
        errors.append("bot.yaml → bot.website debe ser una URL")
    return report(strict)


def report(strict: bool) -> int:
    for w in warnings:
        print(f"⚠️  {w}")
    for e in errors:
        print(f"❌ {e}")
    print(f"\nResultado: {len(errors)} errores, {len(warnings)} avisos.")
    if errors or (strict and warnings):
        return 1
    print("✅ Contenido válido.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
