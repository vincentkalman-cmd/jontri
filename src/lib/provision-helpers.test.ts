import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVoicePrompt, buildAssistantPayload, buyPhoneNumber, resolveVapiKey, phoneNumberPlan, getPhoneNumber } from "./vapi.ts";

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

test("resolveVapiKey prefers the client's key, then Jontri's env key", () => {
  const prev = process.env.VAPI_API_KEY;
  process.env.VAPI_API_KEY = "env-key";
  assert.equal(resolveVapiKey({ vapiApiKey: " client-key " }), "client-key");
  assert.equal(resolveVapiKey({}), "env-key");
  delete process.env.VAPI_API_KEY;
  assert.equal(resolveVapiKey({}), "");
  if (prev !== undefined) process.env.VAPI_API_KEY = prev;
});

test("buyPhoneNumber posts to Vapi and returns the number", async () => {
  const realFetch = globalThis.fetch;
  let seen: { url: string; body: Record<string, unknown>; auth: string } | null = null;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    seen = { url, body: JSON.parse(String(init.body)), auth: String((init.headers as Record<string, string>).Authorization) };
    return new Response(JSON.stringify({ id: "pn_1", number: "+17205550199" }), { status: 201 });
  }) as typeof fetch;
  try {
    const r = await buyPhoneNumber("key", "asst_1", { areaCode: "720", name: "Haul Hero" });
    assert.deepEqual(r, { ok: true, id: "pn_1", number: "+17205550199" });
    assert.equal(seen!.url, "https://api.vapi.ai/phone-number");
    assert.equal(seen!.auth, "Bearer key");
    assert.equal(seen!.body.assistantId, "asst_1");
    assert.equal(seen!.body.numberDesiredAreaCode, "720");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("buyPhoneNumber reports Vapi errors and rejects bad area codes", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ message: ["Area code not available"] }), { status: 400 })) as typeof fetch;
  try {
    assert.deepEqual(await buyPhoneNumber("key", "asst_1", { areaCode: "720" }), { ok: false, error: "Area code not available" });
    assert.equal((await buyPhoneNumber("key", "asst_1", { areaCode: "72a" })).ok, false);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("phoneNumberPlan never buys twice: existing id means refresh, not buy", () => {
  assert.deepEqual(phoneNumberPlan({ phoneNumberId: "pn_1", phoneNumber: "+1720" }), { action: "existing", number: "+1720" });
  assert.deepEqual(phoneNumberPlan({ phoneNumberId: "pn_1", phoneNumber: "" }), { action: "refresh", id: "pn_1" });
  assert.deepEqual(phoneNumberPlan({ phoneNumber: "+1720" }), { action: "existing", number: "+1720" });
  assert.equal(phoneNumberPlan({}).action, "error");
  assert.deepEqual(phoneNumberPlan({ assistantId: "asst_1" }), { action: "buy", assistantId: "asst_1" });
});

test("getPhoneNumber reads the number Vapi assigned later", async () => {
  const realFetch = globalThis.fetch;
  let url = "";
  globalThis.fetch = (async (u: string) => {
    url = u;
    return new Response(JSON.stringify({ id: "pn_1", number: "+17205550199" }), { status: 200 });
  }) as typeof fetch;
  try {
    assert.deepEqual(await getPhoneNumber("key", "pn_1"), { ok: true, id: "pn_1", number: "+17205550199" });
    assert.equal(url, "https://api.vapi.ai/phone-number/pn_1");
  } finally {
    globalThis.fetch = realFetch;
  }
});
