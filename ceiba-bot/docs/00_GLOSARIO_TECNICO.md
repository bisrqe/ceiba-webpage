# 00 · Glosario técnico (para personas que no programan)

| Término | Qué significa aquí |
|---|---|
| **Canal** | Plataforma donde la gente conversa con el bot: sitio web, WhatsApp, Telegram, Messenger |
| **Backend / servidor** | El programa que recibe los mensajes y decide qué responder. Vive en `backend/` |
| **Frontend / widget** | La ventana de chat que se ve en el sitio web. Vive en `frontend/` |
| **Orquestador (middleware)** | La pieza central que coordina todo el recorrido de un mensaje |
| **NLU** | Comprensión del lenguaje natural: convertir texto libre en datos (intención y entidades) |
| **Intención** | Lo que la persona quiere: ver el calendario, inscribirse, hablar con alguien |
| **Entidad** | Un dato concreto del mensaje: el campus, el programa, el nivel |
| **Contexto** | Lo que el bot recuerda de cada persona entre mensajes |
| **Máquina de estados** | Las reglas que deciden en qué parte de la conversación está la persona y qué sigue |
| **Fulfillment / cumplimiento** | La función que arma la respuesta de cada intención |
| **Payload** | El código invisible que envía un botón al tocarlo, por ejemplo `i:ver_programas` |
| **Webhook** | Una dirección del servidor a la que WhatsApp o Telegram envían cada mensaje nuevo |
| **Token** | Contraseña que autoriza al bot a enviar mensajes en una plataforma. Va en `.env`, nunca en GitHub |
| **RAG** | Buscar primero en documentos oficiales y responder solo con lo encontrado |
| **BM25** | Método de búsqueda por palabras, como un buscador clásico |
| **Embeddings** | Representación numérica del significado de un texto; permite buscar por sentido y no solo por palabras |
| **LLM** | Modelo de lenguaje grande (como Claude, GPT o Llama). En este bot es opcional |
| **YAML** | Formato de texto legible para guardar el contenido (`content/*.yaml`) |
| **`.env`** | Archivo con la configuración secreta (tokens, contraseñas). Cada servidor tiene el suyo |
| **CI** | Revisión automática que GitHub ejecuta en cada cambio propuesto |
| **PR (Pull Request)** | Propuesta de cambio que otra persona revisa antes de aplicarla |
| **Derivación (handoff)** | Pasar la conversación a una persona: secretaría de campus o coordinación |
| **Modo DRY RUN** | Modo de prueba: el bot procesa todo pero no envía mensajes reales |
