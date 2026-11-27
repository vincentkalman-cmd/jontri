import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServiceViews } from "./portal-view.ts";

const config = {
  vapiApiKey: "sk_live_TOPSECRET_ROOT",
  chatbot: { primaryColor: "#35e0c2", websiteKnowledge: "PRIVATE_SCRAPE", openaiApiKey: "sk-SECRET2" },
  "voice-agent": { vapiApiKey: "vapi_SECRET3", assistantId: "asst_1", phoneNumber: "+17205550199", businessPhone: "720-555-0100", businessHours: "Mon-Fri" },
  "seo-audit": { audit: { scores: { seo: 80, ai: 50, speed: 70, trust: 60 }, fixes: Array.from({ length: 8 }, (_, i) => ({ label: `L${i}`, fix: `F${i}` })), checkedAt: "2026-11-28" } },
  "ai-seo": { analysis: { overall_score: 7, top_recommendations: ["a", "b", "c", "d", "e", "f"], raw_notes: "INTERNAL_ONLY" }, checkedAt: "2026-11-28" },
};
const services = {
  chatbot: { status: "active", detail: "Chatbot is live." },
  "voice-agent": { status: "active" },
  "seo-audit": { status: "active" },
  "ai-seo": { status: "active" },
  "review-mgmt": { status: "manual" },
};

test("portal view never contains secrets or raw config", () => {
  const json = JSON.stringify(buildServiceViews(services, config, "haul-hero", "https://jontri.com"));
  for (const secret of ["TOPSECRET", "SECRET2", "SECRET3", "PRIVATE_SCRAPE", "INTERNAL_ONLY", "asst_1", "vapiApiKey"]) {
    assert.equal(json.includes(secret), false, `leaked ${secret}`);
  }
});

test("portal view exposes the useful bits, capped", () => {
  const v = buildServiceViews(services, config, "haul-hero", "https://jontri.com");
  assert.match(v.chatbot.embedCode || "", /client=haul-hero&color=%2335e0c2/);
  assert.equal(v["voice-agent"].phoneNumber, "+17205550199");
  assert.equal(v["seo-audit"].scores?.seo, 80);
  assert.equal(v["seo-audit"].fixes?.length, 5);
  assert.equal(v["ai-seo"].aiScore, 7);
  assert.equal(v["ai-seo"].recommendations?.length, 5);
  assert.equal(v["review-mgmt"].status, "manual");
});

test("bad stored values are ignored, not echoed", () => {
  const v = buildServiceViews(
    { chatbot: { status: "active" }, "voice-agent": { status: "active" } },
    { chatbot: { primaryColor: "red\" onload=\"x" }, "voice-agent": { phoneNumber: { evil: true } } },
    "s",
    "https://jontri.com",
  );
  assert.match(v.chatbot.embedCode || "", /color=%233B82F6/);
  assert.equal(v["voice-agent"].phoneNumber, undefined);
});
