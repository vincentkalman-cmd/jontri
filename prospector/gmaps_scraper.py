"""Google Maps lead discovery — search for local businesses and extract contact info."""

import json
import re
import time
import requests
from config import OUTPUT_DIR


def search_google_maps(query: str, api_key: str, max_results: int = 20) -> list[dict]:
    """Search Google Maps Places API for businesses matching a query.

    Args:
        query: Search query like "plumbers in Dallas" or "wedding venues Sydney"
        api_key: Google Maps API key (Places API must be enabled)
        max_results: Maximum number of results to return (up to 60)

    Returns:
        List of lead dicts compatible with the prospector pipeline.
    """
    leads = []
    url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    params = {"query": query, "key": api_key}

    pages_fetched = 0
    max_pages = max(1, max_results // 20)

    while pages_fetched < max_pages:
        resp = requests.get(url, params=params, timeout=30)
        if resp.status_code != 200:
            print(f"  Google Maps API error: {resp.status_code}")
            break

        data = resp.json()
        if data.get("status") not in ("OK", "ZERO_RESULTS"):
            print(f"  Google Maps API status: {data.get('status')} — {data.get('error_message', '')}")
            break

        for place in data.get("results", []):
            lead = _place_to_lead(place)
            leads.append(lead)
            if len(leads) >= max_results:
                return leads

        next_token = data.get("next_page_token")
        if not next_token:
            break

        # Google requires a short delay before using next_page_token
        time.sleep(2)
        params = {"pagetoken": next_token, "key": api_key}
        pages_fetched += 1

    return leads


def enrich_with_details(leads: list[dict], api_key: str) -> list[dict]:
    """Enrich leads with website and phone from Place Details API."""
    url = "https://maps.googleapis.com/maps/api/place/details/json"

    for i, lead in enumerate(leads):
        place_id = lead.get("_place_id")
        if not place_id:
            continue

        params = {
            "place_id": place_id,
            "fields": "website,formatted_phone_number,opening_hours,url",
            "key": api_key,
        }
        try:
            resp = requests.get(url, params=params, timeout=15)
            if resp.status_code == 200:
                result = resp.json().get("result", {})
                lead["company_website"] = result.get("website", lead.get("company_website", ""))
                lead["phone"] = result.get("formatted_phone_number", lead.get("phone", ""))
                lead["google_maps_url"] = result.get("url", "")
        except Exception as e:
            print(f"  Details fetch failed for {lead['company']}: {e}")

        # Rate limit: ~10 QPS for Places API
        if i < len(leads) - 1:
            time.sleep(0.15)

    return leads


def _place_to_lead(place: dict) -> dict:
    """Convert a Google Maps place result to our lead format."""
    address = place.get("formatted_address", "")
    city, state = _parse_city_state(address)

    return {
        "first_name": "",
        "last_name": "",
        "title": "Owner",
        "email": "",
        "phone": "",
        "linkedin_url": "",
        "company": place.get("name", ""),
        "company_website": "",
        "industry": _types_to_industry(place.get("types", [])),
        "employee_count": "",
        "city": city,
        "state": state,
        "keywords": ", ".join(place.get("types", [])[:5]),
        "technologies": "",
        "annual_revenue": "",
        "address": address,
        "rating": place.get("rating", 0),
        "review_count": place.get("user_ratings_total", 0),
        "_place_id": place.get("place_id", ""),
    }


def _parse_city_state(address: str) -> tuple[str, str]:
    """Extract city and state from a formatted address string."""
    # Typical format: "123 Main St, Dallas, TX 75201, USA"
    parts = [p.strip() for p in address.split(",")]
    city = ""
    state = ""
    if len(parts) >= 3:
        city = parts[-3] if len(parts) >= 3 else ""
        state_zip = parts[-2] if len(parts) >= 2 else ""
        match = re.match(r"([A-Z]{2})", state_zip.strip())
        if match:
            state = match.group(1)
    return city, state


def _types_to_industry(types: list[str]) -> str:
    """Map Google Maps place types to a human-readable industry string."""
    type_map = {
        "plumber": "Plumbing",
        "electrician": "Electrical",
        "roofing_contractor": "Roofing",
        "general_contractor": "Construction",
        "hvac_contractor": "HVAC",
        "painter": "Painting",
        "locksmith": "Locksmith",
        "moving_company": "Moving",
        "real_estate_agency": "Real Estate",
        "insurance_agency": "Insurance",
        "accounting": "Accounting",
        "lawyer": "Legal",
        "dentist": "Dental",
        "doctor": "Healthcare",
        "veterinary_care": "Veterinary",
        "restaurant": "Restaurant",
        "gym": "Fitness",
        "beauty_salon": "Beauty",
        "car_repair": "Auto Repair",
        "car_dealer": "Auto Sales",
    }
    for t in types:
        if t in type_map:
            return type_map[t]
    # Return the first non-generic type
    generic = {"point_of_interest", "establishment", "political", "locality"}
    for t in types:
        if t not in generic:
            return t.replace("_", " ").title()
    return "Local Business"


def load_leads_from_gmaps(
    query: str,
    api_key: str,
    max_results: int = 20,
    require_website: bool = True,
) -> list[dict]:
    """Full pipeline: search Google Maps, enrich with details, filter.

    This is the main entry point used by the website-agent pipeline.
    """
    print(f"  Searching Google Maps: \"{query}\"")
    leads = search_google_maps(query, api_key, max_results=max_results)
    print(f"  Found {len(leads)} businesses")

    if not leads:
        return []

    print(f"  Enriching {len(leads)} leads with website & phone details...")
    leads = enrich_with_details(leads, api_key)

    if require_website:
        before = len(leads)
        leads = [l for l in leads if l.get("company_website")]
        print(f"  Filtered to {len(leads)} leads with websites (dropped {before - len(leads)} without)")

    # Clean up internal fields
    for lead in leads:
        lead.pop("_place_id", None)

    return leads
