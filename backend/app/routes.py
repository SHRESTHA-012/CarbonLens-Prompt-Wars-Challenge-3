import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.rules_engine import generate_local_fallback_insights
from app.services.gemini_service import generate_gemini_advice
from app.services.firestore_service import save_ledger_snapshot, get_ledger_snapshot

router = APIRouter()


# Input Pydantic models for request validation
class InsightsRequest(BaseModel):
    totals: Dict[str, float]
    highestImpactCategory: Optional[str] = None
    userTargetKg: float = Field(
        gt=0, description="Daily carbon budget in kg CO2e, must be positive"
    )
    streak: int = Field(
        ge=0, description="Consecutive days under target, cannot be negative"
    )


class SaveEntriesRequest(BaseModel):
    deviceId: str
    entries: List[Dict[str, Any]]


def build_python_prompt(
    totals: Dict[str, float],
    highest_impact_category: Optional[str],
    target_kg: float,
    streak: int,
) -> str:
    """
    Constructs the prompt sent to Google Gemini API.
    """
    categories_list = "\n".join(
        [f"- {cat}: {val:.2f} kg CO2e" for cat, val in totals.items()]
    )
    return (
        "You are CarbonLens Coach, a friendly, direct, and actionable climate-impact advisor.\n"
        "Analyze the user's daily carbon ledger totals:\n"
        f"{categories_list}\n\n"
        "Context:\n"
        f"- Highest impact category: {highest_impact_category or 'None logged yet'}\n"
        f"- User's daily target budget: {target_kg} kg CO2e\n"
        f"- Current streak under target: {streak} days\n\n"
        "Provide exactly 3 concise, bulleted, highly personalized tips to help them reduce their emissions.\n"
        "Format each tip as:\n"
        "- **Title**: A short, action-focused recommendation. Under it, provide a 1-2 sentence description explaining *why* it helps and its practical implementation.\n"
        "Prioritize their highest impact category first. Keep your tone encouraging, direct, and realistic. "
        "Keep the entire response under 150 words. Do not use generic introductions or conclusions."
    )


@router.get("/health")
def health_check():
    """Liveness readiness probe."""
    return {"status": "healthy"}


@router.post("/insights")
def get_insights(req: InsightsRequest):
    """
    Returns personalized advice. Connects to Google Gemini API.
    Degrades gracefully to local Rules Engine if request fails or no key is provided.
    """
    use_gemini_env = os.environ.get("USE_GEMINI", "true").lower() == "true"
    api_key = os.environ.get("GEMINI_API_KEY")

    if use_gemini_env and api_key and api_key.strip():
        try:
            prompt = build_python_prompt(
                req.totals, req.highestImpactCategory, req.userTargetKg, req.streak
            )
            advice = generate_gemini_advice(prompt, api_key=api_key)
            return {"advice": advice, "source": "gemini"}
        except Exception as e:
            print(f"Gemini API request failed, falling back to rule engine: {e}")

    # Fallback to local rule engine
    advice = generate_local_fallback_insights(
        req.totals, req.highestImpactCategory, req.userTargetKg, req.streak
    )
    return {"advice": advice, "source": "rules_fallback"}


@router.post("/entries")
def save_entries(req: SaveEntriesRequest):
    """
    Saves user entries snapshot database records for a device ID.
    """
    if not req.deviceId or not req.deviceId.strip():
        raise HTTPException(status_code=400, detail="Missing deviceId parameter")

    save_ledger_snapshot(req.deviceId, req.entries)
    return {"status": "success"}


@router.get("/entries/{device_id}")
def get_entries(device_id: str):
    """
    Retrieves historical entries snapshot list for a specific device ID.
    """
    if not device_id or not device_id.strip():
        raise HTTPException(status_code=400, detail="Missing device_id parameter")

    entries = get_ledger_snapshot(device_id)
    return {"entries": entries}
