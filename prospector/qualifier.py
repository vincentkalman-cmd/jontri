"""AI-powered lead qualification and email personalization using Claude."""

import json
import anthropic
from config import ANTHROPIC_API_KEY, FROM_NAME, FROM_TITLE, FROM_COMPANY, BOOKING_URL
import config

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY, max_retries=5)

QUALIFY_PROMPT = """\
You are a sales intelligence analyst for {company}, {business_description}.

Analyze this prospect and return a JSON object with:
- "score": integer 1-10 (10 = perfect fit)
- "reasoning": one sentence explaining the score
- "pain_points": list of 2-3 likely pain points this business faces that {pain_point_lens}
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
- Reference exactly ONE specific pain point from the list — do not list all of them
- {value_proposition_line}
- {cta_line}
- Tone: {tone}
{custom_guidelines}

Return as JSON with keys: "subject", "body"
Return ONLY valid JSON, no markdown fences."""


def qualify_lead(lead: dict) -> dict | None:
    """Score and qualify a lead using Claude."""
    qual = config.QUALIFICATION
    service_focus = qual.get("service_focus", "")
    service_focus_line = f"Our key services for this prospect: {service_focus}" if service_focus else ""

    business_description = qual.get(
        "business_description",
        "an AI consulting firm that helps businesses automate operations, reduce costs, and grow revenue using AI",
    )
    pain_point_lens = qual.get(
        "pain_point_lens",
        "AI could solve",
    )
    prompt = QUALIFY_PROMPT.format(
        company=config.FROM_COMPANY,
        business_description=business_description,
        pain_point_lens=pain_point_lens,
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
    except anthropic.APIStatusError as e:
        print(f"  Qualification API error {e.status_code} for {lead['first_name']} {lead['last_name']}: {e.message}")
        return None
    except json.JSONDecodeError as e:
        print(f"  Qualification returned malformed JSON for {lead['first_name']} {lead['last_name']}: {e}")
        return None


def generate_email(lead: dict, qualification: dict, lead_index: int = 0) -> dict | None:
    """Generate a personalized outreach email using Claude.

    `lead_index` controls deterministic rotation across openers/wedges/CTAs so
    consecutive leads get different templates regardless of company-name spelling.
    """
    email_cfg = config.EMAIL_CONFIG
    guidelines = "\n".join(f"- {g}" for g in email_cfg.get("custom_guidelines", []))

    rotation = email_cfg.get("rotation") or {}
    openers = rotation.get("openers") or []
    wedges = rotation.get("wedges") or []
    ctas = rotation.get("ctas") or []
    rotation_block = ""
    if openers and wedges and ctas:
        n = max(len(openers), len(wedges), len(ctas))
        bucket = lead_index % n
        rotation_block = (
            f"\n\nROTATION ASSIGNMENT (you MUST follow these — they ensure variety across the campaign):\n"
            f"- Opener style for THIS email: {openers[bucket % len(openers)]}\n"
            f"- Wedge / pain-point focus for THIS email: {wedges[bucket % len(wedges)]}\n"
            f"- Closing CTA phrasing for THIS email: {ctas[bucket % len(ctas)]}\n"
            f"Use the assigned opener style, wedge, and CTA. Do NOT mix in other rotations."
        )

    value_prop = email_cfg.get(
        "value_proposition_line",
        "Briefly mention how AI automation could help (be specific to their industry)",
    )
    cta = email_cfg.get(
        "cta_line",
        f"End with a soft CTA linking to a free consultation: {config.BOOKING_URL}",
    )
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
        value_proposition_line=value_prop,
        cta_line=cta,
        max_words=email_cfg.get("max_words", 150),
        tone=email_cfg.get("tone", "professional but conversational"),
        custom_guidelines=guidelines + rotation_block,
    )
    # Retry up to 3 times if the model returns an empty/short body
    for attempt in range(3):
        try:
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=600,
                messages=[{"role": "user", "content": prompt}],
            )
            data = json.loads(resp.content[0].text)
            body = (data.get("body") or "").strip()
            subject = (data.get("subject") or "").strip()
            if len(body.split()) >= 50 and subject:
                return data
            print(f"  Short/empty body for {lead['company']} (attempt {attempt+1}/3, words={len(body.split())}); retrying")
        except anthropic.APIStatusError as e:
            print(f"  Email API error {e.status_code} for {lead['company']}: {e.message}")
            return None
        except anthropic.APIConnectionError as e:
            print(f"  Connection error for {lead['company']} (attempt {attempt+1}/3): {e}; retrying")
            import time as _t; _t.sleep(2 * (attempt + 1))
        except json.JSONDecodeError as e:
            print(f"  Email returned malformed JSON for {lead['company']}: {e}; retrying")
    print(f"  Gave up on {lead['company']} after 3 retries")
    return None
