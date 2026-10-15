# 02 · Guía de edición de contenido (sin programar)

Todo lo que el bot dice vive en la carpeta `content/`. Cada archivo explica su formato en las primeras líneas. Esta guía cubre los cambios más comunes, de más a menos frecuentes.

## Antes de empezar: tres reglas de YAML

1. **Respeta la sangría.** YAML usa espacios (nunca tabuladores) para saber qué va dentro de qué. Copia un bloque existente y cambia solo los valores.
2. **Pon el texto entre comillas** si contiene `:` o `#`. Para textos largos usa `>` y escribe en las líneas siguientes con sangría.
3. **No cambies las claves** (lo que va antes de los dos puntos) ni los `id`. El código las busca por nombre.

```yaml
email: "ceiba@tec.mx"        # ✅ valor entre comillas
email: ceiba@tec.mx # nota   # ✅ también funciona
correo: "ceiba@tec.mx"       # ❌ cambiaste la clave: el bot ya no la encuentra
```

Después de cada cambio:

```bash
python scripts/validate_content.py     # te dice exactamente qué línea corregir
python scripts/chat_cli.py             # pruébalo conversando
```

## Editar desde GitHub, sin instalar nada

1. Abre el archivo en GitHub (por ejemplo `content/contacts.yaml`) y pulsa el lápiz ✏️.
2. Haz el cambio. Abajo elige **«Create a new branch… and start a pull request»**.
3. GitHub corre el validador y las pruebas automáticamente. Si aparece ❌, abre el detalle: dice qué archivo y qué campo corregir.
4. Una persona de `CODEOWNERS` revisa y aprueba. Al unirse a `main`, el cambio se publica en el siguiente despliegue (o al llamar a `/admin/reload`).

---

## 1. Contactos (lo más urgente antes de publicar)

Archivo: `content/contacts.yaml`. Busca `EDITA AQUÍ`.

```yaml
campuses:
  - id: monterrey
    name: "Campus Monterrey"
    secretary: "Secretaría CEIBA Monterrey"     # nombre o cargo
    email: "ceiba.mty@tec.mx"                  # ← aquí llegan las derivaciones por correo
    phone: "+52 81 0000 0000"
    whatsapp: "5281XXXXXXXX"                   # solo dígitos con lada; crea el botón «Escribir por WhatsApp»
    hours: "L a V, 10:00 a 14:00"
```

Si un dato queda en `null`, el bot muestra «Por definir» y ofrece el contacto general de CEIBA.

**Agregar un campus:** copia un bloque completo en `contacts.yaml` y agrega el mismo `id` con sus sinónimos en `content/entities.yaml → campus`. El validador avisa si no coinciden.

## 2. Preguntas frecuentes de la convocatoria

Archivo: `content/faq.yaml`. Monto, fechas, rubros no financiables, «empujón verde» y costo están en `null` porque no se han entregado los datos.

```yaml
  - id: monto
    category: convocatoria
    question: "¿Cuál es el monto del apoyo?"
    variants: ["cuanto dinero dan", "monto", "cuanto financian"]
    answer: >
      Hasta $XX,XXX MXN por iniciativa, entregados en dos ministraciones.
    status: done
    source: "Convocatoria 2026-2027, sección 4"     # obligatorio con status: done
```

**Agregar una pregunta:** copia un bloque, cambia `id`, escribe varias `variants` (cómo la preguntaría un estudiante real) y llena `answer` y `source`. Las primeras 9 preguntas aparecen en el menú «Preguntas frecuentes».

## 3. Biblioteca (agregar un documento)

Archivo: `content/bibliography.yaml`. Copia un bloque completo y llena todos los campos. Los más importantes:

| Campo | Para qué sirve | Consejo |
|---|---|---|
| `level` | Recomendarlo al nivel correcto | `basico` para introducciones, `avanzado` para informes científicos |
| `tags` | Que aparezca en el tema correcto del menú | `fundamentos`, `tratados`, `conferencias`, `ciencia` |
| `programs` | Recomendarlo según el programa de interés | `internacionales`, `semanatec`, `anual` |
| `summary_es` | Texto de la tarjeta | 2 o 3 frases propias, en español |
| `key_facts` | Lo que el bot cita textualmente | Solo datos verificados en la fuente. Una frase por dato |
| `keywords` | Que la búsqueda lo encuentre | Incluye términos en español e inglés |

Después ejecuta `python scripts/ingest_bibliography.py` para descargar su texto completo y agrega una pregunta de prueba en `backend/tests/test_rag.py → GOLDEN`.

**Las entradas `cop31` y `sb64`** se agregaron como sugerencia (`added_by: sugerencia`) porque CEIBA capacita rumbo a ellas. Revisa los enlaces y cambia a `added_by: user`.

## 4. Textos del bot (saludo, tono, mensajes)

Archivo: `content/bot.yaml → messages`. Puedes usar `**negritas**` y enlaces `[texto](https://…)`. Las variables entre llaves (`{bot}`, `{campus}`) se sustituyen solas: no las borres.

## 5. Menú de acciones

Archivo: `content/menus.yaml`. Cada botón necesita `label` (web y Telegram), `short` de **máximo 20 caracteres** (WhatsApp y Messenger) e `intent`. WhatsApp muestra como máximo 10 opciones en una lista.

## 6. Que el bot entienda más frases

Archivo: `content/intents.yaml`. Si el bot no entendió algo, agrega la frase en `examples` de la intención correcta o una palabra clave en `keywords`. Los mensajes no entendidos se guardan en la tabla `unmatched` de la base de datos: revísalos cada mes.

**Reglas de derivación** (cuándo pasar a la secretaría): `content/entities.yaml → handoff_triggers`. Agrega frases como «mi asesora» o «la sala de juntas».

## 7. Evaluación de perfil

Archivo: `content/diagnostic.yaml`. Puedes cambiar preguntas, opciones y retroalimentación. Si cambias un `value` cuando ya hay personas evaluadas, sus respuestas anteriores dejan de coincidir; mejor agrega opciones nuevas.

## 8. Calendario, programas, iniciativas, glosario

`calendar.yaml`, `programs.yaml`, `initiatives.yaml` y `glossary.yaml` siguen el mismo patrón. **Mantén el contenido igual que en el sitio web** (`src/data/content.js` del repositorio del sitio) para que ambos digan lo mismo.

---

## Publicar los cambios sin reiniciar

```bash
curl -X POST https://TU-SERVIDOR/admin/reload -H "Authorization: Bearer $ADMIN_TOKEN"
```

Si un YAML tiene un error, la recarga se rechaza y el bot sigue funcionando con la versión anterior.

## Marcas de estado

Igual que en el sitio web: `done` (realizado, con evidencia), `meta` (aspiración), `prop` (propuesta por validar), `pending` (falta el dato). El bot muestra «texto por validar» en lo marcado como `prop` y nunca presenta una meta como un logro.
