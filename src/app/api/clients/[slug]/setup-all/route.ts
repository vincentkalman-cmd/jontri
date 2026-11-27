import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { provisionService } from "@/lib/provision";
import { runSetupAll } from "@/lib/setup-all";
import { isStage, stageAfterSetupAll, buildChecklist, type ChecklistItem } from "@/lib/lifecycle";

// Chatbot scrape + SEO audit + AI-search analysis + Vapi all run in parallel.
export const maxDuration = 120;

// POST /api/clients/<slug>/setup-all — provision every service on the client (admin only, via middleware).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("slug, services, stage, checklist").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config: Record<string, Record<string, unknown>> = cfgRow?.config || {};

  const serviceKeys = Object.keys(client.services || {});
  if (serviceKeys.length === 0) return NextResponse.json({ error: "This client has no services yet." }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const results = await runSetupAll(serviceKeys, config, (service, cfg) => provisionService(service, slug, cfg, origin));

  const now = new Date().toISOString();
  const services = { ...(client.services || {}) };
  for (const r of results) {
    if (r.configPatch) config[r.service] = { ...(config[r.service] || {}), ...r.configPatch };
    services[r.service] = { status: r.status, detail: r.detail, updated_at: now };
  }
  const stage = stageAfterSetupAll(isStage(client.stage) ? client.stage : "signed_up");
  const existing: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
  const checklist = buildChecklist(serviceKeys, existing);

  await supabase.from("client_configs").upsert({ slug, config, updated_at: now });
  await supabase.from("clients").update({ services, stage, checklist }).eq("slug", slug);

  return NextResponse.json({
    stage,
    results: results.map(({ service, status, detail, embedCode, assistantId, scores, aiScore }) => ({ service, status, detail, embedCode, assistantId, scores, aiScore })),
  });
}
