import { test } from "node:test";
import assert from "node:assert/strict";
import { auditHtml } from "./site-audit.ts";

const good = `<!doctype html><html><head>
<title>Summit Heating &amp; Air | Furnace Repair Denver</title>
<meta name="description" content="Same-day furnace and AC repair in Denver. Licensed techs, upfront pricing, 4.9 stars from 600+ reviews.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta property="og:title" content="Summit"><meta property="og:image" content="/og.png">
<link rel="canonical" href="https://summit.example/">
<script type="application/ld+json">{"@type":"HVACBusiness","name":"Summit"}</script>
<script type="application/ld+json">{"@type":"FAQPage"}</script>
</head><body>
<h1>Furnace repair in Denver</h1><h2>Heating</h2><h2>Cooling</h2><h3>Service area</h3>
<a href="/a">a</a><a href="/b">b</a><a href="/c">c</a><a href="/d">d</a><a href="/e">e</a>
<img src="x.jpg" alt="tech fixing furnace">
<p>Call (303) 555-0142. Serving Denver, CO 80202. Read our reviews ★★★★★</p>
<p>${"word ".repeat(320)}</p>
<form></form>
</body></html>`;

test("a well-built page scores 100 everywhere", () => {
  const r = auditHtml({ html: good, finalUrl: "https://summit.example/", responseMs: 300, hasLlmsTxt: true });
  assert.deepEqual(r.scores, { seo: 100, speed: 100, ai: 100, trust: 100 });
  assert.ok(r.checks.every((c) => c.pass));
});

test("a bare page fails the important checks", () => {
  const r = auditHtml({ html: "<html><body><p>hi</p></body></html>", finalUrl: "http://bare.example/", responseMs: 3000, hasLlmsTxt: false });
  assert.equal(r.scores.ai, 0);
  assert.ok(r.scores.seo < 50);
  const failed = r.checks.filter((c) => !c.pass).map((c) => c.id);
  for (const id of ["title", "desc", "h1", "viewport", "https", "schema", "phone"]) assert.ok(failed.includes(id), id);
});

test("noindex is flagged", () => {
  const html = good.replace("<head>", '<head><meta name="robots" content="noindex">');
  const r = auditHtml({ html, finalUrl: "https://summit.example/", responseMs: 300, hasLlmsTxt: true });
  assert.equal(r.checks.find((c) => c.id === "indexable")?.pass, false);
});

test("scores are whole numbers between 0 and 100", () => {
  const r = auditHtml({ html: good.replace(/<h1>.*?<\/h1>/, ""), finalUrl: "https://s.example/", responseMs: 1500, hasLlmsTxt: false });
  for (const v of Object.values(r.scores)) assert.ok(Number.isInteger(v) && v >= 0 && v <= 100);
});
