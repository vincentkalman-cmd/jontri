import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { provisionService } from "@/lib/provision";
import { runSetupAll, mergeSetupResults } from "@/lib/setup-all";
import { isStage, stageAfterSetupAll, buildChecklist, type ChecklistItem } from "@/lib/lifecycle";

// Chatbot scrape + SEO audit + AI-search analysis + Vapi all run in parallel.
export const maxDuration = 120;

// POST /api/clients/<slug>/setup-all — provision every service on the client (admin only, via middleware).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("slug, services, stage").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config: Record<string, Record<string, unknown>> = cfgRow?.config || {};

  const serviceKeys = Object.keys(client.services || {});
  if (serviceKeys.length === 0) return NextResponse.json({ error: "This client has no services yet." }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const results = await runSetupAll(serviceKeys, config, (service, cfg) => provisionService(service, slug, cfg, origin));

  // Provisioning can take up to 2 minutes: re-read and merge so changes made meanwhile
  // (client approval, feedback, a bought number, checklist ticks) are not overwritten.
  const now = new Date().toISOString();
  const [{ data: freshClient }, { data: freshCfg }] = await Promise.all([
    supabase.from("clients").select("services, stage, checklist").eq("slug", slug).maybeSingle(),
    supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle(),
  ]);
  if (!freshClient) return NextResponse.json({ error: "Client was removed during setup." }, { status: 404 });
  const merged = mergeSetupResults(freshCfg?.config || {}, freshClient.services || {}, results, now);
  const existing: ChecklistItem[] = Array.isArray(freshClient.checklist) ? freshClient.checklist : [];
  const checklist = buildChecklist(serviceKeys, existing);

  const { error: cfgError } = await supabase.from("client_configs").upsert({ slug, config: merged.config, updated_at: now });
  const { error: clientError } = await supabase.from("clients").update({ services: merged.services, checklist }).eq("slug", slug);
  if (cfgError || clientError) {
    const ids = results.filter((r) => r.assistantId).map((r) => `${r.service}: ${r.assistantId}`).join(", ");
    return NextResponse.json(
      { error: `Services were set up but saving failed (${(cfgError || clientError)?.message}).${ids ? ` Vapi assistant ${ids}.` : ""} Run Set up all again.` },
      { status: 500 },
    );
  }

  // Only move early stages forward, and only if nobody changed the stage meanwhile.
  const prevStage = isStage(freshClient.stage) ? freshClient.stage : "signed_up";
  let stage = prevStage;
  const nextStage = stageAfterSetupAll(prevStage);
  if (nextStage !== prevStage) {
    const { data: moved } = await supabase.from("clients").update({ stage: nextStage }).eq("slug", slug).eq("stage", prevStage).select("stage").maybeSingle();
    if (moved) stage = nextStage;
  }

  return NextResponse.json({
    stage,
    results: results.map(({ service, status, detail, embedCode, assistantId, scores, aiScore }) => ({ service, status, detail, embedCode, assistantId, scores, aiScore })),
  });
}
