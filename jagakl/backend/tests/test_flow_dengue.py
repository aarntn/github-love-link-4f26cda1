import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from unittest.mock import patch, AsyncMock
import pytest
from routers.triage import handle_message
from session import update_session


_HOTSPOT = {
    "postcode": "50480", "is_hotspot": True, "active_cases": 12,
    "locality_name": "Chow Kit", "last_updated": "2026-05-19", "note": "",
}
_NO_HOTSPOT = {
    "postcode": "50480", "is_hotspot": False, "active_cases": 0,
    "locality_name": None, "last_updated": None, "note": "",
}


@pytest.fixture
def hotspot_mock():
    with patch("routers.triage.fetch_hotspot_status", new_callable=AsyncMock) as mock:
        mock.return_value = _HOTSPOT
        yield mock


@pytest.fixture
def no_hotspot_mock():
    with patch("routers.triage.fetch_hotspot_status", new_callable=AsyncMock) as mock:
        mock.return_value = _NO_HOTSPOT
        yield mock


async def test_full_path_hotspot_day3_refers(phone, onboard, hotspot_mock):
    await onboard(phone)
    await handle_message(phone, "demam 50480")
    r = await handle_message(phone, "3")
    assert "NS1" in r or "clinic" in r.lower()


async def test_day1_no_hotspot_watch_and_wait(phone, onboard, no_hotspot_mock):
    await onboard(phone)
    await handle_message(phone, "demam 50480")
    r = await handle_message(phone, "1")
    assert "rest" in r.lower() or "hydrat" in r.lower() or "berehat" in r.lower()


async def test_no_postcode_asks_for_it(phone, onboard, no_hotspot_mock):
    await onboard(phone)
    r = await handle_message(phone, "demam")
    assert "postcode" in r.lower() or "poskod" in r.lower()


async def test_has_postcode_asks_for_day(phone, onboard, no_hotspot_mock):
    await onboard(phone)
    r = await handle_message(phone, "demam 50480")
    assert "day" in r.lower() or "hari" in r.lower()


async def test_day_parsed_from_natural_text(phone, onboard, hotspot_mock):
    await onboard(phone)
    await handle_message(phone, "demam 50480")
    r = await handle_message(phone, "day 3")
    assert "NS1" in r or "clinic" in r.lower()


async def test_warning_signs_escalate(phone, onboard, no_hotspot_mock):
    await onboard(phone)
    await handle_message(phone, "demam 50480")
    # handle_message bypasses the webhook layer that normally populates conversation_history
    update_session(phone, conversation_history=[{"role": "user", "text": "vomiting"}])
    r = await handle_message(phone, "3")
    assert "NS1" in r or "clinic" in r.lower()


async def test_malay_language_referral(phone, hotspot_mock):
    await handle_message(phone, "hello")
    await handle_message(phone, "2")   # Malay
    await handle_message(phone, "2")   # anonymous
    await handle_message(phone, "demam 50480")
    r = await handle_message(phone, "3")
    assert "Amaran" in r or "klinik" in r.lower() or "NS1" in r
