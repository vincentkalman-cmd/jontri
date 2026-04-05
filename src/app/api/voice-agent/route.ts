import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const VAPI_BASE = "https://api.vapi.ai";

function vapiHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/** Look up the client's Vapi API key from their stored config in Supabase. */
async function getClientVapiKey(slug: string): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();
  return data?.config?.vapiApiKey || null;
}

// GET — list assistants or call logs using the client's Vapi key
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const apiKey = await getClientVapiKey(slug);
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Vapi API key configured for this client" },
      { status: 400 }
    );
  }

  const type = request.nextUrl.searchParams.get("type") || "assistants";
  const assistantId = request.nextUrl.searchParams.get("assistantId");

  if (type === "calls" && assistantId) {
    const res = await fetch(
      `${VAPI_BASE}/call?assistantId=${assistantId}&limit=50`,
      { headers: vapiHeaders(apiKey) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  }

  // List all assistants
  const res = await fetch(`${VAPI_BASE}/assistant`, {
    headers: vapiHeaders(apiKey),
  });
  const data = await res.json();
  return NextResponse.json(data);
}

// POST — create a new Vapi assistant using the client's API key
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    vapiApiKey,
    businessName,
    industry,
    greeting,
    servicesOffered,
    bookingUrl,
    transferNumber,
    businessHours,
    knowledgeBase,
    clientSlug,
  } = body;

  if (!vapiApiKey) {
    return NextResponse.json(
      { error: "Vapi API key is required" },
      { status: 400 }
    );
  }

  const systemPrompt = buildSystemPrompt({
    businessName,
    industry,
    servicesOffered,
    bookingUrl,
    businessHours,
    knowledgeBase,
  });

  const payload: Record<string, unknown> = {
    name: `${businessName} - AI Phone Agent`,
    model: {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      messages: [{ role: "system", content: systemPrompt }],
    },
    voice: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
    },
    firstMessage:
      greeting ||
      `Hi, thanks for calling ${businessName}. How can I help you today?`,
    endCallMessage: "Thank you for calling! Have a great day.",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
    },
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,
    metadata: { client_slug: clientSlug || "" },
  };

  if (transferNumber) {
    payload.forwardingPhoneNumber = transferNumber;
  }

  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: "POST",
    headers: vapiHeaders(vapiApiKey),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(
      { error: data.message || "Failed to create assistant" },
      { status: res.status }
    );
  }

  return NextResponse.json({
    assistantId: data.id,
    name: data.name,
    status: "deployed",
  });
}

function buildSystemPrompt(config: {
  businessName: string;
  industry: string;
  servicesOffered?: string;
  bookingUrl?: string;
  businessHours?: string;
  knowledgeBase?: string;
}): string {
  let prompt = `You are a friendly, professional AI phone assistant for ${config.businessName}, a ${config.industry} company.

Your capabilities:
- Answer FAQs about the business
- Book appointments
- Take messages
- Transfer to a human when needed`;

  if (config.servicesOffered) {
    prompt += `\n\nServices offered:\n${config.servicesOffered}`;
  }
  if (config.bookingUrl) {
    prompt += `\n\nTo book an appointment, direct callers to: ${config.bookingUrl}`;
  }
  if (config.knowledgeBase) {
    prompt += `\n\nBusiness information:\n${config.knowledgeBase}`;
  }

  prompt += `\n\nBusiness hours: ${config.businessHours || "Monday-Friday 8am-6pm"}
If someone calls outside business hours, take a message and let them know someone will call back.

Rules:
- Be warm and conversational, not robotic
- Keep responses concise (phone calls should be snappy)
- If you can't help with something, offer to transfer to a human
- Always confirm appointment details before booking
- Never make up information you don't have
- If asked about pricing, say you'd be happy to have someone follow up with a quote`;

  return prompt;
}
