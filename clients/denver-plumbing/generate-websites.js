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

// Trade-noble fallback palette — used when extracted color is too desaturated
const TRADE_PALETTE = [
  '#1F4D3F', // forest
  '#7A3327', // oxblood
  '#1B3A5C', // cobalt
  '#3F2E54', // plum
  '#5A4631', // tobacco
  '#2C4A52', // gunmetal teal
  '#6B2737', // wine
  '#26492F', // pine
];

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex({ r, g, b }) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function isWashedOut(hex) {
  const c = hexToRgb(hex);
  if (!c) return true;
  const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
  const sat = max === 0 ? 0 : (max - min) / max; // simple saturation
  // Reject near-gray (<18% sat), pure black/white, or extremely light
  if (sat < 0.18) return true;
  if (max < 30) return true;
  if (min > 220) return true;
  return false;
}
function darken(hex, amount) {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({ r: c.r * (1 - amount), g: c.g * (1 - amount), b: c.b * (1 - amount) });
}
function mixWithWhite(hex, ratio) {
  const c = hexToRgb(hex);
  if (!c) return hex;
  return rgbToHex({
    r: c.r + (255 - c.r) * ratio,
    g: c.g + (255 - c.g) * ratio,
    b: c.b + (255 - c.b) * ratio,
  });
}
function buildColorSystem(slug, extracted) {
  const base = isWashedOut(extracted) ? TRADE_PALETTE[hashIndex(slug, TRADE_PALETTE.length)] : extracted;
  return {
    primary: base,
    primaryDeep: darken(base, 0.30),
    primarySoft: mixWithWhite(base, 0.78),
    primaryTint: mixWithWhite(base, 0.92),
  };
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

  const { primary: rawPrimary, accent } = await extractBrandColor(website);
  const colors = buildColorSystem(slug, rawPrimary);
  console.log(`   raw: ${rawPrimary} → primary: ${colors.primary} ${rawPrimary !== colors.primary ? '(overridden)' : ''}`);

  const gbpPhotos = await scrapeGbpPhotos(mapsUrl);
  console.log(`   gbp photos: ${gbpPhotos.length}`);

  const heroPhoto = stock.hero[hashIndex(slug, stock.hero.length)];
  const servicePhotos = stock.services;

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
    primary: colors.primary,
    primaryDeep: colors.primaryDeep,
    primarySoft: colors.primarySoft,
    primaryTint: colors.primaryTint,
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
    .replace(/\{\{PRIMARY_DEEP\}\}/g, b.primaryDeep)
    .replace(/\{\{PRIMARY_SOFT\}\}/g, b.primarySoft)
    .replace(/\{\{PRIMARY_TINT\}\}/g, b.primaryTint)
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
