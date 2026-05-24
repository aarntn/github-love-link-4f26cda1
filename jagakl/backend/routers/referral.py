import json
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "ngo_clinics.json"
_clinics_data: dict | None = None


def _load_clinics() -> dict:
    global _clinics_data
    if _clinics_data is None:
        with open(_DATA_PATH, encoding="utf-8") as f:
            _clinics_data = json.load(f)
    return _clinics_data


def format_clinic_card(clinic: dict, language: str) -> str:
    lang = language if language in ("ms", "en", "ta", "zh", "bn") else "en"
    ref_msgs = clinic.get("referral_message", {})
    ref_msg = ref_msgs.get(lang) or ref_msgs.get("en", "")

    hours_mon = clinic.get("hours", {}).get("mon", "Call to confirm")
    hours_sat = clinic.get("hours", {}).get("sat", "Closed")

    lines = [
        f"*{clinic['name']}*",
        clinic["address"],
        f"Tel: {clinic.get('phone', 'N/A')}",
        f"Hours: Mon {hours_mon} | Sat {hours_sat}",
    ]
    if clinic.get("whatsapp"):
        lines.append(f"WhatsApp: {clinic['whatsapp']}")
    badges = []
    if clinic.get("no_ic_required"):
        badges.append("No IC required")
    if clinic.get("free"):
        badges.append("FREE")
    if clinic.get("anonymous_safe"):
        badges.append("Anonymous safe")
    if badges:
        lines.append(" | ".join(badges))
    lines.append("")
    lines.append(ref_msg)
    return "\n".join(lines)


def route_referral(triage_result: dict) -> dict:
    condition = triage_result.get("condition", "general")
    mode = triage_result.get("mode", "anonymous")
    language = triage_result.get("language", "en")

    if mode == "citizen":
        if language == "ms":
            msg = (
                "Anda boleh tempah janji di Klinik Kesihatan berdekatan melalui MySejahtera:\n"
                "https://mysejahtera.malaysia.gov.my/intro\n\n"
                "Untuk kes mendesak, datang terus dan beritahu jururawat simptom anda dengan segera."
            )
        else:
            msg = (
                "You can book at your nearest Klinik Kesihatan via MySejahtera:\n"
                "https://mysejahtera.malaysia.gov.my/intro\n\n"
                "For urgent cases, walk in and tell the nurse your symptoms immediately."
            )
        return {
            "type": "citizen",
            "message": msg,
            "mysejahtera_link": "https://mysejahtera.malaysia.gov.my/intro",
        }

    # Anonymous mode — route to NGO clinics
    data = _load_clinics()
    clinics: list[dict] = data.get("clinics", [])

    matched = [
        c for c in clinics
        if any(condition.lower() in sp.lower() for sp in c.get("specialties", []))
        and c.get("anonymous_safe")
    ]
    if not matched:
        matched = [c for c in clinics if c.get("anonymous_safe") and c.get("walk_in")]
    if not matched:
        matched = [c for c in clinics if c.get("anonymous_safe")]

    top2 = matched[:2]
    clinic_cards = [format_clinic_card(c, language) for c in top2]

    if language == "ms":
        header = "Klinik yang sesuai untuk anda (tiada IC diperlukan):\n\n"
    else:
        header = "Recommended clinics for you (no IC required):\n\n"

    return {
        "type": "anonymous",
        "clinics": top2,
        "clinic_cards": clinic_cards,
        "message": header + "\n\n---\n\n".join(clinic_cards),
    }
