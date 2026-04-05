"""Load leads from Apollo CSV exports."""

import csv
import os
import glob


def load_leads_from_csv(csv_path: str | None = None) -> list[dict]:
    """Load leads from an Apollo CSV export file.
    
    If no path given, finds the most recent CSV in the project root or prospector dir.
    """
    if not csv_path:
        csv_path = find_latest_csv()
    
    if not csv_path or not os.path.exists(csv_path):
        print("  No Apollo CSV file found.")
        return []

    print(f"  Loading from: {os.path.basename(csv_path)}")
    leads = []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lead = {
                "first_name": row.get("First Name", ""),
                "last_name": row.get("Last Name", ""),
                "title": row.get("Title", ""),
                "email": row.get("Email", ""),
                "phone": row.get("Corporate Phone", "") or row.get("Work Direct Phone", "") or row.get("Mobile Phone", ""),
                "linkedin_url": row.get("Person Linkedin Url", ""),
                "company": row.get("Company Name", ""),
                "company_website": row.get("Website", ""),
                "industry": row.get("Industry", ""),
                "employee_count": row.get("# Employees", ""),
                "city": row.get("City", "") or row.get("Company City", ""),
                "state": row.get("State", "") or row.get("Company State", ""),
                "keywords": _truncate(row.get("Keywords", ""), 10),
                "technologies": _truncate(row.get("Technologies", ""), 10),
                "annual_revenue": row.get("Annual Revenue", ""),
            }
            if lead["email"]:
                leads.append(lead)
    return leads


def find_latest_csv() -> str | None:
    """Find the most recent Apollo CSV in the project."""
    search_dirs = [
        os.path.join(os.path.dirname(__file__), ".."),  # project root
        os.path.dirname(__file__),  # prospector dir
    ]
    csv_files = []
    for d in search_dirs:
        csv_files.extend(glob.glob(os.path.join(d, "*.csv")))

    if not csv_files:
        return None
    return max(csv_files, key=os.path.getmtime)


def _truncate(comma_str: str, max_items: int) -> str:
    """Keep only the first N comma-separated items."""
    items = [s.strip() for s in comma_str.split(",") if s.strip()]
    return ", ".join(items[:max_items])
