import os
import pytest
from fastapi.testclient import TestClient

# Mock environment before imports to ensure clean testing state
os.environ["USE_FIRESTORE"] = "false"
os.environ["USE_GEMINI"] = "false"

from app.main import app
from app.services.firestore_service import LOCAL_DB_FILE

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_local_db():
    """Removes the local JSON database file if it exists before each test."""
    if os.path.exists(LOCAL_DB_FILE):
        try:
            os.remove(LOCAL_DB_FILE)
        except Exception:
            pass
    yield
    if os.path.exists(LOCAL_DB_FILE):
        try:
            os.remove(LOCAL_DB_FILE)
        except Exception:
            pass


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_insights_fallback_engine():
    payload = {
        "totals": {"transport": 10.5, "energy": 0.0, "food": 0.0, "waste": 0.0},
        "highestImpactCategory": "transport",
        "userTargetKg": 5.5,
        "streak": 3,
    }
    response = client.post("/api/insights", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "advice" in data
    assert data["source"] == "rules_fallback"
    assert "Streak Alert" in data["advice"]
    assert "TRANSPORT" in data["advice"]


def test_insights_empty_totals():
    payload = {
        "totals": {"transport": 0.0, "energy": 0.0, "food": 0.0, "waste": 0.0},
        "highestImpactCategory": None,
        "userTargetKg": 5.5,
        "streak": 0,
    }
    response = client.post("/api/insights", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Welcome to CarbonLens!" in data["advice"]
    assert data["source"] == "rules_fallback"


def test_save_and_retrieve_entries():
    device_id = "test_device_123"
    entries = [
        {
            "id": "e1",
            "category": "transport",
            "label": "Petrol car",
            "quantity": 10.0,
            "unit": "km",
            "kgCO2e": 1.92,
            "timestamp": "2026-06-18",
        }
    ]

    # Save entries
    save_payload = {"deviceId": device_id, "entries": entries}
    save_response = client.post("/api/entries", json=save_payload)
    assert save_response.status_code == 200
    assert save_response.json() == {"status": "success"}

    # Verify local file exists
    assert os.path.exists(LOCAL_DB_FILE)

    # Retrieve entries
    get_response = client.get(f"/api/entries/{device_id}")
    assert get_response.status_code == 200
    retrieved_data = get_response.json()
    assert "entries" in retrieved_data
    assert len(retrieved_data["entries"]) == 1
    assert retrieved_data["entries"][0]["id"] == "e1"


def test_insights_rejects_negative_target():
    """userTargetKg must be positive — validates the Field(gt=0) constraint."""
    payload = {
        "totals": {"transport": 5.0},
        "highestImpactCategory": "transport",
        "userTargetKg": -2.0,
        "streak": 1,
    }
    response = client.post("/api/insights", json=payload)
    assert response.status_code == 422


def test_insights_rejects_negative_streak():
    """streak must be zero or positive — validates the Field(ge=0) constraint."""
    payload = {
        "totals": {"transport": 5.0},
        "highestImpactCategory": "transport",
        "userTargetKg": 5.5,
        "streak": -1,
    }
    response = client.post("/api/insights", json=payload)
    assert response.status_code == 422


def test_save_entries_missing_device_id():
    """Empty deviceId should be rejected with a 400."""
    payload = {"deviceId": "", "entries": []}
    response = client.post("/api/entries", json=payload)
    assert response.status_code == 400


def test_get_entries_unknown_device_returns_empty():
    """Querying a device with no saved history should return an empty list, not an error."""
    response = client.get("/api/entries/never_seen_device_xyz")
    assert response.status_code == 200
    assert response.json() == {"entries": []}
