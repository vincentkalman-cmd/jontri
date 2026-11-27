# Client lifecycle: sign-up → build → review → live

**Status:** draft for approval · 2026-11-27
**Decisions made:** voice agents live in Jontri's Vapi account · Stripe subscription at sign-up · private portal link (no login) · click-to-accept contract

## The journey

| Stage | Client | System | Owner (Vince) |
|---|---|---|---|
| 1. Sign up | Fills `/onboarding`: business info → package → setup details → accept terms → pay | Creates client, private portal link, stores everything needed for setup; emails Vince + welcome email to client | — |
| 2. Kickoff | Books kickoff call from the welcome email/portal | Portal stage = **Kickoff** | Reviews client in dashboard, clicks **Set up all** |
| 3. Building | Sees progress in portal; completes "What we need from you" items | Auto-services provision (chatbot, SEO audit, AI-search, voice agent + phone number); manual services get a checklist | Works the per-client checklist (phone forwarding, review links, workflows) |
| 4. Review | Tests chatbot + calls AI number from portal, clicks **Approve** (or leaves a note) | Emails Vince; stage = **Live** on approve | Fixes anything flagged |
| 5. Live | Portal shows status, scores, monthly report | Monthly re-scan of SEO / AI-search scores | Monthly tuning, strategy calls (Tier 3) |

## Components

### 1. Onboarding v2 (`/onboarding`)
Steps: **Business** (name, contact, phone, website, industry) → **Package** (Tier 1/2 with price, Tier 3 = "book a call") → **Setup details** (only fields the chosen services need: hours, services offered, booking link, transfer number, lead email, brand color, Google Business link) → **Review & accept** (summary, terms, typed full name + "I agree" checkbox; store name, timestamp, IP) → **Pay** (Stripe Checkout) → **Success** page with portal link.
Tier 3 / à la carte: skip payment, mark "awaiting proposal", notify Vince.

### 2. Payments (Stripe)
- Checkout Session in `subscription` mode, one recurring Price per package (env `STRIPE_PRICE_TIER1`, `STRIPE_PRICE_TIER2`).
- Webhook `/api/stripe/webhook` (signature-verified):
  - `checkout.session.completed` → client `billing_status=active`, stage → Kickoff, send emails
  - `invoice.payment_failed` → `billing_status=past_due`, email Vince
  - `customer.subscription.deleted` → `billing_status=canceled`, stage → Paused
- Build and test in Stripe **test mode** first.

### 3. Private portal link
- New column `clients.portal_token` (random, 16+ chars). Portal URL: `jontri.com/p/<token>`.
- Old `/client/<slug>` URLs stop showing data (redirect to a "use your private link" page).

### 4. Portal v2
- Stage timeline (Signed up → Kickoff → Building → Review → Live).
- Service cards: status + what's done; chatbot "Try it" (live widget), voice agent "Call your AI" (phone number), SEO/AI-search scores.
- "What we need from you" list (e.g. add embed code to site, forward phone line, Google Business access).
- **Approve** / **Request changes** buttons → email Vince, update stage.

### 5. Dashboard
- Clients grouped by stage (Kickoff queue at top).
- Client page: **Set up all** (runs provisioning for every service with stored onboarding data), stage control, per-client checklist generated from service templates (check off manual tasks; progress shows in portal), notes.

### 6. Voice agents on Jontri's Vapi account
- Server env `VAPI_API_KEY` (private, Vercel only). Provisioning uses it by default; per-client key remains an override.
- **Get phone number** action: buy/attach a Vapi number to the client's assistant (verify API + pricing during build).
- Homepage "Talk to our AI": `NEXT_PUBLIC_VAPI_PUBLIC_KEY` + `NEXT_PUBLIC_VAPI_DEMO_ASSISTANT_ID`.

### 7. Notifications (Zoho SMTP, existing)
New sign-up → Vince · Payment success/failure → Vince · Welcome (portal link, kickoff booking link, what we need) → client · Stage changes / Ready for review → client · Approval / change request → Vince.

## Data changes (Supabase migration, run by owner)
`clients`: `portal_token text unique`, `stage text default 'signed_up'`, `billing_status text`, `stripe_customer_id text`, `stripe_subscription_id text`, `contract_accepted_name text`, `contract_accepted_at timestamptz`, `contract_accepted_ip text`, `checklist jsonb default '[]'`, `notes text`.

## Build phases
1. **Core flow (no Stripe yet):** portal tokens + portal v2, dashboard stages/checklist/Set up all, onboarding v2 with click-to-accept, notifications, Vapi on Jontri's account.
2. **Payments:** Stripe Checkout + webhook (test mode → live).
3. **Test run:** Haul Hero Auto Transport (haulheroautotransport.com) through the whole flow in Stripe test mode; fix what we find. Then monthly re-scan job.

## What the owner provides
- Vercel env: `VAPI_API_KEY` (private), `NEXT_PUBLIC_VAPI_PUBLIC_KEY`, `NEXT_PUBLIC_VAPI_DEMO_ASSISTANT_ID`
- Stripe (phase 2): account, two recurring Prices (Tier 1 $1,500/mo, Tier 2 $3,000/mo), `STRIPE_SECRET_KEY`, later `STRIPE_WEBHOOK_SECRET`
- Run the Supabase migration SQL (applying migrations from here is blocked)
- Contract/terms wording you're comfortable with (current Word template is the starting point)

## Out of scope (for now)
Client logins/magic links, call recordings/lead lists in portal, à la carte self-checkout, automated monthly PDF reports.
