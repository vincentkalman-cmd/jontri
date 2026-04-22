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
