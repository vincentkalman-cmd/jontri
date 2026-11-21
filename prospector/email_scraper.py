"""Scrape contact emails from a business's public website.

Used as a fallback when Apollo data is unavailable. Visits homepage and a few
common contact pages, regex-matches email addresses in the raw HTML, ranks
candidates, and returns the most likely owner/business email.
"""

import re
import time
import requests
from urllib.parse import urlparse, urljoin

EMAIL_RE = re.compile(r"\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b")

# Pages to check, in order. Stop early once we have a high-confidence match.
PROBE_PATHS = ["", "/contact", "/contact-us", "/about", "/about-us", "/book", "/booking", "/team"]

# Email patterns to skip outright (noise, not contact addresses).
SKIP_LOCALPARTS = {
    "webmaster", "postmaster", "abuse", "privacy", "noreply", "no-reply",
    "donotreply", "do-not-reply", "support@example", "you@",
    "name@", "email@", "user@", "test@", "example@", "sample@",
    # Wix / Squarespace / other CMS placeholder-template addresses
    "youremail", "yourname", "your-email", "your.email", "your.name",
    "yourcompany", "yourbusiness", "yourdomain", "youraddress",
    "info@example", "contact@example",
}
SKIP_DOMAINS_SUBSTR = {
    "sentry.io", "wixstatic.com", "godaddy.com", "google.com",
    "googleapis.com", "gstatic.com", "fbcdn.net", "facebook.com",
    "instagram.com", "schema.org", "w3.org", "example.com", "domain.com",
    "abc.com", "yourdomain.com", "yoursite.com", "company.com",
    "wixsite.com", "squarespace.com", "godaddysites.com",
}
GENERIC_LOCALPARTS = {"info", "hello", "contact", "admin", "office", "team", "appointments", "bookings", "frontdesk", "reception"}


def _is_likely_garbage(email: str) -> bool:
    e = email.lower().strip()
    local = e.split("@", 1)[0] if "@" in e else ""
    domain = e.split("@", 1)[1] if "@" in e else ""
    if any(local.startswith(s) for s in SKIP_LOCALPARTS):
        return True
    if any(s in domain for s in SKIP_DOMAINS_SUBSTR):
        return True
    # filter out emails that look like image filenames matched by mistake
    if any(domain.endswith(ext) for ext in (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".css", ".js")):
        return True
    if len(local) > 64 or len(domain) > 64:
        return True
    return False


def _score_email(email: str, business_domain: str | None) -> int:
    """Higher score = more likely to be the right contact email."""
    e = email.lower()
    local, _, domain = e.partition("@")
    score = 0
    # Strong signal: email domain matches business domain
    if business_domain and business_domain in domain:
        score += 50
    # Generic mailbox is OK but lower-priority than personal
    if local in GENERIC_LOCALPARTS:
        score += 5
    else:
        # Looks like a personal name (single word or first.last)
        score += 15
        if "." in local or "_" in local:
            score += 5
    # Slight penalty for very long local parts (likely encoded ID, not human)
    if len(local) > 25:
        score -= 5
    return score


def _fetch(url: str, timeout: int = 10) -> str | None:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; JontriBot/1.0; +https://jontri.com)"}
    try:
        r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if r.status_code == 200 and r.text:
            return r.text
    except requests.RequestException:
        pass
    return None


def find_email_for_site(website: str, max_probes: int = 4, require_domain_match: bool = True) -> dict:
    """Visit the site's homepage + a few contact pages, return best email + metadata.

    By default only returns emails whose domain matches the business's domain — this
    avoids picking up the web designer's address embedded in a "Site by..." footer
    credit. Set require_domain_match=False for fallback when nothing else found.

    Returns dict with keys: email (str|""), all_emails (list[str]), pages_checked (int).
    """
    if not website:
        return {"email": "", "all_emails": [], "pages_checked": 0}

    if not website.startswith(("http://", "https://")):
        website = "https://" + website

    parsed = urlparse(website)
    base = f"{parsed.scheme}://{parsed.netloc}"
    business_domain = parsed.netloc.lower().replace("www.", "")
    # Strip subdomains for matching: "shop.acme.com" -> "acme.com"
    domain_root = ".".join(business_domain.split(".")[-2:]) if business_domain.count(".") >= 1 else business_domain

    found: dict[str, int] = {}
    pages_checked = 0
    for path in PROBE_PATHS[:max_probes]:
        url = urljoin(base + "/", path.lstrip("/"))
        html = _fetch(url)
        pages_checked += 1
        if not html:
            continue
        for raw in EMAIL_RE.findall(html):
            email = raw.lower().strip(".,;:")
            if _is_likely_garbage(email):
                continue
            email_domain = email.split("@", 1)[1] if "@" in email else ""
            if require_domain_match and domain_root and domain_root not in email_domain:
                # Web designer's address or third-party — skip
                continue
            if email not in found:
                found[email] = _score_email(email, business_domain)

    if not found:
        return {"email": "", "all_emails": [], "pages_checked": pages_checked}

    ranked = sorted(found.items(), key=lambda kv: kv[1], reverse=True)
    return {
        "email": ranked[0][0],
        "all_emails": [e for e, _ in ranked],
        "pages_checked": pages_checked,
    }


def enrich_leads_with_emails(leads: list[dict], delay: float = 1.0, verbose: bool = True) -> list[dict]:
    """For each lead with a `company_website`, scrape a contact email.

    Mutates leads in-place by setting the `email` field. Returns the same list.
    """
    for i, lead in enumerate(leads):
        site = lead.get("company_website") or ""
        if not site:
            continue
        if verbose:
            print(f"  ({i+1}/{len(leads)}) Scanning {lead.get('company','?')[:40]:42} {site[:50]}...", end=" ", flush=True)
        result = find_email_for_site(site)
        email = result["email"]
        lead["email"] = email
        lead["_email_candidates"] = result["all_emails"]
        if verbose:
            print(email if email else "<no email found>")
        if i < len(leads) - 1:
            time.sleep(delay)
    return leads
