/**
 * Turns a saved service config into a working service. Called by POST /api/clients
 * right after the config is stored, so every dashboard deploy screen gets the same
 * behavior: enter client info → service is set up (or we say exactly what's missing).
 */
import { normalizeUserUrl, safeFetchPage, publicFileExists } from "@/lib/safe-fetch";
import { pageText } from "@/lib/page-text";
import { auditHtml } from "@/lib/site-audit";
import { analyzeAiSeo } from "@/lib/ai-seo";
import { upsertAssistant, resolveVapiKey } from "@/lib/vapi";

export type ProvisionStatus = "active" | "needs_setup" | "manual" | "error";

export interface ProvisionResult {
  service: string;
  status: ProvisionStatus;
  detail: string;
  /** Merged into client_configs.config[service]. */
  configPatch?: Record<string, unknown>;
  /** Safe-to-show extras for the dashboard result screen. */
  embedCode?: string;
  assistantId?: string;
  scores?: Record<string, number>;
  aiScore?: number;
}

/** Services that are set up automatically from client info. Everything else is run by the team. */
export const AUTO_SERVICES = ["chatbot", "voice-agent", "seo-audit", "ai-seo"] as const;

const MANUAL_DETAIL: Record<string, string> = {
  prospector: "Run from the Outreach tab: create a campaign for this client's industry and area.",
  "review-mgmt": "Set up by the Jontri team (review requests + reply drafting).",
  website: "Built by the Jontri team.",
  "follow-up": "Set up by the Jontri team.",
  reporting: "Monthly report prepared by the Jontri team.",
  "n8n-workflows": "Custom workflows scoped and built by the Jontri team.",
  "ai-estimating": "Set up by the Jontri team.",
  "strategy-calls": "Scheduled by the Jontri team.",
};

export function isAutoService(service: string): boolean {
  return (AUTO_SERVICES as readonly string[]).includes(service);
}

export function chatbotEmbedCode(origin: string, slug: string, color?: string): string {
  const c = /^#[0-9a-fA-F]{3,8}$/.test(color || "") ? (color as string) : "#3B82F6";
  return `<script src="${origin}/api/chatbot?client=${encodeURIComponent(slug)}&color=${encodeURIComponent(c)}"></script>`;
}

type Cfg = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function fetchKnowledge(websiteUrl: string): Promise<string> {
  const url = normalizeUserUrl(websiteUrl);
  if (!url) return "";
  try {
    const page = await safeFetchPage(url);
    return pageText(page.html);
  } catch {
    return "";
  }
}

async function provisionChatbot(slug: string, cfg: Cfg, origin: string): Promise<ProvisionResult> {
  const patch: Record<string, unknown> = {};
  if (!str(cfg.websiteKnowledge) && str(cfg.websiteUrl)) {
    const knowledge = await fetchKnowledge(str(cfg.websiteUrl));
    if (knowledge) patch.websiteKnowledge = knowledge;
  }
  const hasKnowledge = Boolean(str(cfg.websiteKnowledge) || patch.websiteKnowledge || str(cfg.servicesOffered));
  const embedCode = chatbotEmbedCode(origin, slug, str(cfg.primaryColor));
  return {
    service: "chatbot",
    status: "active",
    detail: hasKnowledge
      ? "Chatbot is live. Paste the embed code into the client's website."
      : "Chatbot is live, but we couldn't read their website. Add services/FAQ text so it can answer accurately.",
    configPatch: { ...patch, deployedAt: new Date().toISOString() },
    embedCode,
  };
}

async function provisionVoiceAgent(slug: string, cfg: Cfg): Promise<ProvisionResult> {
  const apiKey = resolveVapiKey(cfg);
  if (!apiKey) {
    return { service: "voice-agent", status: "needs_setup", detail: "VAPI_API_KEY isn't set in Vercel yet. Add it, then run setup again." };
  }
  let knowledge = str(cfg.websiteKnowledge);
  const patch: Record<string, unknown> = {};
  if (!knowledge && str(cfg.websiteUrl)) {
    knowledge = await fetchKnowledge(str(cfg.websiteUrl));
    if (knowledge) patch.websiteKnowledge = knowledge;
  }
  const r = await upsertAssistant(
    apiKey,
    {
      businessName: str(cfg.businessName) || slug,
      industry: str(cfg.industry),
      greeting: str(cfg.greeting),
      servicesOffered: str(cfg.servicesOffered),
      bookingUrl: str(cfg.bookingUrl),
      businessHours: str(cfg.businessHours),
      transferNumber: str(cfg.transferNumber),
      knowledgeBase: knowledge,
      clientSlug: slug,
    },
    str(cfg.assistantId) || undefined,
  );
  if (!r.ok) {
    return { service: "voice-agent", status: "error", detail: `Vapi rejected the setup: ${r.error}`, configPatch: patch };
  }
  return {
    service: "voice-agent",
    status: "active",
    detail: "AI receptionist is live. Use Get phone number in the dashboard to give it a number.",
    configPatch: { ...patch, assistantId: r.assistantId, deployedAt: new Date().toISOString() },
    assistantId: r.assistantId,
  };
}

async function provisionSeoAudit(cfg: Cfg): Promise<ProvisionResult> {
  const url = normalizeUserUrl(str(cfg.websiteUrl));
  if (!url) return { service: "seo-audit", status: "needs_setup", detail: "Add the client's website URL, then redeploy to run the audit." };
  try {
    const page = await safeFetchPage(url);
    const final = new URL(page.finalUrl);
    const hasLlmsTxt = await publicFileExists(final, "/llms.txt");
    const audit = auditHtml({ html: page.html, finalUrl: page.finalUrl, responseMs: page.responseMs, hasLlmsTxt });
    const fixes = audit.checks
      .filter((c) => !c.pass)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8)
      .map((c) => ({ label: c.label, fix: c.fix }));
    const passed = audit.checks.filter((c) => c.pass).length;
    return {
      service: "seo-audit",
      status: "active",
      detail: `Audit complete: passed ${passed} of ${audit.checks.length} checks. Google SEO ${audit.scores.seo}/100.`,
      configPatch: { audit: { scores: audit.scores, passed, total: audit.checks.length, fixes, checkedAt: new Date().toISOString() } },
      scores: audit.scores,
    };
  } catch {
    return { service: "seo-audit", status: "error", detail: "Couldn't reach the client's website. Check the URL and redeploy." };
  }
}

async function provisionAiSeo(cfg: Cfg): Promise<ProvisionResult> {
  if (!str(cfg.websiteUrl)) return { service: "ai-seo", status: "needs_setup", detail: "Add the client's website URL, then redeploy to run the analysis." };
  const r = await analyzeAiSeo({
    websiteUrl: str(cfg.websiteUrl),
    businessName: str(cfg.businessName),
    industry: str(cfg.industry),
    targetQueries: str(cfg.targetQueries) || str(cfg.targetKeywords),
  });
  if (!r.ok) return { service: "ai-seo", status: "error", detail: `AI search analysis failed: ${r.error}` };
  const score = Number(r.analysis.overall_score) || 0;
  return {
    service: "ai-seo",
    status: "active",
    detail: `AI search analysis complete: ${score}/10 visibility.`,
    configPatch: { analysis: r.analysis, checkedAt: new Date().toISOString() },
    aiScore: score,
  };
}

export async function provisionService(service: string, slug: string, cfg: Cfg, origin: string): Promise<ProvisionResult> {
  switch (service) {
    case "chatbot":
      return provisionChatbot(slug, cfg, origin);
    case "voice-agent":
      return provisionVoiceAgent(slug, cfg);
    case "seo-audit":
      return provisionSeoAudit(cfg);
    case "ai-seo":
      return provisionAiSeo(cfg);
    default:
      return { service, status: "manual", detail: MANUAL_DETAIL[service] || "Set up by the Jontri team." };
  }
}
