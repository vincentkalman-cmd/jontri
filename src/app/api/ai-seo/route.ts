import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { analyzeAiSeo } from "@/lib/ai-seo";

export const maxDuration = 60;

// POST /api/ai-seo — analyze a website for AI search optimization (admin only; see middleware)
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const { businessName, websiteUrl, targetQueries, industry } = body;
  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required" }, { status: 400 });
  }

  const r = await analyzeAiSeo({ websiteUrl, businessName, industry, targetQueries });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ analysis: r.analysis });
}
