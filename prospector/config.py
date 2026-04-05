import os
from dotenv import load_dotenv

load_dotenv()

# Apollo
APOLLO_API_KEY = os.getenv("APOLLO_API_KEY", "")
APOLLO_BASE_URL = "https://api.apollo.io/api/v1"

# Claude
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Instantly.ai
INSTANTLY_API_KEY = os.getenv("INSTANTLY_API_KEY", "")

# Vapi (AI Voice Agent) — each client provides their own key via dashboard
# Fallback: VAPI_API_KEY env var used if no per-client key is set
VAPI_API_KEY = os.getenv("VAPI_API_KEY", "")

# Google Maps (Places API for lead discovery)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Netlify (demo site deployment)
NETLIFY_API_TOKEN = os.getenv("NETLIFY_API_TOKEN", "")

# Zoho SMTP (legacy, kept as fallback)
ZOHO_EMAIL = os.getenv("ZOHO_EMAIL", "")
ZOHO_PASSWORD = os.getenv("ZOHO_PASSWORD", "")
SMTP_HOST = "smtp.zoho.com"
SMTP_PORT = 587

# --- Defaults (used when no client config is loaded) ---
FROM_NAME = os.getenv("FROM_NAME", "Vincent Kalman")
FROM_TITLE = os.getenv("FROM_TITLE", "Founder")
FROM_COMPANY = os.getenv("FROM_COMPANY", "Jontri Consulting")
BOOKING_URL = os.getenv("BOOKING_URL", "https://calendly.com/jontri/consultation")

ICP = {
    "person_titles": [
        "Owner", "President", "CEO", "Founder",
        "Vice President", "VP", "Executive Director",
        "Director of Operations", "COO", "General Manager",
        "Director of Business Development",
    ],
    "person_locations": ["Colorado, United States"],
    "organization_industry_tag_ids": [],
    "q_keywords": "construction OR HVAC OR mechanical OR plumbing OR sheet metal OR heating OR cooling",
    "organization_num_employees_ranges": ["1,500"],
    "per_page": 25,
}

QUALIFICATION = {
    "min_score": 6,
    "ideal_customer_description": (
        "A Colorado construction/HVAC/mechanical company with 10-500 employees "
        "whose leadership is open to technology but hasn't fully adopted AI yet. "
        "Companies still using manual processes, spreadsheets, or outdated software score higher."
    ),
    "service_focus": "",
}

EMAIL_CONFIG = {
    "tone": "professional but conversational, not pushy",
    "max_words": 150,
    "cta_style": "soft",
    "custom_guidelines": ["Do NOT use phrases like 'I hope this email finds you well'"],
}

INSTANTLY_CONFIG = {
    "campaign_prefix": "",
    "schedule": {
        "from": "09:00",
        "to": "17:00",
        "days": [1, 2, 3, 4, 5],
        "timezone": "America/Denver",
    },
}

# --- Website Agent defaults ---
WEBSITE_AGENT = {
    "max_site_score": 5,          # Only redesign sites scoring at or below this
    "max_leads": 20,              # Max leads per Google Maps search
    "require_website": True,      # Skip businesses without a website
    "gmaps_query": "",            # e.g. "plumbers in Dallas"
    "deploy_method": "netlify",   # "netlify" or "local"
}


def apply_client_config(config: dict):
    """Override global config values from a client config dict."""
    global FROM_NAME, FROM_TITLE, FROM_COMPANY, BOOKING_URL
    global ICP, QUALIFICATION, EMAIL_CONFIG, INSTANTLY_CONFIG, WEBSITE_AGENT

    sender = config.get("sender", {})
    if sender.get("from_name"):
        FROM_NAME = sender["from_name"]
    if sender.get("from_title"):
        FROM_TITLE = sender["from_title"]
    if sender.get("from_company"):
        FROM_COMPANY = sender["from_company"]
    if sender.get("booking_url"):
        BOOKING_URL = sender["booking_url"]

    if "icp" in config:
        ICP.update(config["icp"])

    if "qualification" in config:
        QUALIFICATION.update(config["qualification"])

    if "email" in config:
        EMAIL_CONFIG.update(config["email"])

    if "instantly" in config:
        INSTANTLY_CONFIG.update(config["instantly"])

    if "website_agent" in config:
        WEBSITE_AGENT.update(config["website_agent"])


# Output
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)
