"""Website Builder service — generate client landing pages from templates."""

import json
import os
from datetime import datetime
from jontri_platform.services.base import BaseService


class WebsiteService(BaseService):
    name = "website"
    description = "AI-powered landing page and website generation for client businesses"
    category = "web"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "business_name": client.get("name", ""),
            "industry": client.get("industry", ""),
            "description": client.get("description", ""),
            "template": kwargs.get("template", "service-business"),
            "pages": kwargs.get("pages", ["home", "services", "about", "contact"]),
            "color_scheme": kwargs.get("color_scheme", "professional"),
            "include_chatbot": kwargs.get("include_chatbot", True),
            "include_booking": kwargs.get("include_booking", True),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== Website Builder: {client_slug} ===\n")

        site_config = {
            "client": client_slug,
            "business_name": config["business_name"],
            "template": config["template"],
            "pages": config["pages"],
            "features": {
                "chatbot": config["include_chatbot"],
                "booking": config["include_booking"],
            },
            "created_at": datetime.now().isoformat(),
        }

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "deployments", client_slug)
        os.makedirs(output_dir, exist_ok=True)

        if dry_run:
            print(f"  [DRY RUN] Would generate website for {config['business_name']}")
            print(f"  [DRY RUN] Template: {config['template']}")
            print(f"  [DRY RUN] Pages: {', '.join(config['pages'])}")
            print(f"  [DRY RUN] Chatbot: {'yes' if config['include_chatbot'] else 'no'}")
            print(f"  [DRY RUN] Booking: {'yes' if config['include_booking'] else 'no'}")
            return {"status": "dry_run", "config": site_config}

        config_path = os.path.join(output_dir, "website.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(site_config, f, indent=2)

        print(f"  Website config saved to {config_path}")
        return {"status": "configured", "config_path": config_path}
