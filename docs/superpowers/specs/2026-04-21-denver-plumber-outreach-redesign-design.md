# Denver Plumber Outreach Redesign — Design Spec

**Date:** 2026-04-21
**Owner:** Vincent Kalman / Jontri
**Status:** Draft, pending implementation plan

## Problem

The current Denver plumber outreach campaign has two problems that tank reply rates:

1. **The website template looks like a SaaS app, not a plumbing business.** The generated sites (see `clients/denver-plumbing/websites/`) use a dark slate-950 background, monochrome icons, no real photography, and a placeholder hero image filtered to near-black. A plumber evaluating "would I want this as my site?" sees a dark tech-company website and doesn't recognize their own business in it. When the site is screenshotted into the outreach MMS, it photographs as a near-black rectangle at thumbnail size — the preview image can't do any selling.

2. **The SMS copy reads as spam.** It sends from a 631 (Long Island, NY) area code to Denver plumbers — the universal "this is a scam" pattern. Copy uses classic cold-outreach phrases ("free redesign," "no strings attached," "swap it in this week"), and the only call to action is a click on an unbranded demo URL. Every element pattern-matches to the agency spam plumbers already ignore.

Email-first outreach isn't viable — the Google Maps scraper captures phone numbers but not emails, and enrichment is out of scope for this campaign.

## Goals

- Website preview screenshots that make a plumber actually want the site, even at phone-thumbnail size.
- An MMS sequence that doesn't pattern-match to spam, from a 631 number, without a local Denver number available.
- A pipeline that can regenerate all ~100 Denver plumber sites with per-business personalization (brand color, real photos from their Google Business Profile, specific review count).

## Non-Goals

- Email campaign — no emails in the scraped data; email channel is out of scope.
- Local phone number (303/720) — already tried, unavailable. Work around it in copy instead.
- Segmenting prospects by website-quality tier — send the same sequence to everyone this campaign.
- Multi-metro expansion — Denver only for this iteration. Dallas/Phoenix/etc. reuse the template and pipeline later.

## Strategy

Both the website template and the SMS campaign are redesigned in parallel, each solving for the others' weaknesses:

- The MMS image is the pitch. No click required. The screenshot of the generated site does the entire "is this worth my time?" work in 2 seconds.
- The site is redesigned to photograph well at phone-thumbnail size AND convert plumbing customers once the plumber adopts it.
- Copy leans on Vincent's real NY→Denver move to explain the 631 number honestly, and uses the review count + rating from the scraped CSV as the "I looked at YOUR business" signal.

## Design

### MMS Sequence (replaces `outreach-upgrade-sms.md`)

Three messages via GHL workflow, sent from the existing 631 number. All three include the MMS preview image attachment.

**Message 1 — Trigger: contact tag `send-upgrade-campaign` added; send at Tuesday 10:30 AM Denver time**

> Hi — I'm Vincent. Just moved to Denver from NY and started a small business helping local plumbers with their websites. Noticed {{BUSINESS_NAME}} has {{REVIEW_COUNT}} reviews at {{RATING}} stars in Denver — that's a serious reputation. Built you a version of your site that actually reflects it. Preview attached. Reply here if you want the live link.
>
> *[MMS image: 4:5 crop of the generated site's hero + trust bar]*

**Message 2 — Day 3**

> Hey — Vincent again. Just wanted to make sure the preview of {{BUSINESS_NAME}}'s site didn't get buried. No pressure either way — reply here if you'd like the live link.

**Message 3 — Day 7**

> Last note from me. If the website isn't your thing, all good. I'm around Denver if you ever want to chat about the site, AI answering missed calls, or anything else on the online-presence side: https://calendly.com/vincent-jontri/30min. Take care.

**Why each element works:**
- "Hi — I'm Vincent" — identifies a person, not a bot, in the first three words
- "Just moved to Denver from NY" — explains the 631 number honestly (Vincent actually moved)
- "Noticed {{BUSINESS_NAME}} has {{REVIEW_COUNT}} reviews at {{RATING}} stars" — proves you looked at their listing, flatters without hype
- "Built you a version" — past tense, gift framing, not a pitch
- "Preview attached" — value visible immediately, no click leap
- "Reply here if you want the live link" — opt-in, low friction
- Day 7 explicitly says "if it's not your thing, all good" — inverts spam dynamics; spammers never say that

### Website Template (replaces `clients/denver-plumbing/website-template.html`)

**Aesthetic: Premium/modern trades** — white-dominant, confident typography, photo-heavy, one bold brand color plus warm accent.

**Palette shift:**

| | Current (dark/tech) | New (premium trades) |
|---|---|---|
| Background | `#0f172a` slate-950 | `#FFFFFF` white + `#FAF8F5` warm off-white sections |
| Primary | `#3b9af6` tech-SaaS blue | Per-business (scraped from their existing site), fallback `#0B5FAE` deep plumber blue |
| Accent | `#d4915e` subtle copper | `#E85D3A` warm orange (fallback to `#1F2937` charcoal if primary is already warm) |
| Text | White on dark | `#111827` near-black on white |

**Typography:**
- Headings: Archivo Black or Inter Display ExtraBold — confident, sturdy, reads as "trades industry done right"
- Body: Inter 400/500
- Tight tracking on headings, generous line-height on body (per CLAUDE.md guardrails)

**Layout — 7 sections top-to-bottom:**

1. **Hero** — this is what photographs in the MMS. Left: business name (60–72px), tagline, review badge (⭐ {{RATING}} · {{REVIEW_COUNT}} reviews on Google), two CTAs (call + book). Right: hero photo (human-centric stock photo — plumber at work or with truck, not a pipe closeup). Phone in nav and hero. Subtle accent color shape behind hero photo for pop.

2. **Trust bar** — thin strip: `{{REVIEW_COUNT}} reviews` · `Licensed & insured` · `Same-day service` · `Upfront pricing`

3. **Services grid** — 6 cards, 2 rows of 3. Photo (not icon), service name, 1-line description, "Get a quote →" link. Services: Emergency, Drain Cleaning, Water Heaters, Sewer Lines, Leak Detection, Repipe/Remodel. Photos from curated Unsplash pool, deterministic per business.

4. **Recent Work** — 3–4 photos from their Google Business Profile. Fallback to 3 stock photos if scrape returns fewer than 3. Caption localized from address: "Recent work around Denver, Aurora, Westminster..."

5. **Why {{BUSINESS_NAME}}** — 4 trust pillars: `{{REVIEW_COUNT}}+ five-star reviews`, `Same-day response`, `Licensed & insured`, `No hidden fees`.

6. **Reviews** — 3 review cards. Card 1 uses the actual review snippet from the CSV. Cards 2 and 3 use stock-realistic review copy until more snippets are enriched.

7. **Final CTA / Contact** — "Ready to fix it?" headline, call + book CTAs, address, hours, service-area list.

**The hero alone must do 100% of the pitch work at 300px-wide MMS thumbnail size** — legible business name, star rating badge, human photo, orange CTA button.

### Pipeline Changes

**New: `extract-brand-color.js`**
- Takes business's website URL from CSV
- Loads page in Playwright headless Chromium
- Extracts most prominent non-neutral color from top ~800px (hero area)
- Returns `{ primary: "#hex", accent: "#hex" }`. Accent defaults to `#E85D3A` orange; swaps to `#1F2937` charcoal if primary is already warm (hue 0–50°)
- Falls back to `{ primary: "#0B5FAE", accent: "#E85D3A" }` if no website, scrape fails, or extracted color is out-of-range (too dark, too light, or too neutral)
- Writes result to `enriched-leads.json` per business

**New: `scrape-gbp-photos.js`**
- Visits Google Maps URL from CSV using Playwright
- Captures 3–5 photo URLs from the listing's "Photos" section (Google-hosted public URLs)
- Writes URLs to `enriched-leads.json` per business
- Returns null if fewer than 3 photos found; template's Recent Work section falls back to stock

**New: `templates/stock-photos.json`**
- ~15 curated Unsplash URLs, tagged by use:
  - `hero` (5) — human-centric plumber/trades photos
  - `service-emergency`, `service-drain`, `service-waterheater`, `service-sewer`, `service-leak`, `service-repipe` (1–2 each)
  - `recent-work-fallback` (3)
- Hero photo picked deterministically via hash of business name — consistent per business, varied across campaign

**New: `templates/website-template.html`** (replaces the existing one)
- Takes variables: `{{BUSINESS_NAME}}`, `{{PHONE}}`, `{{ADDRESS}}`, `{{SERVICE_AREA}}`, `{{REVIEW_COUNT}}`, `{{RATING}}`, `{{REVIEW_SNIPPET}}`, `{{PRIMARY_COLOR}}`, `{{ACCENT_COLOR}}`, `{{HERO_PHOTO_URL}}`, `{{SERVICE_PHOTOS[1-6]}}`, `{{RECENT_WORK_PHOTOS[1-4]}}`

**Extended: `screenshot.mjs`**
- Add flag/option for a 4:5 aspect crop (1080×1350) of hero + trust bar only (not full page)
- Used to produce the MMS preview PNG per business

**Updated: `generate-websites.js`**
- New per-business flow: read CSV → extract brand color → scrape GBP photos → hash-pick hero photo → pick service photos → render template → save site → generate MMS preview → upload preview, store URL in `enriched-leads.json`

**New: `clients/denver-plumbing/mms-previews/{{slug}}.png`**
- One preview per business. Deployed to a public URL so GHL's MMS attachment step can pull it via `{{contact.mms_preview_url}}`.

### Rollout

1. Build the new template and pipeline on Spartan Plumbing first (already has a screenshot baseline for comparison). Iterate until the MMS preview image looks compelling on my own phone.
2. Once Spartan is approved, regenerate all ~100 plumbers from the CSV.
3. Scrap the existing 10 sites in `clients/denver-plumbing/websites/` — they're the old dark template.
4. Scrap `clients/denver-plumbing/outreach-email.html` — no emails available, no email campaign.
5. Replace `clients/denver-plumbing/outreach-upgrade-sms.md` with the new 3-message sequence (same GHL workflow structure, new copy + MMS attachments).
6. Update `ghl-contacts-import.csv` to include the `mms_preview_url` field per contact.

## Open Questions / Out of Scope

- Email enrichment via Clay/Apollo/etc. could unlock an email-first channel later. Not this campaign.
- Segmenting by Google Business Profile quality (has booking URL / review count / sponsored) could refine targeting. Out of scope for this redesign.
- No-website segment (~10% of CSV) currently gets the same pitch as has-website. A separate "I noticed you don't have a site — I built you one" variant may convert better. Out of scope for this iteration.
- Review snippets for cards 2 and 3 of the Reviews section are currently stock. A future enrichment step could scrape 2–3 more real reviews per business from Google Maps.

## Success Criteria

- MMS preview image is legible and compelling at phone-thumbnail size (business name visible, star rating visible, one clear human photo, one bold CTA). Confirmed by sending the MMS to my own phone before any blast.
- Full Spartan Plumbing site regenerated with the new template renders correctly with real CSV data, scraped color, and scraped GBP photos.
- Pipeline can regenerate all ~100 plumbers from the CSV without manual intervention.
- MMS sequence sends correctly via existing GHL workflow with the new image attachment.
