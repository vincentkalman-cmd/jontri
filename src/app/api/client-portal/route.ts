import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET /api/client-portal?slug=abc-plumbing — public endpoint, no auth required
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = getSupabase();

  const { data: client, error } = await supabase
    .from("clients")
    .select("name, slug, industry, services, status, created_at")
    .eq("slug", slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Load config but only expose safe, non-secret fields
  const { data: configRow } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();

  const config = configRow?.config || {};

  // Build a safe public view of deployed services
  const serviceDetails: Record<string, Record<string, string>> = {};

  if (client.services?.["voice-agent"]) {
    serviceDetails["voice-agent"] = {
      status: client.services["voice-agent"].status,
      businessPhone: config["voice-agent"]?.businessPhone || "",
      businessHours: config["voice-agent"]?.businessHours || config.chatbot?.businessHours || "Monday-Friday 8am-6pm",
    };
  }

  if (client.services?.chatbot) {
    const chatbotColor = config.chatbot?.primaryColor || "#3B82F6";
    serviceDetails.chatbot = {
      status: client.services.chatbot.status,
      embedCode: `<script src="${request.nextUrl.origin}/api/chatbot?client=${slug}&color=${encodeURIComponent(chatbotColor)}"></script>`,
    };
  }

  if (client.services?.website) {
    serviceDetails.website = {
      status: client.services.website.status,
    };
  }

  if (client.services?.prospector) {
    serviceDetails.prospector = {
      status: client.services.prospector.status,
    };
  }

  if (client.services?.["seo-audit"]) {
    serviceDetails["seo-audit"] = {
      status: client.services["seo-audit"].status,
    };
  }

  if (client.services?.["review-mgmt"]) {
    serviceDetails["review-mgmt"] = {
      status: client.services["review-mgmt"].status,
    };
  }

  return NextResponse.json({
    name: client.name,
    slug: client.slug,
    industry: client.industry,
    status: client.status,
    services: serviceDetails,
    createdAt: client.created_at,
  });
}
