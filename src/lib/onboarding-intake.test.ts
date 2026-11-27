import { test } from "node:test";
import assert from "node:assert/strict";
import { validateIntake, detailFieldsFor, buildServiceConfigs, slugify, uniqueSlug } from "./onboarding-intake.ts";

const good = {
  contactName: "Dana Reyes",
  businessName: "Haul Hero Auto Transport",
  email: "dana@example.com",
  phone: "(720) 555-0100",
  website: "haulheroautotransport.com",
  industry: "Auto transport",
  packageId: "tier-1",
  details: { servicesOffered: "Open and enclosed car shipping", businessHours: "Mon-Sat 8-6", bookingUrl: "https://cal.example/hh", transferNumber: "+17205550100", leadEmail: "", brandColor: "#35e0c2", googleBusinessUrl: "", targetArea: "Denver, CO" },
  acceptName: "Dana Reyes",
  agreed: true,
  termsVersion: "v1",
};

test("valid intake is normalized", () => {
  const r = validateIntake(good, "v1");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.data.website, "https://haulheroautotransport.com");
  assert.equal(r.data.email, "dana@example.com");
  assert.equal(r.data.details.brandColor, "#35e0c2");
});

test("intake rejects missing agreement, bad email, unknown package, stale terms, non-http links", () => {
  assert.equal(validateIntake({ ...good, agreed: false }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, acceptName: " " }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, email: "nope" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, packageId: "tier-9" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, termsVersion: "v0" }, "v1").ok, false);
  assert.equal(validateIntake({ ...good, details: { ...good.details, bookingUrl: "javascript:alert(1)" } }, "v1").ok, false);
  assert.equal(validateIntake(null, "v1").ok, false);
  assert.equal(validateIntake({ ...good, businessName: "x".repeat(200) }, "v1").ok, false);
});

test("intake drops invalid brand colors instead of failing", () => {
  const r = validateIntake({ ...good, details: { ...good.details, brandColor: "red; background:url(x)" } }, "v1");
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.data.details.brandColor, "");
});

test("detail fields follow the chosen services", () => {
  assert.deepEqual(detailFieldsFor(["seo-audit"]), []);
  const voice = detailFieldsFor(["voice-agent"]);
  assert.ok(voice.includes("businessHours") && voice.includes("transferNumber"));
  assert.ok(detailFieldsFor(["review-mgmt"]).includes("googleBusinessUrl"));
  const both = detailFieldsFor(["chatbot", "voice-agent"]);
  assert.equal(new Set(both).size, both.length, "no duplicates");
});

test("service configs carry what provisioning reads", () => {
  const r = validateIntake(good, "v1");
  assert.ok(r.ok);
  if (!r.ok) return;
  const cfgs = buildServiceConfigs(["chatbot", "voice-agent", "seo-audit", "ai-seo"], r.data);
  assert.equal(cfgs.chatbot.websiteUrl, "https://haulheroautotransport.com");
  assert.equal(cfgs.chatbot.primaryColor, "#35e0c2");
  assert.equal(cfgs.chatbot.leadEmail, "dana@example.com", "falls back to contact email");
  assert.equal(cfgs["voice-agent"].businessHours, "Mon-Sat 8-6");
  assert.equal(cfgs["voice-agent"].businessPhone, "(720) 555-0100");
  assert.equal(cfgs["seo-audit"].websiteUrl, "https://haulheroautotransport.com");
  assert.match(cfgs["ai-seo"].targetQueries, /Auto transport/);
});

test("slugs: existing names get a numeric suffix", async () => {
  assert.equal(slugify("Haul Hero Auto Transport!"), "haul-hero-auto-transport");
  const taken = new Set(["acme", "acme-2"]);
  assert.equal(await uniqueSlug("acme", async (s) => taken.has(s)), "acme-3");
  assert.equal(await uniqueSlug("fresh", async () => false), "fresh");
  assert.equal(await uniqueSlug("", async () => false), "client");
});
