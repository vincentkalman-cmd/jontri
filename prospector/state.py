"""Persistent state for prospector — tracks which lead emails have already been pushed.

Used to make pipeline restarts idempotent: a crash mid-run won't re-push the same
leads to Instantly on the next invocation.
"""

import json
import os
from pathlib import Path

STATE_PATH = Path(__file__).parent / "output" / ".sent_emails.json"


def _load() -> dict:
    if not STATE_PATH.exists():
        return {"sent": []}
    try:
        with open(STATE_PATH) as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {"sent": []}


def _save(data: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = STATE_PATH.with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.replace(tmp, STATE_PATH)


def already_sent(email: str) -> bool:
    if not email:
        return False
    return email.lower() in {e.lower() for e in _load().get("sent", [])}


def mark_sent(emails: list[str]) -> None:
    if not emails:
        return
    data = _load()
    existing = {e.lower() for e in data.get("sent", [])}
    for e in emails:
        if e and e.lower() not in existing:
            data.setdefault("sent", []).append(e)
            existing.add(e.lower())
    _save(data)
