from datetime import datetime, timedelta, timezone

SESSION_TIMEOUT_MINUTES = 30
_sessions: dict[str, dict] = {}


def _default_session(phone: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    return {
        "phone": phone,
        "mode": None,
        "language": "en",
        "stage": "onboarding",
        "postcode": None,
        "conversation_history": [],
        "media_url": None,
        "created_at": now,
        "last_active": now,
        "tb_answers": [],
        "tb_question_index": 0,
        "dengue_day": None,
        "phq_question_index": 0,
        "phq_answers": [],
        "phq_phase": "phq2",
        "refill_notes": [],
        "glucose_log": [],
        "bp_log": [],
    }


def _is_expired(session: dict) -> bool:
    last = datetime.fromisoformat(session["last_active"])
    return datetime.now(timezone.utc).replace(tzinfo=None) - last.replace(tzinfo=None) > timedelta(minutes=SESSION_TIMEOUT_MINUTES)


def _cleanup_expired() -> None:
    expired = [p for p, s in list(_sessions.items()) if _is_expired(s)]
    for p in expired:
        del _sessions[p]


def get_session(phone: str) -> dict:
    _cleanup_expired()
    if phone not in _sessions or _is_expired(_sessions[phone]):
        _sessions[phone] = _default_session(phone)
    _sessions[phone]["last_active"] = datetime.now(timezone.utc).isoformat()
    return _sessions[phone]


def update_session(phone: str, **kwargs) -> dict:
    session = get_session(phone)
    session.update(kwargs)
    session["last_active"] = datetime.now(timezone.utc).isoformat()
    return session


def delete_session(phone: str) -> bool:
    if phone in _sessions:
        del _sessions[phone]
        return True
    return False


def is_new_session(phone: str) -> bool:
    if phone not in _sessions:
        return True
    return _is_expired(_sessions[phone])
