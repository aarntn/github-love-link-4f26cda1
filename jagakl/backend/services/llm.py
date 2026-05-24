import os
import anthropic

_client: anthropic.AsyncAnthropic | None = None

_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")

_FALLBACK = (
    "I'm not sure I understand. Could you describe your symptoms?\n\n"
    "Examples: fever, cough, chest pain, medication question.\n\n"
    "In an emergency, call 999."
)


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        )
    return _client


async def chat(messages: list[dict], system_prompt: str = "") -> str:
    if not os.getenv("ANTHROPIC_API_KEY"):
        return _FALLBACK

    try:
        resp = await _get_client().messages.create(
            model=_MODEL,
            max_tokens=400,
            system=system_prompt or anthropic.NOT_GIVEN,
            messages=messages,
        )
        return resp.content[0].text
    except Exception:
        return _FALLBACK
