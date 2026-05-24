import logging
from fastapi import APIRouter, Form, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse

from session import get_session, update_session, delete_session, _sessions
from routers.redflag import check_redflag
from routers.triage import handle_message

router = APIRouter()
logger = logging.getLogger(__name__)


# ── WhatsApp (Twilio) ────────────────────────────────────────────────────────

@router.post("/webhook")
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(default=""),
    NumMedia: int = Form(default=0),
    MediaUrl0: str = Form(default=None),
):
    twiml = MessagingResponse()
    try:
        phone = From.replace("whatsapp:", "").strip()
        session = get_session(phone)

        if NumMedia > 0 and MediaUrl0:
            update_session(phone, media_url=MediaUrl0)

        # Layer 1: red-flag check — always runs before triage logic
        flag = check_redflag(Body, language=session.get("language", "en"))
        if flag and flag["triggered"]:
            twiml.message(flag["reply"])
            return Response(content=str(twiml), media_type="application/xml")

        # Append to conversation history (keep last 20 turns)
        history = session.get("conversation_history", [])
        history.append({"role": "user", "content": Body})
        update_session(phone, conversation_history=history[-20:])

        reply = await handle_message(phone, Body, channel="whatsapp")

        # Store assistant reply so LLM has full context next turn
        history = get_session(phone).get("conversation_history", [])
        history.append({"role": "assistant", "content": reply})
        update_session(phone, conversation_history=history[-20:])

        twiml.message(reply)

    except Exception as exc:
        logger.error("Webhook unhandled error: %s", exc, exc_info=True)
        twiml.message(
            "Sorry, a technical issue occurred. Please try again.\n"
            "In an emergency, call 999."
        )

    return Response(content=str(twiml), media_type="application/xml")


# ── Lovable web UI — chat endpoint ───────────────────────────────────────────

class ChatRequest(BaseModel):
    phone: str
    message: str


@router.post("/chat")
async def web_chat(body: ChatRequest):
    """
    Lovable web UI calls this instead of Twilio.
    Same triage logic — just returns JSON instead of TwiML.
    """
    session = get_session(body.phone)

    flag = check_redflag(body.message, language=session.get("language", "en"))
    if flag and flag["triggered"]:
        return JSONResponse(content={"reply": flag["reply"], "flag": flag["category"]})

    history = session.get("conversation_history", [])
    history.append({"role": "user", "content": body.message})
    update_session(body.phone, conversation_history=history[-20:])

    reply = await handle_message(body.phone, body.message, channel="web")

    # Store assistant reply so LLM has full context next turn
    history = get_session(body.phone).get("conversation_history", [])
    history.append({"role": "assistant", "content": reply})
    update_session(body.phone, conversation_history=history[-20:])

    return JSONResponse(content={"reply": reply, "flag": None})


# ── Dashboard endpoints ──────────────────────────────────────────────────────

def _session_summary(session: dict) -> dict:
    return {
        "phone": session.get("phone"),
        "language": session.get("language"),
        "mode": session.get("mode"),
        "stage": session.get("stage"),
        "postcode": session.get("postcode"),
        "last_active": session.get("last_active"),
        "tb_answers": session.get("tb_answers", []),
        "phq_answers": session.get("phq_answers", []),
        "glucose_log": session.get("glucose_log", []),
        "bp_log": session.get("bp_log", []),
        "refill_notes": session.get("refill_notes", []),
        "conversation_history": session.get("conversation_history", []),
    }


@router.get("/sessions")
async def list_sessions():
    """Lovable dashboard — list all active sessions."""
    return JSONResponse(content=[_session_summary(s) for s in _sessions.values()])


@router.get("/session/{phone}")
async def get_session_data(phone: str):
    """Lovable dashboard — single patient session."""
    return JSONResponse(content=_session_summary(get_session(phone)))


@router.delete("/session/{phone}")
async def delete_session_data(phone: str):
    """Lovable dashboard — delete/reset a specific session (demo utility)."""
    removed = delete_session(phone)
    return JSONResponse(content={"deleted": removed, "phone": phone})


@router.post("/sessions/reset-all")
async def reset_all_sessions():
    """Lovable dashboard — wipe all in-memory sessions (demo reset)."""
    count = len(_sessions)
    _sessions.clear()
    return JSONResponse(content={"cleared": count})
