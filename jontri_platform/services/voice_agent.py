"""AI Voice Agent service — configure and deploy voice agents via Vapi."""

import os
import json
import requests
from datetime import datetime
from jontri_platform.services.base import BaseService

VAPI_BASE_URL = "https://api.vapi.ai"


def _vapi_headers(api_key: str):
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


class VoiceAgentService(BaseService):
    name = "voice-agent"
    description = "AI voice agent for inbound/outbound calls, appointment booking, FAQs (powered by Vapi)"
    category = "calls-scheduling"

    def configure(self, client_config: dict, **kwargs) -> dict:
        client = client_config.get("client", {})
        return {
            "business_name": client.get("name", ""),
            "industry": client.get("industry", ""),
            "mode": kwargs.get("mode", "inbound"),
            "greeting": kwargs.get(
                "greeting",
                f"Hi, thanks for calling {client.get('name', 'our office')}. How can I help you today?",
            ),
            "capabilities": kwargs.get(
                "capabilities",
                [
                    "answer FAQs",
                    "book appointments",
                    "take messages",
                    "transfer to human",
                ],
            ),
            "services_offered": kwargs.get("services_offered", ""),
            "booking_url": kwargs.get("booking_url", ""),
            "business_hours": kwargs.get("business_hours", "Monday-Friday 8am-6pm"),
            "transfer_number": kwargs.get("transfer_number", ""),
            "business_phone": kwargs.get("business_phone", ""),
            "website_url": kwargs.get("website_url", ""),
            "knowledge_base": kwargs.get("knowledge_base", ""),
            "vapi_api_key": kwargs.get("vapi_api_key", ""),
        }

    def run(self, client_slug: str, config: dict, dry_run: bool = True, **kwargs) -> dict:
        print(f"\n=== Voice Agent (Vapi): {client_slug} ===\n")

        system_prompt = self._build_system_prompt(config)

        if dry_run:
            print(f"  [DRY RUN] Would deploy Vapi voice agent:")
            print(f"    Business: {config['business_name']}")
            print(f"    Mode: {config['mode']}")
            print(f"    Greeting: {config['greeting'][:80]}...")
            print(f"    Capabilities: {', '.join(config['capabilities'])}")
            return {"status": "dry_run", "system_prompt": system_prompt}

        vapi_key = config.get("vapi_api_key") or os.getenv("VAPI_API_KEY", "")
        if not vapi_key:
            print("  ERROR: No Vapi API key provided (pass vapi_api_key or set VAPI_API_KEY)")
            return {"status": "error", "error": "Vapi API key not configured"}

        # Check if assistant already exists for this client
        existing_id = kwargs.get("vapi_assistant_id")
        if existing_id:
            result = self._update_assistant(existing_id, config, system_prompt, vapi_key)
        else:
            result = self._create_assistant(client_slug, config, system_prompt, vapi_key)

        if result.get("status") == "error":
            return result

        # Buy/assign a phone number if requested and not already assigned
        assistant_id = result["assistant_id"]
        phone_number_id = kwargs.get("vapi_phone_number_id")
        if not phone_number_id and config.get("mode") in ("inbound", "both"):
            phone_result = self._setup_phone_number(assistant_id, vapi_key)
            if phone_result:
                result["phone_number_id"] = phone_result.get("id")
                result["phone_number"] = phone_result.get("number")

        # Save config locally for reference
        output_dir = os.path.join(
            os.path.dirname(__file__), "..", "..", "data", "deployments", client_slug
        )
        os.makedirs(output_dir, exist_ok=True)
        config_path = os.path.join(output_dir, "voice_agent.json")
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "client": client_slug,
                    "vapi_assistant_id": result["assistant_id"],
                    "phone_number_id": result.get("phone_number_id"),
                    "phone_number": result.get("phone_number"),
                    "system_prompt": system_prompt,
                    "config": config,
                    "deployed_at": datetime.now().isoformat(),
                },
                f,
                indent=2,
            )

        print(f"  Vapi assistant deployed: {result['assistant_id']}")
        if result.get("phone_number"):
            print(f"  Phone number: {result['phone_number']}")

        return result

    def _create_assistant(self, client_slug: str, config: dict, system_prompt: str, api_key: str) -> dict:
        """Create a new Vapi assistant."""
        payload = {
            "name": f"{config['business_name']} - AI Phone Agent",
            "model": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "system", "content": system_prompt}],
            },
            "voice": {
                "provider": "11labs",
                "voiceId": "21m00Tcm4TlvDq8ikWAM",  # Rachel - professional female
            },
            "firstMessage": config["greeting"],
            "endCallMessage": "Thank you for calling! Have a great day.",
            "transcriber": {
                "provider": "deepgram",
                "model": "nova-2",
                "language": "en",
            },
            "silenceTimeoutSeconds": 30,
            "maxDurationSeconds": 600,
            "metadata": {"client_slug": client_slug},
        }

        # Add call forwarding if transfer number is set
        if config.get("transfer_number"):
            payload["forwardingPhoneNumber"] = config["transfer_number"]

        resp = requests.post(
            f"{VAPI_BASE_URL}/assistant",
            json=payload,
            headers=_vapi_headers(api_key),
            timeout=30,
        )

        if resp.status_code in (200, 201):
            data = resp.json()
            print(f"  Vapi assistant created: {data['id']}")
            return {"status": "deployed", "assistant_id": data["id"]}
        else:
            error_msg = resp.text[:300]
            print(f"  Failed to create Vapi assistant: {resp.status_code} {error_msg}")
            return {"status": "error", "error": error_msg}

    def _update_assistant(self, assistant_id: str, config: dict, system_prompt: str, api_key: str) -> dict:
        """Update an existing Vapi assistant."""
        payload = {
            "name": f"{config['business_name']} - AI Phone Agent",
            "model": {
                "provider": "anthropic",
                "model": "claude-sonnet-4-20250514",
                "messages": [{"role": "system", "content": system_prompt}],
            },
            "firstMessage": config["greeting"],
        }

        if config.get("transfer_number"):
            payload["forwardingPhoneNumber"] = config["transfer_number"]

        resp = requests.patch(
            f"{VAPI_BASE_URL}/assistant/{assistant_id}",
            json=payload,
            headers=_vapi_headers(api_key),
            timeout=30,
        )

        if resp.status_code == 200:
            print(f"  Vapi assistant updated: {assistant_id}")
            return {"status": "updated", "assistant_id": assistant_id}
        else:
            error_msg = resp.text[:300]
            print(f"  Failed to update Vapi assistant: {resp.status_code} {error_msg}")
            return {"status": "error", "error": error_msg}

    def _setup_phone_number(self, assistant_id: str, api_key: str) -> dict | None:
        """Buy a phone number and assign it to the assistant."""
        # List existing numbers first
        resp = requests.get(
            f"{VAPI_BASE_URL}/phone-number",
            headers=_vapi_headers(api_key),
            timeout=15,
        )
        if resp.status_code == 200:
            numbers = resp.json()
            # Check if any number is already assigned to this assistant
            for num in numbers:
                if num.get("assistantId") == assistant_id:
                    print(f"  Phone number already assigned: {num.get('number')}")
                    return {"id": num["id"], "number": num.get("number")}

            # Check for unassigned numbers we can reuse
            for num in numbers:
                if not num.get("assistantId"):
                    # Assign this number to the assistant
                    assign_resp = requests.patch(
                        f"{VAPI_BASE_URL}/phone-number/{num['id']}",
                        json={"assistantId": assistant_id},
                        headers=_vapi_headers(api_key),
                        timeout=15,
                    )
                    if assign_resp.status_code == 200:
                        print(f"  Assigned existing number: {num.get('number')}")
                        return {"id": num["id"], "number": num.get("number")}

        # Buy a new number via Vapi
        buy_payload = {
            "provider": "vapi",
            "assistantId": assistant_id,
            "numberDesiredAreaCode": "303",  # Colorado area code
        }
        buy_resp = requests.post(
            f"{VAPI_BASE_URL}/phone-number",
            json=buy_payload,
            headers=_vapi_headers(api_key),
            timeout=30,
        )
        if buy_resp.status_code in (200, 201):
            data = buy_resp.json()
            print(f"  Purchased new number: {data.get('number')}")
            return {"id": data["id"], "number": data.get("number")}
        else:
            print(f"  Could not provision phone number: {buy_resp.status_code} {buy_resp.text[:200]}")
            return None

    def get_call_logs(self, assistant_id: str, api_key: str, limit: int = 50) -> list[dict]:
        """Fetch recent call logs for an assistant."""
        resp = requests.get(
            f"{VAPI_BASE_URL}/call",
            params={"assistantId": assistant_id, "limit": limit},
            headers=_vapi_headers(api_key),
            timeout=15,
        )
        if resp.status_code == 200:
            return resp.json()
        return []

    def _build_system_prompt(self, config: dict) -> str:
        capabilities = "\n".join(f"- {c}" for c in config["capabilities"])

        services_section = ""
        if config.get("services_offered"):
            services_section = f"\n\nServices offered:\n{config['services_offered']}"

        booking_section = ""
        if config.get("booking_url"):
            booking_section = f"\n\nTo book an appointment, direct callers to: {config['booking_url']}"

        knowledge_section = ""
        if config.get("knowledge_base"):
            knowledge_section = f"\n\nBusiness information:\n{config['knowledge_base']}"

        return f"""You are a friendly, professional AI phone assistant for {config['business_name']}, a {config['industry']} company.

Your capabilities:
{capabilities}{services_section}{booking_section}{knowledge_section}

Business hours: {config['business_hours']}
If someone calls outside business hours, take a message and let them know someone will call back.

Rules:
- Be warm and conversational, not robotic
- Keep responses concise (phone calls should be snappy)
- If you can't help with something, offer to transfer to a human
- Always confirm appointment details before booking
- Never make up information you don't have
- If asked about pricing, say you'd be happy to have someone follow up with a quote"""
