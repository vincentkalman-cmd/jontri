import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail } from "@/lib/mailer";
import { isPortalTokenFormat, isStage, applyFeedback, type FeedbackAction } from "@/lib/lifecycle";
import { ownerFeedbackEmail } from "@/lib/lifecycle-emails";

// POST /api/portal/<token>/feedback — client approves or requests changes from their private portal.
export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = rateLimit(request, { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const { token } = await params;
  if (!isPortalTokenFormat(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const action = body?.action as FeedbackAction;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
  if (action !== "approve" && action !== "changes") return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (action === "changes" && !note) return NextResponse.json({ error: "Tell us what you'd like changed." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("slug, name, stage").eq("portal_token", token).maybeSingle();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = isStage(client.stage) ? client.stage : "signed_up";
  const next = applyFeedback(current, action);
  if (!next.ok) return NextResponse.json({ error: next.error }, { status: 409 });

  // Only move the stage if nobody changed it meanwhile (double-click / two tabs).
  const { data: updated } = await supabase
    .from("clients")
    .update({ stage: next.stage })
    .eq("slug", client.slug)
    .eq("stage", current)
    .select("slug")
    .maybeSingle();
  if (!updated) return NextResponse.json({ error: "This was already submitted." }, { status: 409 });

  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", client.slug).maybeSingle();
  const config = (cfgRow?.config || {}) as Record<string, unknown>;
  const feedback = Array.isArray(config.portal_feedback) ? config.portal_feedback : [];
  config.portal_feedback = [{ action, note, at: new Date().toISOString() }, ...feedback].slice(0, 20);
  await supabase.from("client_configs").upsert({ slug: client.slug, config, updated_at: new Date().toISOString() });

  const to = process.env.OWNER_EMAIL || process.env.ZOHO_EMAIL;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (to) await sendMail({ to, ...ownerFeedbackEmail({ businessName: client.name, action, note, dashboardUrl: `${origin}/dashboard` }) });

  return NextResponse.json({ stage: next.stage });
}
