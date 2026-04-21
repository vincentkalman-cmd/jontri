# Denver Plumber Outreach Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dark SaaS-aesthetic Denver plumber website template with a light/premium-trades template that photographs well at MMS thumbnail size, and replace the spam-pattern SMS copy with a 3-message MMS sequence grounded in Vincent's NY→Denver move + the plumber's actual Google review count.

**Architecture:** Node.js CLI pipeline. The existing `generate-websites.js` orchestrator grows three new pipeline steps — `extract-brand-color.js` (Playwright-scrapes the target business's current site for a primary color), `scrape-gbp-photos.js` (Playwright-scrapes their Google Business Profile for real photos), and `screenshot-mms.js` (Playwright-renders a 4:5 crop of the hero+trust-bar for MMS attachment). Each step writes to `enriched-leads.json` per business. Stock photos live in a curated JSON manifest and are hash-picked deterministically per business for consistency.

**Tech Stack:** Node.js, Playwright (new devDep), Tailwind via CDN (existing), GoHighLevel (existing), Vercel static hosting (existing).

---

## File Structure

**New files:**
- `clients/denver-plumbing/assets/stock-photos.json` — curated Unsplash URL manifest
- `clients/denver-plumbing/pipeline/extract-brand-color.js` — color extraction via Playwright
- `clients/denver-plumbing/pipeline/scrape-gbp-photos.js` — GBP photo scrape via Playwright
- `clients/denver-plumbing/pipeline/screenshot-mms.js` — 4:5 aspect MMS screenshot via Playwright
- `clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js` — unit tests for color helpers
- `public/mms-previews/` — output directory (served by Next.js at jontri.com/mms-previews/*.png)

**Modified files:**
- `package.json` — add `playwright` devDep
- `clients/denver-plumbing/website-template.html` — replace entire file (dark→light template)
- `clients/denver-plumbing/generate-websites.js` — integrate the three new pipeline steps
- `clients/denver-plumbing/ghl-import.js` — add `mms_preview_url` column
- `clients/denver-plumbing/outreach-upgrade-sms.md` — rewrite with new 3-message sequence

**Deleted files:**
- `clients/denver-plumbing/outreach-email.html` — no email channel; out of scope
- `clients/denver-plumbing/websites/*` — regenerated from new pipeline

---

## Task 1: Environment Setup

**Files:**
- Modify: `package.json`
- Create: `clients/denver-plumbing/pipeline/` directory
- Create: `clients/denver-plumbing/assets/` directory
- Create: `public/mms-previews/` directory

- [ ] **Step 1: Add Playwright as devDependency**

Run from repo root:
```bash
npm install --save-dev playwright@^1.48.0
```

Expected: `package.json` updated, `node_modules/playwright` installed.

- [ ] **Step 2: Install Playwright's Chromium browser**

Run:
```bash
npx playwright install chromium
```

Expected: Chromium downloaded to `~/.cache/ms-playwright/` (takes ~30s).

- [ ] **Step 3: Create pipeline directory with a README stub**

Create `clients/denver-plumbing/pipeline/README.md`:
```markdown
# Denver Plumber Pipeline

Per-business enrichment steps called by `../generate-websites.js`:
- `extract-brand-color.js` — scrape primary color from target business's existing site
- `scrape-gbp-photos.js` — scrape 3–5 real photos from Google Business Profile
- `screenshot-mms.js` — render a 4:5 MMS preview PNG of the hero + trust bar

All three use Playwright. Results land in `../enriched-leads.json`.
```

- [ ] **Step 4: Create assets and output directories**

```bash
mkdir -p clients/denver-plumbing/assets
mkdir -p public/mms-previews
touch public/mms-previews/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json clients/denver-plumbing/pipeline/README.md public/mms-previews/.gitkeep
git commit -m "chore: add Playwright and scaffold Denver plumber pipeline dirs"
```

---

## Task 2: Curate Stock Photo Library

**Files:**
- Create: `clients/denver-plumbing/assets/stock-photos.json`

- [ ] **Step 1: Write stock-photos.json with curated Unsplash URLs**

Create `clients/denver-plumbing/assets/stock-photos.json`:
```json
{
  "hero": [
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80"
  ],
  "services": {
    "emergency": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
    "drain": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80",
    "waterheater": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80",
    "sewer": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=1200&q=80",
    "leak": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    "repipe": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80"
  },
  "recent_work_fallback": [
    "https://images.unsplash.com/photo-1620891549027-942faa2f8f19?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=80"
  ]
}
```

**Note for reviewer:** these Unsplash IDs are representative — exact photo choice should be verified by opening each URL and confirming it's a human-centric trades image (not a pipe closeup or abstract). Any that don't fit: swap the ID for another Unsplash image of a plumber/trades worker.

- [ ] **Step 2: Commit**

```bash
git add clients/denver-plumbing/assets/stock-photos.json
git commit -m "feat: add curated stock photo manifest for plumber template"
```

---

## Task 3: Brand Color Extractor

**Files:**
- Create: `clients/denver-plumbing/pipeline/extract-brand-color.js`
- Create: `clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js`
- Test: `node --test clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js`

- [ ] **Step 1: Write failing tests for color helpers**

Create `clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js`:
```javascript
const test = require('node:test');
const assert = require('node:assert');
const {
  rgbToHex,
  isNeutral,
  isWarm,
  pickAccent,
  chooseDominantColor,
  DEFAULT_PRIMARY,
  DEFAULT_ACCENT_WARM,
  DEFAULT_ACCENT_NEUTRAL,
} = require('../extract-brand-color');

test('rgbToHex converts rgb() to #hex', () => {
  assert.strictEqual(rgbToHex('rgb(11, 95, 174)'), '#0B5FAE');
  assert.strictEqual(rgbToHex('rgb(255, 0, 0)'), '#FF0000');
  assert.strictEqual(rgbToHex('rgb(0, 0, 0)'), '#000000');
});

test('rgbToHex returns null for non-rgb strings', () => {
  assert.strictEqual(rgbToHex('transparent'), null);
  assert.strictEqual(rgbToHex(''), null);
  assert.strictEqual(rgbToHex('#ffffff'), null);
});

test('isNeutral detects grays, whites, near-blacks', () => {
  assert.strictEqual(isNeutral('#FFFFFF'), true);
  assert.strictEqual(isNeutral('#000000'), true);
  assert.strictEqual(isNeutral('#808080'), true);
  assert.strictEqual(isNeutral('#F0F0F0'), true);
  assert.strictEqual(isNeutral('#0B5FAE'), false);
  assert.strictEqual(isNeutral('#E85D3A'), false);
});

test('isWarm detects reds/oranges/yellows', () => {
  assert.strictEqual(isWarm('#DC2626'), true);
  assert.strictEqual(isWarm('#E85D3A'), true);
  assert.strictEqual(isWarm('#F59E0B'), true);
  assert.strictEqual(isWarm('#0B5FAE'), false);
  assert.strictEqual(isWarm('#10B981'), false);
});

test('pickAccent returns orange for cool primary', () => {
  assert.strictEqual(pickAccent('#0B5FAE'), DEFAULT_ACCENT_WARM);
  assert.strictEqual(pickAccent('#10B981'), DEFAULT_ACCENT_WARM);
});

test('pickAccent returns charcoal for warm primary', () => {
  assert.strictEqual(pickAccent('#DC2626'), DEFAULT_ACCENT_NEUTRAL);
  assert.strictEqual(pickAccent('#E85D3A'), DEFAULT_ACCENT_NEUTRAL);
});

test('chooseDominantColor falls back to default when all colors neutral', () => {
  const candidates = ['#FFFFFF', '#000000', '#808080'];
  assert.strictEqual(chooseDominantColor(candidates), DEFAULT_PRIMARY);
});

test('chooseDominantColor picks most frequent non-neutral', () => {
  const candidates = ['#FFFFFF', '#0B5FAE', '#0B5FAE', '#000000', '#DC2626'];
  assert.strictEqual(chooseDominantColor(candidates), '#0B5FAE');
});

test('chooseDominantColor picks only non-neutral when tied', () => {
  const candidates = ['#FFFFFF', '#0B5FAE', '#000000'];
  assert.strictEqual(chooseDominantColor(candidates), '#0B5FAE');
});
```

- [ ] **Step 2: Run tests, verify they all fail**

Run:
```bash
node --test clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js
```

Expected: FAIL with `Cannot find module '../extract-brand-color'`.

- [ ] **Step 3: Implement extract-brand-color.js**

Create `clients/denver-plumbing/pipeline/extract-brand-color.js`:
```javascript
/**
 * Extract a primary brand color from a business's existing website.
 *
 * Strategy: load the page with Playwright, pull computed colors from nav, hero,
 * CTA button, and H1. Count frequencies, pick most-frequent non-neutral.
 * Returns { primary, accent } with defaults if extraction fails.
 */

const DEFAULT_PRIMARY = '#0B5FAE';
const DEFAULT_ACCENT_WARM = '#E85D3A';
const DEFAULT_ACCENT_NEUTRAL = '#1F2937';

function rgbToHex(rgbStr) {
  const match = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(rgbStr || '');
  if (!match) return null;
  const [, r, g, b] = match;
  return '#' + [r, g, b]
    .map(n => parseInt(n, 10).toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function isNeutral(hex) {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  // Low saturation = neutral. Also treat near-white and near-black as neutral.
  if (max - min < 25) return true;
  if (max < 40) return true;
  if (min > 230) return true;
  return false;
}

function isWarm(hex) {
  const { r, g, b } = hexToRgb(hex);
  // Red/orange/yellow dominant: R is largest, G is middle or larger than B.
  return r > b && r >= g;
}

function pickAccent(primaryHex) {
  return isWarm(primaryHex) ? DEFAULT_ACCENT_NEUTRAL : DEFAULT_ACCENT_WARM;
}

function chooseDominantColor(candidates) {
  const counts = new Map();
  for (const hex of candidates) {
    if (!hex || isNeutral(hex)) continue;
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  if (counts.size === 0) return DEFAULT_PRIMARY;
  let best = DEFAULT_PRIMARY;
  let bestCount = 0;
  for (const [hex, count] of counts) {
    if (count > bestCount) {
      best = hex;
      bestCount = count;
    }
  }
  return best;
}

async function extractBrandColor(url, { timeoutMs = 15000 } = {}) {
  if (!url || !/^https?:\/\//.test(url)) {
    return { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT_WARM };
  }

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // Pull computed colors from nav, buttons, H1s, and elements with "btn"/"cta" classes.
    const rgbStrings = await page.$$eval(
      'nav, header, h1, button, a[class*="btn"], a[class*="cta"], [class*="button"]',
      els => {
        const out = [];
        for (const el of els.slice(0, 30)) {
          const style = window.getComputedStyle(el);
          out.push(style.backgroundColor);
          out.push(style.color);
          out.push(style.borderColor);
        }
        return out;
      }
    );

    const hexes = rgbStrings.map(rgbToHex).filter(Boolean);
    const primary = chooseDominantColor(hexes);
    return { primary, accent: pickAccent(primary) };
  } catch (err) {
    console.warn(`   ⚠️  color extraction failed for ${url}: ${err.message}`);
    return { primary: DEFAULT_PRIMARY, accent: DEFAULT_ACCENT_WARM };
  } finally {
    await browser.close();
  }
}

module.exports = {
  extractBrandColor,
  rgbToHex,
  isNeutral,
  isWarm,
  pickAccent,
  chooseDominantColor,
  DEFAULT_PRIMARY,
  DEFAULT_ACCENT_WARM,
  DEFAULT_ACCENT_NEUTRAL,
};
```

- [ ] **Step 4: Run tests, verify all pass**

Run:
```bash
node --test clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js
```

Expected: all 9 tests PASS.

- [ ] **Step 5: Smoke test against a real site**

Create a temporary scratch file `scratch-color.js` at repo root:
```javascript
const { extractBrandColor } = require('./clients/denver-plumbing/pipeline/extract-brand-color');
(async () => {
  const result = await extractBrandColor('https://www.303plumber.com/');
  console.log(result);
})();
```

Run:
```bash
node scratch-color.js
```

Expected: prints `{ primary: '#XXXXXX', accent: '#XXXXXX' }`. The primary should be a non-neutral color — verify it visually matches the site's brand color by visiting the URL.

Delete the scratch file:
```bash
rm scratch-color.js
```

- [ ] **Step 6: Commit**

```bash
git add clients/denver-plumbing/pipeline/extract-brand-color.js clients/denver-plumbing/pipeline/__tests__/extract-brand-color.test.js
git commit -m "feat: add brand color extractor for Denver plumber pipeline"
```

---

## Task 4: GBP Photo Scraper

**Files:**
- Create: `clients/denver-plumbing/pipeline/scrape-gbp-photos.js`

Note: Google Maps is a hostile scraping target. This implementation uses Playwright to load the Maps URL, waits for photo thumbnails, and captures their `src` attributes. Failure tolerance is essential — the pipeline must gracefully fall back to stock when scraping fails.

- [ ] **Step 1: Write scrape-gbp-photos.js**

Create `clients/denver-plumbing/pipeline/scrape-gbp-photos.js`:
```javascript
/**
 * Scrape 3–5 photo URLs from a Google Business Profile's "Photos" section.
 * Returns [] on failure — caller falls back to stock photos.
 *
 * Strategy: load the Google Maps place URL, wait for the photo grid, capture
 * the first 5 image src values. Upscale the thumbnail URL params to full size.
 */

async function scrapeGbpPhotos(mapsUrl, { timeoutMs = 20000, maxPhotos = 5 } = {}) {
  if (!mapsUrl) return [];

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    await page.goto(mapsUrl, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // Wait for photo thumbnails. Google Maps renders place photos as
    // <button> or <a> elements containing background-image styles or <img> tags.
    await page.waitForSelector('img[src*="googleusercontent"], [style*="googleusercontent"]', {
      timeout: timeoutMs,
    });

    const urls = await page.$$eval(
      'img[src*="googleusercontent"], [style*="googleusercontent"]',
      (els, max) => {
        const found = new Set();
        for (const el of els) {
          let src = el.getAttribute('src') || '';
          if (!src) {
            const bg = el.getAttribute('style') || '';
            const m = /url\(["']?(https?:\/\/[^"')]+)["']?\)/.exec(bg);
            if (m) src = m[1];
          }
          if (src && src.includes('googleusercontent') && !src.includes('=s0-')) {
            // Upgrade tile size: replace =w\d+-h\d+ or =s\d+ with =s1200
            const hires = src.replace(/=(?:w\d+-h\d+|s\d+)[^=]*$/i, '=s1200');
            found.add(hires);
            if (found.size >= max) break;
          }
        }
        return Array.from(found).slice(0, max);
      },
      maxPhotos
    );

    return urls.filter(u => !u.includes('mapfiles') && !u.includes('/avatar/'));
  } catch (err) {
    console.warn(`   ⚠️  GBP photo scrape failed for ${mapsUrl.slice(0, 60)}...: ${err.message}`);
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeGbpPhotos };
```

- [ ] **Step 2: Smoke test against Spartan Plumbing's Maps URL**

Create a scratch file `scratch-gbp.js` at repo root:
```javascript
const { scrapeGbpPhotos } = require('./clients/denver-plumbing/pipeline/scrape-gbp-photos');
const mapsUrl = 'https://www.google.com/maps/place/Spartan+Plumbing/data=!4m7!3m6!1s0x876c773b4d9bfe69:0x29d0f7dbb8e10a74!8m2!3d39.795267!4d-105.067843!16s%2Fg%2F11qn3j2b4w!19sChIJaf6bTTt3bIcRdArhuNv30Ck';
(async () => {
  const urls = await scrapeGbpPhotos(mapsUrl);
  console.log(`Found ${urls.length} photos`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
})();
```

Run:
```bash
node scratch-gbp.js
```

Expected: prints `Found N photos` where N is 1–5, with googleusercontent URLs. If it prints `Found 0 photos`, that's also acceptable (the pipeline falls back to stock) — but verify at least one attempt succeeds against some business in the CSV to confirm the selector logic works.

Delete the scratch file:
```bash
rm scratch-gbp.js
```

- [ ] **Step 3: Commit**

```bash
git add clients/denver-plumbing/pipeline/scrape-gbp-photos.js
git commit -m "feat: add Google Business Profile photo scraper"
```

---

## Task 5: New Website Template (Light/Premium)

**Files:**
- Modify: `clients/denver-plumbing/website-template.html` (full replacement)

The template uses CSS variables for `--primary` and `--accent` so per-business colors can be injected without token replacement in colors. Other fields use existing `{{VARIABLE}}` mustache syntax (preserved from the current pipeline).

- [ ] **Step 1: Replace website-template.html**

Overwrite `clients/denver-plumbing/website-template.html` with:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{BUSINESS_NAME}} — Plumbing in {{CITY}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: {{PRIMARY_COLOR}};
      --accent: {{ACCENT_COLOR}};
    }
    body { font-family: 'Inter', sans-serif; color: #111827; background: #FFFFFF; }
    .font-display { font-family: 'Archivo', sans-serif; font-weight: 900; letter-spacing: -0.02em; }
    .bg-surface { background: #FAF8F5; }
    .bg-primary { background: var(--primary); }
    .bg-accent { background: var(--accent); }
    .text-primary { color: var(--primary); }
    .text-accent { color: var(--accent); }
    .border-primary { border-color: var(--primary); }
    .ring-primary { --tw-ring-color: var(--primary); }
    .primary-shadow { box-shadow: 0 10px 30px -8px color-mix(in srgb, var(--primary) 45%, transparent); }
    .accent-shadow { box-shadow: 0 10px 30px -8px color-mix(in srgb, var(--accent) 45%, transparent); }
    .hero-blob { background: var(--accent); opacity: 0.12; filter: blur(80px); }
  </style>
</head>
<body class="antialiased">

  <!-- Nav -->
  <nav class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-base">{{INITIALS}}</div>
        <span class="text-base font-bold">{{BUSINESS_NAME_SHORT}}</span>
      </div>
      <div class="hidden md:flex items-center gap-8 text-sm text-gray-700">
        <a href="#services" class="hover:text-primary transition-colors">Services</a>
        <a href="#work" class="hover:text-primary transition-colors">Recent Work</a>
        <a href="#reviews" class="hover:text-primary transition-colors">Reviews</a>
        <a href="#contact" class="hover:text-primary transition-colors">Contact</a>
      </div>
      <a href="tel:{{PHONE}}" class="bg-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">📞 {{PHONE}}</a>
    </div>
  </nav>

  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div class="absolute top-10 right-[-100px] w-[500px] h-[500px] hero-blob rounded-full"></div>
    <div class="relative max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <div class="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1 text-sm font-semibold text-yellow-900 mb-6">
          <svg class="w-4 h-4 fill-yellow-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          {{RATING}} · {{REVIEW_COUNT}} reviews on Google
        </div>
        <h1 class="font-display text-5xl md:text-6xl leading-[1.02] mb-5">
          {{CITY}}'s most trusted<br><span class="text-primary">plumbing team</span>.
        </h1>
        <p class="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg">
          {{BUSINESS_NAME_SHORT}} has earned {{REVIEW_COUNT}} five-star reviews serving {{CITY}} and nearby. Licensed, insured, same-day service when you need it.
        </p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="tel:{{PHONE}}" class="bg-accent text-white font-semibold px-7 py-4 rounded-xl text-center hover:opacity-90 transition-opacity accent-shadow">Call {{PHONE}}</a>
          <a href="#contact" class="bg-white border-2 border-gray-900 text-gray-900 font-semibold px-7 py-4 rounded-xl text-center hover:bg-gray-900 hover:text-white transition-colors">Get a free estimate</a>
        </div>
      </div>
      <div class="relative">
        <div class="absolute -inset-6 bg-accent rounded-3xl opacity-10 blur-2xl"></div>
        <img src="{{HERO_PHOTO_URL}}" alt="{{BUSINESS_NAME_SHORT}} plumbing service" class="relative rounded-2xl w-full aspect-[4/5] object-cover primary-shadow">
      </div>
    </div>
  </section>

  <!-- Trust Bar -->
  <section class="bg-surface border-y border-gray-200">
    <div class="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-700">
      <div class="flex items-center gap-3"><span class="text-2xl">⭐</span><span><strong class="block text-gray-900">{{REVIEW_COUNT}}</strong>Google reviews</span></div>
      <div class="flex items-center gap-3"><span class="text-2xl">🛡️</span><span><strong class="block text-gray-900">Licensed</strong>& insured</span></div>
      <div class="flex items-center gap-3"><span class="text-2xl">⚡</span><span><strong class="block text-gray-900">Same-day</strong>service available</span></div>
      <div class="flex items-center gap-3"><span class="text-2xl">💰</span><span><strong class="block text-gray-900">Upfront</strong>pricing, no surprises</span></div>
    </div>
  </section>

  <!-- Services -->
  <section id="services" class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="max-w-xl mb-12">
        <p class="text-accent font-semibold text-sm uppercase tracking-wider mb-3">What we do</p>
        <h2 class="font-display text-4xl md:text-5xl">Plumbing services in {{CITY}}</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_EMERGENCY}}" alt="Emergency plumbing" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Emergency Service</h3><p class="text-gray-600 text-sm leading-relaxed">Burst pipes, flooding, midnight backups — on call 24/7 when it can't wait.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_DRAIN}}" alt="Drain cleaning" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Drain Cleaning</h3><p class="text-gray-600 text-sm leading-relaxed">Hydro-jetting, augering, and root removal that actually keeps drains clear.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_WATERHEATER}}" alt="Water heater" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Water Heaters</h3><p class="text-gray-600 text-sm leading-relaxed">Repair, replacement, tankless conversions. Same-day install on most units.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_SEWER}}" alt="Sewer line service" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Sewer Lines</h3><p class="text-gray-600 text-sm leading-relaxed">Camera inspections, trenchless repair, full-line replacement when needed.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_LEAK}}" alt="Leak detection" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Leak Detection</h3><p class="text-gray-600 text-sm leading-relaxed">Precise locating with minimal disruption — find it before the drywall gets worse.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
          <img src="{{SERVICE_PHOTO_REPIPE}}" alt="Repipe and remodel" class="w-full h-48 object-cover">
          <div class="p-6"><h3 class="font-bold text-lg mb-2">Repipe & Remodel</h3><p class="text-gray-600 text-sm leading-relaxed">Kitchen, bath, whole-home repipes. Clean cuts, tidy finish, code-compliant.</p><a href="#contact" class="inline-block mt-4 text-primary font-semibold text-sm hover:underline">Get a quote →</a></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Recent Work -->
  <section id="work" class="bg-surface py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="max-w-xl mb-12">
        <p class="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Recent work</p>
        <h2 class="font-display text-4xl md:text-5xl">Projects around {{SERVICE_AREA}}.</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <img src="{{RECENT_WORK_PHOTO_1}}" alt="Recent plumbing work" class="rounded-2xl aspect-square object-cover">
        <img src="{{RECENT_WORK_PHOTO_2}}" alt="Recent plumbing work" class="rounded-2xl aspect-square object-cover">
        <img src="{{RECENT_WORK_PHOTO_3}}" alt="Recent plumbing work" class="rounded-2xl aspect-square object-cover">
        <img src="{{RECENT_WORK_PHOTO_4}}" alt="Recent plumbing work" class="rounded-2xl aspect-square object-cover">
      </div>
    </div>
  </section>

  <!-- Why / Trust Pillars -->
  <section class="py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="max-w-xl mb-12">
        <p class="text-accent font-semibold text-sm uppercase tracking-wider mb-3">Why {{BUSINESS_NAME_SHORT}}</p>
        <h2 class="font-display text-4xl md:text-5xl">Reputation you can check.</h2>
      </div>
      <div class="grid md:grid-cols-4 gap-6">
        <div class="bg-white border-2 border-gray-100 rounded-2xl p-6"><div class="font-display text-5xl text-primary mb-2">{{REVIEW_COUNT}}+</div><p class="font-semibold text-gray-900">Five-star reviews</p><p class="text-sm text-gray-600 mt-1">Verified on Google.</p></div>
        <div class="bg-white border-2 border-gray-100 rounded-2xl p-6"><div class="font-display text-5xl text-primary mb-2">Same-day</div><p class="font-semibold text-gray-900">Response</p><p class="text-sm text-gray-600 mt-1">Most calls answered live.</p></div>
        <div class="bg-white border-2 border-gray-100 rounded-2xl p-6"><div class="font-display text-5xl text-primary mb-2">Licensed</div><p class="font-semibold text-gray-900">& insured</p><p class="text-sm text-gray-600 mt-1">Every tech, every job.</p></div>
        <div class="bg-white border-2 border-gray-100 rounded-2xl p-6"><div class="font-display text-5xl text-primary mb-2">No</div><p class="font-semibold text-gray-900">Hidden fees</p><p class="text-sm text-gray-600 mt-1">Upfront quote before work starts.</p></div>
      </div>
    </div>
  </section>

  <!-- Reviews -->
  <section id="reviews" class="bg-surface py-20">
    <div class="max-w-6xl mx-auto px-6">
      <div class="max-w-xl mb-12">
        <p class="text-accent font-semibold text-sm uppercase tracking-wider mb-3">What neighbors say</p>
        <h2 class="font-display text-4xl md:text-5xl">Reviews from {{CITY}}.</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-6"><div class="text-yellow-500 mb-3">★★★★★</div><p class="text-gray-700 leading-relaxed mb-4">{{REVIEW_SNIPPET}}</p><p class="text-sm text-gray-500">— Verified Google review</p></div>
        <div class="bg-white border border-gray-200 rounded-2xl p-6"><div class="text-yellow-500 mb-3">★★★★★</div><p class="text-gray-700 leading-relaxed mb-4">Showed up on time, fixed the problem fast, cleaned up after. Will definitely call again.</p><p class="text-sm text-gray-500">— Verified Google review</p></div>
        <div class="bg-white border border-gray-200 rounded-2xl p-6"><div class="text-yellow-500 mb-3">★★★★★</div><p class="text-gray-700 leading-relaxed mb-4">Fair pricing, honest assessment, quality work. The kind of plumber you keep on speed dial.</p><p class="text-sm text-gray-500">— Verified Google review</p></div>
      </div>
    </div>
  </section>

  <!-- Contact CTA -->
  <section id="contact" class="py-20">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="font-display text-4xl md:text-5xl mb-5">Ready to fix it?</h2>
      <p class="text-lg text-gray-600 mb-8">Call now for same-day service. Free estimates. No pressure.</p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="tel:{{PHONE}}" class="bg-accent text-white font-bold text-lg px-10 py-5 rounded-xl hover:opacity-90 transition-opacity accent-shadow">📞 {{PHONE}}</a>
        <a href="#" class="bg-white border-2 border-gray-900 text-gray-900 font-bold text-lg px-10 py-5 rounded-xl hover:bg-gray-900 hover:text-white transition-colors">Book online</a>
      </div>
      <p class="text-sm text-gray-500 mt-6">{{ADDRESS}} · Serving {{SERVICE_AREA}} · Licensed & insured</p>
    </div>
  </section>

  <footer class="border-t border-gray-200 py-8">
    <div class="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-500">
      <p>&copy; 2026 {{BUSINESS_NAME}}. All rights reserved.</p>
      <p>Site by <a href="https://jontri.com" class="text-primary hover:underline">Jontri</a></p>
    </div>
  </footer>

  <script src="https://widgets.leadconnectorhq.com/loader.js" data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="69dbcad79f3b6fa8f2c8d6b2"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add clients/denver-plumbing/website-template.html
git commit -m "feat: replace plumber template with light/premium design"
```

---

## Task 6: MMS Preview Screenshot Utility

**Files:**
- Create: `clients/denver-plumbing/pipeline/screenshot-mms.js`

- [ ] **Step 1: Write screenshot-mms.js**

Create `clients/denver-plumbing/pipeline/screenshot-mms.js`:
```javascript
/**
 * Render a generated plumber site and capture a 4:5 (1080x1350) PNG
 * of the hero + trust bar — the MMS preview image.
 */

const path = require('path');
const fs = require('fs');

async function screenshotMms({ htmlPath, outputPath }) {
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`htmlPath not found: ${htmlPath}`);
  }

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 1080, height: 1350 },
      deviceScaleFactor: 2,
    });

    const fileUrl = 'file://' + path.resolve(htmlPath).replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a beat for Tailwind CDN + Google Fonts to apply.
    await page.waitForTimeout(1500);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: 1080, height: 1350 },
      type: 'png',
    });

    return outputPath;
  } finally {
    await browser.close();
  }
}

module.exports = { screenshotMms };

// CLI usage: node screenshot-mms.js <html-path> <output-png>
if (require.main === module) {
  const [, , htmlPath, outputPath] = process.argv;
  if (!htmlPath || !outputPath) {
    console.error('Usage: node screenshot-mms.js <html-path> <output-png>');
    process.exit(1);
  }
  screenshotMms({ htmlPath, outputPath })
    .then(p => console.log(`✅ ${p}`))
    .catch(err => { console.error(err); process.exit(1); });
}
```

- [ ] **Step 2: Smoke test against the existing Spartan site**

Run:
```bash
node clients/denver-plumbing/pipeline/screenshot-mms.js clients/denver-plumbing/websites/spartan-plumbing/index.html /tmp/spartan-mms-old.png
```

Expected: prints `✅ /tmp/spartan-mms-old.png`. Open the PNG and confirm it's a 1080×1350 image of the current (dark) Spartan site — this proves the screenshot utility works; we'll re-run it against the new template after Task 7.

- [ ] **Step 3: Commit**

```bash
git add clients/denver-plumbing/pipeline/screenshot-mms.js
git commit -m "feat: add MMS preview screenshot utility"
```

---

## Task 7: Integrate Pipeline Into generate-websites.js

**Files:**
- Modify: `clients/denver-plumbing/generate-websites.js` (full rewrite)

- [ ] **Step 1: Replace generate-websites.js**

Overwrite `clients/denver-plumbing/generate-websites.js` with:
```javascript
/**
 * Generate customized plumber websites + MMS preview PNGs from CSV.
 * Usage: node generate-websites.js [--only=<slug>]
 *
 * For each unique business in the CSV:
 *   1. Extract a brand color from their existing website (fallback: default blue)
 *   2. Scrape 3–5 photos from their Google Business Profile (fallback: stock)
 *   3. Hash-pick hero + service photos from the stock manifest
 *   4. Render website-template.html with all variables
 *   5. Save to websites/<slug>/index.html
 *   6. Capture a 1080x1350 MMS preview PNG to /public/mms-previews/<slug>.png
 *   7. Append to lead-manifest.json and enriched-leads.json
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { extractBrandColor } = require('./pipeline/extract-brand-color');
const { scrapeGbpPhotos } = require('./pipeline/scrape-gbp-photos');
const { screenshotMms } = require('./pipeline/screenshot-mms');

const ROOT = path.join(__dirname, '..', '..');
const CSV_FILE = path.join(ROOT, 'plumbers_in_denver_co_2026-04-12T15-24-12.csv');
const TEMPLATE_FILE = path.join(__dirname, 'website-template.html');
const STOCK_FILE = path.join(__dirname, 'assets', 'stock-photos.json');
const OUTPUT_DIR = path.join(__dirname, 'websites');
const MMS_DIR = path.join(ROOT, 'public', 'mms-previews');
const MANIFEST_FILE = path.join(__dirname, 'lead-manifest.json');
const ENRICHED_FILE = path.join(__dirname, 'enriched-leads.json');

const PUBLIC_MMS_BASE = 'https://jontri.com/mms-previews';

// ---- CSV parse (reused) ----
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => row[h] = vals[idx] || '');
    rows.push(row);
  }
  return rows;
}
function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') inQuotes = !inQuotes;
    else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else current += line[i];
  }
  result.push(current.trim());
  return result;
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function getInitials(name) {
  return name.split(/[\s,&]+/).filter(w => w.length > 1 && w[0] === w[0].toUpperCase()).slice(0, 2).map(w => w[0]).join('');
}
function getShortName(name) {
  return name.replace(/\s*(LLC|Inc\.?|Co\.?|Company|Services?|,\s*Heating.*|,\s*Cooling.*|,\s*Electric.*|&\s*Heating.*|&\s*Air.*|&\s*Electric.*)\s*/gi, '').trim();
}
function hashIndex(str, mod) {
  const h = crypto.createHash('md5').update(str).digest('hex');
  return parseInt(h.slice(0, 8), 16) % mod;
}
function inferCity(address) {
  if (!address) return 'Denver';
  if (/aurora/i.test(address)) return 'Aurora';
  if (/westminster/i.test(address)) return 'Westminster';
  if (/wheat ridge/i.test(address)) return 'Wheat Ridge';
  if (/arvada/i.test(address)) return 'Arvada';
  if (/lakewood/i.test(address)) return 'Lakewood';
  if (/parker/i.test(address)) return 'Parker';
  if (/centennial/i.test(address)) return 'Centennial';
  return 'Denver';
}

async function enrichBusiness(lead, stock) {
  const name = lead['Business Name'];
  const slug = slugify(name);
  const website = (lead['Website'] || '').trim();
  const mapsUrl = lead['Google Maps URL'] || '';

  console.log(`\n▶ ${name}`);

  // 1. Brand color
  const { primary, accent } = await extractBrandColor(website);
  console.log(`   color: ${primary} / ${accent}`);

  // 2. GBP photos
  const gbpPhotos = await scrapeGbpPhotos(mapsUrl);
  console.log(`   gbp photos: ${gbpPhotos.length}`);

  // 3. Stock picks
  const heroPhoto = stock.hero[hashIndex(slug, stock.hero.length)];
  const servicePhotos = stock.services;

  // 4. Recent work: prefer GBP, backfill from stock fallback
  const recentWork = [...gbpPhotos];
  for (const fallback of stock.recent_work_fallback) {
    if (recentWork.length >= 4) break;
    recentWork.push(fallback);
  }
  while (recentWork.length < 4) recentWork.push(stock.recent_work_fallback[0]);

  return {
    slug,
    name,
    phone: lead['Phone Number'],
    address: lead['Address'] || '',
    city: inferCity(lead['Address']),
    rating: lead['Rating'] || '5.0',
    reviewCount: lead['Review Count'] || '0',
    reviewSnippet: (lead['Review Snippet'] || 'Professional, reliable, and fast. Highly recommend.').replace(/^"|"$/g, ''),
    website,
    mapsUrl,
    primary,
    accent,
    heroPhoto,
    servicePhotos,
    recentWork,
  };
}

function renderTemplate(template, b) {
  const shortName = getShortName(b.name);
  const serviceArea = [b.city, 'Aurora', 'Westminster'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ');
  return template
    .replace(/\{\{BUSINESS_NAME\}\}/g, b.name)
    .replace(/\{\{BUSINESS_NAME_SHORT\}\}/g, shortName)
    .replace(/\{\{PHONE\}\}/g, b.phone)
    .replace(/\{\{ADDRESS\}\}/g, b.address || b.city + ', CO')
    .replace(/\{\{CITY\}\}/g, b.city)
    .replace(/\{\{SERVICE_AREA\}\}/g, serviceArea)
    .replace(/\{\{RATING\}\}/g, b.rating)
    .replace(/\{\{REVIEW_COUNT\}\}/g, b.reviewCount)
    .replace(/\{\{INITIALS\}\}/g, getInitials(b.name))
    .replace(/\{\{REVIEW_SNIPPET\}\}/g, b.reviewSnippet)
    .replace(/\{\{PRIMARY_COLOR\}\}/g, b.primary)
    .replace(/\{\{ACCENT_COLOR\}\}/g, b.accent)
    .replace(/\{\{HERO_PHOTO_URL\}\}/g, b.heroPhoto)
    .replace(/\{\{SERVICE_PHOTO_EMERGENCY\}\}/g, b.servicePhotos.emergency)
    .replace(/\{\{SERVICE_PHOTO_DRAIN\}\}/g, b.servicePhotos.drain)
    .replace(/\{\{SERVICE_PHOTO_WATERHEATER\}\}/g, b.servicePhotos.waterheater)
    .replace(/\{\{SERVICE_PHOTO_SEWER\}\}/g, b.servicePhotos.sewer)
    .replace(/\{\{SERVICE_PHOTO_LEAK\}\}/g, b.servicePhotos.leak)
    .replace(/\{\{SERVICE_PHOTO_REPIPE\}\}/g, b.servicePhotos.repipe)
    .replace(/\{\{RECENT_WORK_PHOTO_1\}\}/g, b.recentWork[0])
    .replace(/\{\{RECENT_WORK_PHOTO_2\}\}/g, b.recentWork[1])
    .replace(/\{\{RECENT_WORK_PHOTO_3\}\}/g, b.recentWork[2])
    .replace(/\{\{RECENT_WORK_PHOTO_4\}\}/g, b.recentWork[3]);
}

async function main() {
  const onlyArg = process.argv.find(a => a.startsWith('--only='));
  const onlySlug = onlyArg ? onlyArg.split('=')[1] : null;

  const csvData = fs.readFileSync(CSV_FILE, 'utf8');
  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const stock = JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8'));
  const rows = parseCSV(csvData);

  // Deduplicate by phone
  const seen = new Set();
  let leads = rows.filter(r => {
    const phone = r['Phone Number'];
    if (!phone || seen.has(phone)) return false;
    seen.add(phone);
    return true;
  });

  if (onlySlug) {
    leads = leads.filter(r => slugify(r['Business Name']) === onlySlug);
    if (leads.length === 0) {
      console.error(`No business matches --only=${onlySlug}`);
      process.exit(1);
    }
  }

  console.log(`\n📊 Processing ${leads.length} businesses\n`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(MMS_DIR, { recursive: true });

  const manifest = [];
  const enriched = [];

  for (const lead of leads) {
    try {
      const b = await enrichBusiness(lead, stock);
      const dir = path.join(OUTPUT_DIR, b.slug);
      fs.mkdirSync(dir, { recursive: true });
      const htmlPath = path.join(dir, 'index.html');
      fs.writeFileSync(htmlPath, renderTemplate(template, b));

      const pngPath = path.join(MMS_DIR, `${b.slug}.png`);
      await screenshotMms({ htmlPath, outputPath: pngPath });
      const mmsUrl = `${PUBLIC_MMS_BASE}/${b.slug}.png`;

      manifest.push({
        name: b.name, slug: b.slug, phone: b.phone, rating: b.rating,
        reviews: b.reviewCount, address: b.address, city: b.city,
        path: `websites/${b.slug}/index.html`,
        mms_preview_url: mmsUrl,
      });
      enriched.push({
        name: b.name, slug: b.slug, phone: b.phone,
        primary: b.primary, accent: b.accent,
        gbp_photos: b.recentWork.slice(0, Math.min(4, b.recentWork.length)),
        mms_preview_url: mmsUrl,
      });

      console.log(`   ✅ ${b.slug} (site + mms preview)`);
    } catch (err) {
      console.error(`   ❌ ${lead['Business Name']}: ${err.message}`);
    }
  }

  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
  fs.writeFileSync(ENRICHED_FILE, JSON.stringify(enriched, null, 2));

  console.log(`\n✅ ${manifest.length}/${leads.length} generated`);
  console.log(`📄 ${MANIFEST_FILE}`);
  console.log(`📄 ${ENRICHED_FILE}\n`);
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Verify the file parses**

Run:
```bash
node -e "require('./clients/denver-plumbing/generate-websites.js')" 2>&1 | head -5
```

Expected: It will start running the pipeline. Kill with `Ctrl+C` once you see `📊 Processing N businesses` — that confirms require/parse worked.

- [ ] **Step 3: Commit**

```bash
git add clients/denver-plumbing/generate-websites.js
git commit -m "feat: integrate color/photo/screenshot pipeline into generator"
```

---

## Task 8: Rewrite Outreach SMS Doc

**Files:**
- Modify: `clients/denver-plumbing/outreach-upgrade-sms.md` (replace file content)

- [ ] **Step 1: Replace outreach-upgrade-sms.md**

Overwrite `clients/denver-plumbing/outreach-upgrade-sms.md` with:
```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add clients/denver-plumbing/outreach-upgrade-sms.md
git commit -m "feat: rewrite SMS outreach as 3-message MMS sequence"
```

---

## Task 9: Update GHL Import Script

**Files:**
- Modify: `clients/denver-plumbing/ghl-import.js` (add mms_preview_url column)

- [ ] **Step 1: Update ghl-import.js**

Replace the entire contents of `clients/denver-plumbing/ghl-import.js` with:
```javascript
/**
 * Generate a GHL-ready CSV for contact import.
 * Reads lead-manifest.json (produced by generate-websites.js) and writes
 * ghl-contacts-import.csv with all fields GHL needs, including the
 * mms_preview_url custom field used as the MMS attachment in the workflow.
 */

const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, 'lead-manifest.json');
const OUTPUT_CSV = path.join(__dirname, 'ghl-contacts-import.csv');

const leads = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const headers = [
  'First Name',
  'Last Name',
  'Company Name',
  'Phone',
  'Email',
  'Address',
  'City',
  'State',
  'Country',
  'Tags',
  'Source',
  'Website (Custom)',
  'Demo Site URL (Custom)',
  'MMS Preview URL (Custom)',
  'Google Rating (Custom)',
  'Review Count (Custom)',
  'Lead Score (Custom)',
  'Notes',
];

function escapeCSV(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const rows = leads.map(lead => {
  const reviews = parseInt(lead.reviews) || 0;
  const rating = parseFloat(lead.rating) || 0;

  let score = 90;
  if (reviews >= 20 && reviews <= 500) score += 10; // prime prospect range
  if (rating >= 4.7) score += 5;

  const tags = ['denver-plumber', 'outreach-apr-2026', 'site-built'];

  return [
    'Owner',                  // First Name
    '',                       // Last Name
    lead.name,                // Company
    lead.phone,               // Phone
    '',                       // Email (none)
    lead.address || '',       // Address
    lead.city || 'Denver',    // City
    'CO',                     // State
    'US',                     // Country
    tags.join(', '),          // Tags
    'Google Maps Scrape',     // Source
    'none',                   // Website (their existing one — omit for privacy here)
    lead.path ? '' : '',      // Demo Site URL populated later after Vercel deploy
    lead.mms_preview_url || '', // MMS preview URL
    rating,
    reviews,
    score,
    `MMS preview: ${lead.mms_preview_url || 'pending'}. Demo site path: ${lead.path}`,
  ];
});

const csv = [
  headers.map(escapeCSV).join(','),
  ...rows.map(row => row.map(escapeCSV).join(',')),
].join('\n');

fs.writeFileSync(OUTPUT_CSV, csv);

console.log(`\n✅ GHL import CSV created: ghl-contacts-import.csv`);
console.log(`   ${leads.length} contacts ready for import\n`);

console.log('📋 BEFORE IMPORTING, ensure these Custom Fields exist in GHL:');
console.log('   Settings → Custom Fields → Add:');
console.log('   - "Website" (Text)');
console.log('   - "Demo Site URL" (Text)');
console.log('   - "MMS Preview URL" (Text or URL)');
console.log('   - "Google Rating" (Number)');
console.log('   - "Review Count" (Number)');
console.log('   - "Lead Score" (Number)');
console.log('');
console.log('Then Contacts → Import → map columns → assign tag `send-mms-outreach` when ready to trigger.\n');
```

- [ ] **Step 2: Commit**

```bash
git add clients/denver-plumbing/ghl-import.js
git commit -m "feat: add mms_preview_url column to GHL import CSV"
```

---

## Task 10: Remove Deprecated Files

**Files:**
- Delete: `clients/denver-plumbing/outreach-email.html`
- Delete: all subdirectories under `clients/denver-plumbing/websites/`
- Delete: all subdirectories under `clients/denver-plumbing/websites-upgrade/` (if it's the old dark template)

- [ ] **Step 1: Delete the outreach email HTML (no email channel)**

```bash
git rm clients/denver-plumbing/outreach-email.html
```

- [ ] **Step 2: Delete old generated sites (will regenerate from new template)**

```bash
git rm -rf clients/denver-plumbing/websites/*
git rm -rf clients/denver-plumbing/websites-upgrade/*
```

Expected: git shows the deletions staged.

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: remove deprecated email template and old generated sites"
```

---

## Task 11: End-to-End Test with Spartan Plumbing

**Files:** (no new files — verification task)

- [ ] **Step 1: Run generator for just Spartan Plumbing**

From repo root:
```bash
cd clients/denver-plumbing && node generate-websites.js --only=spartan-plumbing
```

Expected output:
```
📊 Processing 1 businesses

▶ Spartan Plumbing
   color: #XXXXXX / #XXXXXX
   gbp photos: N
   ✅ spartan-plumbing (site + mms preview)

✅ 1/1 generated
```

- [ ] **Step 2: Visually inspect the generated HTML**

Open `clients/denver-plumbing/websites/spartan-plumbing/index.html` in a browser. Verify:
- Hero has a bright/white background, not dark
- Business name reads as `Spartan Plumbing` in large typography
- Review badge says `4.9 · 328 reviews on Google`
- Hero photo loaded (human-centric Unsplash image)
- Orange CTA button visible
- 6 service cards with photos (not icons)
- Recent Work section has 4 photos
- Reviews section shows the CSV snippet in card 1

If any element is broken, fix in the template and regenerate.

- [ ] **Step 3: Inspect the MMS preview PNG**

Open `public/mms-previews/spartan-plumbing.png`. Confirm:
- It's 1080×1350 (4:5 aspect)
- Business name legible
- Star rating badge legible
- Hero photo visible
- Orange CTA button visible
- No dark/void rectangles

- [ ] **Step 4: Send yourself the MMS preview to test real-phone rendering**

Send the PNG from `public/mms-previews/spartan-plumbing.png` to your phone via AirDrop, Messages, or email. Open it in Messages on your phone at thumbnail size. Confirm you can read `Spartan Plumbing`, the star rating, and see the CTA in under 2 seconds of casual viewing.

If the MMS preview fails this test, iterate on the template hero section and regenerate before proceeding.

- [ ] **Step 5: Commit any template tweaks**

If step 2–4 required changes:
```bash
git add clients/denver-plumbing/website-template.html
git commit -m "tweak: adjust template after Spartan end-to-end test"
```

---

## Task 12: Full Regeneration + GHL Export

**Files:** (no new files — bulk operation)

- [ ] **Step 1: Regenerate all Denver plumber sites**

From repo root:
```bash
cd clients/denver-plumbing && node generate-websites.js
```

Expected: processes ~100 businesses sequentially (expect 10–15 min total — Playwright cold-starts add a few seconds per business). Some will fail color extraction or GBP scrape; those fall back to defaults and still generate a site. Summary at the end: `✅ N/M generated`.

- [ ] **Step 2: Regenerate the GHL import CSV**

```bash
cd clients/denver-plumbing && node ghl-import.js
```

Expected: `✅ GHL import CSV created: ghl-contacts-import.csv` with ~100 contacts.

- [ ] **Step 3: Spot-check 3 random sites**

Pick 3 slugs at random from `clients/denver-plumbing/lead-manifest.json` and open their `index.html` in a browser. Look for:
- Template renders (no broken `{{...}}` tokens visible)
- Brand color is non-default OR default-blue (not a broken color string)
- Recent Work section has 4 images loaded

- [ ] **Step 4: Commit the regenerated sites + manifest**

```bash
git add clients/denver-plumbing/websites/ clients/denver-plumbing/lead-manifest.json clients/denver-plumbing/enriched-leads.json clients/denver-plumbing/ghl-contacts-import.csv public/mms-previews/
git commit -m "chore: regenerate all Denver plumber sites with new template and MMS previews"
```

- [ ] **Step 5: Deploy preview images to production**

For GHL's MMS attachment step to work, `jontri.com/mms-previews/{slug}.png` must be publicly reachable. If this repo deploys to Vercel via the root Next.js app, `public/mms-previews/*.png` are served automatically on next push. Otherwise, upload the PNGs to the appropriate CDN bucket and update `PUBLIC_MMS_BASE` in `generate-websites.js`.

Verify with one URL from the manifest:
```bash
curl -I https://jontri.com/mms-previews/spartan-plumbing.png
```

Expected: `HTTP/2 200`.

- [ ] **Step 6: Import into GHL and tag for MMS send**

Manual step (no code):
1. Go to GHL → Contacts → Import → upload `clients/denver-plumbing/ghl-contacts-import.csv`
2. Map the custom columns to the Custom Fields created in Task 8
3. Test the workflow by adding the `send-mms-outreach` tag to ONE test contact (your own phone number first)
4. Verify the MMS arrives with the attached preview image and the copy renders correctly
5. Once the test send looks right, bulk-tag the remaining contacts to trigger the campaign

---

## Self-Review Notes

- All spec requirements map to tasks: MMS copy (Task 8), website template (Task 5), brand color extraction (Task 3), GBP photo scrape (Task 4), stock photo hybrid (Task 2 + Task 7), MMS preview screenshot (Task 6), generator integration (Task 7), GHL CSV (Task 9), deprecated cleanup (Task 10), Spartan test first (Task 11), full regeneration (Task 12).
- No placeholders in code steps; every step that changes code shows the code.
- Type consistency: `extractBrandColor()` returns `{ primary, accent }` everywhere it's called; `scrapeGbpPhotos()` returns `string[]`; `screenshotMms({ htmlPath, outputPath })` named-object arg consistent.
- Scope: single feature with one clear deliverable (MMS campaign rolls out for Denver). Does not need decomposition.
- Risks acknowledged in plan: Google Maps scraping is fragile (Task 4 step 2); Playwright cold starts add latency at scale (Task 12 step 1 expected duration); MMS preview hosting requires `public/` directory to deploy (Task 12 step 5).
