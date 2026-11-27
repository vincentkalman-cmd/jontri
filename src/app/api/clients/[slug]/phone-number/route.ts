import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveVapiKey, buyPhoneNumber } from "@/lib/vapi";

// POST /api/clients/<slug>/phone-number — buy a Vapi number and point it at the client's assistant (admin only).
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const areaCode = typeof body.areaCode === "string" && body.areaCode.trim() ? body.areaCode.trim() : undefined;

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("name").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config = (cfgRow?.config || {}) as Record<string, unknown>;
  const voice = (config["voice-agent"] || {}) as Record<string, unknown>;

  // Never buy a second number for the same client.
  if (typeof voice.phoneNumber === "string" && voice.phoneNumber) return NextResponse.json({ phoneNumber: voice.phoneNumber });
  if (typeof voice.assistantId !== "string" || !voice.assistantId) {
    return NextResponse.json({ error: "Set up the voice agent first (Set up all), then get a number." }, { status: 400 });
  }
  const apiKey = resolveVapiKey(voice);
  if (!apiKey) return NextResponse.json({ error: "VAPI_API_KEY isn't set in Vercel yet." }, { status: 400 });

  const r = await buyPhoneNumber(apiKey, voice.assistantId, { areaCode, name: client.name });
  if (!r.ok) return NextResponse.json({ error: `Vapi: ${r.error}` }, { status: 502 });

  config["voice-agent"] = { ...voice, phoneNumberId: r.id, phoneNumber: r.number };
  await supabase.from("client_configs").upsert({ slug, config, updated_at: new Date().toISOString() });
  return NextResponse.json({ phoneNumber: r.number || "Provisioning… refresh in a minute" });
}
