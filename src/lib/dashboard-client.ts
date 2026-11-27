/** Dashboard client shape (from a clients row) and stage grouping. Pure — type imports only. */
import type { ChecklistItem, Stage } from "./lifecycle";

const STAGES: Stage[] = ["signed_up", "kickoff", "building", "review", "live", "proposal", "paused"];
export const STAGE_ORDER: Stage[] = ["kickoff", "signed_up", "proposal", "building", "review", "live", "paused"];

export interface DashboardClient {
  name: string;
  slug: string;
  industry: string;
  description: string;
  contact: { name: string; email: string; phone: string };
  onboarding?: Record<string, unknown>;
  services: Record<string, { status: string; updated_at: string; detail?: string }>;
  created_at: string;
  status: string;
  tier_id?: string;
  billing_type?: string;
  monthly_rate?: number;
  stage: Stage;
  portal_token: string;
  billing_status: string | null;
  checklist: ChecklistItem[];
  notes: string;
  phoneNumber?: string;
}

const s = (v: unknown) => (typeof v === "string" ? v : "");

export function toDashboardClient(row: Record<string, unknown>, extra: { onboarding?: unknown; phoneNumber?: unknown } = {}): DashboardClient {
  const stage = STAGES.includes(row.stage as Stage) ? (row.stage as Stage) : "signed_up";
  return {
    name: s(row.name),
    slug: s(row.slug),
    industry: s(row.industry),
    description: s(row.description),
    contact: { name: s(row.contact_name), email: s(row.contact_email), phone: s(row.contact_phone) },
    onboarding: extra.onboarding && typeof extra.onboarding === "object" ? (extra.onboarding as Record<string, unknown>) : undefined,
    services: (row.services && typeof row.services === "object" ? row.services : {}) as DashboardClient["services"],
    created_at: s(row.created_at),
    status: s(row.status),
    tier_id: s(row.tier_id) || undefined,
    billing_type: s(row.billing_type) || undefined,
    monthly_rate: typeof row.monthly_rate === "number" ? row.monthly_rate : undefined,
    stage,
    portal_token: s(row.portal_token),
    billing_status: typeof row.billing_status === "string" ? row.billing_status : null,
    checklist: Array.isArray(row.checklist) ? (row.checklist as ChecklistItem[]) : [],
    notes: s(row.notes),
    phoneNumber: typeof extra.phoneNumber === "string" && extra.phoneNumber ? extra.phoneNumber : undefined,
  };
}

export function groupByStage(clients: DashboardClient[]) {
  return STAGE_ORDER.map((stage) => ({ stage, clients: clients.filter((c) => c.stage === stage) })).filter((g) => g.clients.length > 0);
}
