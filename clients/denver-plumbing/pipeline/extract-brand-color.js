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
  if (max - min < 25) return true;
  if (max < 40) return true;
  if (min > 230) return true;
  return false;
}

function isWarm(hex) {
  const { r, g, b } = hexToRgb(hex);
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
