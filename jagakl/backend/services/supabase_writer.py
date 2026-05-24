"""
Fire-and-forget Supabase writer for triage case completions.
Uses httpx (already in requirements) to POST to Supabase REST API.
Silently skips if SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.
"""

import logging
import os

import httpx

logger = logging.getLogger(__name__)


async def write_triage_case(
    *,
    channel: str = "whatsapp",
    chief_complaint: str,
    flow: str,
    language: str,
    mode: str,
    postcode: str | None,
    recommended_clinic: str,
    red_flag: bool = False,
    triage_summary: str,
    urgency: str,
    is_dengue_hotspot: bool | None = None,
) -> None:
    """
    Write a completed triage case row to the Supabase `triage_cases` table.

    All writes are fire-and-forget — exceptions are logged but never propagate,
    so a Supabase outage or misconfiguration never interrupts the chat flow.
    """
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        return  # Not configured — skip silently

    row: dict = {
        "channel": channel,
        "chief_complaint": chief_complaint[:500],
        "flow": flow,
        "language": language,
        "mode": mode,
        "postcode": postcode,
        "recommended_clinic": recommended_clinic[:200],
        "red_flag": red_flag,
        "triage_summary": triage_summary[:1000],
        "urgency": urgency,
        "status": "new",
    }
    if is_dengue_hotspot is not None:
        row["is_dengue_hotspot"] = is_dengue_hotspot

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{url}/rest/v1/triage_cases",
                json=row,
                headers={
                    "apikey": key,
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
            )
            if resp.status_code not in (200, 201):
                logger.warning(
                    "Supabase write returned %s: %s", resp.status_code, resp.text[:200]
                )
    except Exception as exc:
        logger.warning("Supabase write_triage_case failed: %s", exc)
