/**
 * Render a single sample using the new template + new color system.
 * For visual approval before running the full pipeline.
 *
 * Usage: node render-sample.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { screenshotMms } = require('./pipeline/screenshot-mms');

const TEMPLATE_FILE = path.join(__dirname, 'website-template.html');
const STOCK_FILE = path.join(__dirname, 'assets', 'stock-photos.json');
const OUT_HTML = path.join(__dirname, 'websites', 'speed-plumbing', 'index.html');
const OUT_PNG = path.join(__dirname, '..', '..', 'public', 'mms-previews', 'speed-plumbing.png');

// Color helpers (mirror generate-websites.js)
function hashIndex(str, mod) {
  const h = crypto.createHash('md5').update(str).digest('hex');
  return parseInt(h.slice(0, 8), 16) % mod;
}
const TRADE_PALETTE = ['#1F4D3F', '#7A3327', '#1B3A5C', '#3F2E54', '#5A4631', '#2C4A52', '#6B2737', '#26492F'];
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}
function rgbToHex({ r, g, b }) {
  const c = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
function isWashedOut(hex) {
  const c = hexToRgb(hex); if (!c) return true;
  const max = Math.max(c.r, c.g, c.b), min = Math.min(c.r, c.g, c.b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat < 0.18 || max < 30 || min > 220;
}
function darken(hex, a) { const c = hexToRgb(hex); return c ? rgbToHex({ r: c.r*(1-a), g: c.g*(1-a), b: c.b*(1-a) }) : hex; }
function mixWithWhite(hex, r) { const c = hexToRgb(hex); return c ? rgbToHex({ r: c.r+(255-c.r)*r, g: c.g+(255-c.g)*r, b: c.b+(255-c.b)*r }) : hex; }
function buildColorSystem(slug, extracted) {
  const base = isWashedOut(extracted) ? TRADE_PALETTE[hashIndex(slug, TRADE_PALETTE.length)] : extracted;
  return { primary: base, primaryDeep: darken(base, 0.30), primarySoft: mixWithWhite(base, 0.78), primaryTint: mixWithWhite(base, 0.92) };
}

// Speed Plumbing data
const b = {
  name: 'Speed Plumbing',
  shortName: 'Speed Plumbing',
  initials: 'SP',
  phone: '(720) 670-6361',
  address: '19 S Harrison St',
  city: 'Denver',
  serviceArea: 'Denver, Aurora, Lakewood',
  rating: '5.0',
  reviewCount: '194',
  reviewSnippet: 'Showed up the same day, found the slab leak in 20 minutes, fixed it clean. Fair price, no upsell. The kind of plumber I tell every neighbor about.',
};

const colors = buildColorSystem('speed-plumbing', '#092C40');
console.log('Colors:', colors);

const stock = JSON.parse(fs.readFileSync(STOCK_FILE, 'utf8'));
const heroPhoto = stock.hero[hashIndex('speed-plumbing', stock.hero.length)];

const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
const html = template
  .replace(/\{\{BUSINESS_NAME\}\}/g, b.name)
  .replace(/\{\{BUSINESS_NAME_SHORT\}\}/g, b.shortName)
  .replace(/\{\{INITIALS\}\}/g, b.initials)
  .replace(/\{\{PHONE\}\}/g, b.phone)
  .replace(/\{\{ADDRESS\}\}/g, b.address)
  .replace(/\{\{CITY\}\}/g, b.city)
  .replace(/\{\{SERVICE_AREA\}\}/g, b.serviceArea)
  .replace(/\{\{RATING\}\}/g, b.rating)
  .replace(/\{\{REVIEW_COUNT\}\}/g, b.reviewCount)
  .replace(/\{\{REVIEW_SNIPPET\}\}/g, b.reviewSnippet)
  .replace(/\{\{PRIMARY_COLOR\}\}/g, colors.primary)
  .replace(/\{\{PRIMARY_DEEP\}\}/g, colors.primaryDeep)
  .replace(/\{\{PRIMARY_SOFT\}\}/g, colors.primarySoft)
  .replace(/\{\{PRIMARY_TINT\}\}/g, colors.primaryTint)
  .replace(/\{\{ACCENT_COLOR\}\}/g, '#E85D3A')
  .replace(/\{\{HERO_PHOTO_URL\}\}/g, heroPhoto)
  .replace(/\{\{SERVICE_PHOTO_EMERGENCY\}\}/g, stock.services.emergency)
  .replace(/\{\{SERVICE_PHOTO_DRAIN\}\}/g, stock.services.drain)
  .replace(/\{\{SERVICE_PHOTO_WATERHEATER\}\}/g, stock.services.waterheater)
  .replace(/\{\{SERVICE_PHOTO_SEWER\}\}/g, stock.services.sewer)
  .replace(/\{\{SERVICE_PHOTO_LEAK\}\}/g, stock.services.leak)
  .replace(/\{\{SERVICE_PHOTO_REPIPE\}\}/g, stock.services.repipe)
  .replace(/\{\{RECENT_WORK_PHOTO_1\}\}/g, stock.recent_work_fallback[0])
  .replace(/\{\{RECENT_WORK_PHOTO_2\}\}/g, stock.recent_work_fallback[1])
  .replace(/\{\{RECENT_WORK_PHOTO_3\}\}/g, stock.recent_work_fallback[2])
  .replace(/\{\{RECENT_WORK_PHOTO_4\}\}/g, stock.recent_work_fallback[0]);

fs.mkdirSync(path.dirname(OUT_HTML), { recursive: true });
fs.writeFileSync(OUT_HTML, html);
console.log('Wrote:', OUT_HTML);

(async () => {
  await screenshotMms({ htmlPath: OUT_HTML, outputPath: OUT_PNG });
  console.log('Wrote:', OUT_PNG);
})();
