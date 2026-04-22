# Denver Plumber Pipeline

Per-business enrichment steps called by `../generate-websites.js`:
- `extract-brand-color.js` — scrape primary color from target business's existing site
- `scrape-gbp-photos.js` — scrape 3–5 real photos from Google Business Profile
- `screenshot-mms.js` — render a 4:5 MMS preview PNG of the hero + trust bar

All three use Playwright. Results land in `../enriched-leads.json`.
