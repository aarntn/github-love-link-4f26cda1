import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import get_session

_TB_KEYWORD = "batuk lama"


async def _answer_all(phone, answer):
    """Send `answer` 7 times. The 7th call records the last answer and returns the result."""
    r = None
    for _ in range(7):
        r = await handle_message(phone, answer)
    return r


async def test_all_yes_triggers_referral(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _TB_KEYWORD)
    r = await _answer_all(phone, "yes")
    assert "TB" in r or "test" in r.lower()


async def test_all_no_low_risk(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _TB_KEYWORD)
    r = await _answer_all(phone, "no")
    assert "low" in r.lower()


async def test_score_at_threshold_refers(phone, onboard):
    # Q0 has weight=3 which equals the threshold=3; Q1-Q6 all no → total = 3 → referral
    await onboard(phone)
    await handle_message(phone, _TB_KEYWORD)
    await handle_message(phone, "yes")   # Q0 weight=3
    r = None
    for _ in range(6):
        r = await handle_message(phone, "no")   # Q1-Q6 weight=0
    assert "TB" in r or "test" in r.lower()


async def test_ya_counts_as_yes(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _TB_KEYWORD)
    r = await _answer_all(phone, "ya")
    assert "TB" in r or "test" in r.lower()


async def test_progress_indicator_shown(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, _TB_KEYWORD)
    assert "(1/7)" in r


async def test_stage_resets_after_completion(phone, onboard):
    await onboard(phone)
    await handle_message(phone, _TB_KEYWORD)
    await _answer_all(phone, "no")   # completes flow → low risk
    session = get_session(phone)
    assert session.get("stage") == "triage_start"
    assert session.get("tb_question_index") == 0
    assert session.get("tb_answers") == []
