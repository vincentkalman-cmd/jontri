"""Lead generation service — Apollo CSV → AI qualify → personalized emails → Instantly.ai"""

import os
import sys
import time
import json
import csv
import glob as globmod
from datetime import datetime

from jontri_platform.services.base import BaseService

# Add prospector to path so we can reuse its modules
PROSPECTOR_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "prospector")
if PROSPECTOR_DIR not in sys.path:
    sys.path.insert(0, PROSPECTOR_DIR)


class ProspectorService(BaseService):
    name = "prospector"
    description = "AI-powered lead generation: find, qualify, and email prospects"
    category = "lead-gen"

    def configure(self, client_config: dict, **kwargs) -> dict:
        qual = client_config.get("qualification", {})
        email_cfg = client_config.get("email", {})
        sender = client_config.get("sender", {})
        return {
            "min_score": kwargs.get("min_score") or qual.get("min_score", 6),
            "send_emails": kwargs.get("send_emails", False),
            "csv_path": kwargs.get("csv_path"),
            "qualification": qual,
            "email_config": email_cfg,
            "sender": sender,
            "icp": client_config.get("icp", {}),
            "instantly": client_config.get("instantly", {}),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        # Apply client config to the prospector's global config module
        import config as prospector_config
        from apollo_client import load_leads_from_csv
        from qualifier import qualify_lead, generate_email
        from emailer import push_to_instantly
        from exporter import export_leads

        # Apply sender settings
        sender = config.get("sender", {})
        if sender.get("from_name"):
            prospector_config.FROM_NAME = sender["from_name"]
        if sender.get("from_title"):
            prospector_config.FROM_TITLE = sender["from_title"]
        if sender.get("from_company"):
            prospector_config.FROM_COMPANY = sender["from_company"]
        if sender.get("booking_url"):
            prospector_config.BOOKING_URL = sender["booking_url"]

        if config.get("icp"):
            prospector_config.ICP.update(config["icp"])
        if config.get("qualification"):
            prospector_config.QUALIFICATION.update(config["qualification"])
        if config.get("email_config"):
            prospector_config.EMAIL_CONFIG.update(config["email_config"])
        if config.get("instantly"):
            prospector_config.INSTANTLY_CONFIG.update(config["instantly"])

        min_score = config["min_score"]
        send_emails = config["send_emails"]
        csv_path = config.get("csv_path")

        print(f"\n=== Prospector: {client_slug} ===\n")

        # Step 1: Load leads
        print("[1/4] Loading leads from Apollo CSV...")
        leads = load_leads_from_csv(csv_path)
        print(f"  Found {len(leads)} leads\n")

        if not leads:
            return {"status": "no_leads", "leads_loaded": 0, "leads_qualified": 0, "leads_emailed": 0}

        # Step 2: Qualify
        print(f"[2/4] Qualifying leads (min score: {min_score})...")
        qualified = []
        for i, lead in enumerate(leads):
            print(f"  ({i+1}/{len(leads)}) {lead['first_name']} {lead['last_name']} @ {lead['company']}...")
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

        print(f"\n  {len(qualified)}/{len(leads)} qualified\n")

        if not qualified:
            return {"status": "none_qualified", "leads_loaded": len(leads), "leads_qualified": 0, "leads_emailed": 0}

        # Step 3: Generate emails
        print("[3/4] Generating personalized emails...")
        for i, lead in enumerate(qualified):
            print(f"  ({i+1}/{len(qualified)}) Email for {lead['first_name']} {lead['last_name']}...")
            email_data = generate_email(lead, lead["_qualification"])
            if email_data:
                lead["email_subject"] = email_data.get("subject", "")
                lead["email_body"] = email_data.get("body", "")
                lead["email_sent"] = False
            time.sleep(0.5)

        # Step 4: Push to Instantly
        pushed = 0
        if send_emails:
            prefix = config.get("instantly", {}).get("campaign_prefix", "")
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
            campaign_name = f"{prefix + ' - ' if prefix else ''}{client_slug} - {timestamp}"
            print(f"\n[4/4] {'[DRY RUN] ' if dry_run else ''}Pushing to Instantly...")
            success = push_to_instantly(qualified, campaign_name, dry_run=dry_run)
            if success and not dry_run:
                for lead in qualified:
                    lead["email_sent"] = True
                pushed = len(qualified)
        else:
            print("\n[4/4] Skipping Instantly (use --send-emails to enable)")

        # Export
        for lead in qualified:
            lead.pop("_qualification", None)
            lead.pop("keywords", None)
            lead.pop("technologies", None)

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "output", client_slug)
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = os.path.join(output_dir, f"prospects_{timestamp}.csv")

        fieldnames = [
            "first_name", "last_name", "title", "email", "phone",
            "company", "industry", "employee_count", "city", "state",
            "linkedin_url", "company_website", "annual_revenue",
            "ai_score", "ai_reasoning", "pain_points",
            "email_subject", "email_body", "email_sent",
        ]
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(qualified)

        print(f"\n  Exported to {filepath}")

        return {
            "status": "completed",
            "leads_loaded": len(leads),
            "leads_qualified": len(qualified),
            "leads_emailed": pushed,
            "export_path": filepath,
        }
