import os
from groq import AsyncGroq

_client: AsyncGroq | None = None

_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

_FALLBACK = (
    "I'm not sure I understand. Could you describe your symptoms?\n\n"
    "Examples: fever, cough, chest pain, medication question.\n\n"
    "In an emergency, call 999."
)


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY", ""))
    return _client


async def chat(messages: list[dict], system_prompt: str = "") -> str:
    if not os.getenv("GROQ_API_KEY"):
        return _FALLBACK

    try:
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        resp = await _get_client().chat.completions.create(
            model=_MODEL,
            max_tokens=400,
            messages=msgs,
        )
        return resp.choices[0].message.content or _FALLBACK
    except Exception:
        return _FALLBACK
