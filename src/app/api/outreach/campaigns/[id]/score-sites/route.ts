import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { SITE_SCORE_PROMPT, fillPrompt } from "@/lib/outreach-config";

// POST /api/outreach/campaigns/[id]/score-sites — score lead websites
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

  const { data: campaign } = await supabase
    .from("outreach_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  // Get leads with websites but no site score
  const { data: leads } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("campaign_id", id)
    .not("website", "eq", "")
    .is("site_score", null);

  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: "No sites to score" });
  }

  let scored = 0;
  const maxSiteScore = campaign.config?.maxSiteScore || 5;

  try {
    for (const lead of leads) {
      // Scrape the website using our own scrape API
      let title = "";
      let metaDescription = "";
      let content = "";

      try {
        const scrapeRes = await fetch(
          new URL("/api/scrape", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").toString(),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: lead.website }),
          }
        );
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          title = scrapeData.meta?.title || "";
          metaDescription = scrapeData.meta?.description || "";
          content = (scrapeData.knowledgeBase || "").slice(0, 3000);
        }
      } catch {
        // Score without scrape data
      }

      const prompt = fillPrompt(SITE_SCORE_PROMPT, {
        business_name: lead.company,
        industry: lead.industry || "",
        url: lead.website,
        title,
        meta_description: metaDescription,
        content: content || "(Could not fetch content)",
      });

      try {
        const resp = await anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          messages: [{ role: "user", content: prompt }],
        });

        const text =
          resp.content[0].type === "text" ? resp.content[0].text : "";
        const result = JSON.parse(text);

        await supabase
          .from("outreach_leads")
          .update({
            site_score: result.score,
            site_issues: Array.isArray(result.issues)
              ? result.issues.join("; ")
              : result.issues || "",
          })
          .eq("id", lead.id);

        scored++;
      } catch {
        // Skip on failure
      }
    }

    // Update stats
    const { data: scoredLeads } = await supabase
      .from("outreach_leads")
      .select("site_score")
      .eq("campaign_id", id)
      .not("site_score", "is", null);

    await supabase
      .from("outreach_campaigns")
      .update({
        status: "draft",
        stats: {
          ...(campaign.stats || {}),
          sitesScored: scoredLeads?.length || 0,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      scored,
      belowThreshold: (scoredLeads || []).filter(
        (l) => l.site_score <= maxSiteScore
      ).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
