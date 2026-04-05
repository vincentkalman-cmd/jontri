import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { GMAPS_CONFIG } from "@/lib/outreach-config";

// POST /api/outreach/campaigns/[id]/discover — discover leads via Google Maps
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get campaign
  const { data: campaign, error: campError } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const maxLeads = campaign.config?.maxLeads || 20;
  const requireWebsite = campaign.config?.requireWebsite !== false;

  // Update campaign status
  await supabase
    .from("outreach_campaigns")
    .update({ status: "discovering", updated_at: new Date().toISOString() })
    .eq("id", id);

  try {
    const leads: Array<Record<string, unknown>> = [];
    let nextPageToken: string | null = null;

    // Paginate through Google Maps Text Search results
    do {
      const url = new URL(`${GMAPS_CONFIG.baseUrl}/textsearch/json`);
      url.searchParams.set("query", campaign.query);
      url.searchParams.set("key", apiKey);
      if (nextPageToken) {
        url.searchParams.set("pagetoken", nextPageToken);
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        throw new Error(`Google Maps API error: ${data.status}`);
      }

      for (const place of data.results || []) {
        if (leads.length >= maxLeads) break;

        const lead = {
          campaign_id: id,
          company: place.name,
          address: place.formatted_address || "",
          city: extractCity(place.formatted_address),
          state: extractState(place.formatted_address),
          rating: place.rating || 0,
          review_count: place.user_ratings_total || 0,
          google_maps_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
          status: "discovered",
        };

        leads.push(lead);
      }

      nextPageToken = data.next_page_token || null;

      // Google requires a short delay before using nextPageToken
      if (nextPageToken && leads.length < maxLeads) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    } while (nextPageToken && leads.length < maxLeads);

    // Enrich with Place Details (phone, website)
    for (const lead of leads) {
      const placeId = (lead.google_maps_url as string)?.split("place_id:")[1];
      if (!placeId) continue;

      try {
        const detailUrl = new URL(`${GMAPS_CONFIG.baseUrl}/details/json`);
        detailUrl.searchParams.set("place_id", placeId);
        detailUrl.searchParams.set(
          "fields",
          "formatted_phone_number,website,name"
        );
        detailUrl.searchParams.set("key", apiKey);

        const detailRes = await fetch(detailUrl.toString());
        const detailData = await detailRes.json();

        if (detailData.result) {
          lead.phone = detailData.result.formatted_phone_number || "";
          lead.website = detailData.result.website || "";
        }
      } catch {
        // Continue without details
      }
    }

    // Filter by website requirement
    const filteredLeads = requireWebsite
      ? leads.filter((l) => l.website)
      : leads;

    // Insert into database
    if (filteredLeads.length > 0) {
      await supabase.from("outreach_leads").insert(filteredLeads);
    }

    // Update campaign stats
    await supabase
      .from("outreach_campaigns")
      .update({
        status: "draft",
        stats: {
          ...(campaign.stats || {}),
          leadsFound: filteredLeads.length,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      leadsFound: filteredLeads.length,
      totalSearched: leads.length,
    });
  } catch (err) {
    await supabase
      .from("outreach_campaigns")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Discovery failed" },
      { status: 500 }
    );
  }
}

function extractCity(address: string | undefined): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 3] || parts[0] : "";
}

function extractState(address: string | undefined): string {
  if (!address) return "";
  const parts = address.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const stateZip = parts[parts.length - 2] || "";
    return stateZip.replace(/\d+/g, "").trim();
  }
  return "";
}
