from unittest.mock import AsyncMock, patch

from routers.triage import handle_message
from services.lang_detect import LanguageAnalysis


def _analysis(language, normalized, intent, confidence=0.95):
    return LanguageAnalysis(
        language=language,
        confidence=confidence,
        normalized_english=normalized,
        user_language_name=language,
        intent=intent,
        source="test",
    )


async def test_tamil_fever_routes_to_dengue_flow(phone, onboard):
    await onboard(phone, lang="3")

    with patch("routers.triage.analyze_language", new_callable=AsyncMock) as mock:
        mock.return_value = _analysis(
            "ta",
            "I have fever for 3 days",
            "dengue",
        )
        reply = await handle_message(phone, "\u0b95\u0bbe\u0baf\u0bcd\u0b9a\u0bcd\u0b9a\u0bb2\u0bcd")

    assert "postcode" in reply.lower() or "poskod" in reply.lower()


async def test_bangla_cough_routes_to_tb_flow(phone, onboard):
    await onboard(phone, lang="4")

    with patch("routers.triage.analyze_language", new_callable=AsyncMock) as mock:
        mock.return_value = _analysis(
            "bn",
            "I have had cough for more than 2 weeks",
            "tb",
        )
        reply = await handle_message(phone, "\u09a6\u09c1\u0987 \u09b8\u09aa\u09cd\u09a4\u09be\u09b9 \u0995\u09be\u09b6\u09bf")

    assert "(1/7)" in reply


async def test_chinese_sad_message_routes_to_myminda_flow(phone, onboard):
    await onboard(phone, lang="5")

    with patch("routers.triage.analyze_language", new_callable=AsyncMock) as mock:
        mock.return_value = _analysis(
            "zh",
            "I feel sad and anxious",
            "mental_health",
        )
        reply = await handle_message(phone, "\u6211\u89c9\u5f97\u5f88\u96be\u8fc7")

    assert "(1/2)" in reply


async def test_malay_chest_pain_normalized_text_escalates_to_999(phone, onboard):
    await onboard(phone, lang="2")

    with patch("routers.triage.analyze_language", new_callable=AsyncMock) as mock:
        mock.return_value = _analysis(
            "ms",
            "I have chest pain and sweating",
            "emergency",
        )
        reply = await handle_message(phone, "dada rasa berat")

    assert "999" in reply


async def test_translated_emergency_text_escalates_to_999(phone, onboard):
    await onboard(phone, lang="3")

    with patch("routers.triage.analyze_language", new_callable=AsyncMock) as mock:
        mock.return_value = _analysis(
            "ta",
            "I have severe difficulty breathing",
            "emergency",
        )
        reply = await handle_message(phone, "\u0bae\u0bc2\u0b9a\u0bcd\u0b9a\u0bc1 \u0bae\u0bc1\u0b9f\u0bcd\u0b9f\u0bc1\u0ba4\u0bc1")

    assert "999" in reply
