"""CEIBA bot · backend.

Mapa rápido de este paquete (ver docs/01_ARQUITECTURA.md):
  main.py           → servidor web: rutas de la API y de los webhooks (nivel macro)
  orchestrator.py   → middleware: recibe un mensaje, decide y responde (nivel macro)
  nlu/              → comprensión: intenciones, entidades, normalización (nivel medio)
  dialogue/         → contexto y máquina de estados (nivel medio / micro)
  fulfillment/      → funciones de cumplimiento: una por intención (nivel micro)
  rag/              → biblioteca climática: búsqueda y redacción con fuentes
  channels/         → adaptadores de canal: web, WhatsApp, Telegram, Messenger
  integrations/     → avisos salientes: correo, webhook, Slack
  storage/          → base de datos (SQLite por defecto)
"""
