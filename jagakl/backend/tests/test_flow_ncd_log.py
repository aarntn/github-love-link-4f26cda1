import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import get_session, delete_session


def test_default_session_has_log_keys():
    phone = "+60109998001"
    delete_session(phone)
    s = get_session(phone)
    assert s["glucose_log"] == []
    assert s["bp_log"] == []
    delete_session(phone)


async def test_log_keyword_triggers_flow(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "glucose 7.2")
    assert "✅" in r
    assert "7.2" in r


async def test_glucose_in_range(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "glucose 5.5")
    assert "✓" in r


async def test_glucose_above_target(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "glucose 9.1")
    assert "↑" in r


async def test_glucose_hypoglycaemia(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "glucose 3.2")
    assert "⚠️" in r or "Hypoglycaemia" in r or "Hipoglisemia" in r


async def test_bp_logged(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "BP 148/92")
    assert "148" in r
    assert "92" in r
    s = get_session(phone)
    assert len(s["bp_log"]) == 1
    assert s["bp_log"][0]["sys"] == 148


async def test_both_in_one_message(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "glucose 7.2 BP 130/85")
    assert "7.2" in r
    assert "130" in r
    s = get_session(phone)
    assert len(s["glucose_log"]) == 1
    assert len(s["bp_log"]) == 1


async def test_invalid_reprompts(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "daily log")   # no reading → ask
    r = await handle_message(phone, "maybe")   # invalid → re-prompt
    assert "glucose" in r.lower() or "BP" in r or "bacaan" in r.lower()


async def test_weekly_summary_on_seventh(phone, onboard):
    await onboard(phone)
    for i in range(1, 7):
        await handle_message(phone, f"glucose 6.{i}")
    r = await handle_message(phone, "glucose 6.5")
    assert "Weekly Summary" in r or "Ringkasan" in r
