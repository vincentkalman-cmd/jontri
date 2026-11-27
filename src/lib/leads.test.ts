import { test } from "node:test";
import assert from "node:assert/strict";
import { extractContact, leadEmailHtml } from "./leads.ts";

test("finds emails and US phone formats", () => {
  assert.deepEqual(extractContact("reach me at jen.r+hvac@gmail.com thanks"), { email: "jen.r+hvac@gmail.com" });
  assert.equal(extractContact("call (303) 555-0142")?.phone, "(303) 555-0142");
  assert.equal(extractContact("303.555.0142")?.phone, "303.555.0142");
  assert.equal(extractContact("+1 303-555-0142")?.phone, "+1 303-555-0142");
  const both = extractContact("jen@x.io or 3035550142");
  assert.equal(both?.email, "jen@x.io");
  assert.equal(both?.phone, "3035550142");
});

test("ignores messages without contact info", () => {
  assert.equal(extractContact("Do you do weekend repairs?"), null);
  assert.equal(extractContact("We're open 8 to 5, 7 days"), null);
});

test("lead email escapes visitor text", () => {
  const html = leadEmailHtml("Acme <b>", { email: "a@b.co" }, [{ role: "user", content: "<script>x</script>" }]);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("Acme &lt;b&gt;"));
});
