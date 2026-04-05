// TODO: Add rate limiting via Vercel's config or @upstash/ratelimit to prevent abuse
import { NextRequest, NextResponse } from "next/server";

// Strip HTML tags and normalize whitespace
function extractText(html: string): string {
  // Remove script and style blocks
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  // Replace common elements with newlines
  text = text.replace(/<\/?(h[1-6]|p|div|li|br|tr)[^>]*>/gi, "\n");
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, " ");
  // Decode common HTML entities
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  // Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n\s*\n/g, "\n").trim();
  // Remove very short lines (likely menu items, icons, etc.)
  const lines = text.split("\n").filter((l) => l.trim().length > 15);
  return lines.join("\n").substring(0, 8000); // Cap at 8k chars
}

// Extract metadata from HTML
function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  const metaTags = html.matchAll(/<meta[^>]*(?:name|property)=["']([^"']+)["'][^>]*content=["']([^"']+)["'][^>]*/gi);
  for (const m of metaTags) {
    const key = m[1].toLowerCase();
    if (["description", "og:description", "og:title", "keywords"].includes(key)) {
      meta[key] = m[2];
    }
  }
  // Also try content before name/property
  const metaTags2 = html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']([^"']+)["'][^>]*/gi);
  for (const m of metaTags2) {
    const key = m[2].toLowerCase();
    if (["description", "og:description", "og:title", "keywords"].includes(key)) {
      meta[key] = m[1];
    }
  }
  return meta;
}

// Try to find key pages to scrape
function getPageUrls(baseUrl: string, html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const linkRegex = /href=["']([^"'#]+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1];
    if (href.startsWith("/")) href = baseUrl + href;
    if (!href.startsWith(baseUrl)) continue;
    const path = href.replace(baseUrl, "").toLowerCase();
    if (seen.has(path)) continue;
    seen.add(path);
    // Only scrape key pages
    if (/\/(about|services|pricing|faq|contact|team|what-we-do|our-work)/i.test(path)) {
      urls.push(href);
    }
  }
  return urls.slice(0, 4); // Max 4 sub-pages
}

function isPrivateOrDisallowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    // Only allow http and https schemes
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
    const hostname = parsed.hostname.toLowerCase();
    // Reject localhost variants
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true;
    // Reject private IP ranges
    const parts = hostname.split(".").map(Number);
    if (parts.length === 4 && parts.every((p) => !isNaN(p))) {
      if (parts[0] === 10) return true; // 10.x.x.x
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true; // 172.16-31.x.x
      if (parts[0] === 192 && parts[1] === 168) return true; // 192.168.x.x
      if (parts[0] === 127) return true; // 127.x.x.x
      if (parts[0] === 169 && parts[1] === 254) return true; // 169.254.x.x
      if (parts[0] === 0) return true; // 0.x.x.x
    }
    return false;
  } catch {
    return true;
  }
}

export async function POST(request: NextRequest) {
  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Normalize URL
  let baseUrl = url.startsWith("http") ? url : `https://${url}`;
  baseUrl = baseUrl.replace(/\/$/, "");

  if (isPrivateOrDisallowedUrl(baseUrl)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    // Fetch the main page
    const res = await fetch(baseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JontriBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${res.status}` }, { status: 400 });
    }

    const html = await res.text();
    const meta = extractMeta(html);
    const mainContent = extractText(html);

    // Find and scrape sub-pages
    const subPages = getPageUrls(baseUrl, html);
    const pageContents: Record<string, string> = { home: mainContent };

    for (const pageUrl of subPages) {
      try {
        const pageRes = await fetch(pageUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; JontriBot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (pageRes.ok) {
          const pageHtml = await pageRes.text();
          const pagePath = pageUrl.replace(baseUrl, "") || "/";
          pageContents[pagePath] = extractText(pageHtml);
        }
      } catch {
        // Skip failed sub-pages
      }
    }

    // Build a combined knowledge base
    let knowledgeBase = "";
    if (meta.title) knowledgeBase += `Business: ${meta.title}\n`;
    if (meta.description || meta["og:description"]) {
      knowledgeBase += `Description: ${meta.description || meta["og:description"]}\n`;
    }
    knowledgeBase += `Website: ${baseUrl}\n\n`;

    for (const [page, content] of Object.entries(pageContents)) {
      knowledgeBase += `--- ${page === "home" ? "Homepage" : page} ---\n${content}\n\n`;
    }

    // Trim to a reasonable size for bot context
    const trimmedKnowledge = knowledgeBase.substring(0, 15000);

    return NextResponse.json({
      url: baseUrl,
      meta,
      pagesScraped: Object.keys(pageContents).length,
      knowledgeBase: trimmedKnowledge,
      contentLength: trimmedKnowledge.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Could not reach website: ${err instanceof Error ? err.message : "unknown error"}` },
      { status: 400 }
    );
  }
}
