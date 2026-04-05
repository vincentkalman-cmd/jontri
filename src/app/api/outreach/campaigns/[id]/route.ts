import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/outreach/campaigns/[id] — get campaign with leads
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: campaign, error: campError } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const { data: leads } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("campaign_id", id)
    .order("ai_score", { ascending: false, nullsFirst: false });

  return NextResponse.json({ campaign, leads: leads || [] });
}

// PATCH /api/outreach/campaigns/[id] — update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("outreach_campaigns")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaign: data });
}

// DELETE /api/outreach/campaigns/[id] — delete campaign and leads
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("outreach_campaigns")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Campaign deleted" });
}
