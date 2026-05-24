import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from routers.triage import handle_message
from session import delete_session


async def test_zh_mode_prompt_in_chinese(phone):
    await handle_message(phone, "hello")
    r = await handle_message(phone, "5")
    assert "马来西亚" in r or "公民" in r or "无IC" in r


async def test_zh_triage_prompt_in_chinese(phone):
    await handle_message(phone, "hello")
    await handle_message(phone, "5")
    r = await handle_message(phone, "2")
    assert "发烧" in r or "今天" in r or "帮" in r


async def test_zh_tb_question_in_chinese(phone):
    delete_session(phone)
    await handle_message(phone, "hello")
    await handle_message(phone, "5")
    await handle_message(phone, "2")
    r = await handle_message(phone, "batuk lama")
    assert "咳嗽" in r or "2周" in r


async def test_zh_phq_question_in_chinese(phone):
    delete_session(phone)
    await handle_message(phone, "hello")
    await handle_message(phone, "5")
    await handle_message(phone, "2")
    r = await handle_message(phone, "depressed")
    assert "兴趣" in r or "乐趣" in r


async def test_zh_drug_not_found_in_chinese(phone):
    delete_session(phone)
    await handle_message(phone, "hello")
    await handle_message(phone, "5")
    await handle_message(phone, "2")
    await handle_message(phone, "ubat diabetes")
    r = await handle_message(phone, "Panadol")
    assert "抱歉" in r


async def test_zh_phq_reply_hint_in_chinese(phone):
    delete_session(phone)
    await handle_message(phone, "hello")
    await handle_message(phone, "5")
    await handle_message(phone, "2")
    r = await handle_message(phone, "depressed")
    assert "完全没有" in r
