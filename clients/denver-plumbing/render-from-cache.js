/**
 * Re-render templates + screenshots from existing enriched-leads.json + lead-manifest.json
 * Skips brand-color extraction and GBP scraping (those are slow). Uses cached data.
 *
 * Usage:
 *   node render-from-cache.js                        # render all 121
 *   node render-from-cache.js --only=speed-plumbing  # render one
 *   node render-from-cache.js --slugs=a,b,c          # render a few
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { screenshotMms } = require('./pipeline/screenshot-mms');

const ROOT = path.join(__dirname, '..', '..');
const TEMPLATE_FILE = path.join(__dirname, 'website-template.html');
const STOCK_FILE = path.join(__dirname, 'assets', 'stock-photos.json');
const ENRICHED_FILE = path.join(__dirname, 'enriched-leads.json');
const MANIFEST_FILE = path.join(__dirname, 'lead-manifest.json');
const OUTPUT_DIR = path.join(__dirname, 'websites');
const MMS_DIR = path.join(ROOT, 'public', 'mms-previews');

// Color helpers (mirror generate-websites.js)
const TRADE_PALETTE = ['#1F4D3F', '#7A3327', '#1B3A5C', '#3F2E54', '#5A4631', '#2C4A52', '#6B2737', '#26492F'];
function hashIndex(s, m) { return parseInt(crypto.createHash('md5').update(s).digest('hex').slice(0, 8), 16) % m; }
function hexToRgb(hex) { const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || ''); return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null; }
function rgbToHex({ r, g, b }) { const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); return '#' + c(r) + c(g) + c(b); }
function isWashedOut(hex) { const c = hexToRgb(hex); if (!c) return true; const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b); const sat = max === 0 ? 0 : (max - min) / max; return sat < 0.18 || max < 30 || min > 220; }
function darken(hex, a) { const c = hexToRgb(hex); return c ? rgbToHex({ r: c.r * (1 - a), g: c.g * (1 - a), b: c.b * (1 - a) }) : hex; }
function mixWithWhite(hex, r) { const c = hexToRgb(hex); return c ? rgbToHex({ r: c.r + (255 - c.r) * r, g: c.g + (255 - c.g) * r, b: c.b + (255 - c.b) * r }) : hex; }
function buildColorSystem(slug, extracted) {
  const base = isWashedOut(extracted) ? TRADE_PALETTE[hashIndex(slug, TRADE_PALETTE.length)] : extracted;
  return { primary: base, primaryDeep: darken(base, 0.30), primarySoft: mixWithWhite(base, 0.78), primaryTint: mixWithWhite(base, 0.92) };
}

function getInitials(name) {
  return name.split(/[\s,&]+/).filter(w => w.length > 1 && w[0] === w[0].toUpperCase()).slice(0, 2).map(w => w[0]).join('').toUpperCase() || name.slice(0, 2).toUpperCase();
}
function getShortName(name) {
  return name.replace(/\s*(LLC|Inc\.?|Co\.?|Company|Services?|,\s*Heating.*|,\s*Cooling.*|,\s*Electric.*|&\s*Heating.*|&\s*Air.*|&\s*Electric.*)\s*/gi, '').trim() || name;
}

async function main() {
  const args = process.argv.slice(2);
  const onlyArg = args.find(a => a.startsWith('--only='));
  const slugsArg = args.find(a => a.startsWith('--slugs='));
  const onlySlugs = onlyArg ? [onlyArg.split('=')[1]] : (slugsArg ? slugsArg.split('=')[1].split(',') : null);

  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const stock = JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8'));
  const enriched = JSON.parse(fs.readFileSync(ENRICHED_FILE, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));

  const enrichedBySlug = Object.fromEntries(enriched.map(e => [e.slug, e]));
  let leads = manifest;
  if (onlySlugs) leads = leads.filter(l => onlySlugs.includes(l.slug));

  console.log(`Rendering ${leads.length} leads...\n`);
  fs.mkdirSync(MMS_DIR, { recursive: true });

  let success = 0;
  for (const m of leads) {
    try {
      const en = enrichedBySlug[m.slug];
      if (!en) { console.error(`! ${m.slug} — no enriched entry`); continue; }

      const colors = buildColorSystem(m.slug, en.primary);
      const heroPhoto = stock.hero[hashIndex(m.slug, stock.hero.length)];
      const recentWork = (en.gbp_photos && en.gbp_photos.length >= 4)
        ? en.gbp_photos.slice(0, 4)
        : [...(en.gbp_photos || []), ...stock.recent_work_fallback].slice(0, 4);
      while (recentWork.length < 4) recentWork.push(stock.recent_work_fallback[0]);

      const shortName = getShortName(m.name);
      const initials = getInitials(m.name);
      const serviceArea = [m.city || 'Denver', 'Aurora', 'Lakewood'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', ');
      const reviewSnippet = m.reviewSnippet || 'Showed up the same day, found the slab leak in 20 minutes, fixed it clean. Fair price, no upsell. The kind of plumber I tell every neighbor about.';

      const html = template
        .replace(/\{\{BUSINESS_NAME\}\}/g, m.name)
        .replace(/\{\{BUSINESS_NAME_SHORT\}\}/g, shortName)
        .replace(/\{\{INITIALS\}\}/g, initials)
        .replace(/\{\{PHONE\}\}/g, m.phone)
        .replace(/\{\{ADDRESS\}\}/g, m.address || (m.city || 'Denver') + ', CO')
        .replace(/\{\{CITY\}\}/g, m.city || 'Denver')
        .replace(/\{\{SERVICE_AREA\}\}/g, serviceArea)
        .replace(/\{\{RATING\}\}/g, m.rating || '5.0')
        .replace(/\{\{REVIEW_COUNT\}\}/g, m.reviews || '0')
        .replace(/\{\{REVIEW_SNIPPET\}\}/g, reviewSnippet)
        .replace(/\{\{PRIMARY_COLOR\}\}/g, colors.primary)
        .replace(/\{\{PRIMARY_DEEP\}\}/g, colors.primaryDeep)
        .replace(/\{\{PRIMARY_SOFT\}\}/g, colors.primarySoft)
        .replace(/\{\{PRIMARY_TINT\}\}/g, colors.primaryTint)
        .replace(/\{\{ACCENT_COLOR\}\}/g, en.accent || '#FF7A1A')
        .replace(/\{\{HERO_PHOTO_URL\}\}/g, heroPhoto)
        .replace(/\{\{SERVICE_PHOTO_EMERGENCY\}\}/g, stock.services.emergency)
        .replace(/\{\{SERVICE_PHOTO_DRAIN\}\}/g, stock.services.drain)
        .replace(/\{\{SERVICE_PHOTO_WATERHEATER\}\}/g, stock.services.waterheater)
        .replace(/\{\{SERVICE_PHOTO_SEWER\}\}/g, stock.services.sewer)
        .replace(/\{\{SERVICE_PHOTO_LEAK\}\}/g, stock.services.leak)
        .replace(/\{\{SERVICE_PHOTO_REPIPE\}\}/g, stock.services.repipe)
        .replace(/\{\{RECENT_WORK_PHOTO_1\}\}/g, recentWork[0])
        .replace(/\{\{RECENT_WORK_PHOTO_2\}\}/g, recentWork[1])
        .replace(/\{\{RECENT_WORK_PHOTO_3\}\}/g, recentWork[2])
        .replace(/\{\{RECENT_WORK_PHOTO_4\}\}/g, recentWork[3]);

      const dir = path.join(OUTPUT_DIR, m.slug);
      fs.mkdirSync(dir, { recursive: true });
      const htmlPath = path.join(dir, 'index.html');
      fs.writeFileSync(htmlPath, html);

      const jpgPath = path.join(MMS_DIR, `${m.slug}.jpg`);
      await screenshotMms({ htmlPath, outputPath: jpgPath });

      const sizeKB = Math.round(fs.statSync(jpgPath).size / 1024);
      console.log(`✓ ${m.slug}  ${sizeKB}KB  ${colors.primary === en.primary ? '' : '(palette override)'}`);
      success++;
    } catch (err) {
      console.error(`✗ ${m.slug}: ${err.message}`);
    }
  }

  // After rendering, rewrite lead-manifest.json with .jpg URLs
  const updatedManifest = manifest.map(m => ({
    ...m,
    mms_preview_url: m.mms_preview_url.replace(/\.png$/, '.jpg'),
  }));
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(updatedManifest, null, 2));
  console.log(`\nManifest URLs updated to .jpg`);

  console.log(`\nDone: ${success}/${leads.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
