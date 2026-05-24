from fastapi.testclient import TestClient

from main import app
from routers.referral import nearest_clinics, route_referral


def test_nearest_clinics_orders_by_distance():
    clinics = nearest_clinics(
        lat=3.1820,
        lng=101.6860,
        condition="general",
        limit=2,
    )

    assert clinics
    assert clinics[0]["name"] == "Tzu Chi Free Clinic Sentul"
    assert clinics[0]["distance_km"] < clinics[1]["distance_km"]
    assert clinics[0]["maps_url"].startswith("https://www.google.com/maps/search/")


def test_route_referral_uses_shared_location_for_anonymous_patient():
    ref = route_referral(
        {
            "condition": "general",
            "mode": "anonymous",
            "language": "en",
            "latitude": 3.1820,
            "longitude": 101.6860,
        }
    )

    assert ref["location_used"] is True
    assert ref["clinics"][0]["name"] == "Tzu Chi Free Clinic Sentul"
    assert "Nearest suitable clinics" in ref["message"]
    assert "Distance:" in ref["message"]
    assert "Please verify hours" in ref["message"]


def test_nearest_clinics_endpoint_returns_ranked_clinics():
    client = TestClient(app)
    resp = client.post(
        "/clinics/nearest",
        json={
            "latitude": 3.1820,
            "longitude": 101.6860,
            "condition": "general",
            "language": "en",
            "limit": 1,
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["clinics"][0]["name"] == "Tzu Chi Free Clinic Sentul"
    assert data["clinics"][0]["distance_km"] is not None
    assert "Open" not in data["cards"][0]


def test_nearest_clinics_endpoint_rejects_non_kl_location():
    client = TestClient(app)
    resp = client.post(
        "/clinics/nearest",
        json={
            "latitude": 5.4141,
            "longitude": 100.3288,
            "condition": "general",
        },
    )

    assert resp.status_code == 400
