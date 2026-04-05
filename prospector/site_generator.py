"""Demo site generator — uses Claude to build a modern redesign from scraped business data."""

import json
import os
import anthropic
from config import ANTHROPIC_API_KEY, OUTPUT_DIR
import config

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

GENERATE_PROMPT = """\
You are an elite web designer building a modern, professional single-page website for a local business.

Your goal: create a stunning redesign that will make the business owner say "wow, I need this."

=== BUSINESS INFO ===
Business Name: {business_name}
Industry: {industry}
Location: {address}
Phone: {phone}
Website (current): {current_url}
Rating: {rating}/5 ({review_count} reviews)

=== CONTENT FROM THEIR CURRENT SITE ===
{scraped_content}

=== CURRENT SITE STRENGTHS TO PRESERVE ===
{strengths}

=== ISSUES WITH CURRENT SITE ===
{issues}

=== DESIGN REQUIREMENTS ===
Build a COMPLETE, self-contained single-page HTML file with:

1. **Tech**: Tailwind CSS via CDN (`<script src="https://cdn.tailwindcss.com"></script>`), all styles inline
2. **Sections**: Hero with CTA, Services/Features, About, Testimonials (use realistic placeholder reviews), Contact with address & phone, Footer
3. **Design quality**:
   - Pick a custom brand color palette that fits the industry (NEVER use default Tailwind blue/indigo)
   - Layered, color-tinted shadows (not flat shadow-md)
   - Pair a display font with a clean sans-serif (use Google Fonts CDN links)
   - Tight tracking on headings, generous line-height on body text
   - Gradient overlays on hero sections
   - Every button needs hover and active states
   - Animate only transform and opacity (never transition-all)
   - Mobile-first responsive design
   - Consistent spacing using Tailwind spacing scale
   - Surface layering (base, elevated, floating depths)
4. **Content**: Use the REAL business name, services, phone, and address from the scraped data. Fill gaps with industry-appropriate placeholder content.
5. **Google Maps**: Embed a Google Maps iframe for the business address
6. **CTA**: Primary CTA should be "Call Now" linking to tel:{phone}, secondary CTA "Get a Free Quote"
7. **Footer**: Include the business name, address, phone, and a "Website redesign by Jontri Consulting" credit with a link to https://jontri.com

IMPORTANT:
- The site must look DRAMATICALLY better than their current site
- Use real data from the scrape wherever possible
- Do not use placeholder images — use CSS gradients, patterns, and icons instead
- The HTML must be completely self-contained (no external files except CDN links)

Return ONLY the complete HTML file content. No markdown fences, no explanation — just the HTML starting with <!DOCTYPE html>."""


def generate_demo_site(lead: dict) -> str | None:
    """Generate a complete HTML demo site for a prospect.

    Args:
        lead: Lead dict with company info and scraped site data.

    Returns:
        Complete HTML string, or None on failure.
    """
    scraped = lead.get("_scraped", {})
    scoring = lead.get("_site_scoring", {})

    prompt = GENERATE_PROMPT.format(
        business_name=lead.get("company", "Business"),
        industry=lead.get("industry", "Local Business"),
        address=lead.get("address", lead.get("city", "")),
        phone=lead.get("phone", "(555) 000-0000"),
        current_url=lead.get("company_website", ""),
        rating=lead.get("rating", "N/A"),
        review_count=lead.get("review_count", 0),
        scraped_content=scraped.get("content", "No content available")[:4000],
        strengths="\n".join(f"- {s}" for s in scoring.get("strengths", ["N/A"])),
        issues="\n".join(f"- {i}" for i in scoring.get("issues", ["Outdated design"])),
        phone_tel=lead.get("phone", ""),
    )

    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=16000,
            messages=[{"role": "user", "content": prompt}],
        )
        html = resp.content[0].text.strip()

        # Ensure it starts with DOCTYPE
        if not html.lower().startswith("<!doctype"):
            # Try to extract HTML if wrapped in markdown
            if "<!DOCTYPE" in html or "<!doctype" in html:
                start = html.lower().index("<!doctype")
                html = html[start:]
            else:
                print(f"    Warning: Generated content doesn't look like HTML for {lead['company']}")
                return None

        return html
    except Exception as e:
        print(f"    Site generation failed for {lead['company']}: {e}")
        return None


def save_demo_site(html: str, lead: dict) -> str:
    """Save generated HTML to the output directory.

    Returns the file path.
    """
    demos_dir = os.path.join(OUTPUT_DIR, "demos")
    os.makedirs(demos_dir, exist_ok=True)

    # Create a safe filename from the business name
    safe_name = "".join(c if c.isalnum() or c in "-_ " else "" for c in lead.get("company", "site"))
    safe_name = safe_name.strip().replace(" ", "-").lower()[:50]
    filename = f"{safe_name}.html"

    filepath = os.path.join(demos_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html)

    return filepath


def generate_and_save(lead: dict) -> dict:
    """Generate a demo site and save it. Returns result dict.

    Result includes:
        - status: "success" | "failed" | "skipped"
        - html_path: path to saved HTML file (if success)
        - company: business name
    """
    company = lead.get("company", "Unknown")

    if not lead.get("_site_scoring", {}).get("worth_redesigning", True):
        return {"status": "skipped", "company": company, "reason": "Site scored too high"}

    html = generate_demo_site(lead)
    if not html:
        return {"status": "failed", "company": company}

    filepath = save_demo_site(html, lead)
    lead["_demo_html_path"] = filepath

    return {"status": "success", "company": company, "html_path": filepath}
