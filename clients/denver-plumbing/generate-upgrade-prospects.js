/**
 * Generate upgrade prospect list, build websites, and create GHL import data.
 * For plumbers who HAVE a website but it's weak (score 40+).
 * Usage: node generate-upgrade-prospects.js
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', '..', 'plumbers_in_denver_co_2026-04-12T15-24-12.csv');
const TEMPLATE_FILE = path.join(__dirname, 'website-template.html');
const OUTPUT_DIR = path.join(__dirname, 'websites-upgrade');

function parseLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += line[i]; }
  }
  result.push(current.trim());
  return result;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 50);
}

function getInitials(name) {
  return name.split(/[\s,&]+/).filter(w => w.length > 1 && w[0] === w[0].toUpperCase()).slice(0, 2).map(w => w[0]).join('');
}

function getShortName(name) {
  return name
    .replace(/\s*(LLC|Inc\.?|Co\.?|Company)\s*\.?\s*$/gi, '')
    .replace(/\s*\|.*$/g, '')
    .trim();
}

const lines = fs.readFileSync(CSV_FILE, 'utf8').split('\n');
const headers = parseLine(lines[0]);
const rows = [];
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const vals = parseLine(lines[i]);
  const row = {};
  headers.forEach((h, idx) => row[h] = vals[idx] || '');
  rows.push(row);
}

// Filter: HAS website, dedupe by phone
const seen = new Set();
const withWebsite = rows.filter(r => {
  const website = (r['Website'] || '').trim();
  const phone = r['Phone Number'];
  if (!website || seen.has(phone)) return false;
  seen.add(phone);
  return true;
});

// Score
const scored = withWebsite.map(r => {
  let score = 0;
  const reasons = [];
  const website = (r['Website'] || '').trim();
  const booking = (r['Booking URL'] || '').trim();
  const reviews = parseInt(r['Review Count'] || '0') || 0;
  const rating = parseFloat(r['Rating'] || '0') || 0;

  if (!booking) { score += 25; reasons.push('No online booking'); }
  if (reviews < 50) { score += 20; reasons.push('Very small'); }
  else if (reviews < 200) { score += 15; reasons.push('Small shop'); }
  else if (reviews < 500) { score += 10; reasons.push('Mid-size'); }
  if (rating >= 4.7 && reviews < 300) { score += 15; reasons.push('High rating low visibility'); }
  if (!website.startsWith('https://')) { score += 10; reasons.push('No HTTPS'); }
  if (/wix|weebly|squarespace|godaddy|wordpress\.com/i.test(website)) { score += 20; reasons.push('DIY website'); }

  return {
    name: r['Business Name'],
    phone: r['Phone Number'],
    website: website.split('?')[0],
    rating,
    reviews,
    score,
    reasons: reasons.join(', '),
    address: r['Address'] || '',
    reviewSnippet: (r['Review Snippet'] || '').replace(/^"|"$/g, '')
  };
}).filter(s => s.score >= 40).sort((a, b) => b.score - a.score);

console.log(`\n📊 ${scored.length} upgrade prospects (score 40+)\n`);

// Generate websites
const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const manifest = [];

scored.forEach(lead => {
  const slug = slugify(lead.name);
  const dir = path.join(OUTPUT_DIR, slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const reviewSnippet = lead.reviewSnippet || 'Professional, reliable, and fast. Would highly recommend to anyone needing a plumber.';

  const html = template
    .replace(/\{\{BUSINESS_NAME\}\}/g, lead.name)
    .replace(/\{\{BUSINESS_NAME_SHORT\}\}/g, getShortName(lead.name))
    .replace(/\{\{PHONE\}\}/g, lead.phone)
    .replace(/\{\{ADDRESS\}\}/g, lead.address || 'Denver, CO')
    .replace(/\{\{RATING\}\}/g, lead.rating)
    .replace(/\{\{REVIEW_COUNT\}\}/g, lead.reviews)
    .replace(/\{\{INITIALS\}\}/g, getInitials(lead.name))
    .replace(/\{\{REVIEW_SNIPPET\}\}/g, reviewSnippet);

  fs.writeFileSync(path.join(dir, 'index.html'), html);

  manifest.push({
    name: lead.name,
    slug,
    phone: lead.phone,
    rating: lead.rating,
    reviews: lead.reviews,
    address: lead.address,
    currentWebsite: lead.website,
    score: lead.score,
    reasons: lead.reasons,
    path: `websites-upgrade/${slug}/index.html`
  });

  console.log(`  ✅ ${lead.name} (${lead.score})`);
});

fs.writeFileSync(path.join(__dirname, 'upgrade-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`\n✅ Generated ${manifest.length} upgrade websites`);
console.log(`📄 Manifest saved to upgrade-manifest.json\n`);
