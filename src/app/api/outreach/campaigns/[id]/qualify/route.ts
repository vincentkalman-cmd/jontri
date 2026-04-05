import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { QUALIFY_PROMPT, SENDER, fillPrompt } from "@/lib/outreach-config";

// POST /api/outreach/campaigns/[id]/qualify — AI-qualify discovered leads
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Get campaign
  const { data: campaign } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get unqualified leads
  const { data: leads } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("campaign_id", id)
    .eq("status", "discovered");

  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: "No leads to qualify" });
  }

  // Update campaign status
  await supabase
    .from("outreach_campaigns")
    .update({ status: "qualifying", updated_at: new Date().toISOString() })
    .eq("id", id);

  const minScore = campaign.config?.minScore || 6;
  const idealCustomer = campaign.config?.idealCustomer || "";
  const serviceFocus = campaign.config?.serviceFocus || "";
  let qualified = 0;

  try {
    for (const lead of leads) {
      const prompt = fillPrompt(QUALIFY_PROMPT, {
        company: SENDER.fromCompany,
        company_name: lead.company,
        industry: lead.industry || "",
        city: lead.city || "",
        state: lead.state || "",
        phone: lead.phone || "",
        website: lead.website || "",
        rating: lead.rating || 0,
        review_count: lead.review_count || 0,
        ideal_customer_description: idealCustomer,
        service_focus_line: serviceFocus
          ? `Our key services for this prospect: ${serviceFocus}`
          : "",
      });

      try {
        const resp = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        });

        const text =
          resp.content[0].type === "text" ? resp.content[0].text : "";
        const result = JSON.parse(text);

        const isQualified = result.score >= minScore;
        if (isQualified) qualified++;

        await supabase
          .from("outreach_leads")
          .update({
            ai_score: result.score,
            ai_reasoning: result.reasoning || "",
            pain_points: Array.isArray(result.pain_points)
              ? result.pain_points.join(", ")
              : result.pain_points || "",
            personalized_hook: result.personalized_hook || "",
            status: isQualified ? "qualified" : "disqualified",
          })
          .eq("id", lead.id);
      } catch {
        // Skip this lead on AI failure
      }
    }

    // Update campaign stats
    const { data: allLeads } = await supabase
      .from("outreach_leads")
      .select("ai_score")
      .eq("campaign_id", id)
      .not("ai_score", "is", null);

    const scores = (allLeads || []).map((l) => l.ai_score).filter(Boolean);
    const avgScore =
      scores.length > 0
        ? Math.round(
            (scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10
          ) / 10
        : 0;

    await supabase
      .from("outreach_campaigns")
      .update({
        status: "draft",
        stats: {
          ...(campaign.stats || {}),
          leadsQualified: qualified,
          avgScore,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      totalProcessed: leads.length,
      qualified,
      avgScore,
    });
  } catch (err) {
    await supabase
      .from("outreach_campaigns")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Qualification failed" },
      { status: 500 }
    );
  }
}
