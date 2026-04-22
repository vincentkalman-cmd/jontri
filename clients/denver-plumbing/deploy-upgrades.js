/**
 * Deploy all upgrade prospect websites to Vercel.
 * Usage: node deploy-upgrades.js
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
const MANIFEST_FILE = path.join(__dirname, 'upgrade-manifest.json');
const WEBSITES_DIR = path.join(__dirname, 'websites-upgrade');

const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));

console.log(`\n🚀 Deploying ${manifest.length} upgrade websites to Vercel...\n`);

const results = [];

for (const lead of manifest) {
  const projectDir = path.join(WEBSITES_DIR, lead.slug);

  process.stdout.write(`  Deploying ${lead.name.substring(0, 40)}...`);

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

    const aliasMatch = output.match(/Aliased:\s+(https:\/\/[^\s\[]+)/);
    const jsonMatch = output.match(/"url":\s*"(https:\/\/[^"]+)"/);
    const url = aliasMatch ? aliasMatch[1] : (jsonMatch ? jsonMatch[1] : null);
    results.push({ ...lead, url, status: 'deployed' });
    console.log(` ✅`);
  } catch (err) {
    console.log(` ❌`);
    results.push({ ...lead, url: null, status: 'failed' });
  }
}

fs.writeFileSync(path.join(__dirname, 'upgrade-deploy-manifest.json'), JSON.stringify(results, null, 2));

const deployed = results.filter(r => r.status === 'deployed');
const failed = results.filter(r => r.status === 'failed');
console.log(`\n✅ Deployed: ${deployed.length} | ❌ Failed: ${failed.length}`);
console.log(`📄 Saved to upgrade-deploy-manifest.json\n`);
