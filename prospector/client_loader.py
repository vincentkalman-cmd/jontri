"""Load client configuration from JSON config files."""

import json
import os

CLIENTS_DIR = os.path.join(os.path.dirname(__file__), "..", "clients")


def list_clients() -> list[str]:
    """Return available client directory names."""
    if not os.path.isdir(CLIENTS_DIR):
        return []
    return [
        d for d in sorted(os.listdir(CLIENTS_DIR))
        if os.path.isfile(os.path.join(CLIENTS_DIR, d, "config.json"))
    ]


def load_client_config(client_name: str) -> dict:
    """Load and return a client's config.json."""
    config_path = os.path.join(CLIENTS_DIR, client_name, "config.json")
    if not os.path.isfile(config_path):
        raise FileNotFoundError(f"No config.json found for client '{client_name}' at {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    config.pop("_instructions", None)
    return config
