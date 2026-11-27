import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveVapiKey, buyPhoneNumber, getPhoneNumber, phoneNumberPlan } from "@/lib/vapi";

async function saveNumber(slug: string, id: string, number: string) {
  // Re-read just before writing so other config changes made meanwhile are kept.
  const supabase = getSupabaseAdmin();
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config = (cfgRow?.config || {}) as Record<string, unknown>;
  const voice = (config["voice-agent"] || {}) as Record<string, unknown>;
  config["voice-agent"] = { ...voice, phoneNumberId: id, phoneNumber: number };
  const { error } = await supabase.from("client_configs").upsert({ slug, config, updated_at: new Date().toISOString() });
  return error;
}

// POST /api/clients/<slug>/phone-number — buy a Vapi number for the client's assistant, or
// fetch the digits of one already bought. Never buys a second number (admin only).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const areaCode = typeof body.areaCode === "string" && body.areaCode.trim() ? body.areaCode.trim() : undefined;

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("name").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const voice = ((cfgRow?.config || {})["voice-agent"] || {}) as Record<string, unknown>;

  const plan = phoneNumberPlan(voice);
  if (plan.action === "existing") return NextResponse.json({ phoneNumber: plan.number });
  if (plan.action === "error") return NextResponse.json({ error: plan.error }, { status: 400 });

  const apiKey = resolveVapiKey(voice);
  if (!apiKey) return NextResponse.json({ error: "VAPI_API_KEY isn't set in Vercel yet." }, { status: 400 });

  const r = plan.action === "refresh" ? await getPhoneNumber(apiKey, plan.id) : await buyPhoneNumber(apiKey, plan.assistantId, { areaCode, name: client.name });
  if (!r.ok) return NextResponse.json({ error: `Vapi: ${r.error}` }, { status: 502 });

  const saveError = await saveNumber(slug, r.id, r.number);
  if (saveError) {
    return NextResponse.json({ error: `Vapi created number ${r.number || r.id} (id ${r.id}) but saving failed: ${saveError.message}. Don't buy again — add it in Supabase or retry.` }, { status: 500 });
  }
  return NextResponse.json({ phoneNumber: r.number || "Vapi is still assigning the number. Click again in a minute." });
}
