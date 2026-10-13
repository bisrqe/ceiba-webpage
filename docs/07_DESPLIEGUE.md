# 07 · Despliegue

El bot es un solo servicio web (FastAPI) más un archivo SQLite. Cualquier proveedor que ejecute Python o Docker con **https** sirve.

## Opción A: Docker (recomendada)

```bash
cp .env.example .env          # llena los valores de producción
docker compose up --build -d
curl https://TU-SERVIDOR/health
```

`docker-compose.yml` monta `data/` (base de datos e índice) y `content/` como volúmenes: puedes editar YAML en el servidor y aplicar con `/admin/reload` sin reconstruir.

## Opción B: plataforma administrada (Render, Railway, Fly.io)

1. Conecta el repositorio de GitHub.
2. Comando de inicio: `uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port $PORT --proxy-headers`
3. Copia las variables de `.env.example` en el panel de variables de entorno.
4. **Agrega un disco persistente** montado en `/app/data` (o la ruta que use `DATABASE_PATH`). Sin disco, la base de datos se borra en cada despliegue.
5. Activa el despliegue automático al unir cambios a `main`.

## Opción C: servidor propio (VM)

Python 3.11+, `pip install -r backend/requirements.txt`, uvicorn como servicio de `systemd` detrás de Nginx o Caddy con certificado https.

## Después de desplegar

1. Configura los webhooks de cada canal con la URL pública ([03_CONECTIVIDAD.md](03_CONECTIVIDAD.md)).
2. Ejecuta `python scripts/ingest_bibliography.py` en el servidor (o súbelo como paso de construcción).
3. Programa a diario `python scripts/purge_old_data.py` y el respaldo de `data/ceiba_bot.sqlite3`.
4. Incrusta el widget en el sitio de CEIBA:
   ```html
   <script type="module" src="https://TU-SERVIDOR/widget/ceiba-bot.js"></script>
   <ceiba-bot api="https://TU-SERVIDOR"></ceiba-bot>
   ```

## Escalar

Una instancia atiende sin problema el volumen de un programa estudiantil. Si necesitas varias instancias: migra `storage/db.py` a PostgreSQL y el `RateLimiter` de `security.py` a Redis; ambos están aislados para cambiarlos sin tocar el resto.

## Flujo de trabajo en GitHub para varias personas

1. Protege `main` (*Settings → Branches*): PR obligatorio, 1 aprobación, CI en verde, revisión de Code Owners.
2. Edita `.github/CODEOWNERS` con los usuarios reales.
3. Ramas con prefijo: `contenido/…`, `canal/…`, `fix/…`, `docs/…`.
4. Nadie sube `.env`. Las credenciales de producción viven solo en el panel del hosting y las conoce el mínimo de personas.
