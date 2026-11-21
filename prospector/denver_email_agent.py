#!/usr/bin/env python3
"""Denver-plumbing email agent — bridges the denver-plumbing lead manifest
into the existing Instantly pipeline, sending the hosted demo video.

The denver-plumbing pipeline was built for GHL MMS (by phone). This sends
the same leads by EMAIL instead: it discovers each business's website +
contact email (Google Places -> site scrape, reusing prospector modules),
builds an HTML email whose poster image (the already-generated MMS .jpg)
links to the hosted walkthrough video, and pushes to Instantly.

Email discovery is cached to email-enriched.json so re-runs don't re-burn
Places quota or re-crawl sites. Sending is DRY-RUN by default; pass --live.

Prereq: run `node clients/denver-plumbing/render-from-cache.js --video`
first so each lead has a video_url in lead-manifest.json, and deploy
public/ so the .jpg/.mp4 URLs are live.
"""

import argparse
import json
import os
import subprocess
import time

import config
from gmaps_scraper import search_google_maps, enrich_with_details
from emailer import push_to_instantly

SCRAPER_JS = os.path.join(
    os.path.dirname(__file__), "..", "clients", "denver-plumbing",
    "pipeline", "scrape-email.js",
)


def scrape_email_js(website: str) -> dict:
    """Run the Playwright deep scraper (JS-rendered, de-obfuscating).

    Returns {email, all_emails}. Falls back to empty on any failure —
    a site with no published email simply yields nothing.
    """
    try:
        out = subprocess.run(
            ["node", SCRAPER_JS, website],
            capture_output=True, text=True, timeout=120,
        ).stdout
        data = json.loads(out or "{}")
        return {"email": data.get("email", ""),
                "all_emails": data.get("candidates", [])}
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        return {"email": "", "all_emails": []}

DENVER_DIR = os.path.join(
    os.path.dirname(__file__), "..", "clients", "denver-plumbing"
)
MANIFEST_FILE = os.path.join(DENVER_DIR, "lead-manifest.json")
CACHE_FILE = os.path.join(DENVER_DIR, "email-enriched.json")

# Mirrors getShortName() in render-from-cache.js so the email greeting
# reads naturally ("Built A-1 Plumbing a new site", not the legal name).
_SUFFIX_RE = None


def short_name(name: str) -> str:
    import re

    global _SUFFIX_RE
    if _SUFFIX_RE is None:
        _SUFFIX_RE = re.compile(
            r"\s*(LLC|Inc\.?|Co\.?|Company|Services?|,\s*Heating.*|,\s*Cooling.*"
            r"|,\s*Electric.*|&\s*Heating.*|&\s*Air.*|&\s*Electric.*)\s*",
            re.IGNORECASE,
        )
    return _SUFFIX_RE.sub(" ", name).strip() or name


def discover_email(lead: dict, api_key: str) -> dict:
    """Find a business's website + contact email via Google Places + scrape.

    Returns {website, email, email_candidates}. Empty strings when nothing
    was found (lead with no site can't be emailed and is skipped upstream).
    """
    query = f"{lead['name']} {lead.get('address') or lead.get('city') or 'Denver'}"
    hits = search_google_maps(query, api_key, max_results=1)
    if not hits:
        return {"website": "", "email": "", "email_candidates": []}

    enrich_with_details(hits, api_key)
    website = hits[0].get("company_website", "")
    if not website:
        return {"website": "", "email": "", "email_candidates": []}

    res = scrape_email_js(website)
    return {
        "website": website,
        "email": res["email"],
        "email_candidates": res["all_emails"],
    }


def load_cache() -> dict:
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, encoding="utf-8") as f:
            return {e["slug"]: e for e in json.load(f)}
    return {}


def save_cache(cache: dict):
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(list(cache.values()), f, indent=2)


def build_email(lead: dict) -> dict:
    """Build the subject + HTML body. Poster image links to hosted video.

    Voice mirrors the proven send-day1-mms.js script: a real person who
    already built the site, not a pitch. Under ~120 words.
    """
    sn = short_name(lead["name"])
    poster = lead["mms_preview_url"]
    video = lead["video_url"]
    rating = lead.get("rating", "")
    reviews = lead.get("reviews", "")
    rep = (
        f" You've got {reviews} reviews at {rating} stars in Denver — that's a "
        f"serious reputation, and your current site doesn't show it."
        if reviews and rating
        else ""
    )

    subject = f"Built {sn} a new website (30-sec video)"

    body = f"""\
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a;max-width:600px">
<p>Hi — I'm {config.FROM_NAME}. I run a small shop helping Denver plumbers with their websites.{rep}</p>
<p>So I went ahead and built {sn} a new one. Here's a 30-second walkthrough — click the preview:</p>
<p style="margin:18px 0">
<a href="{video}" style="text-decoration:none">
<img src="{poster}" alt="{sn} — new website preview" width="600" style="width:100%;max-width:600px;border-radius:10px;border:1px solid #e2e2e2;display:block" />
<span style="display:inline-block;margin-top:8px;font-size:14px;color:#0a66c2">▶ Watch the 30-sec walkthrough</span>
</a>
</p>
<p>It's a real, finished site — not a mockup. Reply "send it" and I'll send the live link so you can click through it yourself.</p>
<p>— {config.FROM_NAME}<br/>{config.FROM_COMPANY}</p>
</div>"""

    return {"subject": subject, "body": body}


def discover_only(limit: int | None):
    """Build the email cache over the FULL manifest, independent of video
    render. Resumable (incremental cache), no sends. Prints coverage.
    """
    api_key = config.GOOGLE_MAPS_API_KEY
    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY not set in prospector/.env")
        return
    with open(MANIFEST_FILE, encoding="utf-8") as f:
        manifest = json.load(f)
    leads = manifest[:limit] if limit else manifest
    cache = load_cache()

    print(f"\nDiscovering emails for {len(leads)} leads "
          f"({sum(1 for l in leads if l['slug'] in cache)} cached)...")
    found = 0
    for i, lead in enumerate(leads):
        slug = lead["slug"]
        if slug in cache and "email" in cache[slug]:
            if cache[slug].get("email"):
                found += 1
            continue
        print(f"  ({i+1}/{len(leads)}) {lead['name'][:42]:44}", end=" ", flush=True)
        res = discover_email(lead, api_key)
        cache[slug] = {
            "slug": slug, "name": lead["name"], "website": res["website"],
            "email": res["email"], "email_candidates": res["email_candidates"],
        }
        save_cache(cache)
        if res["email"]:
            found += 1
        print(res["email"] or "<none>")
        time.sleep(0.5)

    pct = round(found / len(leads) * 100) if leads else 0
    print(f"\n=== Discovery complete ===")
    print(f"  Emailable: {found}/{len(leads)} ({pct}%)  → cache: email-enriched.json")


def run(limit: int | None, live: bool, skip_discovery: bool):
    api_key = config.GOOGLE_MAPS_API_KEY
    if not skip_discovery and not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY not set in prospector/.env")
        return

    with open(MANIFEST_FILE, encoding="utf-8") as f:
        manifest = json.load(f)

    leads = [m for m in manifest if m.get("video_url")]
    no_video = len(manifest) - len(leads)
    if no_video:
        print(
            f"  {no_video}/{len(manifest)} leads have no video_url — run "
            f"`render-from-cache.js --video` first. Proceeding with {len(leads)}."
        )
    if limit:
        leads = leads[:limit]

    cache = load_cache()

    # --- Step 1: email discovery (cached) ---
    print(f"\n[1/3] Email discovery for {len(leads)} leads "
          f"({'cache only' if skip_discovery else 'Places + site scrape'})...")
    for i, lead in enumerate(leads):
        slug = lead["slug"]
        cached = cache.get(slug)
        if cached and "email" in cached:
            lead["email"] = cached["email"]
            lead["company_website"] = cached.get("website", "")
            continue
        if skip_discovery:
            lead["email"] = ""
            continue
        print(f"  ({i+1}/{len(leads)}) {lead['name'][:42]:44}", end=" ", flush=True)
        res = discover_email(lead, api_key)
        lead["email"] = res["email"]
        lead["company_website"] = res["website"]
        cache[slug] = {
            "slug": slug,
            "name": lead["name"],
            "website": res["website"],
            "email": res["email"],
            "email_candidates": res["email_candidates"],
        }
        save_cache(cache)  # incremental — safe to interrupt
        print(res["email"] or "<none>")
        time.sleep(1.0)

    # --- Step 2: filter + build emails ---
    sendable = [l for l in leads if l.get("email")]
    print(f"\n[2/3] {len(sendable)}/{len(leads)} leads have an email. "
          f"Building HTML bodies...")
    for lead in sendable:
        e = build_email(lead)
        lead["company"] = lead["name"]  # emailer expects `company`
        lead["first_name"] = ""
        lead["last_name"] = ""
        lead["email_subject"] = e["subject"]
        lead["email_body"] = e["body"]

    if not sendable:
        print("\nNo emailable leads. Nothing to push.")
        return

    # --- Step 3: push to Instantly ---
    from datetime import datetime

    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    campaign = f"Denver Plumbing Video - {ts}"
    print(f"\n[3/3] {'[DRY RUN] ' if not live else ''}Pushing to Instantly: {campaign}")
    ok = push_to_instantly(sendable, campaign, dry_run=not live)

    print("\n=== Summary ===")
    print(f"  Leads with video:  {len(leads)}")
    print(f"  Emails discovered: {len(sendable)}")
    print(f"  {'PUSHED' if ok and live else 'Dry run (use --live to send)'}")
    if not live and sendable:
        s = sendable[0]
        print(f"\n  Sample — {s['email']}")
        print(f"  Subject: {s['email_subject']}")


def main():
    p = argparse.ArgumentParser(description="Denver-plumbing email agent")
    p.add_argument("--limit", type=int, default=None,
                   help="Only process the first N leads (testing)")
    p.add_argument("--live", action="store_true",
                   help="Actually push to Instantly (default is dry run)")
    p.add_argument("--skip-discovery", action="store_true",
                   help="Use cached emails only — no Places/scrape calls")
    p.add_argument("--discover-only", action="store_true",
                   help="Only build the email cache over all 121 (no video, no send)")
    args = p.parse_args()
    if args.discover_only:
        discover_only(limit=args.limit)
    else:
        run(limit=args.limit, live=args.live, skip_discovery=args.skip_discovery)


if __name__ == "__main__":
    main()
