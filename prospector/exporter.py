"""CSV export for qualified leads."""

import csv
import os
from datetime import datetime
from config import OUTPUT_DIR


def export_leads(leads: list[dict], filename: str | None = None) -> str:
    """Export qualified leads to CSV."""
    if not filename:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"prospects_{timestamp}.csv"

    filepath = os.path.join(OUTPUT_DIR, filename)

    fieldnames = [
        "first_name", "last_name", "title", "email", "phone",
        "company", "industry", "employee_count", "city", "state",
        "linkedin_url", "company_website", "annual_revenue",
        "ai_score", "ai_reasoning", "pain_points",
        "site_score", "site_issues", "demo_url",
        "email_subject", "email_body", "email_sent",
    ]

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(leads)

    print(f"\n  Exported {len(leads)} leads to {filepath}")
    return filepath
