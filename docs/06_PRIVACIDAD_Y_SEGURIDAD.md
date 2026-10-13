# 06 · Privacidad y seguridad

> Este documento describe cómo está construido el bot. **No sustituye una revisión jurídica.** El aviso de privacidad debe redactarlo o revisarlo la persona responsable legal de CEIBA.

## Marco aplicable (México)

La Ley Federal de Protección de Datos Personales en Posesión de los Particulares vigente se publicó en el DOF el 20 de marzo de 2025. Para un bot como este, lo relevante es: informar el aviso de privacidad antes de tratar datos, limitar los datos a lo necesario, permitir el ejercicio de derechos (acceso, rectificación, cancelación, oposición) y obtener el consentimiento de madre, padre o tutor para tratar datos de menores de edad.

## Qué datos guarda el bot

| Dato | ¿Se guarda? | Cómo |
|---|---|---|
| Número de WhatsApp, id de Telegram o Messenger | Sí, **irreversible** | Hash HMAC-SHA256 con `USER_HASH_SALT`. No se puede recuperar el número |
| Perfil (perfil, interés, nivel, campus, etapa) | Sí | Para dar seguimiento y recomendaciones |
| Historial de mensajes | Opcional (`LOG_MESSAGES`) | Correos y teléfonos escritos se reemplazan por `[correo]` y `[teléfono]`. Se borra tras `RETENTION_DAYS` |
| Nombre, correo, edad, escuela | **No** | La inscripción se hace en el formulario oficial, que gestiona el consentimiento |
| Mensajes no entendidos | Sí, sin identificar a la persona | Tabla `unmatched`, para mejorar el bot |
| Derivaciones | Solo campus, motivo y pregunta | El aviso a la secretaría sale únicamente si la persona toca «Enviar mi pregunta» |

## Derechos de la persona

El bot muestra el aviso de privacidad en la primera interacción. Escribir **«borrar mis datos»** elimina de inmediato el perfil, el historial y las derivaciones de esa persona. Para otras solicitudes (acceso, rectificación), el contacto es el de `contacts.yaml → general`.

## Menores de edad

El perfil «Quiero aprender lo básico» está pensado para 8 a 14 años: activa lenguaje sencillo y evita documentos avanzados. El bot no pide edad ni datos personales, y para inscribirse redirige al formulario oficial, que solicita el consentimiento del tutor.

## Seguridad técnica

| Medida | Dónde |
|---|---|
| Verificación de firma de webhooks (Meta y Telegram) | `security.py`; obligatoria con `APP_ENV=production` |
| Límite anti-spam por persona | `RATE_LIMIT_PER_MINUTE` |
| CORS restringido al dominio del sitio | `ALLOWED_ORIGINS` |
| Secretos fuera del repositorio | `.env` en `.gitignore`; variables de entorno del hosting en producción |
| HTML seguro en el widget y Telegram | El texto se escapa antes de aplicar formato; solo se permiten enlaces `https` y `mailto` |
| Contenedor sin privilegios | El `Dockerfile` ejecuta como usuario `ceiba`, no como root |
| Recarga protegida | `/admin/reload` exige `ADMIN_TOKEN` |

## Lista de verificación antes de producción

- [ ] `APP_ENV=production`
- [ ] `USER_HASH_SALT`, `ADMIN_TOKEN`, `META_APP_SECRET` y `TELEGRAM_SECRET_TOKEN` generados con `secrets.token_urlsafe(32)`
- [ ] `ALLOWED_ORIGINS` solo con los dominios de CEIBA
- [ ] Aviso de privacidad publicado y enlazado en `contacts.yaml → general.privacy_url`
- [ ] `scripts/purge_old_data.py` programado a diario
- [ ] Respaldo programado de `data/ceiba_bot.sqlite3`
- [ ] Rama `main` protegida en GitHub, con revisión obligatoria y CI en verde
- [ ] Revisión jurídica del aviso de privacidad y de los textos de derivación
