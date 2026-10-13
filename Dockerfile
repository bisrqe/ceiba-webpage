# Imagen de producción de CEIBA bot.
#   docker build -t ceiba-bot .
#   docker run -p 8000:8000 --env-file .env -v $(pwd)/data:/app/data ceiba-bot
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend
COPY content content
COPY frontend frontend
COPY scripts scripts
RUN mkdir -p data && useradd --create-home ceiba && chown -R ceiba /app
USER ceiba

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--app-dir", "backend", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
