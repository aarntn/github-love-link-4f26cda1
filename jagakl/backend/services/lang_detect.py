from services.llm import chat

_SYSTEM = (
    "Identify the language of a WhatsApp message. "
    "Reply with ONLY one BCP-47 tag from: en ms ta zh bn. "
    "Indonesian → ms. If unsure → en. No other output."
)

_VALID = {"en", "ms", "ta", "zh", "bn"}


async def detect_language(text: str) -> str:
    try:
        tag = await chat([{"role": "user", "content": text[:200]}], system_prompt=_SYSTEM)
        tag = tag.strip().lower()
        if tag in _VALID:
            return tag
    except Exception:
        pass
    return "en"


def map_to_session_lang(detected: str) -> str:
    mapping = {
        "en": "en",
        "ms": "ms",
        "ta": "ta",
        "zh": "zh",
        "bn": "bn",
        "id": "ms",
    }
    return mapping.get(detected, "en")
