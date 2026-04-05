"""Client management — create, list, status, configure."""

import os
import json
import re
from datetime import datetime
from jontri_platform.db import get_all_clients, get_client, save_client, delete_client


CONFIG_DIR = os.path.join(os.path.dirname(__file__), "..", "clients")


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug


def create_client(
    name: str,
    industry: str,
    contact_name: str = "",
    contact_email: str = "",
    contact_phone: str = "",
    description: str = "",
) -> str:
    slug = slugify(name)
    if get_client(slug):
        raise ValueError(f"Client '{slug}' already exists")

    client_data = {
        "name": name,
        "slug": slug,
        "industry": industry,
        "description": description,
        "contact": {
            "name": contact_name,
            "email": contact_email,
            "phone": contact_phone,
        },
        "services": {},
        "created_at": datetime.now().isoformat(),
        "status": "active",
    }

    save_client(slug, client_data)

    # Also create the config directory with a config.json
    client_dir = os.path.join(CONFIG_DIR, slug)
    os.makedirs(client_dir, exist_ok=True)
    config_path = os.path.join(client_dir, "config.json")
    if not os.path.exists(config_path):
        config = {
            "client": {
                "name": name,
                "industry": industry,
                "description": description,
                "website": "",
            },
            "sender": {
                "from_name": "Vincent Kalman",
                "from_title": "Founder",
                "from_company": "Jontri Consulting",
                "booking_url": "https://calendly.com/jontri/consultation",
            },
            "icp": {
                "person_titles": [
                    "Owner", "President", "CEO", "Founder",
                    "Vice President", "VP", "Executive Director",
                    "Director of Operations", "COO", "General Manager",
                ],
                "person_locations": ["Colorado, United States"],
                "q_keywords": "",
                "organization_num_employees_ranges": ["1,500"],
                "per_page": 25,
            },
            "qualification": {
                "min_score": 6,
                "ideal_customer_description": "",
                "service_focus": "",
            },
            "email": {
                "tone": "professional but conversational, not pushy",
                "max_words": 150,
                "cta_style": "soft",
                "custom_guidelines": [],
            },
        }
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2)

    return slug


def list_clients(status_filter: str | None = None) -> list[dict]:
    clients = get_all_clients()
    result = []
    for slug, data in clients.items():
        if status_filter and data.get("status") != status_filter:
            continue
        result.append(data)
    return sorted(result, key=lambda c: c.get("created_at", ""), reverse=True)


def client_status(slug: str) -> dict | None:
    return get_client(slug)


def remove_client(slug: str) -> bool:
    return delete_client(slug)


def load_client_config(slug: str) -> dict:
    config_path = os.path.join(CONFIG_DIR, slug, "config.json")
    if not os.path.exists(config_path):
        raise FileNotFoundError(f"No config found for client '{slug}' at {config_path}")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)
