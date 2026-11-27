/**
 * Client lifecycle: stages, private portal tokens, per-client checklist. Pure — no imports at all,
 * because dashboard client components import STAGE_LABELS etc. (so no node:crypto here).
 */

export type Stage = "signed_up" | "kickoff" | "building" | "review" | "live" | "proposal" | "paused";

export const MAIN_STAGES: readonly Stage[] = ["signed_up", "kickoff", "building", "review", "live"];
export const ALL_STAGES: readonly Stage[] = [...MAIN_STAGES, "proposal", "paused"];

export const STAGE_LABELS: Record<Stage, string> = {
  signed_up: "Signed up",
  kickoff: "Kickoff",
  building: "Building",
  review: "Review",
  live: "Live",
  proposal: "Awaiting proposal",
  paused: "Paused",
};

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (ALL_STAGES as readonly string[]).includes(v);
}

export function timeline(stage: Stage) {
  const idx = Math.max(0, MAIN_STAGES.indexOf(stage));
  return MAIN_STAGES.map((key, i) => ({
    key,
    label: STAGE_LABELS[key],
    state: (i < idx ? "done" : i === idx ? "current" : "upcoming") as "done" | "current" | "upcoming",
  }));
}

/** 24 random bytes → 32 base64url chars. Web Crypto + btoa work in Node 24 and browsers. */
export function newPortalToken(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isPortalTokenFormat(t: string): boolean {
  return /^[A-Za-z0-9_-]{24,64}$/.test(t);
}

export function portalUrl(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/p/${token}`;
}

export interface ChecklistItem {
  id: string;
  service: string;
  label: string;
  owner: "jontri" | "client";
  done: boolean;
}

type Template = Omit<ChecklistItem, "done" | "service">;

const TEMPLATES: Record<string, Template[]> = {
  chatbot: [
    { id: "chatbot-review", label: "Check the chatbot's answers against the website", owner: "jontri" },
    { id: "chatbot-embed", label: "Add the chatbot code to your website (we can do this for you)", owner: "client" },
  ],
  "voice-agent": [
    { id: "voice-test", label: "Create the AI receptionist and place a test call", owner: "jontri" },
    { id: "voice-number", label: "Get a phone number for the AI receptionist", owner: "jontri" },
    { id: "voice-forward", label: "Forward your business line to your AI number (or tell us when missed calls should go there)", owner: "client" },
  ],
  "seo-audit": [{ id: "seo-fixes", label: "Run the website audit and send the fix list", owner: "jontri" }],
  "ai-seo": [{ id: "ai-seo-run", label: "Run the AI search analysis and send recommendations", owner: "jontri" }],
  "review-mgmt": [
    { id: "reviews-access", label: "Give Jontri manager access to your Google Business Profile", owner: "client" },
    { id: "reviews-setup", label: "Set up review requests and reply drafts", owner: "jontri" },
  ],
  prospector: [
    { id: "prospect-icp", label: "Confirm who your ideal customers are and where", owner: "client" },
    { id: "prospect-campaign", label: "Launch the first outreach campaign", owner: "jontri" },
  ],
  "follow-up": [{ id: "follow-up-build", label: "Build the follow-up sequences", owner: "jontri" }],
  reporting: [{ id: "reporting-setup", label: "Set up the monthly report", owner: "jontri" }],
};

const KICKOFF: ChecklistItem = { id: "kickoff-call", service: "general", label: "Kickoff call", owner: "jontri", done: false };

export function buildChecklist(services: string[], existing: ChecklistItem[] = []): ChecklistItem[] {
  const done = new Map(existing.map((i) => [i.id, i.done]));
  const items: ChecklistItem[] = [KICKOFF];
  for (const service of services) {
    const tpl = TEMPLATES[service] || [{ id: `${service}-build`, label: `Scope and build: ${service.replace(/-/g, " ")}`, owner: "jontri" as const }];
    for (const t of tpl) items.push({ ...t, service, done: false });
  }
  const seen = new Set<string>();
  return items
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .map((i) => ({ ...i, done: done.get(i.id) ?? false }));
}

export function toggleChecklistItem(list: ChecklistItem[], id: string, done: boolean): ChecklistItem[] {
  return list.map((i) => (i.id === id ? { ...i, done } : i));
}

export function checklistProgress(list: ChecklistItem[]) {
  return { done: list.filter((i) => i.done).length, total: list.length };
}

export function clientNeeds(list: ChecklistItem[]): ChecklistItem[] {
  return list.filter((i) => i.owner === "client");
}

export type FeedbackAction = "approve" | "changes";

export function applyFeedback(stage: Stage, action: FeedbackAction): { ok: true; stage: Stage } | { ok: false; error: string } {
  if (action === "approve") {
    return stage === "review" ? { ok: true, stage: "live" } : { ok: false, error: "There's nothing waiting for your approval right now." };
  }
  return stage === "review" || stage === "live"
    ? { ok: true, stage: "building" }
    : { ok: false, error: "We're still setting things up. You'll be able to request changes once it's ready for review." };
}

export function stageAfterSetupAll(stage: Stage): Stage {
  return stage === "signed_up" || stage === "kickoff" ? "building" : stage;
}
