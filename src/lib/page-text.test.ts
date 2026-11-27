import { test } from "node:test";
import assert from "node:assert/strict";
import { structuredDataTypes, pageText } from "./page-text.ts";

test("finds JSON-LD types including @graph and arrays", () => {
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":["Service","FAQPage"]}]}</script>
<script type="application/ld+json">{"@type":"HVACBusiness"}</script>`;
  assert.deepEqual(structuredDataTypes(html).sort(), ["FAQPage", "HVACBusiness", "Organization", "Service"]);
  assert.deepEqual(structuredDataTypes("<p>none</p>"), []);
});

test("page text drops scripts and short lines", () => {
  const t = pageText('<script>var x=1</script><h1>Roof repair in Denver, same day</h1><p>ok</p>');
  assert.ok(t.includes("Roof repair in Denver, same day"));
  assert.ok(!t.includes("var x"));
});
