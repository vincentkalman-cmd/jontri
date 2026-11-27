/** Client-facing view of deployed services. Allow-list only: never spread raw config. Pure — no app imports. */

export interface PortalServiceView {
  status: string;
  detail?: string;
  businessPhone?: string;
  businessHours?: string;
  phoneNumber?: string;
  embedCode?: string;
  scores?: Record<string, number>;
  fixes?: { label: string; fix: string }[];
  aiScore?: number;
  recommendations?: string[];
  checkedAt?: string;
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
const str = (v: unknown, max = 300): string | undefined => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

function scores(v: unknown): Record<string, number> | undefined {
  const out: Record<string, number> = {};
  for (const [k, n] of Object.entries(obj(v))) if (typeof n === "number" && Number.isFinite(n)) out[k.slice(0, 20)] = n;
  return Object.keys(out).length ? out : undefined;
}

export function buildServiceViews(
  services: Record<string, { status?: string; detail?: string }>,
  config: Record<string, unknown>,
  slug: string,
  origin: string,
): Record<string, PortalServiceView> {
  const views: Record<string, PortalServiceView> = {};
  for (const [key, svc] of Object.entries(services || {})) {
    const cfg = obj(config[key]);
    // svc.detail is written for the owner (e.g. "VAPI_API_KEY isn't set") — clients only see the status.
    const v: PortalServiceView = { status: str(svc?.status, 30) || "pending" };

    if (key === "voice-agent") {
      v.businessPhone = str(cfg.businessPhone, 40);
      v.businessHours = str(cfg.businessHours, 200);
      v.phoneNumber = str(cfg.phoneNumber, 40);
    }
    if (key === "chatbot") {
      const color = typeof cfg.primaryColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(cfg.primaryColor) ? cfg.primaryColor : "#3B82F6";
      v.embedCode = `<script src="${origin}/api/chatbot?client=${encodeURIComponent(slug)}&color=${encodeURIComponent(color)}"></script>`;
    }
    if (key === "seo-audit") {
      const audit = obj(cfg.audit);
      v.scores = scores(audit.scores);
      if (Array.isArray(audit.fixes)) {
        v.fixes = audit.fixes.slice(0, 5).map((f) => ({ label: str(obj(f).label, 120) || "", fix: str(obj(f).fix, 400) || "" }));
      }
      v.checkedAt = str(audit.checkedAt, 40);
    }
    if (key === "ai-seo") {
      const an = obj(cfg.analysis);
      if (typeof an.overall_score === "number") v.aiScore = an.overall_score;
      if (Array.isArray(an.top_recommendations)) {
        v.recommendations = an.top_recommendations.slice(0, 5).map((r) => str(r, 300)).filter((r): r is string => Boolean(r));
      }
      v.checkedAt = str(cfg.checkedAt, 40);
    }
    views[key] = v;
  }
  return views;
}
