import httpx
from datetime import datetime

_cache: dict[str, dict] = {}
_CACHE_TTL_SECONDS = 3600

_DENGUE_WARNING_SIGNS = [
    "vomit", "muntah", "abdominal pain", "sakit perut", "stomach pain",
    "bleeding", "pendarahan", "darah", "blood", "mucosal bleed",
    "lethargy", "lesu", "very tired", "sangat penat",
    "persistent vomiting", "rapid breathing",
]

_DENGUE_FEVER_SIGNS = ["fever", "demam", "panas", "suhu tinggi", "temperature"]
_DENGUE_HEADACHE_SIGNS = ["headache", "sakit kepala"]
_DENGUE_EYE_SIGNS = ["eye pain", "sakit mata", "pain behind eyes", "retro-orbital"]
_DENGUE_RASH_SIGNS = ["rash", "ruam", "red spots", "bintik merah"]
_DENGUE_JOINT_SIGNS = ["joint pain", "sakit sendi", "muscle pain", "sakit otot", "myalgia"]


def is_dengue_warning_signs(symptoms: list[str]) -> bool:
    text = " ".join(symptoms).lower()
    if any(s in text for s in _DENGUE_WARNING_SIGNS):
        return True
    # Classic dengue: fever + 2 or more additional signs
    has_fever = any(s in text for s in _DENGUE_FEVER_SIGNS)
    other_signs = sum([
        any(s in text for s in _DENGUE_HEADACHE_SIGNS),
        any(s in text for s in _DENGUE_EYE_SIGNS),
        any(s in text for s in _DENGUE_RASH_SIGNS),
        any(s in text for s in _DENGUE_JOINT_SIGNS),
    ])
    return has_fever and other_signs >= 2


async def fetch_hotspot_status(postcode: str) -> dict:
    cached = _cache.get(postcode)
    if cached:
        age = (datetime.utcnow() - cached["cached_at"]).total_seconds()
        if age < _CACHE_TTL_SECONDS:
            return cached["data"]

    result = await _fetch_from_api(postcode)
    _cache[postcode] = {"data": result, "cached_at": datetime.utcnow()}
    return result


async def _fetch_from_api(postcode: str) -> dict:
    import asyncio

    async def _try_govmy() -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://api.data.gov.my/data-catalogue",
                    params={"id": "dengue_cases_malaysia", "limit": 500},
                )
                if resp.status_code == 200:
                    payload = resp.json()
                    rows = payload if isinstance(payload, list) else payload.get("data", [])
                    if rows:
                        return _parse_rows(rows, postcode)
        except Exception:
            pass
        return None

    async def _try_idengue() -> dict | None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://idengue.mysa.gov.my/idengue/api/getHotspot",
                    params={"postcode": postcode},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and data:
                        item = data[0]
                        return {
                            "postcode": postcode,
                            "is_hotspot": True,
                            "active_cases": item.get("case_count"),
                            "locality_name": item.get("locality") or item.get("kawasan"),
                            "last_updated": item.get("updated_date"),
                            "note": None,
                        }
        except Exception:
            pass
        return None

    # Run both APIs in parallel — take whichever responds first
    results = await asyncio.gather(_try_govmy(), _try_idengue(), return_exceptions=True)
    for r in results:
        if isinstance(r, dict):
            return r

    return _fallback(postcode)


def _parse_rows(rows: list, postcode: str) -> dict:
    matched = [r for r in rows if str(r.get("postcode", "")).strip() == postcode.strip()]
    if not matched:
        return _fallback(postcode, "No dengue data found for this postcode.")
    total_cases = sum(int(r.get("cases", 0)) for r in matched)
    locality = matched[0].get("locality") or matched[0].get("kawasan")
    last_updated = matched[0].get("date") or matched[0].get("updated_at")
    return {
        "postcode": postcode,
        "is_hotspot": total_cases >= 5,
        "active_cases": total_cases,
        "locality_name": locality,
        "last_updated": last_updated,
        "note": None,
    }


def _fallback(postcode: str, note: str = "Live dengue data unavailable. Treat with caution.") -> dict:
    return {
        "postcode": postcode,
        "is_hotspot": False,
        "active_cases": None,
        "locality_name": None,
        "last_updated": None,
        "note": note,
    }
