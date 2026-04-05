"""AI-powered lead qualification and email personalization using Claude."""

import json
import anthropic
from config import ANTHROPIC_API_KEY, FROM_NAME, FROM_TITLE, FROM_COMPANY, BOOKING_URL
import config

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

QUALIFY_PROMPT = """\
You are a sales intelligence analyst for {company}, an AI consulting firm that helps \
businesses automate operations, reduce costs, and grow revenue using AI.

Analyze this prospect and return a JSON object with:
- "score": integer 1-10 (10 = perfect fit)
- "reasoning": one sentence explaining the score
- "pain_points": list of 2-3 likely pain points this business faces that AI could solve
- "personalized_hook": a one-sentence opener referencing something specific about their business

Prospect:
- Name: {first_name} {last_name}
- Title: {title}
- Company: {company_name}
- Industry: {industry}
- Employees: {employee_count}
- Keywords: {keywords}
- Technologies: {technologies}
- Revenue: {annual_revenue}
- Location: {city}, {state}

Our ideal customer: {ideal_customer_description}

{service_focus_line}

Return ONLY valid JSON, no markdown fences."""

EMAIL_PROMPT = """\
You are writing a cold outreach email on behalf of {from_name}, {from_title} at {from_company}.

Write a short, personalized cold email (under {max_words} words) to this prospect:
- Name: {first_name} {last_name}
- Title: {title}
- Company: {company_name}
- Pain points: {pain_points}
- Personalized hook: {hook}

Guidelines:
- Subject line should be casual and curiosity-driven (not salesy)
- Open with the personalized hook
- Reference one specific pain point
- Briefly mention how AI automation could help (be specific to their industry)
- End with a soft CTA linking to a free consultation: {booking_url}
- Tone: {tone}
{custom_guidelines}

Return as JSON with keys: "subject", "body"
Return ONLY valid JSON, no markdown fences."""


def qualify_lead(lead: dict) -> dict | None:
    """Score and qualify a lead using Claude."""
    qual = config.QUALIFICATION
    service_focus = qual.get("service_focus", "")
    service_focus_line = f"Our key services for this prospect: {service_focus}" if service_focus else ""

    prompt = QUALIFY_PROMPT.format(
        company=config.FROM_COMPANY,
        first_name=lead["first_name"],
        last_name=lead["last_name"],
        title=lead["title"],
        company_name=lead["company"],
        industry=lead["industry"],
        employee_count=lead["employee_count"],
        keywords=lead["keywords"],
        technologies=lead["technologies"],
        annual_revenue=lead["annual_revenue"],
        city=lead["city"],
        state=lead["state"],
        ideal_customer_description=qual.get("ideal_customer_description", ""),
        service_focus_line=service_focus_line,
    )
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(resp.content[0].text)
    except Exception as e:
        print(f"  Qualification failed for {lead['first_name']} {lead['last_name']}: {e}")
        return None


def generate_email(lead: dict, qualification: dict) -> dict | None:
    """Generate a personalized outreach email using Claude."""
    email_cfg = config.EMAIL_CONFIG
    guidelines = "\n".join(f"- {g}" for g in email_cfg.get("custom_guidelines", []))

    prompt = EMAIL_PROMPT.format(
        from_name=config.FROM_NAME,
        from_title=config.FROM_TITLE,
        from_company=config.FROM_COMPANY,
        first_name=lead["first_name"],
        last_name=lead["last_name"],
        title=lead["title"],
        company_name=lead["company"],
        pain_points=", ".join(qualification.get("pain_points", [])),
        hook=qualification.get("personalized_hook", ""),
        booking_url=config.BOOKING_URL,
        max_words=email_cfg.get("max_words", 150),
        tone=email_cfg.get("tone", "professional but conversational"),
        custom_guidelines=guidelines,
    )
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        return json.loads(resp.content[0].text)
    except Exception as e:
        print(f"  Email generation failed for {lead['first_name']} {lead['last_name']}: {e}")
        return None
