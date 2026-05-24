import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import update_session

_NCD_KEYWORD = "ubat diabetes"


async def test_first_visit_shows_prompt(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, _NCD_KEYWORD)
    assert "photo" in r.lower() or "medication" in r.lower()
    # First visit should show prompt, not drug card (no dosing info like 🍽)
    assert "🍽" not in r


async def test_return_visit_generic_name(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _NCD_KEYWORD)
    r = await handle_message(phone, "Metformin")
    assert "*Metformin*" in r
    assert "🍽" in r


async def test_return_visit_brand_name(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _NCD_KEYWORD)
    r = await handle_message(phone, "Glucophage")
    assert "*Metformin*" in r


async def test_return_visit_unknown_drug(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _NCD_KEYWORD)
    r = await handle_message(phone, "Panadol")
    assert "don't have info" in r


async def test_return_visit_multiword(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _NCD_KEYWORD)
    r = await handle_message(phone, "take metformin daily")
    assert "*Metformin*" in r


async def test_media_url_ocr_stub(phone, onboard):
    await onboard(phone)
    # Simulate webhook receiving a photo — set media_url directly in session
    update_session(phone, media_url="http://example.com/img.jpg")
    r = await handle_message(phone, _NCD_KEYWORD)
    assert "photo" in r.lower() or "ocr" in r.lower()


async def test_malay_language_prompt(phone, onboard):
    await onboard(phone, lang="2")
    r = await handle_message(phone, _NCD_KEYWORD)
    assert "gambar" in r.lower() or "ubat" in r.lower()
