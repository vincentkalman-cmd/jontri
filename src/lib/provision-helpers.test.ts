import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVoicePrompt, buildAssistantPayload } from "./vapi.ts";

test("voice prompt includes business facts and honesty rule", () => {
  const p = buildVoicePrompt({
    businessName: "Peak Roofing",
    industry: "roofing",
    servicesOffered: "Repairs\nInspections",
    bookingUrl: "https://cal.example/peak",
    businessHours: "Mon-Fri 7-5",
    clientSlug: "peak-roofing",
  });
  assert.match(p, /Peak Roofing, a roofing business/);
  assert.match(p, /Repairs\nInspections/);
  assert.match(p, /cal\.example\/peak/);
  assert.match(p, /Mon-Fri 7-5/);
  assert.match(p, /If asked whether you are an AI, say yes/);
});

test("assistant payload: default greeting, transfer number only when given, name capped", () => {
  const base = { businessName: "A Very Long Business Name That Keeps Going On", clientSlug: "x" };
  const p = buildAssistantPayload(base);
  assert.equal(p.firstMessage, "Thanks for calling A Very Long Business Name That Keeps Going On! How can I help you today?");
  assert.equal("forwardingPhoneNumber" in p, false);
  assert.ok(String(p.name).length <= 40);
  const q = buildAssistantPayload({ ...base, transferNumber: "+15551234567", greeting: "Hi!" });
  assert.equal(q.forwardingPhoneNumber, "+15551234567");
  assert.equal(q.firstMessage, "Hi!");
  assert.deepEqual(q.metadata, { client_slug: "x" });
});
