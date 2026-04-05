import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const AI_SEO_PROMPT = `You are an AI search optimization expert. Analyze this business's web presence for visibility in AI-powered search engines (ChatGPT, Perplexity, Google AI Overviews, Bing Copilot).

Business: {business_name}
Website: {website_url}
Industry: {industry}
Target AI Queries: {target_queries}

Website Content:
{content}

Analyze and return a JSON object with:
- "overall_score": integer 1-10 (10 = fully optimized for AI search)
- "structured_data": { "present": boolean, "types_found": string[], "missing": string[], "score": integer 1-10 }
- "content_citability": { "score": integer 1-10, "issues": string[], "recommendations": string[] }
- "entity_clarity": { "score": integer 1-10, "issues": string[], "recommendations": string[] }
- "llms_txt": { "present": boolean, "recommendation": string }
- "ai_query_coverage": [{ "query": string, "coverage": "strong"|"weak"|"missing", "recommendation": string }]
- "top_recommendations": string[] (top 5 actionable recommendations, prioritized)

Scoring guide:
1-3: Invisible to AI search engines
4-5: Partially visible, missing key signals
6-7: Decent visibility, room for improvement
8-10: Well-optimized for AI search

Return ONLY valid JSON, no markdown fences.`;

// POST /api/ai-seo — analyze a website for AI search optimization
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { businessName, websiteUrl, targetQueries, industry } = body;

  if (!websiteUrl) {
    return NextResponse.json(
      { error: "Website URL is required" },
      { status: 400 }
    );
  }

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Scrape the website for content
    let content = "";
    try {
      const scrapeRes = await fetch(
        new URL(
          "/api/scrape",
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        ).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: websiteUrl }),
        }
      );
      if (scrapeRes.ok) {
        const scrapeData = await scrapeRes.json();
        content = scrapeData.knowledgeBase || "";
      }
    } catch {
      content = "(Could not fetch website content)";
    }

    // Check for llms.txt
    let llmsTxtPresent = false;
    try {
      const llmsRes = await fetch(
        new URL("/llms.txt", websiteUrl).toString(),
        { method: "HEAD", signal: AbortSignal.timeout(5000) }
      );
      llmsTxtPresent = llmsRes.ok;
    } catch {
      // Not found
    }

    const prompt = AI_SEO_PROMPT.replace("{business_name}", businessName || "")
      .replace("{website_url}", websiteUrl)
      .replace("{industry}", industry || "")
      .replace("{target_queries}", targetQueries || "")
      .replace("{content}", content.slice(0, 5000));

    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const resp = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = resp.content[0].type === "text" ? resp.content[0].text : "";
    const result = JSON.parse(text);

    // Override llms.txt with actual check
    if (result.llms_txt) {
      result.llms_txt.present = llmsTxtPresent;
    }

    return NextResponse.json({ analysis: result });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "AI SEO analysis failed",
      },
      { status: 500 }
    );
  }
}
