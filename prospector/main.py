#!/usr/bin/env python3
"""Jontri AI Prospecting Agent - qualifies leads and sends personalized emails via Instantly."""

import argparse
import time
from datetime import datetime
from apollo_client import load_leads_from_csv
from qualifier import qualify_lead, generate_email
from emailer import push_to_instantly
from exporter import export_leads
from client_loader import list_clients, load_client_config
from gmaps_scraper import load_leads_from_gmaps
from site_scorer import score_website, filter_by_score
from site_generator import generate_and_save
from deployer import deploy_demo
import config


def run_prospecting(
    csv_path: str | None = None,
    min_score: int | None = None,
    send_emails: bool = False,
    dry_run: bool = True,
):
    """Main prospecting pipeline."""
    if min_score is None:
        min_score = config.QUALIFICATION.get("min_score", 6)

    campaign_prefix = config.INSTANTLY_CONFIG.get("campaign_prefix", "")
    print("\n=== Jontri AI Prospecting Agent ===\n")

    # Step 1: Load leads from Apollo CSV
    print("[1/4] Loading leads from Apollo CSV...")
    leads = load_leads_from_csv(csv_path)
    print(f"  Found {len(leads)} leads\n")

    if not leads:
        print("No leads found. Export a CSV from Apollo and place it in the project folder.")
        return

    # Step 2: Qualify leads with AI
    print(f"[2/4] Qualifying leads with AI (min score: {min_score})...")
    qualified = []
    for i, lead in enumerate(leads):
        print(f"  ({i+1}/{len(leads)}) Qualifying {lead['first_name']} {lead['last_name']} at {lead['company']}...")
        result = qualify_lead(lead)
        if result and result.get("score", 0) >= min_score:
            lead["ai_score"] = result["score"]
            lead["ai_reasoning"] = result.get("reasoning", "")
            lead["pain_points"] = ", ".join(result.get("pain_points", []))
            lead["_qualification"] = result
            qualified.append(lead)
            print(f"    Score: {result['score']}/10 - QUALIFIED")
        elif result:
            print(f"    Score: {result['score']}/10 - below threshold")
        time.sleep(0.5)

    print(f"\n  {len(qualified)} of {len(leads)} leads qualified (score >= {min_score})\n")

    if not qualified:
        print("No leads qualified. Try lowering the min_score threshold.")
        return

    # Step 3: Generate personalized emails
    print("[3/4] Generating personalized emails...")
    for i, lead in enumerate(qualified):
        print(f"  ({i+1}/{len(qualified)}) Drafting email for {lead['first_name']} {lead['last_name']}...")
        email_data = generate_email(lead, lead["_qualification"])
        if email_data:
            lead["email_subject"] = email_data.get("subject", "")
            lead["email_body"] = email_data.get("body", "")
            lead["email_sent"] = False
        time.sleep(0.5)

    # Step 4: Push to Instantly.ai
    if send_emails:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        prefix = f"{campaign_prefix} - " if campaign_prefix else "Jontri Prospector - "
        campaign_name = f"{prefix}{timestamp}"
        print(f"\n[4/4] {'[DRY RUN] ' if dry_run else ''}Pushing to Instantly.ai...")
        success = push_to_instantly(qualified, campaign_name, dry_run=dry_run)
        if success and not dry_run:
            for lead in qualified:
                lead["email_sent"] = True
    else:
        print("\n[4/4] Skipping Instantly push (use --send-emails to enable)")

    # Export results
    print("\n[Export] Saving results to CSV...")
    for lead in qualified:
        lead.pop("_qualification", None)
        lead.pop("keywords", None)
        lead.pop("technologies", None)

    filepath = export_leads(qualified)

    # Print summary
    print("\n=== Summary ===")
    print(f"  Leads loaded:    {len(leads)}")
    print(f"  Leads qualified: {len(qualified)}")
    pushed = sum(1 for l in qualified if l.get("email_sent"))
    print(f"  Pushed to Instantly: {pushed}")
    print(f"  Results saved:   {filepath}")
    print()


def run_website_agent(
    query: str,
    max_leads: int | None = None,
    max_site_score: int | None = None,
    send_emails: bool = False,
    dry_run: bool = True,
):
    """Website Agent pipeline — discover leads, score sites, generate demos, deploy, and email."""
    wa = config.WEBSITE_AGENT
    if max_leads is None:
        max_leads = wa.get("max_leads", 20)
    if max_site_score is None:
        max_site_score = wa.get("max_site_score", 5)

    api_key = config.GOOGLE_MAPS_API_KEY
    netlify_token = config.NETLIFY_API_TOKEN

    print("\n=== Jontri Website Agent ===\n")

    if not api_key:
        print("ERROR: GOOGLE_MAPS_API_KEY not set. Add it to your .env file.")
        print("  You need a Google Cloud project with the Places API enabled.")
        return

    # Step 1: Discover leads from Google Maps
    print(f'[1/5] Discovering leads from Google Maps: "{query}"')
    leads = load_leads_from_gmaps(
        query=query,
        api_key=api_key,
        max_results=max_leads,
        require_website=wa.get("require_website", True),
    )
    print(f"  Found {len(leads)} leads with websites\n")

    if not leads:
        print("No leads found. Try a different search query.")
        return

    # Step 2: Score their websites
    print(f"[2/5] Scoring websites (threshold: {max_site_score}/10)...")
    for i, lead in enumerate(leads):
        url = lead.get("company_website", "")
        if not url:
            continue
        print(f"  ({i+1}/{len(leads)}) Scoring {lead['company']} — {url}")
        result = score_website(url, lead["company"], lead.get("industry", ""))
        if result:
            lead["site_score"] = result.get("score", 10)
            lead["site_issues"] = ", ".join(result.get("issues", []))
            lead["_site_scoring"] = result
            lead["_scraped"] = result.get("scraped", {})
            print(f"    Score: {result['score']}/10 — {'WORTH REDESIGNING' if result.get('worth_redesigning') else 'skip'}")
        else:
            lead["site_score"] = 10  # Skip if scoring fails
        time.sleep(0.3)

    # Filter to low-scoring sites
    qualified = filter_by_score(leads, max_score=max_site_score)
    print(f"\n  {len(qualified)} of {len(leads)} sites qualify for redesign (score <= {max_site_score})\n")

    if not qualified:
        print("No sites qualified for redesign. Try raising --max-site-score.")
        return

    # Step 3: Generate demo websites
    print(f"[3/5] Generating demo websites for {len(qualified)} businesses...")
    generated = []
    for i, lead in enumerate(qualified):
        print(f"  ({i+1}/{len(qualified)}) Building demo for {lead['company']}...")
        result = generate_and_save(lead)
        if result["status"] == "success":
            generated.append(lead)
            print(f"    Saved to {result['html_path']}")
        else:
            print(f"    {result['status']}: {result.get('reason', 'generation failed')}")

    print(f"\n  Generated {len(generated)} demo sites\n")

    if not generated:
        print("No demo sites were generated successfully.")
        return

    # Step 4: Deploy demos
    print(f"[4/5] {'[DRY RUN] ' if dry_run else ''}Deploying demo sites...")
    for i, lead in enumerate(generated):
        html_path = lead.get("_demo_html_path", "")
        if not html_path:
            continue
        result = deploy_demo(
            html_path=html_path,
            business_name=lead["company"],
            netlify_token=netlify_token,
            dry_run=dry_run,
        )
        lead["demo_url"] = result.get("deploy_url", "")

    # Step 5: Generate outreach emails and push to Instantly
    print(f"\n[5/5] Generating outreach emails...")
    for i, lead in enumerate(generated):
        print(f"  ({i+1}/{len(generated)}) Drafting email for {lead['company']}...")
        qual_data = {
            "score": lead.get("site_score", 0),
            "pain_points": lead.get("site_issues", "").split(", "),
            "personalized_hook": f"I noticed your website at {lead.get('company_website', '')} could use a refresh",
        }
        email_data = generate_email(lead, qual_data)
        if email_data:
            # Inject demo URL into the email body
            demo_url = lead.get("demo_url", "")
            if demo_url and not demo_url.startswith("file:///"):
                body = email_data.get("body", "")
                demo_line = f"\n\nI actually went ahead and built a quick preview of what your new site could look like: {demo_url}"
                email_data["body"] = body + demo_line
            lead["email_subject"] = email_data.get("subject", "")
            lead["email_body"] = email_data.get("body", "")
            lead["email_sent"] = False
        time.sleep(0.3)

    if send_emails:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        campaign_name = f"Website Agent - {query} - {timestamp}"
        print(f"\n  {'[DRY RUN] ' if dry_run else ''}Pushing to Instantly.ai...")
        success = push_to_instantly(generated, campaign_name, dry_run=dry_run)
        if success and not dry_run:
            for lead in generated:
                lead["email_sent"] = True
    else:
        print("\n  Skipping Instantly push (use --send-emails to enable)")

    # Export results
    print("\n[Export] Saving results to CSV...")
    for lead in generated:
        lead.pop("_site_scoring", None)
        lead.pop("_scraped", None)
        lead.pop("_demo_html_path", None)
        lead.pop("_qualification", None)
        lead.pop("keywords", None)
        lead.pop("technologies", None)

    filepath = export_leads(generated)

    # Summary
    print("\n=== Website Agent Summary ===")
    print(f"  Leads discovered:    {len(leads)}")
    print(f"  Sites worth redesign: {len(qualified)}")
    print(f"  Demos generated:     {len(generated)}")
    deployed = sum(1 for l in generated if l.get("demo_url") and not l["demo_url"].startswith("file:///"))
    print(f"  Demos deployed:      {deployed}")
    pushed = sum(1 for l in generated if l.get("email_sent"))
    print(f"  Emails pushed:       {pushed}")
    print(f"  Results saved:       {filepath}")
    print()


def main():
    parser = argparse.ArgumentParser(description="Jontri AI Prospecting Agent")
    parser.add_argument("--mode", choices=["email", "website-agent"], default="email",
                        help="Pipeline mode: 'email' (Apollo CSV) or 'website-agent' (Google Maps → demo sites)")
    parser.add_argument("--client", type=str, default=None, help="Client config to load (folder name under clients/)")
    parser.add_argument("--csv", type=str, default=None, help="Path to Apollo CSV export (auto-detects if not specified)")
    parser.add_argument("--min-score", type=int, default=None, help="Minimum AI qualification score 1-10 (overrides client config)")
    parser.add_argument("--send-emails", action="store_true", help="Push leads to Instantly.ai campaign")
    parser.add_argument("--live", action="store_true", help="Actually push to Instantly / deploy sites (default is dry run)")
    parser.add_argument("--list-clients", action="store_true", help="List available client configs and exit")
    # Website agent options
    parser.add_argument("--query", type=str, default=None,
                        help="Google Maps search query for website-agent mode (e.g. 'plumbers in Dallas')")
    parser.add_argument("--max-leads", type=int, default=None, help="Max leads to discover (website-agent mode)")
    parser.add_argument("--max-site-score", type=int, default=None,
                        help="Max website score for redesign qualification (1-10, default 5)")
    args = parser.parse_args()

    if args.list_clients:
        clients = list_clients()
        if clients:
            print("Available client configs:")
            for c in clients:
                print(f"  - {c}")
        else:
            print("No client configs found. Copy templates/client_config.template.json to clients/<name>/config.json")
        return

    if args.client:
        print(f"Loading client config: {args.client}")
        client_config = load_client_config(args.client)
        config.apply_client_config(client_config)
        print(f"  Client: {client_config.get('client', {}).get('name', args.client)}")
        print(f"  Sender: {config.FROM_NAME} ({config.FROM_COMPANY})")
        print(f"  ICP keywords: {config.ICP.get('q_keywords', 'N/A')}")

    if args.mode == "website-agent":
        query = args.query or config.WEBSITE_AGENT.get("gmaps_query", "")
        if not query:
            print("ERROR: --query is required for website-agent mode.")
            print('  Example: --mode website-agent --query "plumbers in Dallas"')
            return
        run_website_agent(
            query=query,
            max_leads=args.max_leads,
            max_site_score=args.max_site_score,
            send_emails=args.send_emails,
            dry_run=not args.live,
        )
    else:
        run_prospecting(
            csv_path=args.csv,
            min_score=args.min_score,
            send_emails=args.send_emails,
            dry_run=not args.live,
        )


if __name__ == "__main__":
    main()
