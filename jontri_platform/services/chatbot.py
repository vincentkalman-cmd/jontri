"""AI Chatbot service — deploy a website chatbot for client businesses."""

import json
import os
from datetime import datetime
from jontri_platform.services.base import BaseService


class ChatbotService(BaseService):
    name = "chatbot"
    description = "AI-powered website chatbot for lead capture and customer support"
    category = "client-engagement"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "business_name": client.get("name", ""),
            "industry": client.get("industry", ""),
            "website": client.get("website", ""),
            "tone": kwargs.get("tone", "friendly and professional"),
            "goals": kwargs.get("goals", ["answer FAQs", "capture leads", "book appointments"]),
            "faqs": kwargs.get("faqs", []),
            "collect_fields": kwargs.get("collect_fields", ["name", "email", "phone", "message"]),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== Chatbot: {client_slug} ===\n")

        goals = "\n".join(f"- {g}" for g in config["goals"])
        chatbot_config = {
            "client": client_slug,
            "system_prompt": f"""You are a helpful assistant on the {config['business_name']} website.

Your goals:
{goals}

Tone: {config['tone']}

Rules:
- Be concise and helpful
- If you can answer a question, do so directly
- For service inquiries, collect the visitor's name, email, and phone
- Never make up pricing or availability — say "let me connect you with our team"
- If asked something outside your scope, offer to have someone follow up""",
            "collect_fields": config["collect_fields"],
            "created_at": datetime.now().isoformat(),
        }

        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "deployments", client_slug)
        os.makedirs(output_dir, exist_ok=True)

        if dry_run:
            print(f"  [DRY RUN] Would deploy chatbot for {config['business_name']}")
            print(f"  [DRY RUN] Goals: {', '.join(config['goals'])}")
            return {"status": "dry_run", "config": chatbot_config}

        config_path = os.path.join(output_dir, "chatbot.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(chatbot_config, f, indent=2)

        print(f"  Chatbot config saved to {config_path}")
        return {"status": "configured", "config_path": config_path}
