#!/usr/bin/env python3
"""Generic client list builder — scrape a niche/city via Google Places,
score each site, and write a lead manifest of the redesign-worthy ones.

Niche-agnostic: driven entirely by clients/<client>/config.json
(website_agent.gmaps_query / max_leads / max_site_score). Produces
clients/<client>/lead-manifest.json in the shape the downstream tooling
(site render, Filmer, scrape-email.js, email agent) consumes.

  python build_list.py --client phoenix-roofing --max-leads 60
"""

import argparse
import json
import os
import re
import time

import config
from client_loader import load_client_config
from gmaps_scraper import load_leads_from_gmaps
from site_scorer import score_website, filter_by_score


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:60] or "site"


def main():
    p = argparse.ArgumentParser(description="Build a scored lead manifest for a client")
    p.add_argument("--client", required=True, help="clients/<name> with config.json")
    p.add_argument("--max-leads", type=int, default=None,
                   help="Override website_agent.max_leads (Places results to pull)")
    p.add_argument("--no-score", action="store_true",
                   help="Discovery only — keep ALL businesses, skip site scoring/filter "
                        "(use for a services blast that targets everyone, not just weak sites)")
    args = p.parse_args()

    cfg = load_client_config(args.client)
    config.apply_client_config(cfg)
    wa = config.WEBSITE_AGENT

    # Legacy Places textsearch pagination is unreliable (INVALID_REQUEST on
    # next_page_token). Instead of one query + paging, fan out across several
    # metro queries and dedupe — far more robust and higher volume.
    queries = wa.get("gmaps_queries") or ([wa["gmaps_query"]] if wa.get("gmaps_query") else [])
    max_leads = args.max_leads or wa.get("max_leads", 30)
    max_site_score = wa.get("max_site_score", 5)
    api_key = config.GOOGLE_MAPS_API_KEY

    if not queries:
        print("ERROR: website_agent.gmaps_queries / gmaps_query missing in client config")
        return
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY not set in prospector/.env")
        return

    out_dir = os.path.join(os.path.dirname(__file__), "..", "clients", args.client)
    manifest_file = os.path.join(out_dir, "lead-manifest.json")

    print(f"\n=== Building list: {args.client} ===")
    print(f"  {len(queries)} queries | cap {max_leads} | keep site_score <= {max_site_score}\n")

    # 1. Discover via Google Places across all queries, dedupe by name
    leads = []
    seen_names = set()
    for q in queries:
        batch = load_leads_from_gmaps(
            query=q, api_key=api_key, max_results=20, require_website=True
        )
        new = 0
        for b in batch:
            key = b.get("company", "").strip().lower()
            if key and key not in seen_names:
                seen_names.add(key)
                leads.append(b)
                new += 1
        print(f"  {q!r}: +{new} new (total {len(leads)})")
        if len(leads) >= max_leads:
            leads = leads[:max_leads]
            break
    print(f"\n  {len(leads)} unique businesses with websites\n")
    if not leads:
        print("No leads found.")
        return

    if args.no_score:
        # Blast mode: target everyone, no quality filter, no Claude scoring.
        keep = leads
        print("  --no-score: keeping all discovered businesses (no scoring)\n")
    else:
        # 2. Score each website
        print("  Scoring websites...")
        for i, lead in enumerate(leads):
            url = lead.get("company_website", "")
            res = score_website(url, lead["company"], lead.get("industry", "Roofing"))
            if res:
                lead["site_score"] = res.get("score", 10)
                lead["site_issues"] = res.get("issues", [])
                lead["site_summary"] = res.get("summary", "")
                lead["site_strengths"] = res.get("strengths", [])
            else:
                lead["site_score"] = 10
            print(f"   ({i+1}/{len(leads)}) {lead['company'][:40]:42} "
                  f"score={lead.get('site_score')}")
            time.sleep(0.3)

        # 3. Keep only the redesign-worthy ones
        keep = filter_by_score(leads, max_score=max_site_score)
        print(f"\n  {len(keep)}/{len(leads)} qualify for redesign\n")

    # 4. Write manifest in the downstream-compatible shape
    manifest = []
    seen = set()
    for l in keep:
        slug = slugify(l["company"])
        while slug in seen:
            slug += "-x"
        seen.add(slug)
        manifest.append({
            "name": l["company"],
            "slug": slug,
            "phone": l.get("phone", ""),
            "address": l.get("address", ""),
            "city": l.get("city", ""),
            "rating": l.get("rating", ""),
            "reviews": l.get("review_count", ""),
            "website": l.get("company_website", ""),
            "site_score": l.get("site_score"),
            "site_issues": l.get("site_issues", []),
            "site_summary": l.get("site_summary", ""),
            "site_strengths": l.get("site_strengths", []),
        })

    os.makedirs(out_dir, exist_ok=True)
    with open(manifest_file, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"=== Done ===")
    print(f"  {len(manifest)} leads -> {os.path.relpath(manifest_file)}")
    if manifest:
        print(f"  Sample: {manifest[0]['name']} (score {manifest[0]['site_score']})")


if __name__ == "__main__":
    main()
