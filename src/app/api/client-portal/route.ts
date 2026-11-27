import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/client-portal?slug=abc-plumbing — public endpoint, no auth required
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

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

  // Build a safe public view of deployed services (never include API keys or raw config).
  type Detail = Record<string, unknown>;
  const serviceDetails: Record<string, Detail> = {};
  const services: Record<string, { status?: string; detail?: string }> = client.services || {};

  for (const [key, svc] of Object.entries(services)) {
    const cfg = (config[key] || {}) as Record<string, unknown>;
    const d: Detail = { status: svc?.status || "pending" };
    if (svc?.detail) d.detail = svc.detail;

    if (key === "voice-agent") {
      d.businessPhone = cfg.businessPhone || "";
      d.businessHours = cfg.businessHours || "Monday-Friday 8am-6pm";
    }
    if (key === "chatbot") {
      const color = typeof cfg.primaryColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(cfg.primaryColor) ? cfg.primaryColor : "#3B82F6";
      d.embedCode = `<script src="${request.nextUrl.origin}/api/chatbot?client=${encodeURIComponent(slug)}&color=${encodeURIComponent(color)}"></script>`;
    }
    if (key === "seo-audit" && cfg.audit && typeof cfg.audit === "object") {
      const audit = cfg.audit as { scores?: unknown; fixes?: unknown; checkedAt?: unknown };
      d.scores = audit.scores;
      d.fixes = Array.isArray(audit.fixes) ? audit.fixes.slice(0, 5) : [];
      d.checkedAt = audit.checkedAt;
    }
    if (key === "ai-seo" && cfg.analysis && typeof cfg.analysis === "object") {
      const an = cfg.analysis as { overall_score?: unknown; top_recommendations?: unknown };
      d.aiScore = an.overall_score;
      d.recommendations = Array.isArray(an.top_recommendations) ? an.top_recommendations.slice(0, 5) : [];
      d.checkedAt = cfg.checkedAt;
    }
    serviceDetails[key] = d;
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
