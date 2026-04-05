"""Demo site deployer — uploads generated HTML to Netlify Drop for instant public URLs."""

import json
import os
import requests
import zipfile
import tempfile
from config import OUTPUT_DIR

# Netlify API
NETLIFY_API = "https://api.netlify.com/api/v1"


def deploy_to_netlify(html_path: str, site_name: str = "", api_token: str = "") -> dict:
    """Deploy a single HTML file to Netlify as a static site.

    Uses Netlify's file-based deploy API — no account needed for basic deploys,
    but an API token enables custom subdomains and management.

    Args:
        html_path: Path to the HTML file to deploy.
        site_name: Optional subdomain prefix (e.g. "joes-plumbing-demo").
        api_token: Netlify personal access token (optional for anonymous deploys).

    Returns:
        dict with deploy_url, site_id, and status.
    """
    if not os.path.exists(html_path):
        return {"status": "error", "message": f"File not found: {html_path}"}

    # Create a zip containing index.html
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
        zip_path = tmp.name

    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(html_path, "index.html")

        headers = {"Content-Type": "application/zip"}
        if api_token:
            headers["Authorization"] = f"Bearer {api_token}"

        # Create site or deploy to existing
        with open(zip_path, "rb") as f:
            zip_data = f.read()

        resp = requests.post(
            f"{NETLIFY_API}/sites",
            headers=headers,
            data=zip_data,
            timeout=60,
        )

        if resp.status_code in (200, 201):
            data = resp.json()
            deploy_url = data.get("ssl_url") or data.get("url", "")
            site_id = data.get("id", "")
            return {
                "status": "deployed",
                "deploy_url": deploy_url,
                "site_id": site_id,
                "admin_url": data.get("admin_url", ""),
            }
        else:
            return {
                "status": "error",
                "message": f"Netlify API returned {resp.status_code}: {resp.text[:300]}",
            }
    finally:
        os.unlink(zip_path)


def deploy_locally(html_path: str) -> dict:
    """Fallback: just track the local file path as the 'deployment'.

    Useful for dry runs or when no deploy service is configured.
    The HTML file can be opened directly in a browser or served locally.
    """
    return {
        "status": "local",
        "deploy_url": f"file:///{html_path.replace(os.sep, '/')}",
        "html_path": html_path,
    }


def deploy_demo(html_path: str, business_name: str, netlify_token: str = "", dry_run: bool = True) -> dict:
    """Deploy a demo site and return the result.

    Args:
        html_path: Path to the generated HTML file.
        business_name: Business name (used for subdomain).
        netlify_token: Netlify API token. If empty, uses local deployment.
        dry_run: If True, only return local file path.

    Returns:
        dict with status and deploy_url.
    """
    if dry_run:
        print(f"    [DRY RUN] Would deploy demo for {business_name}")
        return deploy_locally(html_path)

    if netlify_token:
        safe_name = "".join(c if c.isalnum() or c == "-" else "-" for c in business_name.lower())[:30]
        site_name = f"{safe_name}-demo"
        print(f"    Deploying to Netlify: {site_name}...")
        result = deploy_to_netlify(html_path, site_name=site_name, api_token=netlify_token)
        if result["status"] == "deployed":
            print(f"    Live at: {result['deploy_url']}")
        else:
            print(f"    Deploy failed: {result.get('message', 'unknown error')}")
            result = deploy_locally(html_path)
        return result
    else:
        print(f"    No Netlify token — saving locally for {business_name}")
        return deploy_locally(html_path)


def cleanup_old_deploys(netlify_token: str, max_age_days: int = 30):
    """Delete Netlify sites older than max_age_days.

    Call periodically to avoid accumulating stale demo sites.
    """
    if not netlify_token:
        return

    headers = {"Authorization": f"Bearer {netlify_token}"}
    resp = requests.get(f"{NETLIFY_API}/sites", headers=headers, params={"per_page": 100}, timeout=30)

    if resp.status_code != 200:
        print(f"  Failed to list sites: {resp.status_code}")
        return

    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=max_age_days)
    sites = resp.json()
    deleted = 0

    for site in sites:
        name = site.get("name", "")
        if not name.endswith("-demo"):
            continue

        created = site.get("created_at", "")
        try:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            if created_dt < cutoff:
                site_id = site["id"]
                del_resp = requests.delete(
                    f"{NETLIFY_API}/sites/{site_id}",
                    headers=headers,
                    timeout=15,
                )
                if del_resp.status_code in (200, 204):
                    deleted += 1
        except (ValueError, KeyError):
            continue

    if deleted:
        print(f"  Cleaned up {deleted} old demo sites")
