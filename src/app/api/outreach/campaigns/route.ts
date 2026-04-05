import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/outreach/campaigns — list all campaigns
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: campaigns, error } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns: campaigns || [] });
}

// POST /api/outreach/campaigns — create a new campaign
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, query, mode, config } = body;

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("outreach_campaigns")
    .insert({
      name: name || `Campaign - ${query}`,
      query,
      mode: mode || "email",
      status: "draft",
      config: config || {},
      stats: {
        leadsFound: 0,
        leadsQualified: 0,
        emailsGenerated: 0,
        emailsSent: 0,
        avgScore: 0,
      },
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data }, { status: 201 });
}
