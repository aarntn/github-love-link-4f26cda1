import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import get_session, delete_session


async def test_pharmacy_keyword_triggers_flow(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "refill")
    assert "UMP" in r
    assert "refill date" in r.lower() or "tarikh" in r.lower() or "reminder" in r.lower()


async def test_pharmacy_malay_prompt(phone, onboard):
    await onboard(phone, lang="2")
    r = await handle_message(phone, "ubat habis")
    assert "UMP" in r or "Pos" in r
    assert "tarikh" in r.lower() or "peringatan" in r.lower()


async def test_pharmacy_refill_note_stored(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "refill")
    await handle_message(phone, "Metformin, 15 March")
    s = get_session(phone)
    assert "Metformin, 15 March" in s.get("refill_notes", [])


async def test_pharmacy_stage_resets_after_note(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "refill")
    await handle_message(phone, "Metformin, 15 March")
    s = get_session(phone)
    assert s.get("stage") == "triage_start"


async def test_pharmacy_citizen_mode_shows_mysejahtera(phone, onboard):
    await onboard(phone, mode="1")
    await handle_message(phone, "refill")
    r = await handle_message(phone, "Amlodipine, 20 March")
    assert "mysejahtera" in r.lower()


async def test_pharmacy_anonymous_mode_shows_ngo(phone, onboard):
    await onboard(phone, mode="2")
    await handle_message(phone, "refill")
    r = await handle_message(phone, "Metformin, 15 March")
    assert "Tzu Chi" in r or "MERCY" in r or "MSF" in r or "clinic" in r.lower()
