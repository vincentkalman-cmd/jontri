#!/usr/bin/env python3
"""Generic services-blast agent — client-config-driven cold email at scale.

Reads clients/<client>/lead-manifest.json (built by build_list.py, which
already stores each business's website), deep-scrapes a contact email per
lead (reusing the Playwright scraper), builds a personalized plain-text
pitch from the client config's service_focus + email guidelines, and
pushes to Instantly.

Unlike the website+video agent this sends NO image/video — it's a pure
services pitch, so plain text (best B2B cold deliverability). Email
discovery is cached + resumable. Sending is DRY-RUN unless --live.

  python blast_agent.py --client phoenix-roofing-ai --discover-only
  python blast_agent.py --client phoenix-roofing-ai            # dry run
  python blast_agent.py --client phoenix-roofing-ai --live     # send
"""

import argparse
import json
import os
import time
from datetime import datetime

import config
from client_loader import load_client_config
from emailer import push_to_instantly
from denver_email_agent import scrape_email_js  # shared Playwright scraper


def paths(client: str):
    d = os.path.join(os.path.dirname(__file__), "..", "clients", client)
    return d, os.path.join(d, "lead-manifest.json"), os.path.join(d, "email-enriched.json")


def load_cache(cache_file: str) -> dict:
    if os.path.exists(cache_file):
        with open(cache_file, encoding="utf-8") as f:
            return {e["slug"]: e for e in json.load(f)}
    return {}


def save_cache(cache_file: str, cache: dict):
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(list(cache.values()), f, indent=2)


class _SafeDict(dict):
    """format_map helper: unknown placeholders render empty, never crash."""

    def __missing__(self, key):
        return ""


# Generic, niche-NEUTRAL fallback used only if a client config omits its
# own templates. Deliberately not roofing/plumbing copy so a misconfigured
# client degrades gracefully instead of leaking another niche's pitch.
_DEFAULT_SUBJECT = "{name} — the calls you're missing"
_DEFAULT_BODY = (
    "Hi — I'm {from_name} with {from_company}.\n\n"
    "Quick one for {name}: when your team's heads-down on the job, the calls "
    "that come in often go unanswered — and that new business goes to whoever "
    "picked up first.\n\n"
    "We set up {service_focus}. It answers every call 24/7, books the "
    "appointment, and follows up automatically — no new hire, no software for "
    "your team to learn.\n\n"
    "Worth a 15-minute look? Grab a time here: {booking_url}\n\n"
    "— {from_name}\n{from_company}"
)


def build_email(lead: dict) -> dict:
    """Personalized plain-text pitch from client-config templates.

    Deterministic (no LLM): consistent voice across a blast, zero parse
    risk, instant. ALL niche copy lives in clients/<client>/config.json
    (email.template_subject / email.template_body) — this function is
    niche-agnostic. Available placeholders: {name} {city} {from_name}
    {from_company} {booking_url} {service_focus}.
    """
    fields = _SafeDict(
        name=lead["name"],
        city=lead.get("city") or "your area",
        from_name=config.FROM_NAME,
        from_company=config.FROM_COMPANY,
        booking_url=config.BOOKING_URL,
        service_focus=config.QUALIFICATION.get("service_focus", ""),
    )
    subject_t = config.EMAIL_CONFIG.get("template_subject") or _DEFAULT_SUBJECT
    body_t = config.EMAIL_CONFIG.get("template_body") or _DEFAULT_BODY
    return {
        "subject": subject_t.format_map(fields).strip(),
        "body": body_t.format_map(fields).strip(),
    }


def run(client: str, limit, live: bool, skip_discovery: bool, discover_only: bool):
    cfg = load_client_config(client)
    config.apply_client_config(cfg)
    _, manifest_file, cache_file = paths(client)

    if not os.path.exists(manifest_file):
        print(f"ERROR: {manifest_file} not found. Run build_list.py --client {client} --no-score first.")
        return

    with open(manifest_file, encoding="utf-8") as f:
        manifest = json.load(f)
    leads = manifest[:limit] if limit else manifest
    cache = load_cache(cache_file)

    # --- Step 1: email discovery (cached, resumable) ---
    print(f"\n[1/{'1' if discover_only else '3'}] Email discovery for {len(leads)} leads "
          f"({sum(1 for l in leads if l['slug'] in cache)} cached)...")
    found = 0
    for i, lead in enumerate(leads):
        slug = lead["slug"]
        if slug in cache and "email" in cache[slug]:
            lead["email"] = cache[slug].get("email", "")
            if lead["email"]:
                found += 1
            continue
        if skip_discovery:
            lead["email"] = ""
            continue
        site = lead.get("website", "")
        print(f"  ({i+1}/{len(leads)}) {lead['name'][:42]:44}", end=" ", flush=True)
        res = scrape_email_js(site) if site else {"email": "", "all_emails": []}
        lead["email"] = res["email"]
        cache[slug] = {"slug": slug, "name": lead["name"], "website": site,
                       "email": res["email"], "email_candidates": res["all_emails"]}
        save_cache(cache_file, cache)
        if res["email"]:
            found += 1
        print(res["email"] or "<none>")
        time.sleep(0.4)

    pct = round(found / len(leads) * 100) if leads else 0
    print(f"\n  Emailable: {found}/{len(leads)} ({pct}%)")

    if discover_only:
        print(f"  Cache: {os.path.relpath(cache_file)}")
        return

    # --- Step 2: build emails ---
    sendable = [l for l in leads if l.get("email")]
    print(f"\n[2/3] Building {len(sendable)} personalized pitches...")
    for lead in sendable:
        e = build_email(lead)
        lead["company"] = lead["name"]
        lead["first_name"] = ""
        lead["last_name"] = ""
        lead["email_subject"] = e["subject"]
        lead["email_body"] = e["body"]

    if not sendable:
        print("\nNo emailable leads. Nothing to push.")
        return

    # --- Step 3: push to Instantly ---
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    prefix = config.INSTANTLY_CONFIG.get("campaign_prefix", "Blast")
    campaign = f"{prefix} - {ts}"
    print(f"\n[3/3] {'[DRY RUN] ' if not live else ''}Pushing to Instantly: {campaign}")
    ok = push_to_instantly(sendable, campaign, dry_run=not live)

    print("\n=== Summary ===")
    print(f"  Leads:     {len(leads)}")
    print(f"  Emailable: {len(sendable)}")
    print(f"  {'PUSHED' if ok and live else 'Dry run (use --live to send)'}")
    if not live and sendable:
        s = sendable[0]
        print(f"\n  Sample — {s['email']}\n  Subject: {s['email_subject']}\n")
        print("  " + s["email_body"].replace("\n", "\n  "))


def main():
    p = argparse.ArgumentParser(description="Generic services-blast agent")
    p.add_argument("--client", required=True)
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--live", action="store_true", help="Actually push to Instantly")
    p.add_argument("--skip-discovery", action="store_true", help="Use cached emails only")
    p.add_argument("--discover-only", action="store_true", help="Only build the email cache")
    a = p.parse_args()
    run(a.client, a.limit, a.live, a.skip_discovery, a.discover_only)


if __name__ == "__main__":
    main()
