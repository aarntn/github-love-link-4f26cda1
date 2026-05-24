import logging
import os
import tempfile

import httpx

logger = logging.getLogger(__name__)

_model = None
_MODEL_SIZE = os.getenv("WHISPER_MODEL", "base")


def _get_model():
    global _model
    if _model is None:
        from faster_whisper import WhisperModel  # lazy — only load when first voice note arrives
        logger.info("Loading Whisper model '%s' on CPU (first call only)…", _MODEL_SIZE)
        _model = WhisperModel(_MODEL_SIZE, device="cpu", compute_type="int8")
    return _model


async def transcribe_voice_note(media_url: str) -> str:
    """Download a Twilio voice-note OGG and return the transcribed text."""
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    auth = (account_sid, auth_token) if account_sid and auth_token else None

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.get(media_url, auth=auth, follow_redirects=True)
        resp.raise_for_status()

    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=False) as tmp:
        tmp.write(resp.content)
        tmp_path = tmp.name

    try:
        model = _get_model()
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = " ".join(seg.text for seg in segments).strip()
        logger.info("STT detected language=%s text=%r", info.language, text[:80])
        return text
    finally:
        os.unlink(tmp_path)
