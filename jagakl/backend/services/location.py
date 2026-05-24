import math

KL_BOUNDS = {
    "min_lat": 2.85,
    "max_lat": 3.35,
    "min_lng": 101.45,
    "max_lng": 101.85,
}


def parse_coordinate(value: object) -> float | None:
    try:
        coord = float(str(value).strip())
    except (TypeError, ValueError):
        return None
    return coord if math.isfinite(coord) else None


def is_plausible_kl_coordinate(lat: float | None, lng: float | None) -> bool:
    if lat is None or lng is None:
        return False
    return (
        KL_BOUNDS["min_lat"] <= lat <= KL_BOUNDS["max_lat"]
        and KL_BOUNDS["min_lng"] <= lng <= KL_BOUNDS["max_lng"]
    )


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius_km * c


def maps_url(lat: float, lng: float) -> str:
    return f"https://www.google.com/maps/search/?api=1&query={lat:.6f},{lng:.6f}"


def enrich_with_distance(clinic: dict, user_lat: float, user_lng: float) -> dict:
    lat = parse_coordinate(clinic.get("lat"))
    lng = parse_coordinate(clinic.get("lng"))
    if lat is None or lng is None:
        return dict(clinic)

    enriched = dict(clinic)
    enriched["distance_km"] = round(haversine_km(user_lat, user_lng, lat, lng), 1)
    enriched["maps_url"] = maps_url(lat, lng)
    return enriched
