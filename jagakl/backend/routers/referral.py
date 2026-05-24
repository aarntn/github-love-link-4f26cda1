import json
from pathlib import Path

from services.location import enrich_with_distance, is_plausible_kl_coordinate, maps_url, parse_coordinate

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
    if clinic.get("distance_km") is not None:
        lines.append(f"Distance: ~{clinic['distance_km']} km from shared location")
    if clinic.get("maps_url"):
        lines.append(f"Map: {clinic['maps_url']}")
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
    lines.append("Please verify hours and eligibility before going.")
    return "\n".join(lines)


def _filter_clinics(condition: str) -> list[dict]:
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
    return matched


def nearest_clinics(
    *,
    lat: float,
    lng: float,
    condition: str = "general",
    limit: int = 3,
) -> list[dict]:
    matched = _filter_clinics(condition)
    enriched = [enrich_with_distance(c, lat, lng) for c in matched]
    enriched.sort(key=lambda c: c.get("distance_km", 9999))
    return enriched[:limit]


def clinic_location_summary(clinic: dict) -> dict:
    lat = parse_coordinate(clinic.get("lat"))
    lng = parse_coordinate(clinic.get("lng"))
    return {
        "clinic_distance_km": clinic.get("distance_km"),
        "clinic_lat": lat,
        "clinic_lng": lng,
        "clinic_maps_url": clinic.get("maps_url") or (maps_url(lat, lng) if lat is not None and lng is not None else None),
    }


def route_referral(triage_result: dict) -> dict:
    condition = triage_result.get("condition", "general")
    mode = triage_result.get("mode", "anonymous")
    language = triage_result.get("language", "en")
    lat = parse_coordinate(triage_result.get("latitude"))
    lng = parse_coordinate(triage_result.get("longitude"))
    has_location = is_plausible_kl_coordinate(lat, lng)

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
    matched = _filter_clinics(condition)

    if has_location:
        matched = nearest_clinics(
            lat=lat,
            lng=lng,
            condition=condition,
            limit=max(2, len(matched)),
        )

    top2 = matched[:2]
    clinic_cards = [format_clinic_card(c, language) for c in top2]

    if language == "ms" and has_location:
        header = "Klinik terdekat yang sesuai untuk anda (tiada IC diperlukan):\n\n"
    elif language == "ms":
        header = "Klinik yang sesuai untuk anda (tiada IC diperlukan):\n\n"
    elif has_location:
        header = "Nearest suitable clinics for you (no IC required):\n\n"
    else:
        header = "Recommended clinics for you (no IC required):\n\n"

    return {
        "type": "anonymous",
        "clinics": top2,
        "clinic_cards": clinic_cards,
        "message": header + "\n\n---\n\n".join(clinic_cards),
        "location_used": has_location,
    }
