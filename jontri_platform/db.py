"""Simple JSON flat-file database for client and service state."""

import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "clients.json")


def _ensure_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if not os.path.exists(DB_PATH):
        _write({"clients": {}})


def _read() -> dict:
    _ensure_db()
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _write(data: dict):
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def get_all_clients() -> dict:
    return _read()["clients"]


def get_client(slug: str) -> dict | None:
    return _read()["clients"].get(slug)


def save_client(slug: str, client_data: dict):
    db = _read()
    db["clients"][slug] = client_data
    _write(db)


def delete_client(slug: str) -> bool:
    db = _read()
    if slug in db["clients"]:
        del db["clients"][slug]
        _write(db)
        return True
    return False


def update_service_status(slug: str, service_name: str, status: str, details: dict | None = None):
    db = _read()
    client = db["clients"].get(slug)
    if not client:
        return
    if "services" not in client:
        client["services"] = {}
    client["services"][service_name] = {
        "status": status,
        "updated_at": datetime.now().isoformat(),
        **(details or {}),
    }
    _write(db)
