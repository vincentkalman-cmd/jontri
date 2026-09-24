import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: ["/api/", "/dashboard/", "/sign-in/", "/onboarding/"],
      },
      { userAgent: "GPTBot", allow: ["/"] },
      { userAgent: "OAI-SearchBot", allow: ["/"] },
      { userAgent: "ChatGPT-User", allow: ["/"] },
      { userAgent: "ClaudeBot", allow: ["/"] },
      { userAgent: "Claude-Web", allow: ["/"] },
      { userAgent: "anthropic-ai", allow: ["/"] },
      { userAgent: "PerplexityBot", allow: ["/"] },
      { userAgent: "Google-Extended", allow: ["/"] },
      { userAgent: "CCBot", allow: ["/"] },
    ],
    sitemap: ["https://jontri.com/sitemap.xml"],
  };
}
