"""Push leads and personalized emails to Instantly.ai campaigns."""

import requests
from config import INSTANTLY_API_KEY

BASE_URL = "https://api.instantly.ai/api/v2"
HEADERS = {
    "Authorization": f"Bearer {INSTANTLY_API_KEY}",
    "Content-Type": "application/json",
}


def create_campaign(name: str) -> str | None:
    """Create a new Instantly campaign and return its ID."""
    payload = {
        "name": name,
        "campaign_schedule": {
            "schedules": [
                {
                    "name": "Default",
                    "timing": {"from": "09:00", "to": "17:00"},
                    "days": {"1": True, "2": True, "3": True, "4": True, "5": True},
                    "timezone": "America/Denver",
                }
            ],
        },
    }
    resp = requests.post(f"{BASE_URL}/campaigns", json=payload, headers=HEADERS, timeout=30)
    if resp.status_code in (200, 201):
        data = resp.json()
        campaign_id = data.get("id")
        print(f"  Campaign created: {name} (ID: {campaign_id})")
        return campaign_id
    else:
        print(f"  Failed to create campaign: {resp.status_code} {resp.text[:300]}")
        return None


def add_leads_to_campaign(campaign_id: str, leads: list[dict]) -> bool:
    """Add leads with personalized variables to an Instantly campaign."""
    lead_list = []
    for lead in leads:
        custom_vars = {
            "title": lead.get("title", ""),
            "phone": lead.get("phone", ""),
            "city": lead.get("city", ""),
            "linkedin_url": lead.get("linkedin_url", ""),
            "ai_score": str(lead.get("ai_score", "")),
            "personalized_subject": lead.get("email_subject", ""),
            "personalized_body": lead.get("email_body", ""),
        }
        # Website agent fields
        if lead.get("demo_url"):
            custom_vars["demo_url"] = lead["demo_url"]
        if lead.get("site_issues"):
            custom_vars["site_issues"] = lead["site_issues"]

        lead_list.append({
            "email": lead["email"],
            "first_name": lead.get("first_name", ""),
            "last_name": lead.get("last_name", ""),
            "company_name": lead.get("company", ""),
            "custom_variables": custom_vars,
        })

    payload = {
        "campaign_id": campaign_id,
        "leads": lead_list,
    }
    resp = requests.post(f"{BASE_URL}/leads", json=payload, headers=HEADERS, timeout=30)
    if resp.status_code in (200, 201):
        print(f"  Added {len(lead_list)} leads to campaign")
        return True
    else:
        print(f"  Failed to add leads: {resp.status_code} {resp.text[:300]}")
        return False


def set_campaign_sequence(campaign_id: str) -> bool:
    """Set the email sequence using personalized variables."""
    payload = {
        "campaign_id": campaign_id,
        "sequences": [
            {
                "steps": [
                    {
                        "type": "email",
                        "delay": 0,
                        "variants": [
                            {
                                "subject": "{{personalized_subject}}",
                                "body": "{{personalized_body}}",
                            }
                        ],
                    }
                ],
            }
        ],
    }
    resp = requests.post(f"{BASE_URL}/campaigns/{campaign_id}/sequences", json=payload, headers=HEADERS, timeout=30)
    if resp.status_code in (200, 201):
        print("  Email sequence configured")
        return True
    else:
        print(f"  Failed to set sequence: {resp.status_code} {resp.text[:300]}")
        return False


def set_campaign_accounts(campaign_id: str) -> bool:
    """Attach all available sending accounts to the campaign."""
    # Fetch accounts
    resp = requests.get(f"{BASE_URL}/accounts", headers=HEADERS, params={"limit": 50}, timeout=15)
    if resp.status_code != 200:
        print(f"  Failed to fetch accounts: {resp.status_code}")
        return False

    accounts = resp.json().get("items", [])
    active_emails = [a["email"] for a in accounts if a.get("status") == 1]

    if not active_emails:
        print("  No active sending accounts found in Instantly")
        return False

    payload = {
        "campaign_id": campaign_id,
        "emails": active_emails,
    }
    resp = requests.post(f"{BASE_URL}/campaigns/{campaign_id}/accounts", json=payload, headers=HEADERS, timeout=15)
    if resp.status_code in (200, 201):
        print(f"  Attached {len(active_emails)} sending accounts: {', '.join(active_emails)}")
        return True
    else:
        print(f"  Failed to attach accounts: {resp.status_code} {resp.text[:300]}")
        return False


def launch_campaign(campaign_id: str) -> bool:
    """Activate the campaign so Instantly starts sending."""
    payload = {"campaign_id": campaign_id}
    resp = requests.post(f"{BASE_URL}/campaigns/{campaign_id}/activate", json=payload, headers=HEADERS, timeout=15)
    if resp.status_code in (200, 201):
        print("  Campaign launched!")
        return True
    else:
        print(f"  Failed to launch: {resp.status_code} {resp.text[:300]}")
        return False


def push_to_instantly(leads: list[dict], campaign_name: str, dry_run: bool = True) -> bool:
    """Create an Instantly campaign with personalized leads."""
    if dry_run:
        print(f"\n  [DRY RUN] Would create Instantly campaign: {campaign_name}")
        print(f"  [DRY RUN] Would add {len(leads)} leads with personalized emails")
        for lead in leads[:3]:
            subj = lead.get("email_subject", "N/A")
            print(f"    -> {lead['email']}: {subj.encode('ascii', 'replace').decode()}")
        if len(leads) > 3:
            print(f"    ... and {len(leads) - 3} more")
        return True

    # 1. Create campaign
    campaign_id = create_campaign(campaign_name)
    if not campaign_id:
        return False

    # 2. Set email sequence with personalized variables
    if not set_campaign_sequence(campaign_id):
        return False

    # 3. Attach sending accounts
    if not set_campaign_accounts(campaign_id):
        return False

    # 4. Add leads
    if not add_leads_to_campaign(campaign_id, leads):
        return False

    # 5. Launch
    if not launch_campaign(campaign_id):
        return False

    return True
