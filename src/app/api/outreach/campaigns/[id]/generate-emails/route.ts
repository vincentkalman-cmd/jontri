import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { EMAIL_PROMPT, SENDER, fillPrompt } from "@/lib/outreach-config";

// POST /api/outreach/campaigns/[id]/generate-emails — generate personalized emails
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

  // Get qualified leads without emails
  const { data: leads } = await supabase
    .from("outreach_leads")
    .select("*")
    .eq("campaign_id", id)
    .eq("status", "qualified");

  if (!leads || leads.length === 0) {
    return NextResponse.json({ message: "No qualified leads to email" });
  }

  await supabase
    .from("outreach_campaigns")
    .update({ status: "generating", updated_at: new Date().toISOString() })
    .eq("id", id);

  const emailTone = campaign.config?.emailTone || "professional but conversational, not pushy";
  const customGuidelines = (campaign.config?.customGuidelines || [])
    .map((g: string) => `- ${g}`)
    .join("\n");
  let generated = 0;

  try {
    for (const lead of leads) {
      const prompt = fillPrompt(EMAIL_PROMPT, {
        from_name: SENDER.fromName,
        from_title: SENDER.fromTitle,
        from_company: SENDER.fromCompany,
        company_name: lead.company,
        industry: lead.industry || "",
        city: lead.city || "",
        state: lead.state || "",
        pain_points: lead.pain_points || "",
        hook: lead.personalized_hook || "",
        booking_url: SENDER.bookingUrl,
        max_words: 150,
        tone: emailTone,
        custom_guidelines: customGuidelines,
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

        await supabase
          .from("outreach_leads")
          .update({
            email_subject: result.subject || "",
            email_body: result.body || "",
            email_status: "generated",
            status: "email_generated",
          })
          .eq("id", lead.id);

        generated++;
      } catch {
        // Skip on failure
      }
    }

    await supabase
      .from("outreach_campaigns")
      .update({
        status: "draft",
        stats: {
          ...(campaign.stats || {}),
          emailsGenerated: generated,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      totalProcessed: leads.length,
      generated,
    });
  } catch (err) {
    await supabase
      .from("outreach_campaigns")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Email generation failed" },
      { status: 500 }
    );
  }
}
