"""Website quality scorer — scrapes a site and uses Claude to evaluate if it's worth redesigning."""

import json
import re
import requests
import anthropic
from config import ANTHROPIC_API_KEY
import config

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

SCORE_PROMPT = """\
You are a web design expert evaluating a local business website for quality and modernity.

Analyze the following website content and metadata, then return a JSON assessment.

Business: {business_name}
Industry: {industry}
Website URL: {url}

=== PAGE TITLE ===
{title}

=== META DESCRIPTION ===
{meta_description}

=== PAGE CONTENT (first 3000 chars) ===
{content}

Rate the website on a scale of 1-10 where:
- 1-3: Severely outdated (looks like 2000s, broken layout, no mobile support, Flash, tables for layout)
- 4-5: Outdated (template site, generic, poor design, slow-loading indicators, weak content)
- 6-7: Acceptable (decent design but room for major improvement)
- 8-10: Modern and professional (skip — not worth redesigning)

Return ONLY valid JSON with these keys:
- "score": integer 1-10
- "issues": list of 3-5 specific problems found (e.g. "no mobile responsiveness", "generic stock template", "missing call-to-action")
- "worth_redesigning": boolean (true if score <= 5)
- "summary": one sentence describing the website's quality
- "strengths": list of 1-2 things the current site does well (to preserve in redesign)

Return ONLY valid JSON, no markdown fences."""


def scrape_website(url: str, timeout: int = 15) -> dict | None:
    """Scrape basic content and metadata from a website URL.

    Returns dict with title, meta_description, and text content.
    """
    if not url:
        return None

    # Ensure URL has scheme
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }

    try:
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        resp.raise_for_status()
        html = resp.text
    except Exception as e:
        return {"url": url, "error": str(e), "title": "", "meta_description": "", "content": ""}

    # Extract title
    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    title = title_match.group(1).strip() if title_match else ""

    # Extract meta description
    meta_match = re.search(
        r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']',
        html,
        re.IGNORECASE,
    )
    meta_description = meta_match.group(1).strip() if meta_match else ""

    # Extract text content (strip HTML tags)
    # Remove script and style blocks first
    clean = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r"<style[^>]*>.*?</style>", "", clean, flags=re.DOTALL | re.IGNORECASE)
    clean = re.sub(r"<[^>]+>", " ", clean)
    clean = re.sub(r"\s+", " ", clean).strip()

    return {
        "url": url,
        "title": title,
        "meta_description": meta_description,
        "content": clean[:3000],
        "full_html_length": len(html),
    }


def score_website(url: str, business_name: str, industry: str) -> dict | None:
    """Scrape a website and use Claude to score its quality.

    Returns:
        dict with score, issues, worth_redesigning, summary, strengths,
        plus the scraped content for later use in site generation.
    """
    scraped = scrape_website(url)
    if not scraped:
        return None

    if scraped.get("error"):
        print(f"    Scrape error for {url}: {scraped['error']}")
        return {
            "score": 1,
            "issues": ["Website unreachable or returned an error"],
            "worth_redesigning": True,
            "summary": "Website could not be loaded — likely broken or offline.",
            "strengths": [],
            "scraped": scraped,
        }

    prompt = SCORE_PROMPT.format(
        business_name=business_name,
        industry=industry,
        url=url,
        title=scraped["title"],
        meta_description=scraped["meta_description"],
        content=scraped["content"],
    )

    try:
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        result = json.loads(resp.content[0].text)
        result["scraped"] = scraped
        return result
    except Exception as e:
        print(f"    Scoring failed for {url}: {e}")
        return None


def filter_by_score(leads: list[dict], max_score: int = 5) -> list[dict]:
    """Filter leads to only those with website scores at or below the threshold."""
    return [l for l in leads if l.get("site_score", 10) <= max_score]
