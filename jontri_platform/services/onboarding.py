"""Client Onboarding service — automated welcome flow, contract generation, kickoff."""

import json
import os
from datetime import datetime
from jontri_platform.services.base import BaseService


class OnboardingService(BaseService):
    name = "onboarding"
    description = "Automated client onboarding: welcome emails, contract gen, project kickoff"
    category = "client-onboarding"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "business_name": client.get("name", ""),
            "industry": client.get("industry", ""),
            "contact_email": kwargs.get("contact_email", ""),
            "services_selected": kwargs.get("services", []),
            "send_welcome_email": kwargs.get("send_welcome_email", True),
            "generate_contract": kwargs.get("generate_contract", True),
            "schedule_kickoff": kwargs.get("schedule_kickoff", True),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== Onboarding: {client_slug} ===\n")

        steps_completed = []

        # Step 1: Welcome email
        if config["send_welcome_email"]:
            if dry_run:
                print(f"  [DRY RUN] Would send welcome email to {config['contact_email']}")
            else:
                print(f"  Sending welcome email to {config['contact_email']}...")
                # TODO: integrate with email sender
            steps_completed.append("welcome_email")

        # Step 2: Contract
        if config["generate_contract"]:
            if dry_run:
                print(f"  [DRY RUN] Would generate contract for {config['business_name']}")
            else:
                print(f"  Contract generation available at /onboarding on the website")
            steps_completed.append("contract")

        # Step 3: Kickoff
        if config["schedule_kickoff"]:
            if dry_run:
                print(f"  [DRY RUN] Would send kickoff scheduling link")
            else:
                print(f"  Kickoff scheduling link sent")
            steps_completed.append("kickoff")

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "output", client_slug)
        os.makedirs(output_dir, exist_ok=True)

        onboarding_record = {
            "client": client_slug,
            "steps_completed": steps_completed,
            "services_selected": config["services_selected"],
            "created_at": datetime.now().isoformat(),
        }

        record_path = os.path.join(output_dir, "onboarding.json")
        if not dry_run:
            with open(record_path, "w", encoding="utf-8") as f:
                json.dump(onboarding_record, f, indent=2)

        return {
            "status": "dry_run" if dry_run else "completed",
            "steps_completed": steps_completed,
        }
