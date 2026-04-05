// TODO: Add rate limiting via Vercel's config or @upstash/ratelimit to prevent abuse
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabase } from "@/lib/supabase";

function getAllowedOrigin(requestOrigin: string | null): string | null {
  const allowedRaw = process.env.ALLOWED_ORIGINS || "https://jontri.com,https://www.jontri.com";
  const allowed = allowedRaw.split(",").map((o) => o.trim()).filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return null;
}

function corsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigin(origin);
  if (allowed) {
    return { "Access-Control-Allow-Origin": allowed, "Vary": "Origin" };
  }
  return {};
}

async function getClientConfig(slug: string) {
  const supabase = getSupabase();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!client) return null;

  const { data: configRow } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();

  return { client, config: configRow?.config || {} };
}

export async function POST(request: NextRequest) {
  const { slug, message, history } = await request.json();

  if (!slug || !message) {
    return NextResponse.json({ error: "slug and message are required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Chat service not configured" }, { status: 500 });
  }

  const data = await getClientConfig(slug);
  if (!data) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { client, config } = data;
  const chatbotConfig = config.chatbot || config["voice-agent"] || {};
  const businessName = chatbotConfig.businessName || client.name;
  const knowledge = chatbotConfig.websiteKnowledge || "";
  const personality = chatbotConfig.botPersonality || "Friendly & Casual";
  const servicesOffered = chatbotConfig.servicesOffered || "";
  const bookingUrl = chatbotConfig.bookingUrl || "";
  const industry = chatbotConfig.industry || client.industry || "";

  const systemPrompt = `You are the AI assistant for ${businessName}${industry ? `, a ${industry} company` : ""}.

Your personality: ${personality}

IMPORTANT RULES:
- Only answer questions about ${businessName} and its services. If asked about unrelated topics, politely redirect to how you can help with ${businessName}'s services.
- Be concise — keep responses under 3 sentences unless more detail is needed.
- If the visitor seems interested, suggest they book a consultation${bookingUrl ? ` at ${bookingUrl}` : ""} or ask for their contact info so someone can follow up.
- Never make up information. If you don't know something specific, say you'll have someone from the team follow up.
- Be warm and helpful, not pushy.

${servicesOffered ? `Services offered:\n${servicesOffered}\n` : ""}
${knowledge ? `Here is detailed information about the business scraped from their website. Use this to answer questions accurately:\n\n${knowledge}` : "No website data available. Answer based on the business name and industry only."}`;

  try {
    const anthropic = new Anthropic({ apiKey });

    const messages: { role: "user" | "assistant"; content: string }[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }
    messages.push({ role: "user", content: message });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply, businessName }, {
      headers: corsHeaders(request),
    });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500, headers: corsHeaders(request) }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = getAllowedOrigin(origin);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (allowed) {
    headers["Access-Control-Allow-Origin"] = allowed;
    headers["Vary"] = "Origin";
  }
  return new NextResponse(null, { headers });
}
