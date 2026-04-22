# Denver Plumber Outreach — MMS Campaign

## Context
This replaces the earlier "upgrade" and "no-website" email/SMS sequences. Cold outreach is MMS-only because the Google Maps scraper doesn't yield emails. The 631 number is acknowledged honestly via the opener ("just moved to Denver from NY").

## GHL Workflow Setup

**Name:** Denver Plumber MMS Outreach
**Trigger:** Contact Tag → `send-mms-outreach` → Tag Added
**Wait:** Specific Date/Time → Tuesday April 21, 2026 at 10:30 AM (Denver time)

## Message 1 — Initial (sends on trigger)

**Action:** Send MMS
**Attachment:** `{{contact.mms_preview_url}}` (PNG, 1080x1350)
**Body:**
```
Hi — I'm Vincent. Just moved to Denver from NY and started a small business helping local plumbers with their websites. Noticed {{contact.company_name}} has {{contact.review_count}} reviews at {{contact.google_rating}} stars in Denver — that's a serious reputation. Built you a version of your site that actually reflects it. Preview attached. Reply here if you want the live link.
```

## Message 2 — Day 3 (soft nudge)

**Wait:** 3 days after Message 1
**Action:** Send SMS (no attachment)
**Body:**
```
Hey — Vincent again. Just wanted to make sure the preview of {{contact.company_name}}'s site didn't get buried. No pressure either way — reply here if you'd like the live link.
```

## Message 3 — Day 7 (sign-off)

**Wait:** 4 days after Message 2
**Action:** Send SMS (no attachment)
**Body:**
```
Last note from me. If the website isn't your thing, all good. I'm around Denver if you ever want to chat about the site, AI answering missed calls, or anything else on the online-presence side: https://calendly.com/vincent-jontri/30min. Take care.
```

## Required Custom Fields in GHL

Before importing contacts, create these custom fields under Settings → Custom Fields:

- `mms_preview_url` (URL) — attached to Message 1
- `review_count` (Number)
- `google_rating` (Number)
- `demo_site_url` (URL) — sent after reply as the live link

## Tags Reference
- `denver-plumber` — all Denver plumber leads
- `outreach-apr-2026` — April 2026 campaign
- `send-mms-outreach` — triggers this workflow

## Deprecated
- Earlier "upgrade" and "no-website" SMS variants are replaced by this single sequence.
- Email campaign is removed; no emails are available from the Google Maps scrape.
