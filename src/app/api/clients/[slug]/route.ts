import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isStage, toggleChecklistItem, portalUrl, type ChecklistItem } from "@/lib/lifecycle";
import { toDashboardClient } from "@/lib/dashboard-client";
import { clientReadyForReviewEmail } from "@/lib/lifecycle-emails";
import { sendMail } from "@/lib/mailer";

// GET /api/clients/[slug] — get single client
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Load config
  const { data: configRow } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();

  return NextResponse.json({ client, config: configRow?.config || null });
}

// DELETE /api/clients/[slug]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Client '${slug}' removed` });
}

// PATCH /api/clients/[slug] — stage, one checklist item, or notes
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.stage !== undefined) {
    if (!isStage(body.stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    updates.stage = body.stage;
  }
  if (body.checklistItem) {
    const { id, done } = body.checklistItem;
    if (typeof id !== "string" || typeof done !== "boolean") return NextResponse.json({ error: "Invalid checklist item" }, { status: 400 });
    const list: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
    if (!list.some((i) => i.id === id)) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });
    updates.checklist = toggleChecklistItem(list, id, done);
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string" || body.notes.length > 5000) return NextResponse.json({ error: "Notes must be under 5,000 characters" }, { status: 400 });
    updates.notes = body.notes;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data: saved, error } = await supabase.from("clients").update(updates).eq("slug", slug).select("*").single();
  if (error || !saved) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });

  if (updates.stage === "review" && client.stage !== "review" && saved.contact_email) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    await sendMail({
      to: saved.contact_email,
      ...clientReadyForReviewEmail({ contactName: saved.contact_name || "there", businessName: saved.name, portalUrl: portalUrl(origin, saved.portal_token) }),
    });
  }
  const { data: cfg } = await supabase
    .from("client_configs")
    .select('onboarding:config->onboarding, phoneNumber:config->"voice-agent"->>phoneNumber')
    .eq("slug", slug)
    .maybeSingle();
  return NextResponse.json({ client: toDashboardClient(saved, (cfg as { onboarding?: unknown; phoneNumber?: unknown }) || {}) });
}
