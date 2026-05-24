import json
import re
from dataclasses import asdict, dataclass

from services.llm import DEFAULT_MODEL, LANGUAGE_MODEL, chat_with_model

VALID_LANGS = {"en", "ms", "ta", "zh", "bn"}
VALID_INTENTS = {
    "dengue",
    "tb",
    "mental_health",
    "medication",
    "vitals",
    "emergency",
    "unknown",
}
LANGUAGE_LABELS = {
    "en": "English",
    "ms": "Bahasa Melayu",
    "ta": "Tamil",
    "zh": "Chinese",
    "bn": "Bangla",
}

_SYSTEM = (
    "You are the language intelligence layer for JagaKL, a care-navigation and "
    "triage-support prototype for Malaysia. Do not diagnose, prescribe, or give "
    "medical advice. Analyze the user's message only for language, literal English "
    "normalization, and routing intent.\n\n"
    "Return JSON only with these fields:\n"
    "- language: one of en, ms, ta, zh, bn. Map Indonesian/Manglish Malay to ms.\n"
    "- confidence: number from 0 to 1.\n"
    "- normalized_english: short literal English version of symptoms or request.\n"
    "- user_language_name: display label for the detected language.\n"
    "- intent: one of dengue, tb, mental_health, medication, vitals, emergency, unknown.\n\n"
    "Intent rules: fever/dengue -> dengue; cough 2+ weeks/night sweats/weight loss "
    "-> tb; sadness/anxiety/stress/self-harm -> mental_health; medicine/refill/drug "
    "questions -> medication; BP/glucose/readings/logs -> vitals; chest pain, stroke "
    "signs, severe bleeding, unconsciousness, severe breathing trouble, or immediate "
    "self-harm -> emergency. If unclear, use unknown."
)


@dataclass
class LanguageAnalysis:
    language: str = "en"
    confidence: float = 0.0
    normalized_english: str = ""
    user_language_name: str = "English"
    intent: str = "unknown"
    model: str = LANGUAGE_MODEL
    source: str = "fallback"

    def to_dict(self) -> dict:
        return asdict(self)


def _clamp_confidence(value: object) -> float:
    try:
        confidence = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, confidence))


def _normalize_language(value: object) -> str:
    lang = str(value or "").strip().lower().replace("_", "-")
    if lang.startswith("id") or lang in {"indonesian", "bahasa indonesia"}:
        return "ms"
    if lang.startswith("zh") or lang in {"chinese", "mandarin", "cn"}:
        return "zh"
    if lang.startswith("ta") or lang == "tamil":
        return "ta"
    if lang.startswith("bn") or lang in {"bangla", "bengali"}:
        return "bn"
    if lang.startswith("ms") or lang in {"malay", "bahasa melayu", "bm"}:
        return "ms"
    if lang.startswith("en") or lang == "english":
        return "en"
    return "en"


def _normalize_intent(value: object) -> str:
    intent = str(value or "").strip().lower().replace("-", "_").replace(" ", "_")
    if intent in {"tb", "tuberculosis"}:
        return "tb"
    if intent in {"mental", "mental_health", "myminda", "mood"}:
        return "mental_health"
    if intent in {"medicine", "medication", "pharmacy", "drug"}:
        return "medication"
    if intent in {"vitals", "vital", "log", "reading", "readings"}:
        return "vitals"
    if intent in {"dengue", "fever"}:
        return "dengue"
    if intent == "emergency":
        return "emergency"
    return "unknown"


def _extract_json(raw: str) -> dict | None:
    text = (raw or "").strip()
    if not text:
        return None

    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        text = fenced.group(1)
    elif not text.startswith("{"):
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start : end + 1]

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def _script_language(text: str) -> str | None:
    if re.search(r"[\u0b80-\u0bff]", text):
        return "ta"
    if re.search(r"[\u0980-\u09ff]", text):
        return "bn"
    if re.search(r"[\u4e00-\u9fff]", text):
        return "zh"
    return None


def _heuristic_language(text: str) -> str:
    scripted = _script_language(text)
    if scripted:
        return scripted
    lower = text.lower()
    if any(kw in lower for kw in ["demam", "ubat", "batuk", "sakit", "sesak", "tolong"]):
        return "ms"
    return "en"


def _heuristic_intent(text: str) -> str:
    lower = text.lower()
    emergency_terms = [
        "chest pain",
        "sakit dada",
        "can't breathe",
        "cant breathe",
        "sesak nafas",
        "stroke",
        "bleeding",
        "unconscious",
        "kill myself",
        "want to die",
        "\u80f8\u75db",
        "\u547c\u5438\u56f0\u96be",
    ]
    tb_terms = [
        "cough 2",
        "cough for 2",
        "chronic cough",
        "night sweats",
        "weight loss",
        "batuk lama",
        "\u54b3\u55fd",
        "\u0995\u09be\u09b6\u09bf",
    ]
    mental_terms = [
        "sad",
        "depressed",
        "anxiety",
        "stress",
        "hopeless",
        "sedih",
        "tertekan",
        "\u96be\u8fc7",
        "\u7126\u8651",
    ]
    medication_terms = ["medication", "medicine", "ubat", "refill", "pharmacy", "drug"]
    vitals_terms = ["glucose", "blood sugar", "bp", "blood pressure", "gula darah"]
    fever_terms = [
        "fever",
        "demam",
        "dengue",
        "\u53d1\u70e7",
        "\u767c\u71d2",
        "\u0b95\u0bbe\u0baf\u0bcd\u0b9a\u0bcd\u0b9a\u0bb2\u0bcd",
        "\u099c\u09cd\u09ac\u09b0",
    ]

    if any(term in lower for term in emergency_terms):
        return "emergency"
    if any(term in lower for term in tb_terms):
        return "tb"
    if any(term in lower for term in mental_terms):
        return "mental_health"
    if any(term in lower for term in medication_terms):
        return "medication"
    if any(term in lower for term in vitals_terms):
        return "vitals"
    if any(term in lower for term in fever_terms):
        return "dengue"
    return "unknown"


def _fallback_analysis(text: str, source: str = "fallback") -> LanguageAnalysis:
    lang = _heuristic_language(text)
    intent = _heuristic_intent(text)
    return LanguageAnalysis(
        language=lang,
        confidence=0.45 if lang != "en" or intent != "unknown" else 0.2,
        normalized_english=text[:400],
        user_language_name=LANGUAGE_LABELS[lang],
        intent=intent,
        source=source,
    )


def _analysis_from_model(
    data: dict,
    original_text: str,
    model: str = LANGUAGE_MODEL,
    source: str = "groq",
) -> LanguageAnalysis:
    lang = _normalize_language(data.get("language"))
    intent = _normalize_intent(data.get("intent"))
    normalized = str(data.get("normalized_english") or "").strip()
    if not normalized:
        normalized = original_text[:400]
    label = str(data.get("user_language_name") or LANGUAGE_LABELS[lang]).strip()
    if not label:
        label = LANGUAGE_LABELS[lang]
    return LanguageAnalysis(
        language=lang,
        confidence=_clamp_confidence(data.get("confidence")),
        normalized_english=normalized[:800],
        user_language_name=label,
        intent=intent,
        model=model,
        source=source,
    )


async def analyze_language(text: str) -> LanguageAnalysis:
    message = (text or "").strip()
    if not message:
        return _fallback_analysis("")

    raw = await chat_with_model(
        [{"role": "user", "content": message[:1200]}],
        system_prompt=_SYSTEM,
        model=LANGUAGE_MODEL,
        max_tokens=300,
        response_format={"type": "json_object"},
    )
    data = _extract_json(raw)
    if not data and LANGUAGE_MODEL != DEFAULT_MODEL:
        raw = await chat_with_model(
            [{"role": "user", "content": message[:1200]}],
            system_prompt=_SYSTEM,
            model=DEFAULT_MODEL,
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        data = _extract_json(raw)
        if data:
            return _analysis_from_model(
                data,
                message,
                model=DEFAULT_MODEL,
                source="groq_fallback",
            )
    if not data:
        return _fallback_analysis(message, source="fallback_malformed")
    return _analysis_from_model(data, message)


async def detect_language(text: str) -> str:
    analysis = await analyze_language(text)
    return analysis.language


def map_to_session_lang(detected: str) -> str:
    return _normalize_language(detected)
