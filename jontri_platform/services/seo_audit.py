"""SEO Audit service — analyze a client's website and generate optimization report."""

import json
import os
from datetime import datetime
from jontri_platform.services.base import BaseService


class SEOAuditService(BaseService):
    name = "seo-audit"
    description = "Automated SEO audit with AI-powered recommendations"
    category = "marketing"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "website": kwargs.get("website") or client.get("website", ""),
            "industry": client.get("industry", ""),
            "business_name": client.get("name", ""),
            "competitors": kwargs.get("competitors", []),
            "target_keywords": kwargs.get("target_keywords", []),
            "location": kwargs.get("location", "Colorado"),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== SEO Audit: {client_slug} ===\n")

        if not config.get("website"):
            print("  No website configured. Set 'website' in client config or pass --website")
            return {"status": "error", "error": "No website configured"}

        audit = {
            "client": client_slug,
            "website": config["website"],
            "industry": config["industry"],
            "checklist": [
                {"item": "Title tags", "status": "pending"},
                {"item": "Meta descriptions", "status": "pending"},
                {"item": "H1/H2 structure", "status": "pending"},
                {"item": "Image alt tags", "status": "pending"},
                {"item": "Mobile responsiveness", "status": "pending"},
                {"item": "Page speed", "status": "pending"},
                {"item": "Google Business Profile", "status": "pending"},
                {"item": "Local citations (NAP consistency)", "status": "pending"},
                {"item": "Schema markup", "status": "pending"},
                {"item": "Internal linking", "status": "pending"},
                {"item": "Backlink profile", "status": "pending"},
                {"item": "Content quality & freshness", "status": "pending"},
            ],
            "target_keywords": config.get("target_keywords", []),
            "competitors": config.get("competitors", []),
            "created_at": datetime.now().isoformat(),
        }

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "output", client_slug)
        os.makedirs(output_dir, exist_ok=True)

        if dry_run:
            print(f"  [DRY RUN] Would audit: {config['website']}")
            print(f"  [DRY RUN] Checklist: {len(audit['checklist'])} items")
            return {"status": "dry_run", "website": config["website"]}

        audit_path = os.path.join(output_dir, f"seo_audit_{datetime.now().strftime('%Y%m%d')}.json")
        with open(audit_path, "w", encoding="utf-8") as f:
            json.dump(audit, f, indent=2)

        print(f"  Audit template saved to {audit_path}")
        print(f"  Website: {config['website']}")
        print(f"  {len(audit['checklist'])} audit items queued")

        return {"status": "configured", "audit_path": audit_path, "items": len(audit["checklist"])}
