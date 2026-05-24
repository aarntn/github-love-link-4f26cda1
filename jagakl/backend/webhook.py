import logging
from fastapi import APIRouter, Form, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from twilio.twiml.messaging_response import MessagingResponse

from session import get_session, update_session, delete_session, _sessions
from routers.redflag import check_redflag
from routers.referral import format_clinic_card, nearest_clinics
from routers.triage import handle_message
from services.location import is_plausible_kl_coordinate, parse_coordinate
from services.stt import transcribe_voice_note

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
    Latitude: str = Form(default=None),
    Longitude: str = Form(default=None),
    Address: str = Form(default=None),
    Label: str = Form(default=None),
):
    twiml = MessagingResponse()
    try:
        phone = From.replace("whatsapp:", "").strip()
        session = get_session(phone)
        lat = parse_coordinate(Latitude)
        lng = parse_coordinate(Longitude)
        if is_plausible_kl_coordinate(lat, lng):
            update_session(
                phone,
                location_lat=lat,
                location_lng=lng,
                location_label=Label,
                location_address=Address,
            )
            if not Body:
                Body = f"Shared location: {Label or Address or f'{lat},{lng}'}"
            session = get_session(phone)

        if NumMedia > 0 and MediaUrl0:
            content_type = request.headers.get("MediaContentType0", "")
            if "audio" in content_type:
                try:
                    transcribed = await transcribe_voice_note(MediaUrl0)
                    if transcribed:
                        Body = transcribed
                        logger.info("Voice note transcribed for %s: %r", phone, transcribed[:80])
                except Exception as exc:
                    logger.error("STT failed: %s", exc)
                    twiml.message(
                        "Sorry, I could not understand the voice note. "
                        "Please try typing your question.\n"
                        "/ Maaf, saya tidak dapat memahami pesanan suara. Sila taip soalan anda."
                    )
                    return Response(content=str(twiml), media_type="application/xml")
            else:
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

        reply = await handle_message(phone, Body)

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
    latitude: float | None = None
    longitude: float | None = None
    location_label: str | None = None
    location_address: str | None = None


class NearestClinicRequest(BaseModel):
    latitude: float
    longitude: float
    condition: str = "general"
    language: str = "en"
    limit: int = 3


@router.post("/chat")
async def web_chat(body: ChatRequest):
    """
    Lovable web UI calls this instead of Twilio.
    Same triage logic — just returns JSON instead of TwiML.
    """
    session = get_session(body.phone)
    if is_plausible_kl_coordinate(body.latitude, body.longitude):
        update_session(
            body.phone,
            location_lat=body.latitude,
            location_lng=body.longitude,
            location_label=body.location_label,
            location_address=body.location_address,
        )
        session = get_session(body.phone)

    flag = check_redflag(body.message, language=session.get("language", "en"))
    if flag and flag["triggered"]:
        return JSONResponse(content={"reply": flag["reply"], "flag": flag["category"]})

    history = session.get("conversation_history", [])
    history.append({"role": "user", "content": body.message})
    update_session(body.phone, conversation_history=history[-20:])

    reply = await handle_message(body.phone, body.message)

    # Store assistant reply so LLM has full context next turn
    history = get_session(body.phone).get("conversation_history", [])
    history.append({"role": "assistant", "content": reply})
    update_session(body.phone, conversation_history=history[-20:])

    return JSONResponse(content={"reply": reply, "flag": None})


@router.post("/clinics/nearest")
async def nearest_clinics_endpoint(body: NearestClinicRequest):
    if not is_plausible_kl_coordinate(body.latitude, body.longitude):
        return JSONResponse(
            status_code=400,
            content={"detail": "Latitude/longitude must be within the KL service area."},
        )

    clinics = nearest_clinics(
        lat=body.latitude,
        lng=body.longitude,
        condition=body.condition,
        limit=max(1, min(body.limit, 10)),
    )
    return JSONResponse(
        content={
            "clinics": clinics,
            "cards": [format_clinic_card(c, body.language) for c in clinics],
        }
    )


# ── Dashboard endpoints ──────────────────────────────────────────────────────

def _session_summary(session: dict) -> dict:
    return {
        "phone": session.get("phone"),
        "language": session.get("language"),
        "mode": session.get("mode"),
        "stage": session.get("stage"),
        "postcode": session.get("postcode"),
        "location_lat": session.get("location_lat"),
        "location_lng": session.get("location_lng"),
        "location_label": session.get("location_label"),
        "location_address": session.get("location_address"),
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
