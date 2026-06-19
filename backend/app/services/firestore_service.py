import os
import json
from typing import List, Dict, Any

USE_FIRESTORE = os.environ.get("USE_FIRESTORE", "false").lower() == "true"

# Local database file path fallback - sits in the backend folder root
LOCAL_DB_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "database.json",
)


def save_ledger_snapshot(device_id: str, entries: List[Dict[str, Any]]) -> None:
    """
    Saves the user ledger snapshot list to Google Firestore.
    Falls back to a local JSON file (database.json) if Firestore is disabled or unavailable.
    """
    if USE_FIRESTORE:
        try:
            from google.cloud import firestore

            db = firestore.Client(database="default")
            doc_ref = db.collection("snapshots").document(device_id)
            doc_ref.set({"entries": entries, "timestamp": firestore.SERVER_TIMESTAMP})
            return
        except Exception as e:
            print(f"Firestore connection failed, saving locally: {e}")

    # Local JSON Fallback
    data = {}
    if os.path.exists(LOCAL_DB_FILE):
        try:
            with open(LOCAL_DB_FILE, "r") as f:
                data = json.load(f)
        except Exception:
            data = {}

    data[device_id] = entries

    try:
        with open(LOCAL_DB_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Failed to write to local database file: {e}")


def get_ledger_snapshot(device_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves the ledger snapshot list for a specific device ID from Firestore or the local database.
    """
    if USE_FIRESTORE:
        try:
            from google.cloud import firestore

            db = firestore.Client(database="default")
            doc_ref = db.collection("snapshots").document(device_id)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict().get("entries", [])
            return []
        except Exception as e:
            print(f"Firestore connection failed, reading locally: {e}")

    # Local JSON Fallback
    if os.path.exists(LOCAL_DB_FILE):
        try:
            with open(LOCAL_DB_FILE, "r") as f:
                data = json.load(f)
                return data.get(device_id, [])
        except Exception:
            return []

    return []
