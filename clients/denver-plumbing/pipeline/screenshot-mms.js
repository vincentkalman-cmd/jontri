/**
 * Render a generated plumber site and capture a 4:5 (1080x1350) JPEG
 * of the hero + trust bar — the MMS preview image.
 *
 * JPEG @ quality 80, deviceScaleFactor 1 → ~150-300KB per image, well under
 * carrier MMS limits (~600KB practical cap). PNG @ 2x DPR previously yielded
 * ~2MB files which carriers silently dropped.
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
      deviceScaleFactor: 1,
    });

    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('leadconnectorhq') || url.includes('widgets.leadconnector')) {
        return route.abort();
      }
      return route.continue();
    });

    const fileUrl = 'file://' + path.resolve(htmlPath).replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'networkidle', timeout: 30000 });

    await page.waitForTimeout(1500);

    await page.evaluate(() => {
      document.querySelectorAll('[id*="leadconnector"], [class*="lc-widget"], iframe[src*="leadconnector"]').forEach(el => el.remove());
    });

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    await page.screenshot({
      path: outputPath,
      clip: { x: 0, y: 0, width: 1080, height: 1350 },
      type: 'jpeg',
      quality: 80,
    });

    return outputPath;
  } finally {
    await browser.close();
  }
}

module.exports = { screenshotMms };

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
