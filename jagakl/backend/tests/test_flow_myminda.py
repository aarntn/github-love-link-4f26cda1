import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from pathlib import Path

from session import get_session, delete_session, update_session
from routers.triage import handle_message

_PHQ_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "phq_questions.json"


# ── Task 1: data file ─────────────────────────────────────────────────────────

def test_phq_data_file_loads():
    assert _PHQ_DATA_PATH.exists(), f"Missing: {_PHQ_DATA_PATH}"
    with open(_PHQ_DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    assert "phq2_threshold" in data
    assert "phq9_bands" in data
    assert "questions" in data
    questions = data["questions"]
    assert len(questions) == 9
    for q in questions:
        assert "question_en" in q, f"Missing question_en in {q['id']}"
        assert "question_ms" in q, f"Missing question_ms in {q['id']}"
        assert q.get("answer_type") == "likert_0_3"
    assert questions[8]["crisis_if_nonzero"] is True


# ── Task 2: session keys ──────────────────────────────────────────────────────

def test_default_session_has_myminda_keys():
    phone = "+60109999001"
    delete_session(phone)
    s = get_session(phone)
    assert s["phq_question_index"] == 0
    assert s["phq_answers"] == []
    assert s["phq_phase"] == "phq2"
    delete_session(phone)


# ── Task 3: keyword routing ───────────────────────────────────────────────────

async def test_myminda_keyword_en_triggers_flow(phone, onboard):
    await onboard(phone)
    r = await handle_message(phone, "I feel so depressed lately")
    assert "(1/2)" in r
    assert "interest" in r.lower() or "pleasure" in r.lower()


async def test_myminda_keyword_ms_triggers_flow(phone, onboard):
    await onboard(phone, lang="2")
    r = await handle_message(phone, "saya rasa sangat sedih")
    assert "(1/2)" in r
    assert "minat" in r.lower() or "keseronokan" in r.lower()


# ── Task 4: flow logic ────────────────────────────────────────────────────────

async def test_phq2_low_score_gives_selfcare(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")  # trigger → shows Q1
    await handle_message(phone, "0")                # Q1 = 0
    r = await handle_message(phone, "0")            # Q2 = 0, total=0 → self-care
    assert "self-care" in r.lower() or "doctor" in r.lower() or "worsens" in r.lower()
    assert "(1/9)" not in r  # must NOT escalate to PHQ-9


async def test_phq2_high_score_escalates_to_phq9(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")  # trigger → shows Q1
    await handle_message(phone, "2")                # Q1 = 2
    r = await handle_message(phone, "2")            # Q2 = 2, total=4 ≥ 3 → PHQ-9
    assert "(1/9)" in r
    assert "interest" in r.lower() or "pleasure" in r.lower()


async def test_phq9_mild_result(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")
    await handle_message(phone, "2")  # PHQ-2 Q1 = 2
    await handle_message(phone, "2")  # PHQ-2 Q2 = 2 → escalate to PHQ-9
    r = None
    for _ in range(8):
        r = await handle_message(phone, "1")  # Q1–Q8 = 1
    r = await handle_message(phone, "0")      # Q9 = 0 (no crisis), total = 8 (mild)
    assert r is not None
    assert "mild" in r.lower() or "self-care" in r.lower() or "doctor" in r.lower()
    assert "ACTS" not in r
    assert "MSF" not in r


async def test_phq9_moderate_refers_to_clinic(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")
    await handle_message(phone, "2")  # PHQ-2 Q1 = 2
    await handle_message(phone, "2")  # PHQ-2 Q2 = 2 → escalate to PHQ-9
    r = None
    for _ in range(8):
        r = await handle_message(phone, "2")  # Q1–Q8 = 2
    r = await handle_message(phone, "0")      # Q9 = 0 (no crisis), total = 16 (moderately_severe)
    assert r is not None
    assert "ACTS" in r or "MSF" in r or "clinic" in r.lower() or "klinik" in r.lower()


async def test_phq9_severe_triggers_crisis(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")
    await handle_message(phone, "2")  # PHQ-2 Q1 = 2
    await handle_message(phone, "2")  # PHQ-2 Q2 = 2 → escalate to PHQ-9
    r = None
    for _ in range(9):
        r = await handle_message(phone, "3")  # all 9 answers = 3, total = 27 (severe)
    assert r is not None
    assert "Befrienders" in r or "03-7627 2929" in r
    assert "15999" in r or "Talian Kasih" in r


async def test_q9_nonzero_triggers_crisis_regardless_of_total(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")
    await handle_message(phone, "2")  # PHQ-2 Q1 = 2
    await handle_message(phone, "2")  # PHQ-2 Q2 = 2 → escalate to PHQ-9
    r = None
    for _ in range(8):
        r = await handle_message(phone, "0")  # Q1–Q8 all 0
    r = await handle_message(phone, "1")      # Q9 = 1 (non-zero), total = 1 = "minimal" normally
    assert r is not None
    assert "Befrienders" in r or "03-7627 2929" in r
    assert "15999" in r or "Talian Kasih" in r


async def test_invalid_answer_reprompts(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")  # Q1 shown
    r = await handle_message(phone, "maybe")        # unrecognised → re-prompt same Q
    assert "(1/2)" in r
    assert "0 / 1 / 2 / 3" in r


async def test_stage_resets_after_phq2_completion(phone, onboard):
    await onboard(phone)
    await handle_message(phone, "I feel hopeless")
    await handle_message(phone, "0")  # Q1
    await handle_message(phone, "0")  # Q2, total=0 → done
    s = get_session(phone)
    assert s["stage"] == "triage_start"
    assert s["phq_question_index"] == 0
    assert s["phq_answers"] == []
    assert s["phq_phase"] == "phq2"


async def test_triage_prompt_mentions_mental_health(phone):
    delete_session(phone)
    await handle_message(phone, "hello")
    await handle_message(phone, "1")   # English
    r = await handle_message(phone, "2")  # anonymous → triage prompt
    assert "mood" in r.lower() or "mental" in r.lower() or "stress" in r.lower() or "sad" in r.lower()
