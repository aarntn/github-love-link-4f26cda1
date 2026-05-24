import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from session import delete_session
from routers.triage import handle_message


@pytest.fixture
def phone():
    number = "+60100000001"
    delete_session(number)
    yield number
    delete_session(number)


@pytest.fixture
def onboard():
    async def _onboard(phone, lang="1", mode="2"):
        await handle_message(phone, "hello")
        await handle_message(phone, lang)
        await handle_message(phone, mode)
    return _onboard
