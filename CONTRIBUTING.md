# Cómo contribuir a CEIBA bot

Este repositorio lo mantienen varias personas con perfiles distintos. Estas reglas evitan que un cambio rompa el trabajo de otra persona.

## Quién edita qué

| Perfil | Carpeta | Requiere programar |
|---|---|---|
| Contenido (coordinación, comunicación) | `content/` | No |
| Conectividad (canales, avisos) | `.env` del servidor, `docs/03_CONECTIVIDAD.md` | Poco |
| Desarrollo | `backend/`, `frontend/`, `scripts/` | Sí |

## Flujo

1. Crea una rama desde `main`: `contenido/monto-convocatoria`, `canal/whatsapp`, `fix/fechas-calendario`.
2. Haz el cambio y ejecuta:
   ```bash
   python scripts/validate_content.py
   python -m pytest -q backend/tests
   ```
3. Abre un Pull Request y llena la plantilla. GitHub corre las mismas revisiones.
4. Espera la aprobación de quien aparece en `.github/CODEOWNERS` para esa carpeta.

## Reglas

- **Ningún dato sin fuente.** Fechas, montos y reglas llevan `source` (FAQ) o están en `key_facts` verificados (biblioteca).
- **Ningún secreto en el repositorio.** Tokens y contraseñas van en `.env` o en el panel del hosting.
- **Textos en YAML, lógica en Python.** Si escribes un párrafo dentro de un `.py`, muévelo a `content/`.
- **Cada cambio de código lleva prueba.** Agrega un caso en `backend/tests/`.
- **Comentarios en español** y nombres de variables en inglés, como el resto del código.
- **Marca con `EDITA AQUÍ`** cualquier dato nuevo que otra persona deba completar.
