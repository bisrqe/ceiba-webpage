"""Normalización de texto: minúsculas, sin acentos, sin signos. Base de todo el NLU."""
from __future__ import annotations

import re
import unicodedata

# Palabras vacías en español: no ayudan a distinguir intenciones.
STOPWORDS = {
    "a", "al", "algo", "con", "de", "del", "el", "en", "es", "esta", "este", "esto", "la", "las",
    "le", "lo", "los", "me", "mi", "mis", "o", "para", "por", "que", "se", "si", "su", "sus",
    "te", "tu", "un", "una", "uno", "y", "ya", "yo", "como", "cual", "hay", "the", "of", "and",
    "quiero", "puedo", "sobre", "favor", "porfa", "hola",
    # palabras de pregunta: indican que es pregunta, no de qué trata
    "quien", "quienes", "donde", "cual", "cuales", "cuanto", "cuantos",
}

_PUNCT = re.compile(r"[^\w\s.\-]", re.UNICODE)
_SPACES = re.compile(r"\s+")


def strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch))


def normalize(text: str) -> str:
    """'¿Qué es la CMNUCC?' → 'que es la cmnucc'"""
    text = strip_accents((text or "").lower())
    text = text.replace("¿", " ").replace("¡", " ")
    text = _PUNCT.sub(" ", text)
    text = re.sub(r"(?<!\d)\.(?!\d)", " ", text)     # conserva 1.5 pero quita puntos finales
    return _SPACES.sub(" ", text).strip()


def tokens(text: str, drop_stopwords: bool = True) -> list[str]:
    def keep(word: str) -> bool:
        if word.replace(".", "").isdigit():          # números como 1.5 o 2030 sí cuentan
            return True
        return len(word) > 1 and not (drop_stopwords and word in STOPWORDS)

    return [w for w in normalize(text).split() if keep(w)]


def contains_phrase(norm_text: str, phrase: str) -> bool:
    """¿Aparece la frase completa (respetando límites de palabra)? Ambos ya normalizados."""
    phrase = normalize(phrase)
    if not phrase:
        return False
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", norm_text) is not None
