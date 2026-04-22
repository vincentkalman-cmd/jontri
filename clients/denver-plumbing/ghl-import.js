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
  if (reviews >= 20 && reviews <= 500) score += 10;
  if (rating >= 4.7) score += 5;

  const tags = ['denver-plumber', 'outreach-apr-2026', 'site-built'];

  return [
    'Owner',
    '',
    lead.name,
    lead.phone,
    '',
    lead.address || '',
    lead.city || 'Denver',
    'CO',
    'US',
    tags.join(', '),
    'Google Maps Scrape',
    'none',
    lead.path ? '' : '',
    lead.mms_preview_url || '',
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
