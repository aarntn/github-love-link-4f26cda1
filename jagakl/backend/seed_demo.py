"""
seed_demo.py — Populate Supabase triage_cases with realistic demo rows.

Usage:
    cd jagakl/backend
    python seed_demo.py

Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env (or environment).
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

import httpx

DEMO_CASES = [
    {
        "channel": "whatsapp",
        "chief_complaint": "Demam 4 hari, sakit sendi teruk",
        "flow": "dengue",
        "language": "ms",
        "mode": "anonymous",
        "postcode": "50480",
        "recommended_clinic": "MERCY Malaysia Clinic",
        "red_flag": True,
        "triage_summary": "Dengue day-4 fever in postcode 50480; 12 active cases; hotspot=True; warning_signs=True",
        "urgency": "urgent",
        "is_dengue_hotspot": True,
        "status": "new",
    },
    {
        "channel": "web",
        "chief_complaint": "Batuk 3 minggu, turun berat badan",
        "flow": "tb",
        "language": "en",
        "mode": "anonymous",
        "postcode": "50460",
        "recommended_clinic": "MSF (Médecins Sans Frontières) Clinic",
        "red_flag": False,
        "triage_summary": "TB screen score 4/3 — referred for testing",
        "urgency": "urgent",
        "status": "new",
    },
    {
        "channel": "whatsapp",
        "chief_complaint": "Feeling very sad and hopeless, can't sleep",
        "flow": "general",
        "language": "en",
        "mode": "anonymous",
        "postcode": None,
        "recommended_clinic": "Befrienders KL / Talian Kasih",
        "red_flag": True,
        "triage_summary": "PHQ-9 Q9 crisis (suicidal ideation). PHQ-9 total=22/27",
        "urgency": "emergency",
        "status": "new",
    },
    {
        "channel": "whatsapp",
        "chief_complaint": "Ubat metformin habis, nak isi semula",
        "flow": "ncd",
        "language": "ms",
        "mode": "anonymous",
        "postcode": "50350",
        "recommended_clinic": "Tzu Chi Free Clinic",
        "red_flag": False,
        "triage_summary": "Pharmacy refill: Metformin 500mg, habis 30 Mac",
        "urgency": "routine",
        "status": "reviewed",
    },
    {
        "channel": "web",
        "chief_complaint": "Fever and joint pain for 2 days",
        "flow": "dengue",
        "language": "en",
        "mode": "citizen",
        "postcode": "50490",
        "recommended_clinic": "Klinik Kesihatan (MySejahtera)",
        "red_flag": True,
        "triage_summary": "Dengue day-2 fever in postcode 50490; 8 active cases; hotspot=True; warning_signs=False",
        "urgency": "urgent",
        "is_dengue_hotspot": True,
        "status": "escalated",
    },
    {
        "channel": "whatsapp",
        "chief_complaint": "Cough for many weeks, night sweats",
        "flow": "tb",
        "language": "bn",
        "mode": "anonymous",
        "postcode": "50200",
        "recommended_clinic": "MSF (Médecins Sans Frontières) Clinic",
        "red_flag": False,
        "triage_summary": "TB screen score 5/3 — referred for testing",
        "urgency": "urgent",
        "status": "new",
    },
    {
        "channel": "whatsapp",
        "chief_complaint": "我感到很沮丧，很焦虑",
        "flow": "general",
        "language": "zh",
        "mode": "anonymous",
        "postcode": None,
        "recommended_clinic": "MERCY Malaysia Clinic",
        "red_flag": False,
        "triage_summary": "PHQ-9 moderate (14/27) — mental health referral",
        "urgency": "routine",
        "status": "new",
    },
    {
        "channel": "web",
        "chief_complaint": "Blood pressure reading 155/95, taking amlodipine",
        "flow": "ncd",
        "language": "en",
        "mode": "anonymous",
        "postcode": "50470",
        "recommended_clinic": "Tzu Chi Free Clinic",
        "red_flag": False,
        "triage_summary": "Pharmacy refill: Amlodipine 5mg — NCD chronic follow-up",
        "urgency": "routine",
        "status": "reviewed",
    },
]


async def seed() -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    if not url or not key:
        print("❌  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env")
        return

    print(f"Seeding {len(DEMO_CASES)} demo cases to {url}...")

    async with httpx.AsyncClient(timeout=10.0) as client:
        for i, row in enumerate(DEMO_CASES, 1):
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
            status = "✅" if resp.status_code in (200, 201) else f"❌ {resp.status_code}"
            print(f"  [{i}/{len(DEMO_CASES)}] {status}  {row['flow']:8}  {row['chief_complaint'][:50]}")
            if resp.status_code not in (200, 201):
                print(f"       Error: {resp.text[:200]}")

    print("\nDone. Open the Klinika dashboard to see the demo cases.")


if __name__ == "__main__":
    asyncio.run(seed())
