"""Service registry — single source of truth for all available services."""

from jontri_platform.services.prospector import ProspectorService
from jontri_platform.services.voice_agent import VoiceAgentService
from jontri_platform.services.seo_audit import SEOAuditService
from jontri_platform.services.chatbot import ChatbotService
from jontri_platform.services.review_mgmt import ReviewManagementService
from jontri_platform.services.website import WebsiteService
from jontri_platform.services.onboarding import OnboardingService

SERVICES = {
    "prospector": ProspectorService(),
    "voice-agent": VoiceAgentService(),
    "seo-audit": SEOAuditService(),
    "chatbot": ChatbotService(),
    "review-mgmt": ReviewManagementService(),
    "website": WebsiteService(),
    "onboarding": OnboardingService(),
}


def get_service(name: str):
    svc = SERVICES.get(name)
    if not svc:
        raise ValueError(f"Unknown service '{name}'. Available: {', '.join(SERVICES.keys())}")
    return svc


def list_services() -> list[dict]:
    return [
        {"name": s.name, "description": s.description, "category": s.category}
        for s in SERVICES.values()
    ]
