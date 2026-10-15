# Atajos para tareas frecuentes. Uso: make <tarea>   (en Windows usa los comandos de la derecha)

install:   ## Instala dependencias
	pip install -r backend/requirements.txt

dev:       ## Servidor local con recarga automática → http://localhost:8000
	uvicorn app.main:app --reload --app-dir backend

chat:      ## Conversar con el bot en la terminal
	python scripts/chat_cli.py --debug

validate:  ## Revisar content/*.yaml
	python scripts/validate_content.py

test:      ## Pruebas automáticas
	python -m pytest -q backend/tests

ingest:    ## Descargar textos de la biblioteca para el RAG
	python scripts/ingest_bibliography.py

.PHONY: install dev chat validate test ingest
