"""Discover leads via Google Maps + scrape contact emails, write an Apollo-format CSV.

Used when Apollo's API is unavailable (free tier) or when targeting niches Apollo
doesn't cover well. Output CSV slots into `apollo_client.load_leads_from_csv`,
so the rest of the prospector pipeline (qualify → personalize → push) is unchanged.

Supports multiple queries (Google's Text Search caps at ~60 results per query),
de-duplicating businesses by place_id across queries.

Usage:
  # single query
  python prospector/gmaps_to_csv.py --query "med spa in Scottsdale, AZ" --out leads.csv

  # multiple queries (combined + deduped)
  python prospector/gmaps_to_csv.py \\
      --query "med spa in Scottsdale, AZ" \\
      --query "med spa in Phoenix, AZ" \\
      --query "aesthetics in Scottsdale, AZ" \\
      --out leads.csv
"""

import argparse
import csv
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import config
from gmaps_scraper import search_google_maps, enrich_with_details
from email_scraper import enrich_leads_with_emails


CSV_FIELDS = [
    "First Name", "Last Name", "Title", "Email",
    "Corporate Phone", "Work Direct Phone", "Mobile Phone",
    "Person Linkedin Url", "Company Name", "Website", "Industry",
    "# Employees", "City", "Company City", "State", "Company State",
    "Keywords", "Technologies", "Annual Revenue",
]


def lead_to_csv_row(lead: dict) -> dict:
    return {
        "First Name": lead.get("first_name", ""),
        "Last Name": lead.get("last_name", ""),
        "Title": lead.get("title", "Owner"),
        "Email": lead.get("email", ""),
        "Corporate Phone": lead.get("phone", ""),
        "Work Direct Phone": "",
        "Mobile Phone": "",
        "Person Linkedin Url": lead.get("linkedin_url", ""),
        "Company Name": lead.get("company", ""),
        "Website": lead.get("company_website", ""),
        "Industry": lead.get("industry", ""),
        "# Employees": lead.get("employee_count", ""),
        "City": lead.get("city", ""),
        "Company City": lead.get("city", ""),
        "State": lead.get("state", ""),
        "Company State": lead.get("state", ""),
        "Keywords": lead.get("keywords", ""),
        "Technologies": lead.get("technologies", ""),
        "Annual Revenue": lead.get("annual_revenue", ""),
    }


def main():
    parser = argparse.ArgumentParser(description="Google Maps lead discovery → Apollo-format CSV")
    parser.add_argument("--query", action="append", required=True,
                        help='Google Maps search query (repeat flag for multiple queries)')
    parser.add_argument("--per-query", type=int, default=60,
                        help="Max results per single Google Maps query (Google caps at 60)")
    parser.add_argument("--out", default="leads.csv", help="Output CSV path")
    parser.add_argument("--no-emails", action="store_true", help="Skip email scraping step")
    parser.add_argument("--delay", type=float, default=1.0, help="Seconds between site fetches (default 1.0)")
    args = parser.parse_args()

    api_key = config.GOOGLE_MAPS_API_KEY
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY missing from .env.local")
        return 1

    # ---- 1) Run all queries, accumulate, dedupe by place_id ----
    print(f"\n[1/4] Running {len(args.query)} Google Maps queries...")
    by_place_id: dict[str, dict] = {}
    for i, q in enumerate(args.query, 1):
        print(f"  ({i}/{len(args.query)}) \"{q}\"", end=" ", flush=True)
        results = search_google_maps(q, api_key, max_results=args.per_query)
        new_count = 0
        for r in results:
            pid = r.get("_place_id")
            if pid and pid not in by_place_id:
                by_place_id[pid] = r
                new_count += 1
        print(f"-> {len(results)} results, {new_count} new (cumulative: {len(by_place_id)})")

    leads = list(by_place_id.values())
    print(f"\n  De-duped to {len(leads)} unique businesses")

    if not leads:
        print("No results. Try different queries.")
        return 0

    # ---- 2) Enrich with website + phone via Place Details API ----
    print(f"\n[2/4] Enriching {len(leads)} leads with website + phone details...")
    leads = enrich_with_details(leads, api_key)
    before = len(leads)
    leads = [l for l in leads if l.get("company_website")]
    print(f"  Filtered to {len(leads)} with websites (dropped {before - len(leads)} without)")
    for l in leads:
        l.pop("_place_id", None)

    # ---- 3) Email scrape ----
    if args.no_emails:
        print("\n[3/4] Skipping email scrape (--no-emails set)")
    else:
        print(f"\n[3/4] Scanning {len(leads)} websites for contact emails (delay {args.delay}s)...")
        leads = enrich_leads_with_emails(leads, delay=args.delay, verbose=True)
        with_email = sum(1 for l in leads if l.get("email"))
        print(f"  -> {with_email}/{len(leads)} sites yielded an email")

    # ---- 4) Write Apollo-format CSV ----
    out_path = args.out if os.path.isabs(args.out) else os.path.join(os.getcwd(), args.out)
    print(f"\n[4/4] Writing CSV: {out_path}")
    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for lead in leads:
            writer.writerow(lead_to_csv_row(lead))

    have_email = sum(1 for l in leads if l.get("email"))
    print(f"\n=== Done ===")
    print(f"  Total businesses (deduped): {len(leads)}")
    print(f"  With email:                 {have_email}")
    print(f"  Without email:              {len(leads) - have_email}  (drop or chase via IG/phone)")
    print(f"  CSV:                        {out_path}")
    print(f"\nNext: python prospector/main.py --client=scottsdale-medspa --csv={out_path}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
