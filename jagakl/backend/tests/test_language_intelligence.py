import json
from unittest.mock import AsyncMock, patch

from services.lang_detect import LANGUAGE_MODEL, analyze_language


def _model_payload(language, normalized, intent, confidence=0.93):
    return json.dumps(
        {
            "language": language,
            "confidence": confidence,
            "normalized_english": normalized,
            "user_language_name": language,
            "intent": intent,
        }
    )


async def test_language_model_default_is_qwen3():
    assert LANGUAGE_MODEL == "qwen/qwen3-32b"


async def test_malay_indonesian_maps_to_ms_dengue():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = _model_payload(
            "id",
            "I have fever and body aches",
            "dengue",
        )
        result = await analyze_language("saya demam dan badan sakit")

    assert result.language == "ms"
    assert result.intent == "dengue"
    assert "fever" in result.normalized_english.lower()
    assert result.model == "qwen/qwen3-32b"


async def test_tamil_fever_message_parses_structured_json():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = _model_payload(
            "ta",
            "I have had fever for 3 days",
            "dengue",
        )
        result = await analyze_language("\u0b8e\u0ba9\u0b95\u0bcd\u0b95\u0bc1 \u0b95\u0bbe\u0baf\u0bcd\u0b9a\u0bcd\u0b9a\u0bb2\u0bcd")

    assert result.language == "ta"
    assert result.intent == "dengue"
    assert result.confidence > 0.9


async def test_bangla_cough_message_parses_tb_intent():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = _model_payload(
            "bn",
            "I have had cough for more than 2 weeks",
            "tb",
        )
        result = await analyze_language("\u0986\u09ae\u09be\u09b0 \u09a6\u09c1\u0987 \u09b8\u09aa\u09cd\u09a4\u09be\u09b9 \u0995\u09be\u09b6\u09bf")

    assert result.language == "bn"
    assert result.intent == "tb"


async def test_chinese_sad_message_parses_mental_health_intent():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = _model_payload(
            "zh",
            "I feel sad and anxious",
            "mental_health",
        )
        result = await analyze_language("\u6211\u89c9\u5f97\u5f88\u96be\u8fc7\u548c\u7126\u8651")

    assert result.language == "zh"
    assert result.intent == "mental_health"


async def test_manglish_code_switching_routes_to_ms():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = _model_payload(
            "ms",
            "I have fever, can I go to clinic?",
            "dengue",
            confidence=0.88,
        )
        result = await analyze_language("I demam lah, boleh pergi klinik?")

    assert result.language == "ms"
    assert result.intent == "dengue"


async def test_malformed_model_json_uses_local_fallback():
    with patch("services.lang_detect.chat_with_model", new_callable=AsyncMock) as mock:
        mock.return_value = "not json"
        result = await analyze_language("demam panas")

    assert result.language == "ms"
    assert result.intent == "dengue"
    assert result.source == "fallback_malformed"
