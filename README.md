# 🌳 CEIBA bot

Asistente conversacional de **CEIBA · Capacitación e Incidencia en Bienestar Ambiental**. Informa sobre el programa, evalúa el perfil de cada persona con preguntas cortas, le recomienda programa y lecturas oficiales de la ONU y el IPCC, responde preguntas frecuentes con datos exactos y, cuando la duda requiere a una persona, la deriva a la secretaría de su campus.

Funciona en **sitio web, WhatsApp, Telegram y Facebook Messenger** con una sola lógica. Tiene el mismo contenido que el sitio web de CEIBA.

---

## Empieza aquí según tu rol

| Si tú… | Lee primero | Editas en |
|---|---|---|
| Cambias textos, preguntas frecuentes, contactos o lecturas | [docs/02_GUIA_DE_EDICION.md](docs/02_GUIA_DE_EDICION.md) | `content/` (solo archivos `.yaml`) |
| Conectas WhatsApp, Telegram, Messenger, correo o Google Sheets | [docs/03_CONECTIVIDAD.md](docs/03_CONECTIVIDAD.md) | `.env` (nunca en el código) |
| Modificas el comportamiento o agregas una función | [docs/01_ARQUITECTURA.md](docs/01_ARQUITECTURA.md) y [docs/04_FLUJOS_CONVERSACIONALES.md](docs/04_FLUJOS_CONVERSACIONALES.md) | `backend/app/` |
| Publicas el bot en un servidor | [docs/07_DESPLIEGUE.md](docs/07_DESPLIEGUE.md) | `.env`, `Dockerfile` |
| No conoces términos como «intención» o «webhook» | [docs/00_GLOSARIO_TECNICO.md](docs/00_GLOSARIO_TECNICO.md) | — |

Busca la etiqueta **`EDITA AQUÍ`** en cualquier archivo: marca cada dato que el equipo debe completar o personalizar.

```bash
grep -rn "EDITA AQUÍ" content/ .env.example     # lista todo lo pendiente
```

---

## Arranque rápido (5 minutos)

Requiere Python 3.11 o superior.

```bash
git clone <URL-del-repo> ceiba-bot && cd ceiba-bot
pip install -r backend/requirements.txt
cp .env.example .env                              # ya funciona en modo prueba sin llenar nada

python scripts/chat_cli.py                        # opción 1: conversar en la terminal
uvicorn app.main:app --reload --app-dir backend   # opción 2: abrir http://localhost:8000
```

En la opción 2 verás la página de demostración con el widget. `http://localhost:8000/demo/?modo=pagina` muestra la versión de página completa y `http://localhost:8000/docs` la documentación de la API.

Antes de subir cualquier cambio:

```bash
python scripts/validate_content.py    # revisa los YAML (formato, límites de WhatsApp, campos obligatorios)
python -m pytest -q backend/tests     # 73 pruebas automáticas
```

---

## Mapa del repositorio

```
ceiba-bot/
├── content/                  ← CONTENIDO EDITABLE (sin programar). Cada archivo explica su formato arriba.
│   ├── bot.yaml              nombre, tono, saludos y mensajes del sistema
│   ├── menus.yaml            botones del menú de acciones y temas de la biblioteca
│   ├── intents.yaml          INTENCIONES: palabras y frases que el bot reconoce
│   ├── entities.yaml         ENTIDADES (campus, programa, nivel), reglas de derivación, traducciones de búsqueda
│   ├── faq.yaml              banco de preguntas frecuentes (nivel 1): monto, fechas, rubros, formulario…
│   ├── contacts.yaml         contactos de CEIBA y de la secretaría de cada campus  ← EDITA AQUÍ
│   ├── programs.yaml         quiénes somos y los tres programas (igual que el sitio)
│   ├── diagnostic.yaml       evaluación de perfil progresiva (preguntas, mini retos, reglas de nivel)
│   ├── initiatives.yaml      tipos de iniciativa (3 sectores × 3 tipos)
│   ├── calendar.yaml         calendario agosto → julio
│   ├── glossary.yaml         glosario («¿qué es la CMNUCC?»)
│   └── bibliography.yaml     biblioteca UNFCCC/IPCC: la única fuente de verdad de las respuestas climáticas
│
├── backend/                  ← SERVIDOR (Python + FastAPI)
│   ├── app/
│   │   ├── main.py           rutas: API web, webhooks de cada canal, administración
│   │   ├── orchestrator.py   MIDDLEWARE: recibe → entiende → decide → responde → guarda
│   │   ├── config.py         lee .env
│   │   ├── content_loader.py carga content/*.yaml
│   │   ├── models.py         formato neutral de mensajes (texto, botones, tarjetas)
│   │   ├── security.py       firmas de webhooks, límite anti-spam, hash de identificadores
│   │   ├── nlu/              comprensión: normalizador, clasificador de intenciones, extractor de entidades
│   │   ├── dialogue/         contexto por persona, estados y árbol de decisión
│   │   ├── fulfillment/      una función por intención (handlers, perfil, derivación, recomendador)
│   │   ├── rag/              biblioteca: búsqueda (BM25 o embeddings), redacción con fuentes, ingesta
│   │   ├── channels/         adaptadores: web, WhatsApp, Telegram, Messenger
│   │   ├── integrations/     avisos salientes: correo, webhook (Sheets/CRM), Slack
│   │   └── storage/          base de datos SQLite
│   ├── tests/                pruebas automáticas (comprensión, flujos, canales, biblioteca, contenido)
│   └── requirements.txt
│
├── frontend/
│   ├── widget/ceiba-bot.js   widget <ceiba-bot> (Web Component, sin dependencias, adaptable)
│   └── demo/index.html       página de prueba
│
├── scripts/                  herramientas: validar contenido, chat en terminal, ingesta, limpieza, Telegram
├── docs/                     documentación por tema (ver tabla de arriba)
├── data/                     base de datos e índice (se genera solo; no se sube a GitHub)
├── .env.example              plantilla de configuración con explicación de cada variable
├── Dockerfile · docker-compose.yml · Makefile
└── .github/                  revisión automática (CI), dueños por carpeta, plantillas de PR e issues
```

---

## Qué hace el bot

| Opción del menú | Qué ocurre | Contenido en |
|---|---|---|
| 📝 Evaluar mi perfil | 6 preguntas, una a la vez, con 2 mini retos y retroalimentación. Asigna perfil, nivel y programa, y recomienda lecturas | `diagnostic.yaml`, `bibliography.yaml` |
| 🌎 Programas | Los tres programas con público, logros y lecturas útiles | `programs.yaml` |
| 📚 Biblioteca climática | Lecturas por tema y preguntas libres respondidas solo con fuentes oficiales | `bibliography.yaml` |
| 💡 Tipos de iniciativa | Sectores público, privado y mixto con ejemplos | `initiatives.yaml` |
| 📅 Calendario | Mes actual marcado y próximos eventos | `calendar.yaml` |
| ❓ Preguntas frecuentes | Respuestas predeterminadas exactas, con fuente | `faq.yaml` |
| 📊 Mi progreso | Perfil, nivel, lecturas y código para continuar en otro dispositivo | (base de datos) |
| ✍️ Inscribirme | Enlace al formulario oficial (el bot no pide datos personales) | `contacts.yaml` |
| 🤝 Hablar con una persona | Niveles de atención y contacto de la secretaría del campus | `contacts.yaml` |

**Regla de derivación:** si la pregunta menciona la propuesta concreta del estudiante, un espacio del campus o una persona del campus, el bot no responde por su cuenta. Identifica el campus (o lo pregunta) y entrega el contacto de su secretaría. Si la persona lo autoriza, avisa a la secretaría por correo, webhook o Slack.

---

## Estado y pendientes

Datos que el equipo debe completar antes de publicar (el validador los lista como avisos): contactos de CEIBA y de cada secretaría, URL del aviso de privacidad, monto, fechas, rubros no financiables, definición de «empujón verde» y costo del programa. Mientras estén en `null`, el bot dice que el dato no está publicado y ofrece el contacto humano; nunca lo inventa.

---

## Licencia

Por definir por la coordinación de CEIBA. Los documentos de la biblioteca pertenecen a sus autores (UNFCCC, IPCC); el bot solo enlaza a ellos y cita datos breves.
