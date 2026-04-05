import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { INSTANTLY_CONFIG } from "@/lib/outreach-config";

// POST /api/outreach/campaigns/[id]/send — push leads to Instantly.ai
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const instantlyKey = process.env.INSTANTLY_API_KEY;

  if (!instantlyKey) {
    return NextResponse.json(
      { error: "INSTANTLY_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: campaign } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get leads with generated emails
  const { data: leads } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("campaign_id", id)
    .eq("email_status", "generated");

  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: "No emails ready to send" });
  }

  await supabase
    .from("outreach_campaigns")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id);

  try {
    const prefix = INSTANTLY_CONFIG.campaignPrefix || "JONTRI";
    const campaignName = `${prefix}-${campaign.name}-${Date.now()}`;

    // 1. Create Instantly campaign
    const createRes = await fetch(`${INSTANTLY_CONFIG.baseUrl}/campaigns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instantlyKey}`,
      },
      body: JSON.stringify({ name: campaignName }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create Instantly campaign: ${createRes.status}`);
    }

    const { id: campaignId } = await createRes.json();

    // 2. Add leads to campaign
    const leadsPayload = leads
      .filter((l) => l.email)
      .map((l) => ({
        email: l.email,
        first_name: l.contact_name?.split(" ")[0] || "",
        last_name: l.contact_name?.split(" ").slice(1).join(" ") || "",
        company_name: l.company,
        custom_variables: {
          personalized_subject: l.email_subject,
          personalized_body: l.email_body,
          phone: l.phone || "",
          city: l.city || "",
          ai_score: String(l.ai_score || ""),
          demo_url: l.demo_url || "",
        },
      }));

    if (leadsPayload.length > 0) {
      await fetch(`${INSTANTLY_CONFIG.baseUrl}/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${instantlyKey}`,
        },
        body: JSON.stringify({
          campaign_id: campaignId,
          leads: leadsPayload,
        }),
      });
    }

    // 3. Set campaign schedule & sequence
    await fetch(`${INSTANTLY_CONFIG.baseUrl}/campaigns/${campaignId}/schedule`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${instantlyKey}`,
      },
      body: JSON.stringify({
        schedules: [
          {
            from: INSTANTLY_CONFIG.schedule.from,
            to: INSTANTLY_CONFIG.schedule.to,
            days: INSTANTLY_CONFIG.schedule.days,
            timezone: INSTANTLY_CONFIG.schedule.timezone,
          },
        ],
      }),
    });

    // 4. Launch campaign
    await fetch(`${INSTANTLY_CONFIG.baseUrl}/campaigns/${campaignId}/activate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${instantlyKey}`,
      },
    });

    // Mark leads as sent
    const sentIds = leads.filter((l) => l.email).map((l) => l.id);
    if (sentIds.length > 0) {
      await supabase
        .from("outreach_leads")
        .update({ email_status: "sent", status: "sent" })
        .in("id", sentIds);
    }

    // Update campaign stats
    await supabase
      .from("outreach_campaigns")
      .update({
        status: "completed",
        stats: {
          ...(campaign.stats || {}),
          emailsSent: sentIds.length,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      emailsSent: sentIds.length,
      instantlyCampaignId: campaignId,
    });
  } catch (err) {
    await supabase
      .from("outreach_campaigns")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 500 }
    );
  }
}
