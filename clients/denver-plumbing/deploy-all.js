/**
 * Deploy all generated plumber websites to Vercel as separate projects.
 * Each gets a unique URL like: spartan-plumbing-jontri.vercel.app
 * Usage: node deploy-all.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
if (!VERCEL_TOKEN) {
  console.error('Set VERCEL_TOKEN env var before running.');
  process.exit(1);
}
const VERCEL_SCOPE = 'vincents-projects-90d8734b';
const MANIFEST_FILE = path.join(__dirname, 'lead-manifest.json');
const WEBSITES_DIR = path.join(__dirname, 'websites');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));

console.log(`\n🚀 Deploying ${manifest.length} websites to Vercel...\n`);

const results = [];

for (const lead of manifest) {
  const projectDir = path.join(WEBSITES_DIR, lead.slug);
  const projectName = `${lead.slug}-jontri`;

  console.log(`  Deploying ${lead.name}...`);

  try {
    const output = execSync(
      `npx vercel deploy --yes --prod --token=${VERCEL_TOKEN} --scope=${VERCEL_SCOPE}`,
      {
        cwd: projectDir,
        encoding: 'utf8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );

    // Extract aliased URL (clean .vercel.app URL)
    const aliasMatch = output.match(/Aliased:\s+(https:\/\/[^\s\[]+)/);
    // Fallback: extract from JSON output
    const jsonMatch = output.match(/"url":\s*"(https:\/\/[^"]+)"/);
    const url = aliasMatch ? aliasMatch[1] : (jsonMatch ? jsonMatch[1] : output.trim().split('\n').pop().trim());
    results.push({ ...lead, url, status: 'deployed' });
    console.log(`  ✅ ${lead.name} → ${url}`);
  } catch (err) {
    const errMsg = err.stderr || err.message;
    console.log(`  ❌ ${lead.name} — ${errMsg.substring(0, 100)}`);
    results.push({ ...lead, url: null, status: 'failed', error: errMsg.substring(0, 200) });
  }
}

// Save results
fs.writeFileSync(
  path.join(__dirname, 'deploy-manifest.json'),
  JSON.stringify(results, null, 2)
);

console.log(`\n${'='.repeat(60)}`);
console.log(`✅ Deployed: ${results.filter(r => r.status === 'deployed').length}`);
console.log(`❌ Failed: ${results.filter(r => r.status === 'failed').length}`);
console.log(`📄 Results saved to deploy-manifest.json\n`);

// Print summary table
console.log('Business'.padEnd(45) + 'URL');
console.log('-'.repeat(90));
results.forEach(r => {
  console.log(r.name.substring(0, 44).padEnd(45) + (r.url || 'FAILED'));
});
