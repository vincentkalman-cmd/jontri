# Client Lifecycle — Phase 1 (Core Flow, No Stripe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A client signs up at `/onboarding` (business → package → setup details → click-to-accept), gets a private portal link at `/p/<token>` showing a stage timeline, service status, "what we need from you" and Approve / Request changes; Vince works each client from the dashboard with stages, **Set up all**, a checklist, notes and a **Get phone number** action, with voice agents created on Jontri's own Vapi account.

**Architecture:** Pure, unit-tested logic lives in small `src/lib/*` modules (lifecycle stages/checklists, intake validation, portal view, emails, setup-all orchestration). Thin Next.js route handlers read/write Supabase with the service-role client and call those modules. The portal is a server-rendered page keyed by an unguessable token; the only public write is a rate-limited feedback endpoint. Stripe is out of scope: in Phase 1, Tier 1/2 sign-ups go straight to the **Kickoff** stage with `billing_status = 'unpaid'` and Vince invoices manually.

**Tech Stack:** Next.js 16.1.6 (App Router, Turbopack), React 19, Tailwind v4 (`@theme` tokens in `src/app/globals.css`), Supabase (`@supabase/supabase-js`, project `vamujghcsxtjxgtmufte`), Zoho SMTP via `src/lib/mailer.ts`, Vapi REST API, Node 24 built-in test runner (`npm test`).

**Spec:** `docs/superpowers/specs/2026-11-27-client-lifecycle-design.md` (Phase 1 = "Core flow (no Stripe yet)").

## Global Constraints

- Phase 1 has **no Stripe**. Do not add Stripe code, env vars or packages.
- Voice agents use Jontri's Vapi account: server env `VAPI_API_KEY` (private, Vercel only). A per-client `vapiApiKey` in config stays as an override. The key must never be returned by any API, rendered in any page, or put in a `NEXT_PUBLIC_*` variable.
- Portal URL format: `https://jontri.com/p/<token>`; `clients.portal_token` is random, ≥ 24 chars, unique. Old `/client/<slug>` URLs show no client data.
- Stages (exact keys): `signed_up`, `kickoff`, `building`, `review`, `live`, plus side stages `proposal` (Tier 3 / custom, awaiting proposal) and `paused`.
- Contract = click-to-accept: store `contract_accepted_name`, `contract_accepted_at`, `contract_accepted_ip`.
- Supabase migrations are run **by the owner** in the Supabase SQL Editor. Do not call `apply_migration`. Read-only `execute_sql` checks are fine.
- Booking link: `BOOKING_URL` from `src/lib/constants.ts` (`https://calendly.com/vincent-jontri/30min`).
- Owner notification address: `process.env.OWNER_EMAIL || process.env.ZOHO_EMAIL`.
- Frontend rules (CLAUDE.md): invoke the `ui-ux-pro-max` skill before writing frontend code; never `transition-all` (list properties explicitly); never default Tailwind blue/indigo as primary — use the aqua tokens (`accent`, `accent-light`, `accent-ink`, `bg-primary`, `bg-card`, `text-primary/secondary/muted`) and the helpers in `src/components/site/ui.tsx` (`primaryBtn`, `ghostBtn`, `inputCls`, `panelCls`, `Kicker`, `PageGlow`); every clickable element needs hover, focus-visible and active states.
- Public-facing pages (`/onboarding`, `/p/*`, `/client/*`) must not go live without the owner seeing localhost screenshots (`node serve.mjs` is NOT used here — run `npm run dev` and screenshot `http://localhost:3000/...` with `node screenshot.mjs <url> <label>`, at least 2 rounds) and explicitly approving. **Commit locally per task; do not `git push` until Task 13's approval.**
- Never commit `.env*`, `prospector/`, `*.log`, lead CSVs or `medspa-emails-to-send.txt`. Stage files by explicit path only.
- Tests: `npm test` runs `node --test "src/**/*.test.ts"` with Node's type stripping. A module imported by a test may import **only** `node:*` builtins and `import type ...` (type imports are erased). Test files import siblings with a `.ts` extension (`from "./lifecycle.ts"`); app code imports with `@/lib/...` and no extension.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A sign-up whose business name matches an existing client** must create a new client with a suffixed slug (`acme-hvac-2`), never merge into or overwrite the existing client's data. (Test: Task 3 `uniqueSlug`; route uses it in Task 10.)
2. **Wrong, old or guessed portal links** (`/p/short`, `/p/<random 32 chars>`, `/client/<real-slug>`) must show a generic "not found / use your private link" page with no client data; portal pages are `noindex` and send `Referrer-Policy: no-referrer` so the token isn't leaked to Calendly or other linked sites. (Test: Task 2 `isPortalTokenFormat`; Task 7 manual curl checks.)
3. **Secrets in `client_configs.config`** (`vapiApiKey`, any `*ApiKey`/`*Secret`, `websiteKnowledge`, raw `analysis`) must never appear in the portal output. (Test: Task 5 serializes the view and asserts no secret strings.)
4. **Approve clicked twice, or before the project is in Review** must not move the stage incorrectly or send duplicate emails: approve is only valid from `review`; a second approve gets a 409. (Test: Task 2 `applyFeedback`.)
5. **One service failing during Set up all** (Vapi down, site unreachable, provisioner throws) must not stop the other services or lose their results; the failed one is recorded as `error` with a message. (Test: Task 8 `runSetupAll` with a throwing provisioner.)

Also handled, without a dedicated test: email sending failure (Zoho down) never fails a sign-up or a stage change — `sendMail` already returns `false` instead of throwing; routes ignore the result.

---

## File Structure

**Create**
- `supabase/migrations/20261128_client_lifecycle.sql`: new `clients` columns and backfill.
- `src/lib/lifecycle.ts` (+ `lifecycle.test.ts`): stages, timeline, portal tokens, checklist templates, client needs, feedback transitions.
- `src/lib/onboarding-intake.ts` (+ `onboarding-intake.test.ts`): validate the sign-up payload, which setup fields each service needs, per-service config builder, unique slug.
- `src/lib/terms.ts`: click-to-accept terms text and version.
- `src/lib/lifecycle-emails.ts` (+ `lifecycle-emails.test.ts`): email subject/HTML builders.
- `src/lib/portal-view.ts` (+ `portal-view.test.ts`): safe, client-facing view of a client.
- `src/lib/setup-all.ts` (+ `setup-all.test.ts`): run provisioning for many services, isolating failures.
- `src/lib/dashboard-client.ts` (+ `dashboard-client.test.ts`): map DB rows to the dashboard `Client` shape, group by stage.
- `src/app/p/[token]/page.tsx`: portal (server component).
- `src/app/p/[token]/PortalView.tsx`: portal UI (client component).
- `src/app/api/portal/[token]/feedback/route.ts`: Approve / Request changes.
- `src/app/api/clients/[slug]/setup-all/route.ts`
- `src/app/api/clients/[slug]/phone-number/route.ts`
- `src/app/dashboard/_components/clients/ClientWorkPanel.tsx`: stage control, Set up all, checklist, notes, phone number.

**Modify**
- `src/lib/vapi.ts` (+ `provision-helpers.test.ts`): add `buyPhoneNumber`.
- `src/lib/provision.ts`: use `VAPI_API_KEY` env when the client has no key.
- `src/app/api/clients/route.ts`: generate `portal_token` for new clients; map list rows.
- `src/app/api/clients/[slug]/route.ts`: add `PATCH` (stage, checklist, notes).
- `src/app/api/onboarding/route.ts`: rewrite for v2.
- `src/components/ui/OnboardingForm.tsx`: rewrite for v2.
- `src/components/OnboardingSection.tsx`: copy no longer promises a Word contract.
- `src/app/client/[slug]/page.tsx`: replace with a "use your private link" page.
- `src/app/dashboard/page.tsx`, `_components/clients/ClientList.tsx`, `_components/clients/ClientDetail.tsx`, `_components/deploy/QuickDeployModal.tsx`, `_components/tiers/TierDeployModal.tsx`: stages, portal links, work panel.

**Delete**
- `src/app/api/client-portal/route.ts` (only used by the old `/client/[slug]` page).

---

### Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20261128_client_lifecycle.sql`

**Interfaces:**
- Produces: `clients` columns `portal_token text unique not null`, `stage text not null default 'signed_up'` (checked), `billing_status text`, `stripe_customer_id text`, `stripe_subscription_id text`, `contract_accepted_name text`, `contract_accepted_at timestamptz`, `contract_accepted_ip text`, `checklist jsonb not null default '[]'`, `notes text not null default ''`. Every existing client gets a token and stage `live`.

- [ ] **Step 1: Write the migration**

```sql
-- Client lifecycle (Phase 1): private portal links, stages, checklist, click-to-accept.
-- Run once in the Supabase SQL Editor.

alter table public.clients
  add column if not exists portal_token text,
  add column if not exists stage text not null default 'signed_up',
  add column if not exists billing_status text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists contract_accepted_name text,
  add column if not exists contract_accepted_at timestamptz,
  add column if not exists contract_accepted_ip text,
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists notes text not null default '';

-- Existing clients were set up by hand: give them a private link and mark them live.
update public.clients
set portal_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
    stage = 'live'
where portal_token is null;

alter table public.clients alter column portal_token set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_portal_token_key') then
    alter table public.clients add constraint clients_portal_token_key unique (portal_token);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'clients_stage_check') then
    alter table public.clients add constraint clients_stage_check
      check (stage in ('signed_up','kickoff','building','review','live','proposal','paused'));
  end if;
end $$;
```

- [ ] **Step 2: Hand to the owner and wait**

Tell the owner: open Supabase → SQL Editor → New query, paste the whole file, Run, expect "Success. No rows returned". Do not continue to Task 5+ route work against the live DB until they confirm.

- [ ] **Step 3: Verify (read-only)**

Run via `mcp__claude_ai_Supabase__execute_sql` (project `vamujghcsxtjxgtmufte`):

```sql
select count(*) filter (where portal_token is null) as missing_tokens,
       count(*) as clients,
       array_agg(distinct stage) as stages
from public.clients;
```

Expected: `missing_tokens = 0`, `stages` contains only valid stage keys.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20261128_client_lifecycle.sql
git commit -m "Add client lifecycle migration (portal tokens, stages, checklist)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lifecycle core (`src/lib/lifecycle.ts`)

**Files:**
- Create: `src/lib/lifecycle.ts`
- Test: `src/lib/lifecycle.test.ts`

**Interfaces:**
- Produces:
  - `type Stage = "signed_up" | "kickoff" | "building" | "review" | "live" | "proposal" | "paused"`
  - `MAIN_STAGES: readonly Stage[]` (the 5 timeline stages, in order), `ALL_STAGES: readonly Stage[]`
  - `STAGE_LABELS: Record<Stage, string>`
  - `isStage(v: unknown): v is Stage`
  - `timeline(stage: Stage): { key: Stage; label: string; state: "done" | "current" | "upcoming" }[]`
  - `newPortalToken(): string` (32 chars, base64url)
  - `isPortalTokenFormat(t: string): boolean`
  - `portalUrl(origin: string, token: string): string`
  - `interface ChecklistItem { id: string; service: string; label: string; owner: "jontri" | "client"; done: boolean }`
  - `buildChecklist(services: string[], existing?: ChecklistItem[]): ChecklistItem[]`
  - `toggleChecklistItem(list: ChecklistItem[], id: string, done: boolean): ChecklistItem[]`
  - `checklistProgress(list: ChecklistItem[]): { done: number; total: number }`
  - `clientNeeds(list: ChecklistItem[]): ChecklistItem[]` (owner === "client")
  - `type FeedbackAction = "approve" | "changes"`
  - `applyFeedback(stage: Stage, action: FeedbackAction): { ok: true; stage: Stage } | { ok: false; error: string }`
  - `stageAfterSetupAll(stage: Stage): Stage`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAIN_STAGES, isStage, timeline, newPortalToken, isPortalTokenFormat, portalUrl,
  buildChecklist, toggleChecklistItem, checklistProgress, clientNeeds, applyFeedback, stageAfterSetupAll,
} from "./lifecycle.ts";

test("stages: guard and timeline states", () => {
  assert.deepEqual(MAIN_STAGES, ["signed_up", "kickoff", "building", "review", "live"]);
  assert.equal(isStage("review"), true);
  assert.equal(isStage("deleted"), false);
  assert.equal(isStage(undefined), false);
  const t = timeline("building");
  assert.deepEqual(t.map((s) => s.state), ["done", "done", "current", "upcoming", "upcoming"]);
  assert.deepEqual(timeline("live").map((s) => s.state), ["done", "done", "done", "done", "current"]);
  // Side stages keep the client at the start of the timeline.
  assert.deepEqual(timeline("proposal").map((s) => s.state), ["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
});

test("portal tokens: random, url-safe, validated", () => {
  const a = newPortalToken();
  const b = newPortalToken();
  assert.notEqual(a, b);
  assert.equal(a.length, 32);
  assert.equal(isPortalTokenFormat(a), true);
  assert.equal(isPortalTokenFormat("abc"), false);
  assert.equal(isPortalTokenFormat("a".repeat(24) + "/../"), false);
  assert.equal(isPortalTokenFormat("a".repeat(65)), false);
  // Tokens created by the SQL backfill are 64 hex chars.
  assert.equal(isPortalTokenFormat("0123456789abcdef".repeat(4)), true);
  assert.equal(portalUrl("https://jontri.com/", a), `https://jontri.com/p/${a}`);
});

test("checklist: built from services, keeps done state, unknown services get a generic item", () => {
  const list = buildChecklist(["chatbot", "voice-agent", "custom-thing"]);
  const ids = list.map((i) => i.id);
  assert.ok(ids.includes("kickoff-call"));
  assert.ok(ids.includes("chatbot-embed"));
  assert.ok(ids.includes("voice-number"));
  assert.ok(ids.includes("custom-thing-build"));
  assert.equal(new Set(ids).size, ids.length);
  const toggled = toggleChecklistItem(list, "chatbot-embed", true);
  assert.equal(toggled.find((i) => i.id === "chatbot-embed")?.done, true);
  assert.equal(list.find((i) => i.id === "chatbot-embed")?.done, false, "original not mutated");
  const rebuilt = buildChecklist(["chatbot", "voice-agent", "custom-thing"], toggled);
  assert.equal(rebuilt.find((i) => i.id === "chatbot-embed")?.done, true);
  assert.deepEqual(checklistProgress(toggled), { done: 1, total: list.length });
  assert.ok(clientNeeds(list).every((i) => i.owner === "client"));
  assert.ok(clientNeeds(list).some((i) => i.id === "chatbot-embed"));
});

test("feedback: approve only from review, changes from review or live", () => {
  assert.deepEqual(applyFeedback("review", "approve"), { ok: true, stage: "live" });
  assert.equal(applyFeedback("live", "approve").ok, false);
  assert.equal(applyFeedback("building", "approve").ok, false);
  assert.deepEqual(applyFeedback("review", "changes"), { ok: true, stage: "building" });
  assert.deepEqual(applyFeedback("live", "changes"), { ok: true, stage: "building" });
  assert.equal(applyFeedback("kickoff", "changes").ok, false);
});

test("set up all moves early stages to building only", () => {
  assert.equal(stageAfterSetupAll("signed_up"), "building");
  assert.equal(stageAfterSetupAll("kickoff"), "building");
  assert.equal(stageAfterSetupAll("review"), "review");
  assert.equal(stageAfterSetupAll("live"), "live");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `Cannot find module ... lifecycle.ts`.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass (previous 18 + 5 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle.ts src/lib/lifecycle.test.ts
git commit -m "Add lifecycle core: stages, portal tokens, checklist, feedback rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Sign-up intake (`src/lib/onboarding-intake.ts`, `src/lib/terms.ts`)

**Files:**
- Create: `src/lib/onboarding-intake.ts`, `src/lib/terms.ts`
- Test: `src/lib/onboarding-intake.test.ts`

**Interfaces:**
- Produces:
  - `type PackageId = "tier-1" | "tier-2" | "tier-3" | "custom"`
  - `interface SetupDetails { servicesOffered: string; businessHours: string; bookingUrl: string; transferNumber: string; leadEmail: string; brandColor: string; googleBusinessUrl: string; targetArea: string }`
  - `interface Intake { contactName: string; businessName: string; email: string; phone: string; website: string; industry: string; packageId: PackageId; details: SetupDetails; acceptName: string; termsVersion: string }`
  - `validateIntake(raw: unknown, termsVersion: string): { ok: true; data: Intake } | { ok: false; error: string }`
  - `type DetailField = keyof SetupDetails`
  - `detailFieldsFor(services: string[]): DetailField[]`
  - `buildServiceConfigs(services: string[], d: Intake): Record<string, Record<string, string>>`
  - `slugify(name: string): string`
  - `uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string>`
  - `terms.ts`: `TERMS_VERSION: string`, `TERMS: { title: string; body: string }[]`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateIntake, detailFieldsFor, buildServiceConfigs, slugify, uniqueSlug } from "./onboarding-intake.ts";

const good = {
  contactName: "Dana Reyes",
  businessName: "Haul Hero Auto Transport",
  email: "dana@example.com",
  phone: "(720) 555-0100",
  website: "haulheroautotransport.com",
  industry: "Auto transport",
  packageId: "tier-1",
  details: { servicesOffered: "Open and enclosed car shipping", businessHours: "Mon-Sat 8-6", bookingUrl: "https://cal.example/hh", transferNumber: "+17205550100", leadEmail: "", brandColor: "#35e0c2", googleBusinessUrl: "", targetArea: "Denver, CO" },
  acceptName: "Dana Reyes",
  agreed: true,
  termsVersion: "v1",
};

test("valid intake is normalized", () => {
  const r = validateIntake(good, "v1");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.data.website, "https://haulheroautotransport.com");
  assert.equal(r.data.email, "dana@example.com");
  assert.equal(r.data.details.brandColor, "#35e0c2");
});

test("intake rejects missing agreement, bad email, unknown package, stale terms, non-http links", () => {
  assert.equal(validateIntake({ ...good, agreed: false }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, acceptName: " " }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, email: "nope" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, packageId: "tier-9" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, termsVersion: "v0" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, details: { ...good.details, bookingUrl: "javascript:alert(1)" } }, "v1").ok, false);
  assert.equal(validateIntake(null, "v1").ok, false);
  assert.equal(validateIntake({ ...good, businessName: "x".repeat(200) }, "v1").ok, false);
});

test("intake drops invalid brand colors instead of failing", () => {
  const r = validateIntake({ ...good, details: { ...good.details, brandColor: "red; background:url(x)" } }, "v1");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.details.brandColor, "");
});

test("detail fields follow the chosen services", () => {
  assert.deepEqual(detailFieldsFor(["seo-audit"]), []);
  const voice = detailFieldsFor(["voice-agent"]);
  assert.ok(voice.includes("businessHours") && voice.includes("transferNumber"));
  assert.ok(detailFieldsFor(["review-mgmt"]).includes("googleBusinessUrl"));
  const both = detailFieldsFor(["chatbot", "voice-agent"]);
  assert.equal(new Set(both).size, both.length, "no duplicates");
});

test("service configs carry what provisioning reads", () => {
  const r = validateIntake(good, "v1");
  assert.ok(r.ok);
  if (!r.ok) return;
  const cfgs = buildServiceConfigs(["chatbot", "voice-agent", "seo-audit", "ai-seo"], r.data);
  assert.equal(cfgs.chatbot.websiteUrl, "https://haulheroautotransport.com");
  assert.equal(cfgs.chatbot.primaryColor, "#35e0c2");
  assert.equal(cfgs.chatbot.leadEmail, "dana@example.com", "falls back to contact email");
  assert.equal(cfgs["voice-agent"].businessHours, "Mon-Sat 8-6");
  assert.equal(cfgs["voice-agent"].businessPhone, "(720) 555-0100");
  assert.equal(cfgs["seo-audit"].websiteUrl, "https://haulheroautotransport.com");
  assert.match(cfgs["ai-seo"].targetQueries, /Auto transport/);
});

test("slugs: existing names get a numeric suffix", async () => {
  assert.equal(slugify("Haul Hero Auto Transport!"), "haul-hero-auto-transport");
  const taken = new Set(["acme", "acme-2"]);
  assert.equal(await uniqueSlug("acme", async (s) => taken.has(s)), "acme-3");
  assert.equal(await uniqueSlug("fresh", async () => false), "fresh");
  assert.equal(await uniqueSlug("", async () => false), "client");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test` — Expected: FAIL, module not found.

- [ ] **Step 3: Implement `src/lib/onboarding-intake.ts`**

```ts
/** Sign-up payload validation and per-service config building. Pure — no app imports. */

export type PackageId = "tier-1" | "tier-2" | "tier-3" | "custom";
const PACKAGES: readonly PackageId[] = ["tier-1", "tier-2", "tier-3", "custom"];

export interface SetupDetails {
  servicesOffered: string;
  businessHours: string;
  bookingUrl: string;
  transferNumber: string;
  leadEmail: string;
  brandColor: string;
  googleBusinessUrl: string;
  targetArea: string;
}

export interface Intake {
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageId: PackageId;
  details: SetupDetails;
  acceptName: string;
  termsVersion: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function s(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > max ? null : t;
}

/** "" stays "", bare domains get https://, anything not http(s) is rejected (null). */
function link(v: string): string | null {
  if (!v) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function validateIntake(raw: unknown, termsVersion: string): { ok: true; data: Intake } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request" };
  const r = raw as Record<string, unknown>;
  const d = (r.details && typeof r.details === "object" ? r.details : {}) as Record<string, unknown>;

  const contactName = s(r.contactName, 120);
  const businessName = s(r.businessName, 120);
  const email = s(r.email, 200)?.toLowerCase() ?? null;
  const phone = s(r.phone, 40);
  const industry = s(r.industry, 80);
  const acceptName = s(r.acceptName, 120);
  const website = link(s(r.website, 300) ?? "");
  if (!contactName || !businessName || !phone || !industry) return { ok: false, error: "Please fill in your name, business name, phone and industry." };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (website === null) return { ok: false, error: "Please enter a valid website address." };
  if (!PACKAGES.includes(r.packageId as PackageId)) return { ok: false, error: "Please choose a package." };
  if (r.termsVersion !== termsVersion) return { ok: false, error: "The terms were updated. Please refresh the page and review them again." };
  if (r.agreed !== true || !acceptName || acceptName.length < 2) return { ok: false, error: "Please type your full name and check the box to accept the terms." };

  const fields = {
    servicesOffered: s(d.servicesOffered, 2000),
    businessHours: s(d.businessHours, 200),
    bookingUrl: s(d.bookingUrl, 300),
    transferNumber: s(d.transferNumber, 40),
    leadEmail: s(d.leadEmail, 200),
    brandColor: s(d.brandColor, 20),
    googleBusinessUrl: s(d.googleBusinessUrl, 300),
    targetArea: s(d.targetArea, 200),
  };
  if (Object.values(fields).some((v) => v === null)) return { ok: false, error: "One of the setup details is too long." };
  const bookingUrl = link(fields.bookingUrl as string);
  const googleBusinessUrl = link(fields.googleBusinessUrl as string);
  if (bookingUrl === null || googleBusinessUrl === null) return { ok: false, error: "Please check the links you entered (they should start with https://)." };
  const leadEmail = (fields.leadEmail as string).toLowerCase();
  if (leadEmail && !EMAIL_RE.test(leadEmail)) return { ok: false, error: "Please enter a valid email for lead notifications." };

  return {
    ok: true,
    data: {
      contactName,
      businessName,
      email,
      phone,
      website,
      industry,
      packageId: r.packageId as PackageId,
      acceptName,
      termsVersion,
      details: {
        servicesOffered: fields.servicesOffered as string,
        businessHours: fields.businessHours as string,
        bookingUrl,
        transferNumber: fields.transferNumber as string,
        leadEmail,
        brandColor: /^#[0-9a-fA-F]{3,8}$/.test(fields.brandColor as string) ? (fields.brandColor as string) : "",
        googleBusinessUrl,
        targetArea: fields.targetArea as string,
      },
    },
  };
}

export type DetailField = keyof SetupDetails;

const FIELDS_BY_SERVICE: Record<string, DetailField[]> = {
  chatbot: ["servicesOffered", "bookingUrl", "leadEmail", "brandColor"],
  "voice-agent": ["servicesOffered", "businessHours", "bookingUrl", "transferNumber"],
  "review-mgmt": ["googleBusinessUrl"],
  prospector: ["targetArea"],
  "ai-seo": ["targetArea"],
};

export function detailFieldsFor(services: string[]): DetailField[] {
  return [...new Set(services.flatMap((svc) => FIELDS_BY_SERVICE[svc] || []))];
}

export function buildServiceConfigs(services: string[], d: Intake): Record<string, Record<string, string>> {
  const common = { businessName: d.businessName, industry: d.industry, websiteUrl: d.website };
  const x = d.details;
  const out: Record<string, Record<string, string>> = {};
  for (const svc of services) {
    switch (svc) {
      case "chatbot":
        out[svc] = { ...common, servicesOffered: x.servicesOffered, bookingUrl: x.bookingUrl, leadEmail: x.leadEmail || d.email, primaryColor: x.brandColor };
        break;
      case "voice-agent":
        out[svc] = { ...common, servicesOffered: x.servicesOffered, bookingUrl: x.bookingUrl, businessHours: x.businessHours, transferNumber: x.transferNumber, businessPhone: d.phone };
        break;
      case "ai-seo":
        out[svc] = { ...common, targetQueries: `best ${d.industry}${x.targetArea ? ` in ${x.targetArea}` : ""}` };
        break;
      case "review-mgmt":
        out[svc] = { ...common, googleBusinessUrl: x.googleBusinessUrl };
        break;
      case "prospector":
        out[svc] = { ...common, targetArea: x.targetArea };
        break;
      default:
        out[svc] = { ...common };
    }
  }
  return out;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = base || "client";
  if (!(await exists(root))) return root;
  for (let n = 2; n < 100; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now()}`;
}
```

- [ ] **Step 4: Implement `src/lib/terms.ts`** (adapted from the old Word template; owner may edit wording later — bump `TERMS_VERSION` whenever it changes)

```ts
/** Click-to-accept service terms. Bump TERMS_VERSION whenever the wording changes. */
export const TERMS_VERSION = "2026-11-28";

export const TERMS: { title: string; body: string }[] = [
  { title: "Services", body: "Jontri will set up and run the services in the package you chose. What each service includes is described on jontri.com and in your client portal." },
  { title: "Fees", body: "The package fee is billed monthly in advance. Jontri will send your first invoice after the kickoff call." },
  { title: "Term and cancellation", body: "This agreement runs month to month. Either party can cancel with 30 days' written notice by email." },
  { title: "Your information", body: "You confirm you have the right to share the business information you provide. Jontri uses it only to deliver your services and never sells it." },
  { title: "Ownership", body: "You own your business data and content. Jontri keeps ownership of its pre-existing tools, prompts and frameworks." },
  { title: "Confidentiality", body: "Both parties will keep each other's non-public information confidential." },
  { title: "Liability", body: "Jontri is not liable for indirect or consequential damages. Total liability is limited to the fees you paid in the three months before a claim." },
];
```

- [ ] **Step 5: Run tests** — `npm test`, Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/onboarding-intake.ts src/lib/onboarding-intake.test.ts src/lib/terms.ts
git commit -m "Add sign-up intake validation, per-service config builder, terms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lifecycle emails (`src/lib/lifecycle-emails.ts`)

**Files:**
- Create: `src/lib/lifecycle-emails.ts`
- Test: `src/lib/lifecycle-emails.test.ts`

**Interfaces:**
- Produces (each returns `{ subject: string; html: string }`):
  - `ownerNewSignupEmail(p: { businessName: string; contactName: string; email: string; phone: string; packageName: string; stageLabel: string; dashboardUrl: string })`
  - `clientWelcomeEmail(p: { contactName: string; businessName: string; portalUrl: string; bookingUrl: string; needs: string[]; awaitingProposal: boolean })`
  - `clientReadyForReviewEmail(p: { contactName: string; businessName: string; portalUrl: string })`
  - `ownerFeedbackEmail(p: { businessName: string; action: "approve" | "changes"; note: string; dashboardUrl: string })`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ownerNewSignupEmail, clientWelcomeEmail, clientReadyForReviewEmail, ownerFeedbackEmail } from "./lifecycle-emails.ts";

test("welcome email links the portal and booking page and lists needs", () => {
  const e = clientWelcomeEmail({ contactName: "Dana", businessName: "Haul Hero", portalUrl: "https://jontri.com/p/tok", bookingUrl: "https://cal.example/x", needs: ["Add the chatbot code"], awaitingProposal: false });
  assert.match(e.subject, /Haul Hero/);
  assert.match(e.html, /href="https:\/\/jontri\.com\/p\/tok"/);
  assert.match(e.html, /href="https:\/\/cal\.example\/x"/);
  assert.match(e.html, /Add the chatbot code/);
});

test("proposal welcome says a proposal is coming", () => {
  const e = clientWelcomeEmail({ contactName: "Dana", businessName: "B", portalUrl: "https://jontri.com/p/t", bookingUrl: "https://c", needs: [], awaitingProposal: true });
  assert.match(e.html, /proposal/i);
});

test("user-supplied text is escaped everywhere", () => {
  const evil = `<script>alert(1)</script>`;
  const a = ownerNewSignupEmail({ businessName: evil, contactName: evil, email: "a@b.co", phone: evil, packageName: "Tier 1", stageLabel: "Kickoff", dashboardUrl: "https://jontri.com/dashboard" });
  const b = ownerFeedbackEmail({ businessName: "B", action: "changes", note: evil, dashboardUrl: "https://jontri.com/dashboard" });
  const c = clientReadyForReviewEmail({ contactName: evil, businessName: "B", portalUrl: "https://jontri.com/p/t" });
  for (const e of [a, b, c]) assert.equal(e.html.includes("<script>"), false);
  assert.match(b.html, /&lt;script&gt;/);
  assert.match(b.subject, /changes/i);
  assert.match(ownerFeedbackEmail({ businessName: "B", action: "approve", note: "", dashboardUrl: "x" }).subject, /approved/i);
});

test("subjects strip newlines (no header injection)", () => {
  const e = ownerNewSignupEmail({ businessName: "Acme\r\nBcc: x@y.z", contactName: "A", email: "a@b.co", phone: "1", packageName: "T", stageLabel: "K", dashboardUrl: "d" });
  assert.equal(/[\r\n]/.test(e.subject), false);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, FAIL.

- [ ] **Step 3: Implement**

```ts
/** Lifecycle email templates. Pure — no app imports. All inputs are escaped. */

const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const subj = (v: string) => v.replace(/[\r\n]+/g, " ").slice(0, 150);

function shell(title: string, body: string): string {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#16171b;line-height:1.6">
<p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#22a58e;margin:0 0 8px">Jontri</p>
<h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
${body}
<p style="font-size:12px;color:#7a756d;margin-top:32px">Jontri · jontri.com</p>
</div>`;
}

const button = (href: string, label: string) =>
  `<p><a href="${esc(href)}" style="display:inline-block;background:#35e0c2;color:#021a15;font-weight:700;padding:12px 20px;border-radius:10px;text-decoration:none">${esc(label)}</a></p>`;

export function ownerNewSignupEmail(p: { businessName: string; contactName: string; email: string; phone: string; packageName: string; stageLabel: string; dashboardUrl: string }) {
  return {
    subject: subj(`New client sign-up: ${p.businessName} (${p.packageName})`),
    html: shell(
      `New sign-up: ${esc(p.businessName)}`,
      `<p><strong>${esc(p.contactName)}</strong> · ${esc(p.email)} · ${esc(p.phone)}</p>
<p>Package: ${esc(p.packageName)}<br>Stage: ${esc(p.stageLabel)}</p>
${button(p.dashboardUrl, "Open the dashboard")}`,
    ),
  };
}

export function clientWelcomeEmail(p: { contactName: string; businessName: string; portalUrl: string; bookingUrl: string; needs: string[]; awaitingProposal: boolean }) {
  const needs = p.needs.length
    ? `<p>A few things we'll need from you (you can track these in your portal):</p><ul>${p.needs.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
    : "";
  const next = p.awaitingProposal
    ? `<p>We'll put together a custom proposal for ${esc(p.businessName)}. Book a call so we can scope it together.</p>`
    : `<p>Next step: book your kickoff call. We'll start building ${esc(p.businessName)}'s AI crew right after.</p>`;
  return {
    subject: subj(`Welcome to Jontri, ${p.businessName}`),
    html: shell(
      `Welcome aboard, ${esc(p.contactName)}.`,
      `${next}
${button(p.bookingUrl, "Book your call")}
<p>Your private portal shows progress on every service, what's live, and what we need from you. Keep this link to yourself.</p>
${button(p.portalUrl, "Open your portal")}
${needs}`,
    ),
  };
}

export function clientReadyForReviewEmail(p: { contactName: string; businessName: string; portalUrl: string }) {
  return {
    subject: subj(`${p.businessName}: your AI crew is ready for review`),
    html: shell(
      `Ready for your review, ${esc(p.contactName)}.`,
      `<p>Everything for ${esc(p.businessName)} is set up. Open your portal to try the chatbot, call your AI receptionist, then click <strong>Approve</strong> or tell us what to change.</p>
${button(p.portalUrl, "Review and approve")}`,
    ),
  };
}

export function ownerFeedbackEmail(p: { businessName: string; action: "approve" | "changes"; note: string; dashboardUrl: string }) {
  const approved = p.action === "approve";
  return {
    subject: subj(approved ? `${p.businessName} approved: now live` : `${p.businessName} requested changes`),
    html: shell(
      approved ? `${esc(p.businessName)} approved` : `${esc(p.businessName)} requested changes`,
      `${p.note ? `<blockquote style="border-left:3px solid #35e0c2;margin:0;padding:8px 14px;background:#f4fbf9">${esc(p.note).replace(/\n/g, "<br>")}</blockquote>` : ""}
${button(p.dashboardUrl, "Open the dashboard")}`,
    ),
  };
}
```

- [ ] **Step 4: Run tests** — `npm test`, all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lifecycle-emails.ts src/lib/lifecycle-emails.test.ts
git commit -m "Add lifecycle email templates

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Safe portal view (`src/lib/portal-view.ts`)

**Files:**
- Create: `src/lib/portal-view.ts`
- Test: `src/lib/portal-view.test.ts`

**Interfaces:**
- Consumes: nothing (no imports). It only builds the per-service views; the portal page (Task 7) combines them with the lifecycle helpers for stage, timeline and needs.
- Produces:
  - `interface PortalServiceView { status: string; detail?: string; businessPhone?: string; businessHours?: string; phoneNumber?: string; embedCode?: string; scores?: Record<string, number>; fixes?: { label: string; fix: string }[]; aiScore?: number; recommendations?: string[]; checkedAt?: string }`
  - `buildServiceViews(services: Record<string, { status?: string; detail?: string }>, config: Record<string, unknown>, slug: string, origin: string): Record<string, PortalServiceView>`

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServiceViews } from "./portal-view.ts";

const config = {
  vapiApiKey: "sk_live_TOPSECRET_ROOT",
  chatbot: { primaryColor: "#35e0c2", websiteKnowledge: "PRIVATE_SCRAPE", openaiApiKey: "sk-SECRET2" },
  "voice-agent": { vapiApiKey: "vapi_SECRET3", assistantId: "asst_1", phoneNumber: "+17205550199", businessPhone: "720-555-0100", businessHours: "Mon-Fri" },
  "seo-audit": { audit: { scores: { seo: 80, ai: 50, speed: 70, trust: 60 }, fixes: Array.from({ length: 8 }, (_, i) => ({ label: `L${i}`, fix: `F${i}` })), checkedAt: "2026-11-28" } },
  "ai-seo": { analysis: { overall_score: 7, top_recommendations: ["a", "b", "c", "d", "e", "f"], raw_notes: "INTERNAL_ONLY" }, checkedAt: "2026-11-28" },
};
const services = {
  chatbot: { status: "active", detail: "Chatbot is live." },
  "voice-agent": { status: "active" },
  "seo-audit": { status: "active" },
  "ai-seo": { status: "active" },
  "review-mgmt": { status: "manual" },
};

test("portal view never contains secrets or raw config", () => {
  const json = JSON.stringify(buildServiceViews(services, config, "haul-hero", "https://jontri.com"));
  for (const secret of ["TOPSECRET", "SECRET2", "SECRET3", "PRIVATE_SCRAPE", "INTERNAL_ONLY", "asst_1", "vapiApiKey"]) {
    assert.equal(json.includes(secret), false, `leaked ${secret}`);
  }
});

test("portal view exposes the useful bits, capped", () => {
  const v = buildServiceViews(services, config, "haul-hero", "https://jontri.com");
  assert.match(v.chatbot.embedCode || "", /client=haul-hero&color=%2335e0c2/);
  assert.equal(v["voice-agent"].phoneNumber, "+17205550199");
  assert.equal(v["seo-audit"].scores?.seo, 80);
  assert.equal(v["seo-audit"].fixes?.length, 5);
  assert.equal(v["ai-seo"].aiScore, 7);
  assert.equal(v["ai-seo"].recommendations?.length, 5);
  assert.equal(v["review-mgmt"].status, "manual");
});

test("bad stored values are ignored, not echoed", () => {
  const v = buildServiceViews(
    { chatbot: { status: "active" }, "voice-agent": { status: "active" } },
    { chatbot: { primaryColor: "red\" onload=\"x" }, "voice-agent": { phoneNumber: { evil: true } } },
    "s",
    "https://jontri.com",
  );
  assert.match(v.chatbot.embedCode || "", /color=%233B82F6/);
  assert.equal(v["voice-agent"].phoneNumber, undefined);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, FAIL.

- [ ] **Step 3: Implement**

```ts
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
    const v: PortalServiceView = { status: str(svc?.status, 30) || "pending" };
    const detail = str(svc?.detail, 400);
    if (detail) v.detail = detail;

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
```

- [ ] **Step 4: Run tests** — `npm test`, all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal-view.ts src/lib/portal-view.test.ts
git commit -m "Add allow-listed portal service view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Vapi on Jontri's account + phone numbers

**Files:**
- Modify: `src/lib/vapi.ts` (append), `src/lib/provision.ts:93-97`
- Test: `src/lib/provision-helpers.test.ts` (append)

**Interfaces:**
- Produces:
  - `buyPhoneNumber(apiKey: string, assistantId: string, opts?: { areaCode?: string; name?: string }): Promise<{ ok: true; id: string; number: string } | { ok: false; error: string }>`
  - `resolveVapiKey(cfg: Record<string, unknown>): string` exported from `src/lib/vapi.ts` (client key, else `process.env.VAPI_API_KEY`, else "").

- [ ] **Step 1: Confirm the Vapi phone-number API**

Invoke the `create-phone-number` skill (or read https://docs.vapi.ai/api-reference/phone-numbers/create) and confirm: `POST https://api.vapi.ai/phone-number` with JSON `{ "provider": "vapi", "assistantId": "...", "numberDesiredAreaCode": "720", "name": "..." }` returns `{ id, number, ... }`. Note whether `number` can be missing right after creation (free Vapi numbers may provision asynchronously). If the field names differ, use the documented ones in Step 3 and in the test, and note it in the commit message.

- [ ] **Step 2: Write the failing tests** (append to `src/lib/provision-helpers.test.ts`; add `buyPhoneNumber, resolveVapiKey` to its import from `"./vapi.ts"`)

```ts
test("resolveVapiKey prefers the client's key, then Jontri's env key", () => {
  const prev = process.env.VAPI_API_KEY;
  process.env.VAPI_API_KEY = "env-key";
  assert.equal(resolveVapiKey({ vapiApiKey: " client-key " }), "client-key");
  assert.equal(resolveVapiKey({}), "env-key");
  delete process.env.VAPI_API_KEY;
  assert.equal(resolveVapiKey({}), "");
  if (prev !== undefined) process.env.VAPI_API_KEY = prev;
});

test("buyPhoneNumber posts to Vapi and returns the number", async () => {
  const realFetch = globalThis.fetch;
  let seen: { url: string; body: Record<string, unknown>; auth: string } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url, body: JSON.parse(String(init.body)), auth: String((init.headers as Record<string, string>).Authorization) };
    return new Response(JSON.stringify({ id: "pn_1", number: "+17205550199" }), { status: 201 });
  }) as typeof fetch;
  try {
    const r = await buyPhoneNumber("key", "asst_1", { areaCode: "720", name: "Haul Hero" });
    assert.deepEqual(r, { ok: true, id: "pn_1", number: "+17205550199" });
    assert.equal(seen!.url, "https://api.vapi.ai/phone-number");
    assert.equal(seen!.auth, "Bearer key");
    assert.equal(seen!.body.assistantId, "asst_1");
    assert.equal(seen!.body.numberDesiredAreaCode, "720");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("buyPhoneNumber reports Vapi errors and rejects bad area codes", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ message: ["Area code not available"] }), { status: 400 })) as typeof fetch;
  try {
    assert.deepEqual(await buyPhoneNumber("key", "asst_1", { areaCode: "720" }), { ok: false, error: "Area code not available" });
    assert.equal((await buyPhoneNumber("key", "asst_1", { areaCode: "72a" })).ok, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});
```

- [ ] **Step 3: Run to verify failure** — `npm test`, FAIL (`buyPhoneNumber` not exported).

- [ ] **Step 4: Implement** (append to `src/lib/vapi.ts`)

```ts
/** The client's own Vapi key if they have one, otherwise Jontri's account key (server env only). */
export function resolveVapiKey(cfg: Record<string, unknown>): string {
  const own = typeof cfg.vapiApiKey === "string" ? cfg.vapiApiKey.trim() : "";
  return own || process.env.VAPI_API_KEY || "";
}

/** Buy/attach a Vapi phone number and point it at the assistant. */
export async function buyPhoneNumber(
  apiKey: string,
  assistantId: string,
  opts: { areaCode?: string; name?: string } = {},
): Promise<{ ok: true; id: string; number: string } | { ok: false; error: string }> {
  if (opts.areaCode && !/^\d{3}$/.test(opts.areaCode)) return { ok: false, error: "Area code must be 3 digits." };
  const body: Record<string, unknown> = { provider: "vapi", assistantId };
  if (opts.areaCode) body.numberDesiredAreaCode = opts.areaCode;
  if (opts.name) body.name = opts.name.slice(0, 40);
  try {
    const res = await fetch(`${VAPI_BASE}/phone-number`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.id) return { ok: true, id: String(data.id), number: String(data.number || "") };
    const msg = Array.isArray(data.message) ? data.message.join("; ") : data.message || data.error || `Vapi error ${res.status}`;
    return { ok: false, error: String(msg) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach Vapi" };
  }
}
```

In `src/lib/provision.ts`, change the import to `import { upsertAssistant, resolveVapiKey } from "@/lib/vapi";` and replace the start of `provisionVoiceAgent`:

```ts
async function provisionVoiceAgent(slug: string, cfg: Cfg): Promise<ProvisionResult> {
  const apiKey = resolveVapiKey(cfg);
  if (!apiKey) {
    return { service: "voice-agent", status: "needs_setup", detail: "VAPI_API_KEY isn't set in Vercel yet. Add it, then run setup again." };
  }
```

and change the success `detail` to: `"AI receptionist is live. Use Get phone number in the dashboard to give it a number."`

- [ ] **Step 5: Run tests** — `npm test`, all pass. Also `npx tsc --noEmit` — no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/vapi.ts src/lib/provision.ts src/lib/provision-helpers.test.ts
git commit -m "Voice agents use Jontri's Vapi key by default; add phone number purchase

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Private portal page + retire slug URLs

**Files:**
- Create: `src/app/p/[token]/page.tsx`, `src/app/p/[token]/PortalView.tsx`, `src/app/api/portal/[token]/feedback/route.ts`
- Modify: `src/app/client/[slug]/page.tsx` (replace entirely), `next.config.*` (add header)
- Delete: `src/app/api/client-portal/route.ts`

**Interfaces:**
- Consumes: `isPortalTokenFormat`, `timeline`, `STAGE_LABELS`, `clientNeeds`, `checklistProgress`, `applyFeedback`, `isStage`, `ChecklistItem`, `Stage` (Task 2); `buildServiceViews`, `PortalServiceView` (Task 5); `ownerFeedbackEmail` (Task 4); `sendMail`; `rateLimit`; `getSupabaseAdmin`; `BOOKING_URL`.
- Produces: `POST /api/portal/<token>/feedback` body `{ action: "approve" | "changes", note?: string }` → `200 { stage }` | `400/404/409/429 { error }`.

- [ ] **Step 1: Invoke the `ui-ux-pro-max` skill** (CLAUDE.md requirement) for "client progress portal, dark aqua, timeline + service cards". Keep the existing portal look (panelCls cards, Kicker, PageGlow).

- [ ] **Step 2: Server page `src/app/p/[token]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BOOKING_URL } from "@/lib/constants";
import { isPortalTokenFormat, isStage, timeline, STAGE_LABELS, clientNeeds, checklistProgress, type ChecklistItem } from "@/lib/lifecycle";
import { buildServiceViews } from "@/lib/portal-view";
import { PortalView } from "./PortalView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Jontri portal", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPortalTokenFormat(token)) notFound();
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("slug, name, industry, services, stage, checklist")
    .eq("portal_token", token)
    .maybeSingle();
  if (!client) notFound();
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", client.slug).maybeSingle();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://jontri.com";
  const stage = isStage(client.stage) ? client.stage : "signed_up";
  const checklist: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
  const services = buildServiceViews(client.services || {}, cfgRow?.config || {}, client.slug, origin);

  return (
    <PortalView
      token={token}
      name={client.name}
      industry={client.industry || ""}
      slug={client.slug}
      stage={stage}
      stageLabel={STAGE_LABELS[stage]}
      steps={timeline(stage)}
      services={services}
      needs={clientNeeds(checklist).map(({ id, label, done }) => ({ id, label, done }))}
      progress={checklistProgress(checklist)}
      bookingUrl={BOOKING_URL}
      chatColor={(cfgRow?.config?.chatbot?.primaryColor as string) || "#35E0C2"}
    />
  );
}
```

Note: `notFound()` renders the existing `src/app/not-found.tsx` ("This page missed the call."), which leaks nothing.

- [ ] **Step 3: Client UI `src/app/p/[token]/PortalView.tsx`**

Move the service-card rendering from the current `src/app/client/[slug]/page.tsx` (lines 31-60 `SERVICE_META`/`STATUS_LABELS`, and the card JSX lines 147-244) into this file unchanged, then add the timeline, needs, try-it and feedback sections:

```tsx
"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuPhoneCall, LuMessagesSquare, LuGlobe, LuCrosshair, LuSearch, LuStar, LuSparkles, LuRepeat,
  LuChartBar, LuWorkflow, LuCalculator, LuHandshake, LuSettings, LuCheck, LuCircle, LuCalendar,
} from "react-icons/lu";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Kicker, PageGlow, panelCls, primaryBtn, ghostBtn, inputCls } from "@/components/site/ui";
import type { PortalServiceView } from "@/lib/portal-view";
import type { Stage } from "@/lib/lifecycle";

// SERVICE_META, STATUS_LABELS and SCORE_LABELS: copy verbatim from the old src/app/client/[slug]/page.tsx.

interface Props {
  token: string;
  name: string;
  industry: string;
  slug: string;
  stage: Stage;
  stageLabel: string;
  steps: { key: Stage; label: string; state: "done" | "current" | "upcoming" }[];
  services: Record<string, PortalServiceView>;
  needs: { id: string; label: string; done: boolean }[];
  progress: { done: number; total: number };
  bookingUrl: string;
  chatColor: string;
}

export function PortalView(p: Props) {
  const [stage, setStage] = useState<Stage>(p.stage);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<"" | "approve" | "changes">("");
  const [message, setMessage] = useState("");
  const hasChatbot = Boolean(p.services.chatbot);

  // Load the client's own chatbot so they can try it (bottom-right bubble).
  useEffect(() => {
    if (!hasChatbot) return;
    const s = document.createElement("script");
    s.src = `/api/chatbot?client=${encodeURIComponent(p.slug)}&color=${encodeURIComponent(p.chatColor)}`;
    s.async = true;
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [hasChatbot, p.slug, p.chatColor]);

  async function send(action: "approve" | "changes") {
    if (action === "changes" && !note.trim()) { setMessage("Tell us what you'd like changed."); return; }
    setSending(action);
    setMessage("");
    try {
      const res = await fetch(`/api/portal/${encodeURIComponent(p.token)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(data.error || "Something went wrong. Please try again."); return; }
      setStage(data.stage);
      setNote("");
      setMessage(action === "approve" ? "Approved. Your AI crew is live." : "Got it. We'll make the changes and let you know.");
    } catch {
      setMessage("Couldn't reach us. Check your connection and try again.");
    } finally {
      setSending("");
    }
  }

  const voice = p.services["voice-agent"];

  return (
    <>
      <SiteNav minimal />
      <div className="relative min-h-screen overflow-hidden bg-bg-primary">
        <PageGlow />
        <header className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-6">
          <Kicker>Client portal</Kicker>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">{p.name}</h1>
          <p className="text-text-secondary mt-2">{p.industry}</p>
        </header>

        <main className="relative max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
          {/* Timeline */}
          <section aria-label="Progress" className={`${panelCls} p-6`}>
            <ol className="grid grid-cols-5 gap-2">
              {p.steps.map((s) => {
                const current = s.key === stage || (s.state === "current" && stage === p.stage);
                const done = p.steps.findIndex((x) => x.key === s.key) < p.steps.findIndex((x) => x.key === stage);
                return (
                  <li key={s.key} className="flex flex-col items-center text-center gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${done ? "bg-accent text-accent-ink" : current ? "bg-accent/15 text-accent shadow-[inset_0_0_0_2px_var(--color-accent)]" : "bg-white/[.04] text-text-muted"}`}>
                      {done ? <LuCheck size={16} aria-hidden /> : <LuCircle size={10} aria-hidden />}
                    </span>
                    <span className={`text-xs ${current ? "text-text-primary font-semibold" : "text-text-muted"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
            {(stage === "proposal" || stage === "paused") && (
              <p className="mt-4 text-sm text-text-secondary text-center">
                {stage === "proposal" ? "We're preparing your custom proposal." : "Your services are paused. Reply to any Jontri email to restart."}
              </p>
            )}
            {(stage === "signed_up" || stage === "kickoff" || stage === "proposal") && (
              <div className="mt-5 flex justify-center">
                <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
                  <LuCalendar size={18} aria-hidden /> Book your kickoff call
                </a>
              </div>
            )}
          </section>

          {/* What we need from you */}
          {p.needs.length > 0 && (
            <section aria-labelledby="needs-h">
              <h2 id="needs-h" className="text-2xl font-bold text-text-primary mb-3">What we need from you</h2>
              <ul className="space-y-2">
                {p.needs.map((n) => (
                  <li key={n.id} className={`${panelCls} px-4 py-3 flex items-center gap-3 text-sm`}>
                    <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${n.done ? "bg-accent text-accent-ink" : "bg-white/[.06] text-text-muted"}`}>
                      {n.done ? <LuCheck size={14} aria-hidden /> : null}
                    </span>
                    <span className={n.done ? "text-text-muted line-through" : "text-text-primary"}>{n.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Try it */}
          {(hasChatbot || voice?.phoneNumber) && (
            <section aria-labelledby="try-h" className={`${panelCls} p-6`}>
              <h2 id="try-h" className="text-2xl font-bold text-text-primary mb-2">Try it yourself</h2>
              {hasChatbot && <p className="text-text-secondary text-sm">Your chatbot is in the bottom-right corner of this page. Ask it what a customer would.</p>}
              {voice?.phoneNumber && (
                <p className="text-text-secondary text-sm mt-2">
                  Call your AI receptionist:{" "}
                  <a href={`tel:${voice.phoneNumber}`} className="text-accent font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent">{voice.phoneNumber}</a>
                </p>
              )}
            </section>
          )}

          {/* Services: card list copied from the old page, using p.services */}

          {/* Review */}
          {(stage === "review" || stage === "live") && (
            <section aria-labelledby="review-h" className={`${panelCls} p-6`}>
              <h2 id="review-h" className="text-2xl font-bold text-text-primary mb-2">{stage === "review" ? "Ready for your review" : "Want something changed?"}</h2>
              <label htmlFor="fb-note" className="block text-sm text-text-secondary mb-2">Notes for the Jontri team{stage === "review" ? " (optional when approving)" : ""}</label>
              <textarea id="fb-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={3} className={inputCls} />
              <div className="mt-4 flex flex-wrap gap-3">
                {stage === "review" && (
                  <button type="button" onClick={() => send("approve")} disabled={Boolean(sending)} className={`${primaryBtn} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
                    {sending === "approve" ? "Approving…" : "Approve and go live"}
                  </button>
                )}
                <button type="button" onClick={() => send("changes")} disabled={Boolean(sending)} className={`${ghostBtn} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}>
                  {sending === "changes" ? "Sending…" : "Request changes"}
                </button>
              </div>
              {message && <p role="status" className="mt-3 text-sm text-text-secondary">{message}</p>}
            </section>
          )}
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
```

Replace the comment `{/* Services: ... */}` with the `<section>` that contains the old page's heading "Your AI crew", the empty state, and the `serviceEntries.map(...)` card JSX, where `serviceEntries = Object.entries(p.services)` and the voice card additionally renders `svc.phoneNumber` as an "AI phone number" row next to Business Phone. Simplify the timeline `current/done` computation to use the live `stage` state only:

```tsx
const idx = p.steps.findIndex((x) => x.key === stage);
// inside map: const i = p.steps.indexOf(s); const done = idx >= 0 && i < idx; const current = i === Math.max(0, idx);
```

- [ ] **Step 4: Feedback API `src/app/api/portal/[token]/feedback/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail } from "@/lib/mailer";
import { isPortalTokenFormat, isStage, applyFeedback, type FeedbackAction } from "@/lib/lifecycle";
import { ownerFeedbackEmail } from "@/lib/lifecycle-emails";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const limited = rateLimit(request, { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;
  const { token } = await params;
  if (!isPortalTokenFormat(token)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const action = body?.action as FeedbackAction;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 2000) : "";
  if (action !== "approve" && action !== "changes") return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (action === "changes" && !note) return NextResponse.json({ error: "Tell us what you'd like changed." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("slug, name, stage").eq("portal_token", token).maybeSingle();
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = isStage(client.stage) ? client.stage : "signed_up";
  const next = applyFeedback(current, action);
  if (!next.ok) return NextResponse.json({ error: next.error }, { status: 409 });

  // Only move the stage if nobody changed it meanwhile (double-click / two tabs).
  const { data: updated } = await supabase
    .from("clients")
    .update({ stage: next.stage })
    .eq("slug", client.slug)
    .eq("stage", current)
    .select("slug")
    .maybeSingle();
  if (!updated) return NextResponse.json({ error: "This was already submitted." }, { status: 409 });

  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", client.slug).maybeSingle();
  const config = cfgRow?.config || {};
  const feedback = Array.isArray(config.portal_feedback) ? config.portal_feedback : [];
  config.portal_feedback = [{ action, note, at: new Date().toISOString() }, ...feedback].slice(0, 20);
  await supabase.from("client_configs").upsert({ slug: client.slug, config, updated_at: new Date().toISOString() });

  const to = process.env.OWNER_EMAIL || process.env.ZOHO_EMAIL;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (to) await sendMail({ to, ...ownerFeedbackEmail({ businessName: client.name, action, note, dashboardUrl: `${origin}/dashboard` }) });

  return NextResponse.json({ stage: next.stage });
}
```

- [ ] **Step 5: Retire slug URLs**

Replace `src/app/client/[slug]/page.tsx` entirely:

```tsx
import type { Metadata } from "next";
import { LuLock } from "react-icons/lu";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { PageGlow } from "@/components/site/ui";

export const metadata: Metadata = { title: "Client portal", robots: { index: false, follow: false } };

export default function OldPortalLink() {
  return (
    <>
      <SiteNav minimal />
      <main className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-bg-primary flex items-center justify-center px-4">
        <PageGlow />
        <div className="relative text-center max-w-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/12 text-accent">
            <LuLock size={26} aria-hidden />
          </div>
          <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-text-primary mb-3">Your portal has a new private link</h1>
          <p className="text-text-secondary">Use the link Jontri emailed you. Can&apos;t find it? Email hello@jontri.com and we&apos;ll resend it.</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
```

Delete `src/app/api/client-portal/route.ts` (`git rm`). Update the comment in `src/lib/supabase.ts:19` to drop "client-portal".

Add a `no-referrer` + `noindex` header for `/p/:path*` in the Next config (open `next.config.ts`/`.mjs`, add or extend `async headers()`):

```ts
async headers() {
  return [
    { source: "/p/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "no-store" }] },
  ];
},
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Then `npm run dev` and, after the Task 1 migration is applied, get a real token with read-only SQL `select slug, portal_token from clients limit 1;` and check:
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/p/short` → `404`
- `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/p/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA` → `404`
- `curl -sI http://localhost:3000/p/<real token> | grep -i referrer` → `no-referrer`
- `curl -s http://localhost:3000/client/<real slug> | grep -c "<real business name>"` → `0`
- `curl -s -X POST http://localhost:3000/api/portal/<real token>/feedback -H "Content-Type: application/json" -d '{"action":"approve"}'` on a client not in review → `409`

Screenshot `http://localhost:3000/p/<token>` desktop and mobile (`node screenshot.mjs http://localhost:3000/p/<token> portal`), read the PNGs, fix issues, re-screenshot (2 rounds).

- [ ] **Step 7: Commit**

```bash
git add src/app/p src/app/api/portal "src/app/client/[slug]/page.tsx" src/lib/supabase.ts next.config.*
git rm src/app/api/client-portal/route.ts
git commit -m "Private portal at /p/<token> with timeline, needs, try-it, approve/changes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Set up all (`src/lib/setup-all.ts` + route)

**Files:**
- Create: `src/lib/setup-all.ts`, `src/lib/setup-all.test.ts`, `src/app/api/clients/[slug]/setup-all/route.ts`

**Interfaces:**
- Consumes: `ProvisionResult` (type) and `provisionService` from `src/lib/provision.ts`; `stageAfterSetupAll`, `isStage`, `buildChecklist` (Task 2).
- Produces:
  - `runSetupAll(services: string[], configs: Record<string, Record<string, unknown>>, provision: (service: string, cfg: Record<string, unknown>) => Promise<ProvisionResult>): Promise<ProvisionResult[]>` (same order as `services`)
  - `POST /api/clients/<slug>/setup-all` → `200 { results: SafeResult[], stage: Stage }` where `SafeResult = { service, status, detail, embedCode?, assistantId?, scores?, aiScore? }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { runSetupAll } from "./setup-all.ts";
import type { ProvisionResult } from "./provision";

test("runs every service, keeps order, isolates failures", async () => {
  const calls: string[] = [];
  const results = await runSetupAll(
    ["chatbot", "voice-agent", "seo-audit"],
    { chatbot: { a: 1 }, "voice-agent": {}, "seo-audit": {} },
    async (service, cfg): Promise<ProvisionResult> => {
      calls.push(service);
      if (service === "voice-agent") throw new Error("Vapi down");
      return { service, status: "active", detail: `ok ${JSON.stringify(cfg)}` };
    },
  );
  assert.deepEqual(results.map((r) => r.service), ["chatbot", "voice-agent", "seo-audit"]);
  assert.deepEqual(results.map((r) => r.status), ["active", "error", "active"]);
  assert.match(results[1].detail, /Vapi down/);
  assert.match(results[0].detail, /"a":1/);
  assert.equal(calls.length, 3);
});

test("missing config is passed as an empty object", async () => {
  const [r] = await runSetupAll(["ai-seo"], {}, async (service, cfg) => ({ service, status: "needs_setup", detail: String(Object.keys(cfg).length) }));
  assert.equal(r.detail, "0");
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, FAIL.

- [ ] **Step 3: Implement `src/lib/setup-all.ts`**

```ts
import type { ProvisionResult } from "./provision";

/** Provision many services in parallel. A failure in one never affects the others. */
export async function runSetupAll(
  services: string[],
  configs: Record<string, Record<string, unknown>>,
  provision: (service: string, cfg: Record<string, unknown>) => Promise<ProvisionResult>,
): Promise<ProvisionResult[]> {
  return Promise.all(
    services.map(async (service): Promise<ProvisionResult> => {
      try {
        return await provision(service, configs[service] || {});
      } catch (e) {
        return { service, status: "error", detail: e instanceof Error ? e.message : "Setup failed" };
      }
    }),
  );
}
```

- [ ] **Step 4: Route `src/app/api/clients/[slug]/setup-all/route.ts`** (protected by middleware: path starts with `/api/clients`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { provisionService } from "@/lib/provision";
import { runSetupAll } from "@/lib/setup-all";
import { isStage, stageAfterSetupAll, buildChecklist, type ChecklistItem } from "@/lib/lifecycle";

export const maxDuration = 120;

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("slug, services, stage, checklist").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config: Record<string, Record<string, unknown>> = cfgRow?.config || {};

  const serviceKeys = Object.keys(client.services || {});
  if (serviceKeys.length === 0) return NextResponse.json({ error: "This client has no services yet." }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const results = await runSetupAll(serviceKeys, config, (service, cfg) => provisionService(service, slug, cfg, origin));

  const now = new Date().toISOString();
  const services = { ...(client.services || {}) };
  for (const r of results) {
    if (r.configPatch) config[r.service] = { ...(config[r.service] || {}), ...r.configPatch };
    services[r.service] = { status: r.status, detail: r.detail, updated_at: now };
  }
  const stage = stageAfterSetupAll(isStage(client.stage) ? client.stage : "signed_up");
  const existing: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
  const checklist = buildChecklist(serviceKeys, existing);

  await supabase.from("client_configs").upsert({ slug, config, updated_at: now });
  await supabase.from("clients").update({ services, stage, checklist }).eq("slug", slug);

  return NextResponse.json({
    stage,
    results: results.map(({ service, status, detail, embedCode, assistantId, scores, aiScore }) => ({ service, status, detail, embedCode, assistantId, scores, aiScore })),
  });
}
```

- [ ] **Step 5: Verify** — `npm test`, `npx tsc --noEmit`; `curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/clients/x/setup-all` without a session cookie → `401`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/setup-all.ts src/lib/setup-all.test.ts "src/app/api/clients/[slug]/setup-all/route.ts"
git commit -m "Add Set up all: provision every service for a client in one call

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Admin client APIs — stage/checklist/notes, phone number, list mapping, tokens on create

**Files:**
- Create: `src/lib/dashboard-client.ts`, `src/lib/dashboard-client.test.ts`, `src/app/api/clients/[slug]/phone-number/route.ts`
- Modify: `src/app/api/clients/[slug]/route.ts` (add `PATCH`), `src/app/api/clients/route.ts` (GET mapping, portal token on insert)

**Interfaces:**
- Consumes: `isStage`, `toggleChecklistItem`, `newPortalToken`, `portalUrl`, `STAGE_LABELS`, `ChecklistItem`, `Stage` (Task 2); `clientReadyForReviewEmail` (Task 4); `resolveVapiKey`, `buyPhoneNumber` (Task 6).
- Produces:
  - `interface DashboardClient { name; slug; industry; description; contact: { name; email; phone }; onboarding?: Record<string, unknown>; services: Record<string, { status: string; updated_at: string; detail?: string }>; created_at; status; tier_id?; billing_type?; monthly_rate?; stage: Stage; portal_token: string; billing_status: string | null; checklist: ChecklistItem[]; notes: string; phoneNumber?: string }`
  - `toDashboardClient(row: Record<string, unknown>, extra?: { onboarding?: unknown; phoneNumber?: unknown }): DashboardClient`
  - `STAGE_ORDER: Stage[]` = `["kickoff", "signed_up", "proposal", "building", "review", "live", "paused"]`
  - `groupByStage(clients: DashboardClient[]): { stage: Stage; clients: DashboardClient[] }[]` (empty groups omitted)
  - `PATCH /api/clients/<slug>` body `{ stage?: Stage; checklistItem?: { id: string; done: boolean }; notes?: string }` → `200 { client: DashboardClient }`
  - `POST /api/clients/<slug>/phone-number` body `{ areaCode?: string }` → `200 { phoneNumber: string }` | `400/404/502 { error }`
  - `GET /api/clients` → `{ clients: DashboardClient[], total }`
  - `POST /api/clients` response `client` now includes `portal_token`.

- [ ] **Step 1: Write the failing tests**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toDashboardClient, groupByStage } from "./dashboard-client.ts";

const row = { name: "A", slug: "a", industry: "HVAC", description: "", contact_name: "Dana", contact_email: "d@x.co", contact_phone: "1", services: {}, created_at: "2026-11-28", status: "active", stage: "kickoff", portal_token: "t".repeat(32), billing_status: "unpaid", checklist: [], notes: "" };

test("maps contact columns and defaults bad values", () => {
  const c = toDashboardClient(row, { onboarding: { goals: "x" }, phoneNumber: "+1720" });
  assert.deepEqual(c.contact, { name: "Dana", email: "d@x.co", phone: "1" });
  assert.equal(c.stage, "kickoff");
  assert.equal(c.phoneNumber, "+1720");
  assert.deepEqual(c.onboarding, { goals: "x" });
  const bad = toDashboardClient({ ...row, stage: "weird", checklist: "nope", notes: null });
  assert.equal(bad.stage, "signed_up");
  assert.deepEqual(bad.checklist, []);
  assert.equal(bad.notes, "");
});

test("groups by stage with the kickoff queue first and no empty groups", () => {
  const cs = [toDashboardClient({ ...row, slug: "l", stage: "live" }), toDashboardClient({ ...row, slug: "k", stage: "kickoff" }), toDashboardClient({ ...row, slug: "k2", stage: "kickoff" })];
  const g = groupByStage(cs);
  assert.deepEqual(g.map((x) => x.stage), ["kickoff", "live"]);
  assert.equal(g[0].clients.length, 2);
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, FAIL.

- [ ] **Step 3: Implement `src/lib/dashboard-client.ts`** (pure; only `import type`)

```ts
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
```

- [ ] **Step 4: `GET /api/clients` mapping and tokens on create** (`src/app/api/clients/route.ts`)

Add imports `import { toDashboardClient } from "@/lib/dashboard-client";` and `import { newPortalToken } from "@/lib/lifecycle";`. Replace the GET body:

```ts
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: rows, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: cfgs } = await supabase
    .from("client_configs")
    .select("slug, onboarding:config->onboarding, phoneNumber:config->voice-agent->>phoneNumber");
  const bySlug = new Map((cfgs || []).map((c) => [c.slug as string, c]));
  const clients = (rows || []).map((r) => toDashboardClient(r, bySlug.get(r.slug) || {}));
  return NextResponse.json({ clients, total: clients.length });
}
```

(If PostgREST rejects the hyphenated path `config->voice-agent`, quote it: `config->"voice-agent"->>phoneNumber`; verify with a local GET returning 200.)

In POST, add `portal_token: newPortalToken(),` and `stage: "kickoff",` to `insertData` (owner-created clients skip sign-up).

- [ ] **Step 5: `PATCH /api/clients/[slug]`** (append to `src/app/api/clients/[slug]/route.ts`)

```ts
import { isStage, toggleChecklistItem, portalUrl, type ChecklistItem } from "@/lib/lifecycle";
import { toDashboardClient } from "@/lib/dashboard-client";
import { clientReadyForReviewEmail } from "@/lib/lifecycle-emails";
import { sendMail } from "@/lib/mailer";

// PATCH /api/clients/[slug] — stage, one checklist item, or notes
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("*").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.stage !== undefined) {
    if (!isStage(body.stage)) return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    updates.stage = body.stage;
  }
  if (body.checklistItem) {
    const { id, done } = body.checklistItem;
    if (typeof id !== "string" || typeof done !== "boolean") return NextResponse.json({ error: "Invalid checklist item" }, { status: 400 });
    const list: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
    if (!list.some((i) => i.id === id)) return NextResponse.json({ error: "Unknown checklist item" }, { status: 400 });
    updates.checklist = toggleChecklistItem(list, id, done);
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string" || body.notes.length > 5000) return NextResponse.json({ error: "Notes must be under 5,000 characters" }, { status: 400 });
    updates.notes = body.notes;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data: saved, error } = await supabase.from("clients").update(updates).eq("slug", slug).select("*").single();
  if (error || !saved) return NextResponse.json({ error: error?.message || "Update failed" }, { status: 500 });

  if (updates.stage === "review" && client.stage !== "review" && saved.contact_email) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    await sendMail({
      to: saved.contact_email,
      ...clientReadyForReviewEmail({ contactName: saved.contact_name || "there", businessName: saved.name, portalUrl: portalUrl(origin, saved.portal_token) }),
    });
  }
  return NextResponse.json({ client: toDashboardClient(saved) });
}
```

- [ ] **Step 6: `POST /api/clients/[slug]/phone-number`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveVapiKey, buyPhoneNumber } from "@/lib/vapi";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  const areaCode = typeof body.areaCode === "string" && body.areaCode.trim() ? body.areaCode.trim() : undefined;

  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase.from("clients").select("name").eq("slug", slug).maybeSingle();
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", slug).maybeSingle();
  const config = cfgRow?.config || {};
  const voice = (config["voice-agent"] || {}) as Record<string, unknown>;

  if (typeof voice.phoneNumber === "string" && voice.phoneNumber) return NextResponse.json({ phoneNumber: voice.phoneNumber });
  if (typeof voice.assistantId !== "string" || !voice.assistantId) {
    return NextResponse.json({ error: "Set up the voice agent first (Set up all), then get a number." }, { status: 400 });
  }
  const apiKey = resolveVapiKey(voice);
  if (!apiKey) return NextResponse.json({ error: "VAPI_API_KEY isn't set in Vercel yet." }, { status: 400 });

  const r = await buyPhoneNumber(apiKey, voice.assistantId, { areaCode, name: client.name });
  if (!r.ok) return NextResponse.json({ error: `Vapi: ${r.error}` }, { status: 502 });

  config["voice-agent"] = { ...voice, phoneNumberId: r.id, phoneNumber: r.number };
  await supabase.from("client_configs").upsert({ slug, config, updated_at: new Date().toISOString() });
  return NextResponse.json({ phoneNumber: r.number || "Provisioning… refresh in a minute" });
}
```

- [ ] **Step 7: Verify** — `npm test`, `npx tsc --noEmit`, `npm run lint`. Without a session: `curl -s -o /dev/null -w "%{http_code}" -X PATCH http://localhost:3000/api/clients/x` → `401`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/dashboard-client.ts src/lib/dashboard-client.test.ts src/app/api/clients
git commit -m "Admin APIs: stage/checklist/notes, phone numbers, portal tokens, list mapping

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Onboarding API v2

**Files:**
- Modify: `src/app/api/onboarding/route.ts` (replace entirely)

**Interfaces:**
- Consumes: `validateIntake`, `buildServiceConfigs`, `slugify`, `uniqueSlug` (Task 3); `TERMS_VERSION` (Task 3); `getTierServices`, `getTier` (`src/lib/tiers.ts`); `newPortalToken`, `portalUrl`, `buildChecklist`, `clientNeeds`, `STAGE_LABELS` (Task 2); `ownerNewSignupEmail`, `clientWelcomeEmail` (Task 4); `sendMail`, `rateLimit`, `BOOKING_URL`.
- Produces: `POST /api/onboarding` body = `Intake` fields + `agreed: true` → `200 { portalUrl: string, stage: "kickoff" | "proposal" }` | `400/429/500 { error }`.

- [ ] **Step 1: Replace the route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail } from "@/lib/mailer";
import { BOOKING_URL } from "@/lib/constants";
import { getTier, getTierServices } from "@/lib/tiers";
import { TERMS_VERSION } from "@/lib/terms";
import { validateIntake, buildServiceConfigs, slugify, uniqueSlug } from "@/lib/onboarding-intake";
import { newPortalToken, portalUrl, buildChecklist, clientNeeds, STAGE_LABELS, type Stage } from "@/lib/lifecycle";
import { ownerNewSignupEmail, clientWelcomeEmail } from "@/lib/lifecycle-emails";

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const raw = await request.json().catch(() => null);
  const v = validateIntake(raw, TERMS_VERSION);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const d = v.data;

  const isCustom = d.packageId === "tier-3" || d.packageId === "custom";
  const services = d.packageId === "custom" ? [] : getTierServices(d.packageId);
  const stage: Stage = isCustom ? "proposal" : "kickoff";
  const now = new Date().toISOString();
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const tier = getTier(d.packageId);
  const packageName = tier ? `${tier.name} (${tier.price}/mo)` : "Custom / à la carte";

  const supabase = getSupabaseAdmin();
  const slug = await uniqueSlug(slugify(d.businessName), async (s) => {
    const { data } = await supabase.from("clients").select("slug").eq("slug", s).maybeSingle();
    return Boolean(data);
  });
  const token = newPortalToken();
  const checklist = buildChecklist(services);

  const { error: insertError } = await supabase.from("clients").insert({
    slug,
    name: d.businessName,
    industry: d.industry,
    description: d.details.servicesOffered,
    contact_name: d.contactName,
    contact_email: d.email,
    contact_phone: d.phone,
    services: Object.fromEntries(services.map((s) => [s, { status: "pending", updated_at: now }])),
    status: "active",
    tier_id: tier ? tier.id : null,
    billing_type: tier ? "tier" : "a-la-carte",
    monthly_rate: tier ? Math.round(tier.monthlyRateCents / 100) : 0,
    portal_token: token,
    stage,
    billing_status: isCustom ? null : "unpaid",
    contract_accepted_name: d.acceptName,
    contract_accepted_at: now,
    contract_accepted_ip: ip.slice(0, 64),
    checklist,
  });
  if (insertError) {
    console.error("onboarding insert failed:", insertError.message);
    return NextResponse.json({ error: "We couldn't save your sign-up. Please try again or email hello@jontri.com." }, { status: 500 });
  }

  await supabase.from("client_configs").upsert({
    slug,
    updated_at: now,
    config: {
      ...buildServiceConfigs(services, d),
      client: { name: d.businessName, industry: d.industry, description: d.details.servicesOffered, website: d.website },
      sender: { from_name: "Vincent Kalman", from_title: "Founder", from_company: "Jontri Consulting", booking_url: BOOKING_URL },
      onboarding: { package: d.packageId, details: d.details, website: d.website, terms_version: d.termsVersion, submitted_at: now },
    },
  });

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const link = portalUrl(origin, token);
  const owner = process.env.OWNER_EMAIL || process.env.ZOHO_EMAIL;
  // Emails never block the sign-up; sendMail logs and returns false on failure.
  await Promise.all([
    owner
      ? sendMail({ to: owner, replyTo: d.email, ...ownerNewSignupEmail({ businessName: d.businessName, contactName: d.contactName, email: d.email, phone: d.phone, packageName, stageLabel: STAGE_LABELS[stage], dashboardUrl: `${origin}/dashboard` }) })
      : Promise.resolve(false),
    sendMail({ to: d.email, ...clientWelcomeEmail({ contactName: d.contactName, businessName: d.businessName, portalUrl: link, bookingUrl: BOOKING_URL, needs: clientNeeds(checklist).map((n) => n.label), awaitingProposal: isCustom }) }),
  ]);

  return NextResponse.json({ portalUrl: link, stage });
}
```

Note: the `docx` contract generation is removed; leave the `docx` package installed (still used elsewhere? check with `grep -rn "from \"docx\"" src` — if unused, leave it; removing deps is out of scope).

- [ ] **Step 2: Verify** — `npx tsc --noEmit && npm run lint`. With the dev server running and the migration applied:

```bash
curl -s -X POST http://localhost:3000/api/onboarding -H "Content-Type: application/json" -d '{"agreed":false}'
```
Expected: `400` with an error message.

A full valid sign-up is exercised in Task 13 (it sends real emails — use the owner's own address).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/onboarding/route.ts
git commit -m "Onboarding v2 API: click-to-accept, portal link, checklist, welcome emails

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Onboarding form v2 (public page)

**Files:**
- Modify: `src/components/ui/OnboardingForm.tsx` (replace entirely), `src/components/OnboardingSection.tsx` (copy only)

**Interfaces:**
- Consumes: `POST /api/onboarding` (Task 10); `TIERS` (`src/lib/tiers.ts`); `TERMS`, `TERMS_VERSION` (Task 3); `detailFieldsFor`, `type DetailField`, `type PackageId` (Task 3); `getTierServices`.

- [ ] **Step 1: Invoke `ui-ux-pro-max`** for "multi-step sign-up form, dark aqua, package cards, terms acceptance".

- [ ] **Step 2: Replace `src/components/ui/OnboardingForm.tsx`**

```tsx
"use client";

import { useState, type FormEvent } from "react";
import { LuCheck, LuArrowRight, LuArrowLeft } from "react-icons/lu";
import { TIERS, getTierServices } from "@/lib/tiers";
import { TERMS, TERMS_VERSION } from "@/lib/terms";
import { detailFieldsFor, type DetailField, type PackageId, type SetupDetails } from "@/lib/onboarding-intake";
import { inputCls, primaryBtn, ghostBtn } from "@/components/site/ui";

const STEPS = ["Your business", "Package", "Setup details", "Review & accept"] as const;
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const FIELD_META: Record<DetailField, { label: string; placeholder: string; textarea?: boolean; type?: string }> = {
  servicesOffered: { label: "What services do you offer?", placeholder: "e.g. Open and enclosed car shipping, dealer transfers, snowbird moves", textarea: true },
  businessHours: { label: "Business hours", placeholder: "e.g. Mon–Sat 8am–6pm" },
  bookingUrl: { label: "Booking or quote link (optional)", placeholder: "https://…", type: "url" },
  transferNumber: { label: "Number to transfer urgent calls to", placeholder: "+1 720 555 0100", type: "tel" },
  leadEmail: { label: "Where should new leads be emailed? (optional)", placeholder: "Defaults to your email", type: "email" },
  brandColor: { label: "Brand color (optional)", placeholder: "#35E0C2" },
  googleBusinessUrl: { label: "Google Business Profile link (optional)", placeholder: "https://g.page/…", type: "url" },
  targetArea: { label: "Area you serve", placeholder: "e.g. Denver metro, Colorado" },
};

const emptyDetails: SetupDetails = { servicesOffered: "", businessHours: "", bookingUrl: "", transferNumber: "", leadEmail: "", brandColor: "", googleBusinessUrl: "", targetArea: "" };

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState({ contactName: "", businessName: "", email: "", phone: "", website: "", industry: "" });
  const [packageId, setPackageId] = useState<PackageId | "">("");
  const [details, setDetails] = useState<SetupDetails>(emptyDetails);
  const [acceptName, setAcceptName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ portalUrl: string; stage: string } | null>(null);

  const services = packageId && packageId !== "custom" ? getTierServices(packageId) : [];
  const fields = detailFieldsFor(services);

  function check(s: number): string {
    if (s === 0) {
      if (!biz.contactName.trim() || !biz.businessName.trim() || !biz.phone.trim() || !biz.industry.trim()) return "Please fill in your name, business, phone and industry.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(biz.email.trim())) return "Please enter a valid email address.";
    }
    if (s === 1 && !packageId) return "Please choose a package.";
    if (s === 2) {
      if (fields.includes("servicesOffered") && !details.servicesOffered.trim()) return "Tell us what services you offer so your AI can answer correctly.";
      if (fields.includes("businessHours") && !details.businessHours.trim()) return "Please add your business hours.";
    }
    if (s === 3 && (!agreed || acceptName.trim().length < 2)) return "Type your full name and check the box to accept.";
    return "";
  }

  function next() {
    const e = check(step);
    setError(e);
    if (!e) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const msg = check(3);
    if (msg) { setError(msg); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...biz, packageId, details, acceptName, agreed, termsVersion: TERMS_VERSION }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || "Something went wrong. Please try again."); return; }
      setDone(data);
    } catch {
      setError("Couldn't reach us. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-6" role="status">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink"><LuCheck size={28} aria-hidden /></div>
        <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-text-primary mb-3">You&apos;re in.</h2>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          {done.stage === "proposal" ? "We'll put together your custom proposal. " : "Next step: book your kickoff call. "}
          We just emailed your private portal link. You can also open it now and bookmark it.
        </p>
        <a href={done.portalUrl} className={`${primaryBtn} ${focusRing}`}>Open my portal <LuArrowRight size={18} aria-hidden /></a>
      </div>
    );
  }

  const bizField = (name: keyof typeof biz, label: string, type = "text", autoComplete?: string) => (
    <div>
      <label htmlFor={`ob-${name}`} className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      <input id={`ob-${name}`} type={type} autoComplete={autoComplete} value={biz[name]} onChange={(e) => setBiz({ ...biz, [name]: e.target.value })} className={inputCls} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      <ol className="flex items-center justify-center gap-2 mb-8" aria-label="Sign-up steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span aria-current={i === step ? "step" : undefined} className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === step ? "bg-accent text-accent-ink" : i < step ? "bg-accent/25 text-accent" : "bg-white/[.04] text-text-muted"}`}>
              {i < step ? <LuCheck size={14} aria-hidden /> : i + 1}
            </span>
            <span className="hidden sm:inline text-xs text-text-muted">{label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-white/15" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bizField("contactName", "Your full name", "text", "name")}
          {bizField("businessName", "Business name", "text", "organization")}
          {bizField("email", "Email", "email", "email")}
          {bizField("phone", "Phone", "tel", "tel")}
          {bizField("website", "Website (optional)", "url", "url")}
          {bizField("industry", "Industry", "text")}
        </div>
      )}

      {step === 1 && (
        <fieldset>
          <legend className="sr-only">Choose a package</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...TIERS.map((t) => ({ id: t.id as PackageId, name: t.name, price: t.id === "tier-3" ? "Custom pricing" : `${t.price}/mo`, sub: t.subtitle })),
              { id: "custom" as PackageId, name: "Just one or two services", price: "Quoted for you", sub: "Pick what you need on a call" }].map((p) => (
              <label key={p.id} className={`cursor-pointer rounded-2xl p-5 transition-[box-shadow,background-color,transform] duration-200 hover:-translate-y-0.5 active:scale-[.99] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${packageId === p.id ? "bg-accent/10 shadow-[inset_0_0_0_2px_var(--color-accent)]" : "bg-white/[.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] hover:bg-white/[.05]"}`}>
                <input type="radio" name="package" value={p.id} checked={packageId === p.id} onChange={() => setPackageId(p.id)} className="sr-only" />
                <span className="block text-text-primary font-bold">{p.name}</span>
                <span className="block text-accent font-semibold text-sm mt-1">{p.price}</span>
                <span className="block text-text-muted text-xs mt-1">{p.sub}</span>
              </label>
            ))}
          </div>
          {(packageId === "tier-3" || packageId === "custom") && <p className="mt-4 text-sm text-text-secondary">No payment today. We&apos;ll send a proposal after a quick call.</p>}
        </fieldset>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {fields.length === 0 && <p className="text-text-secondary text-sm">Nothing else needed right now. We&apos;ll go over the details on your call.</p>}
          {fields.map((f) => {
            const m = FIELD_META[f];
            return (
              <div key={f}>
                <label htmlFor={`ob-${f}`} className="block text-sm font-medium text-text-secondary mb-1.5">{m.label}</label>
                {m.textarea ? (
                  <textarea id={`ob-${f}`} rows={3} value={details[f]} placeholder={m.placeholder} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className={inputCls} />
                ) : (
                  <input id={`ob-${f}`} type={m.type || "text"} value={details[f]} placeholder={m.placeholder} onChange={(e) => setDetails({ ...details, [f]: e.target.value })} className={inputCls} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white/[.03] p-5 text-sm text-text-secondary">
            <p><span className="text-text-primary font-semibold">{biz.businessName}</span> · {biz.contactName} · {biz.email}</p>
            <p className="mt-1">Package: <span className="text-text-primary">{TIERS.find((t) => t.id === packageId)?.name || "Custom / à la carte"}</span></p>
          </div>
          <div className="max-h-64 overflow-y-auto rounded-2xl bg-bg-primary p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] text-sm" tabIndex={0} aria-label="Service terms">
            <h3 className="text-text-primary font-bold mb-3">Service terms</h3>
            {TERMS.map((t, i) => (
              <p key={t.title} className="text-text-secondary mb-3"><span className="text-text-primary font-semibold">{i + 1}. {t.title}.</span> {t.body}</p>
            ))}
          </div>
          <div>
            <label htmlFor="ob-accept" className="block text-sm font-medium text-text-secondary mb-1.5">Type your full name to sign</label>
            <input id="ob-accept" value={acceptName} onChange={(e) => setAcceptName(e.target.value)} autoComplete="name" className={inputCls} />
          </div>
          <label className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className={`mt-0.5 h-5 w-5 accent-[var(--color-accent)] ${focusRing}`} />
            I agree to the service terms above on behalf of {biz.businessName || "my business"}.
          </label>
        </div>
      )}

      {error && <p role="alert" className="mt-5 text-sm text-red-400">{error}</p>}

      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={() => { setError(""); setStep((s) => s - 1); }} className={`${ghostBtn} ${focusRing}`}><LuArrowLeft size={18} aria-hidden /> Back</button>
        ) : <span />}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className={`${primaryBtn} ${focusRing}`}>Continue <LuArrowRight size={18} aria-hidden /></button>
        ) : (
          <button type="submit" disabled={submitting} className={`${primaryBtn} ${focusRing}`}>{submitting ? "Submitting…" : "Accept and sign up"}</button>
        )}
      </div>
    </form>
  );
}
```

Note: `src/lib/terms.ts`, `onboarding-intake.ts` and `tiers.ts` import nothing server-only, so they are safe to import from a client component.

- [ ] **Step 3: Update `src/components/OnboardingSection.tsx` copy** (copy only, keep layout):
  - Subtitle → `Tell us about your business, pick a package and accept the terms. Takes about 5 minutes.`
  - Card 1 → icon `LuFileText`, title `Sign in one click`, text `Review the terms and sign by typing your name. No printing or scanning.`
  - Card 2 → title `Secure & Private`, text `Your information is only used to set up your services. We never sell or share it.`
  - Card 3 → title `Track every step`, text `You get a private portal link that shows exactly where your setup is.`

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npm run lint && npm test`. `npm run dev`, screenshot `http://localhost:3000/onboarding` at each step (desktop + 375px mobile), read PNGs, fix, re-screenshot (2 rounds). Keyboard-only pass: Tab through package cards (visible focus ring), Space selects, Enter on Continue.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/OnboardingForm.tsx src/components/OnboardingSection.tsx
git commit -m "Onboarding v2 form: business, package, setup details, click-to-accept

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Dashboard — stages, work panel, portal links

**Files:**
- Create: `src/app/dashboard/_components/clients/ClientWorkPanel.tsx`
- Modify: `src/app/dashboard/_components/clients/ClientList.tsx`, `ClientDetail.tsx`, `src/app/dashboard/page.tsx`, `_components/deploy/QuickDeployModal.tsx:148,229-234`, `_components/tiers/TierDeployModal.tsx:138-139,239-244`

**Interfaces:**
- Consumes: `DashboardClient`, `groupByStage` (Task 9); `STAGE_LABELS`, `ALL_STAGES`, `checklistProgress`, `portalUrl` (Task 2); `PATCH /api/clients/<slug>`, `POST .../setup-all`, `POST .../phone-number`; `ProvisionResults`, `ProvisionRow` (`_components/deploy/ProvisionResults.tsx`).
- Produces: `ClientWorkPanel({ client, onUpdated }: { client: DashboardClient; onUpdated: (c?: DashboardClient) => void })`.

- [ ] **Step 1: Shared type** — In `ClientList.tsx` replace the local `Onboarding`/`Client` interfaces with `export type { DashboardClient as Client } from "@/lib/dashboard-client";` plus `import type { DashboardClient as Client } from "@/lib/dashboard-client";`. In `src/app/dashboard/page.tsx` delete the duplicate `Onboarding`/`Client` interfaces and `import type { DashboardClient as Client } from "@/lib/dashboard-client";`.

- [ ] **Step 2: Group the list by stage** (`ClientList.tsx`): import `groupByStage` and `STAGE_LABELS`; replace the `clients.map(...)` branch with:

```tsx
groupByStage(clients).map((group) => (
  <section key={group.stage} aria-label={STAGE_LABELS[group.stage]} className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted pt-2">
      {STAGE_LABELS[group.stage]} ({group.clients.length})
    </h3>
    {group.clients.map((client) => /* existing <button> card JSX, unchanged */)}
  </section>
))
```

and in each card replace the `client.status` pill with the stage label pill (`STAGE_LABELS[client.stage]`, `bg-accent/15 text-accent` for `kickoff`/`review`, `bg-border text-text-muted` otherwise). The `client.onboarding` dot keeps working (now populated by GET).

- [ ] **Step 3: Create `ClientWorkPanel.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { DashboardClient } from "@/lib/dashboard-client";
import { ALL_STAGES, STAGE_LABELS, checklistProgress, type Stage } from "@/lib/lifecycle";
import { ProvisionResults, type ProvisionRow } from "../deploy/ProvisionResults";

const btn = "px-3 py-2 rounded-lg text-sm font-semibold transition-[background-color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80 disabled:opacity-50 cursor-pointer";

export default function ClientWorkPanel({ client, onUpdated }: { client: DashboardClient; onUpdated: (c?: DashboardClient) => void }) {
  const [busy, setBusy] = useState("");
  const [rows, setRows] = useState<ProvisionRow[] | null>(null);
  const [notes, setNotes] = useState(client.notes);
  const [areaCode, setAreaCode] = useState("");
  const [msg, setMsg] = useState("");
  const progress = checklistProgress(client.checklist);

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setMsg("");
    const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) { setMsg(data.error || "Update failed"); return; }
    onUpdated(data.client);
  }

  async function setUpAll() {
    setBusy("setup");
    setMsg("");
    setRows(null);
    const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}/setup-all`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) { setMsg(data.error || "Setup failed"); return; }
    setRows((data.results || []).map((r: ProvisionRow) => ({ ...r, label: r.service })));
    onUpdated();
  }

  async function getNumber() {
    setBusy("phone");
    setMsg("");
    const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}/phone-number`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ areaCode }) });
    const data = await res.json().catch(() => ({}));
    setBusy("");
    setMsg(res.ok ? `AI number: ${data.phoneNumber}` : data.error || "Couldn't get a number");
    if (res.ok) onUpdated();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="stage" className="block text-xs text-text-muted uppercase tracking-wide mb-1">Stage</label>
          <select id="stage" value={client.stage} disabled={Boolean(busy)} onChange={(e) => patch({ stage: e.target.value as Stage }, "stage")} className="bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-accent">
            {ALL_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
        <button type="button" onClick={setUpAll} disabled={Boolean(busy)} className={`${btn} bg-accent text-accent-ink hover:bg-accent-light`}>
          {busy === "setup" ? "Setting up… (up to 2 min)" : "Set up all"}
        </button>
        {client.services["voice-agent"] && !client.phoneNumber && (
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="area" className="block text-xs text-text-muted uppercase tracking-wide mb-1">Area code</label>
              <input id="area" value={areaCode} onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))} placeholder="720" className="w-20 bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-accent" />
            </div>
            <button type="button" onClick={getNumber} disabled={Boolean(busy)} className={`${btn} border border-accent/40 text-accent hover:bg-accent/10`}>
              {busy === "phone" ? "Getting number…" : "Get phone number"}
            </button>
          </div>
        )}
        {client.phoneNumber && <p className="text-sm text-text-secondary">AI number: <span className="text-text-primary font-semibold">{client.phoneNumber}</span></p>}
      </div>
      {client.stage === "building" && <p className="text-xs text-text-muted">When everything works, set the stage to Review. The client gets an email asking them to approve.</p>}
      {msg && <p role="status" className="text-sm text-text-secondary">{msg}</p>}
      {rows && <ProvisionResults rows={rows} />}

      <section aria-labelledby="cl-h">
        <h3 id="cl-h" className="text-sm font-semibold text-text-primary mb-2">Checklist <span className="text-text-muted font-normal">({progress.done}/{progress.total})</span></h3>
        {client.checklist.length === 0 ? (
          <p className="text-sm text-text-muted">Run Set up all to generate the checklist.</p>
        ) : (
          <ul className="space-y-1.5">
            {client.checklist.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <input type="checkbox" checked={item.done} disabled={Boolean(busy)} onChange={(e) => patch({ checklistItem: { id: item.id, done: e.target.checked } }, "check")} className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
                  <span className={item.done ? "text-text-muted line-through" : "text-text-secondary"}>{item.label}</span>
                  {item.owner === "client" && <span className="text-[10px] uppercase tracking-wide text-accent">client</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notes-h">
        <h3 id="notes-h" className="text-sm font-semibold text-text-primary mb-2">Notes (private)</h3>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={5000} className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-accent" />
        <button type="button" onClick={() => patch({ notes }, "notes")} disabled={Boolean(busy) || notes === client.notes} className={`${btn} mt-2 border border-border text-text-secondary hover:text-text-primary`}>
          {busy === "notes" ? "Saving…" : "Save notes"}
        </button>
      </section>
    </div>
  );
}
```

Before writing, open `ProvisionResults.tsx` and confirm its exported component's prop name (expected `rows: ProvisionRow[]`); adjust the `<ProvisionResults ... />` call to match.

- [ ] **Step 4: Wire it into `ClientDetail.tsx`**
  - Props: add `onUpdated: (c?: Client) => void`.
  - Tabs: `["work", "services", "onboarding", "contact"]`, default `"work"`; render `<ClientWorkPanel client={client} onUpdated={onUpdated} />` for `work`.
  - Replace `handleShareLink` with: `navigator.clipboard.writeText(portalUrl(window.location.origin, client.portal_token)); alert("Private portal link copied!");` and rename the button to "Copy portal link"; hide it if `!client.portal_token`.
  - Delete the stale "Deploy via CLI" block (`python jontri.py ...`) from the services tab.
  - Onboarding tab: the new sign-ups store `onboarding.package`, `onboarding.details`, `onboarding.website`, `onboarding.submitted_at`; render `submitted_at`, `package`, `website`, and each non-empty `details` entry with `InfoRow`; keep showing the old fields when present (older clients). Treat `client.onboarding` as `Record<string, unknown>` and read fields defensively (`typeof x === "string"`).
  - Contact tab: also show `Contract accepted` (`client.contract...` is not in `DashboardClient`; skip — owner can see it in Supabase. Do not add fields beyond the interface).

- [ ] **Step 5: `src/app/dashboard/page.tsx`** — pass `onUpdated` to `ClientDetail`:

```tsx
onUpdated={async (updated) => {
  if (updated) setSelectedClient(updated);
  const res = await fetch("/api/clients");
  const data = await res.json().catch(() => ({ clients: [] }));
  setClients(data.clients || []);
  if (!updated && selectedClient) setSelectedClient((data.clients || []).find((c: Client) => c.slug === selectedClient.slug) || null);
}}
```

Update the `pendingServices` stat to count `kickoff`-stage clients instead: rename label usage only if StatsBar props allow; otherwise leave stats unchanged.

- [ ] **Step 6: Deploy modals show the private link** — in `QuickDeployModal.tsx` and `TierDeployModal.tsx`, wherever `/client/${slug}` / `/client/{result.slug}` is built, use the `portal_token` from the `/api/clients` POST response (`data.client.portal_token`) and `portalUrl(window.location.origin, token)`. Store the token in the existing `result` state next to `slug`. If no token came back, hide the link.

- [ ] **Step 7: Verify** — `npx tsc --noEmit && npm run lint && npm test`. `grep -rn "/client/" src --include=*.tsx | grep -v "src/app/client/"` → no matches. Sign in at `http://localhost:3000/sign-in`, open Clients, screenshot the list and the Work tab (2 rounds).

- [ ] **Step 8: Commit**

```bash
git add src/app/dashboard
git commit -m "Dashboard: clients by stage, work panel (Set up all, checklist, notes, phone), private links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: End-to-end check, owner preview, deploy

**Files:** none new (fixes only, if found).

- [ ] **Step 1: Full local run-through** (dev server, migration applied, `VAPI_API_KEY` present in `.env.local` if the owner wants the voice agent tested locally; otherwise expect `needs_setup` for voice):
  1. `/onboarding` → sign up as a test business "Jontri Test Co" with the owner's own email, package Tier 1. Expect success screen with portal link; owner + welcome emails arrive.
  2. Open the portal link → stage Kickoff, booking button, needs list, services "Setting up".
  3. Dashboard → client appears under **Kickoff** → Work → **Set up all** → chatbot active, voice active (or needs_setup without key), stage becomes Building, checklist generated.
  4. If the voice agent is active: **Get phone number** (area code 720) → number shown; portal shows "Call your AI receptionist".
  5. Tick "Add the chatbot code…" → portal needs item shows done.
  6. Set stage → Review → client email "ready for review" arrives → portal shows Approve → click Approve → stage Live; second click / refresh-and-click → 409 message; owner email arrives.
  7. `/client/jontri-test-co` → "Your portal has a new private link", no data.
  8. Delete the test client from the dashboard (Remove).
- [ ] **Step 2: Run everything** — `npm test && npx tsc --noEmit && npm run lint && npm run build`. All must pass; paste failures verbatim if any.
- [ ] **Step 3: Owner preview gate** — show the owner the screenshots of `/onboarding` (each step), `/p/<token>` (kickoff + review states) and the dashboard Work tab. List the Vercel env vars needed before deploy: `VAPI_API_KEY` (private), optional `OWNER_EMAIL`. **Wait for explicit approval.**
- [ ] **Step 4: Deploy** — after approval: `git push origin main`; watch the Vercel deployment until READY; then on production: `curl -s -o /dev/null -w "%{http_code}\n" https://jontri.com/onboarding` → 200, `https://jontri.com/p/short` → 404, `https://jontri.com/api/clients` → 401.

---

## Self-Review Notes

- Spec coverage (Phase 1): portal tokens + portal v2 → Tasks 1, 2, 5, 7; dashboard stages/checklist/Set up all/notes → Tasks 8, 9, 12; onboarding v2 + click-to-accept → Tasks 3, 10, 11; notifications (new sign-up, welcome, ready for review, approval/change request) → Tasks 4, 7, 9, 10; Vapi on Jontri's account + Get phone number → Tasks 6, 9, 12; old `/client/<slug>` stops showing data → Task 7. "Payment success/failure" emails are Phase 2 (Stripe). Monthly re-scan is Phase 3.
- `lifecycle.ts` has no imports (uses Web Crypto) because client components import its labels; `portal-view.ts`, `onboarding-intake.ts`, `terms.ts`, `lifecycle-emails.ts` and `dashboard-client.ts` likewise import nothing but types, so they are safe in both tests and the browser.
