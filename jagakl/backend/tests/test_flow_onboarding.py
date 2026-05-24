import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import get_session


async def test_first_message_returns_welcome(phone):
    r = await handle_message(phone, "hello")
    assert "JagaKL" in r


async def test_language_1_sets_english(phone):
    await handle_message(phone, "hello")
    r = await handle_message(phone, "1")
    assert "citizen" in r.lower() or "IC" in r


async def test_language_2_sets_malay(phone):
    await handle_message(phone, "hello")
    r = await handle_message(phone, "2")
    assert "Warganegara" in r


async def test_language_word_english(phone):
    await handle_message(phone, "hello")
    r = await handle_message(phone, "english")
    assert "citizen" in r.lower() or "IC" in r


async def test_mode_citizen_shows_triage(phone):
    await handle_message(phone, "hello")
    await handle_message(phone, "1")
    r = await handle_message(phone, "1")
    assert "help" in r.lower() or "symptom" in r.lower()


async def test_mode_anonymous_shows_triage(phone):
    await handle_message(phone, "hello")
    await handle_message(phone, "1")
    r = await handle_message(phone, "2")
    assert "help" in r.lower() or "symptom" in r.lower()


async def test_forget_me_wipes_session(phone):
    await handle_message(phone, "hello")
    r = await handle_message(phone, "forget me")
    assert "deleted" in r.lower()
    r2 = await handle_message(phone, "hello")
    assert "JagaKL" in r2


async def test_postcode_captured_from_message(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I live at 50480")
    assert get_session(phone).get("postcode") == "50480"
