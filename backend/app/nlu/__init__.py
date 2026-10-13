"""NLU (nivel medio): convierte texto libre en datos estructurados.

    understand("¿qué es la cop31? soy de mty")
    → NLUResult(intent="definir_termino", confidence=0.6, entities={"term": "cop", "campus": "monterrey"}, faq=None)
"""
from __future__ import annotations

from dataclasses import dataclass, field

from ..content_loader import Content
from .entity_extractor import EntityExtractor
from .intent_classifier import IntentClassifier, best_match


@dataclass
class NLUResult:
    text: str
    intent: str | None = None
    confidence: float = 0.0
    entities: dict[str, str] = field(default_factory=dict)
    faq: str | None = None
    faq_score: float = 0.0
    ranking: list = field(default_factory=list)


class NLU:
    def __init__(self, content: Content):
        self.classifier = IntentClassifier(content.intents)
        self.extractor = EntityExtractor(content.entities, content.glossary)
        self._faq_index = {
            f["id"]: [f["question"], *f.get("variants", [])] for f in content.faq.get("faqs", [])
        }

    def understand(self, text: str) -> NLUResult:
        ranking = self.classifier.rank(text)
        top = ranking[0] if ranking and ranking[0].score >= self.classifier.threshold else None
        faq_id, faq_score = best_match(text, self._faq_index, min_score=0.6)
        return NLUResult(
            text=text,
            intent=top.intent if top else None,
            confidence=top.score if top else 0.0,
            entities=self.extractor.extract(text),
            faq=faq_id,
            faq_score=faq_score,
            ranking=[(r.intent, r.score) for r in ranking[:3]],
        )
