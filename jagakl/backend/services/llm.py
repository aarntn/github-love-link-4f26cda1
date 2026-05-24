import os
from groq import AsyncGroq

_client: AsyncGroq | None = None

DEFAULT_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
LANGUAGE_MODEL = os.getenv("LANGUAGE_MODEL", "llama-3.1-8b-instant")

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


async def chat_with_model(
    messages: list[dict],
    system_prompt: str = "",
    model: str | None = None,
    max_tokens: int = 400,
    response_format: dict | None = None,
) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return _FALLBACK

    try:
        msgs = []
        if system_prompt:
            msgs.append({"role": "system", "content": system_prompt})
        msgs.extend(messages)

        kwargs = {
            "model": model or DEFAULT_MODEL,
            "max_tokens": max_tokens,
            "messages": msgs,
        }
        if response_format:
            kwargs["response_format"] = response_format

        resp = await _get_client().chat.completions.create(**kwargs)
        return resp.choices[0].message.content or _FALLBACK
    except Exception:
        return _FALLBACK


async def chat(messages: list[dict], system_prompt: str = "") -> str:
    return await chat_with_model(
        messages,
        system_prompt=system_prompt,
        model=DEFAULT_MODEL,
        max_tokens=400,
    )
