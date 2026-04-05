"""Review & Reputation Management service."""

import json
import os
from datetime import datetime
from jontri_platform.services.base import BaseService


class ReviewManagementService(BaseService):
    name = "review-mgmt"
    description = "Automated review requests, monitoring, and reputation management"
    category = "marketing"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "business_name": client.get("name", ""),
            "industry": client.get("industry", ""),
            "google_business_url": kwargs.get("google_business_url", ""),
            "review_platforms": kwargs.get("review_platforms", ["google", "yelp"]),
            "request_delay_hours": kwargs.get("request_delay_hours", 24),
            "request_template": kwargs.get("request_template",
                "Hi {customer_name}, thanks for choosing {business_name}! "
                "We'd love to hear about your experience. "
                "Would you mind leaving us a quick review? {review_link}"
            ),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== Review Management: {client_slug} ===\n")

        review_config = {
            "client": client_slug,
            "business_name": config["business_name"],
            "platforms": config["review_platforms"],
            "request_delay_hours": config["request_delay_hours"],
            "request_template": config["request_template"],
            "google_business_url": config["google_business_url"],
            "created_at": datetime.now().isoformat(),
        }

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "deployments", client_slug)
        os.makedirs(output_dir, exist_ok=True)

        if dry_run:
            print(f"  [DRY RUN] Would configure review management for {config['business_name']}")
            print(f"  [DRY RUN] Platforms: {', '.join(config['review_platforms'])}")
            print(f"  [DRY RUN] Auto-request delay: {config['request_delay_hours']}h after service")
            return {"status": "dry_run", "config": review_config}

        config_path = os.path.join(output_dir, "review_mgmt.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(review_config, f, indent=2)

        print(f"  Review management config saved to {config_path}")
        return {"status": "configured", "config_path": config_path}
