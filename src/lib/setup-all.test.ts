import { test } from "node:test";
import assert from "node:assert/strict";
import { runSetupAll, mergeSetupResults } from "./setup-all.ts";
import type { ProvisionResult } from "./provision";

test("runs every service, keeps order, isolates failures", async () => {
  const calls: string[] = [];
  const results = await runSetupAll(
    ["chatbot", "voice-agent", "seo-audit"],
    { chatbot: { a: 1 }, "voice-agent": {}, "seo-audit": {} },
    async (service, cfg): Promise<ProvisionResult> => {
      calls.push(service);
      if (service === "voice-agent") throw new Error("Vapi down");
      return { service, status: "active", detail: `ok ${JSON.stringify(cfg)}` };
    },
  );
  assert.deepEqual(results.map((r) => r.service), ["chatbot", "voice-agent", "seo-audit"]);
  assert.deepEqual(results.map((r) => r.status), ["active", "error", "active"]);
  assert.match(results[1].detail, /Vapi down/);
  assert.match(results[0].detail, /"a":1/);
  assert.equal(calls.length, 3);
});

test("missing config is passed as an empty object", async () => {
  const [r] = await runSetupAll(["ai-seo"], {}, async (service, cfg) => ({ service, status: "needs_setup", detail: String(Object.keys(cfg).length) }));
  assert.equal(r.detail, "0");
});

test("merge keeps changes made while setup ran and applies only the patches", () => {
  const fresh = {
    portal_feedback: [{ action: "approve" }],
    "voice-agent": { assistantId: "old", phoneNumber: "+1720", phoneNumberId: "pn_1" },
    chatbot: { primaryColor: "#000" },
  };
  const { config, services } = mergeSetupResults(
    fresh,
    { chatbot: { status: "pending", updated_at: "t0" }, "voice-agent": { status: "pending", updated_at: "t0" }, extra: { status: "manual", updated_at: "t0" } },
    [
      { service: "voice-agent", status: "active", detail: "ok", configPatch: { assistantId: "new" } },
      { service: "chatbot", status: "error", detail: "boom" },
    ],
    "t1",
  );
  assert.deepEqual(config.portal_feedback, [{ action: "approve" }]);
  assert.deepEqual(config["voice-agent"], { assistantId: "new", phoneNumber: "+1720", phoneNumberId: "pn_1" });
  assert.deepEqual(config.chatbot, { primaryColor: "#000" });
  assert.deepEqual(services["voice-agent"], { status: "active", detail: "ok", updated_at: "t1" });
  assert.deepEqual(services.chatbot, { status: "error", detail: "boom", updated_at: "t1" });
  assert.deepEqual(services.extra, { status: "manual", updated_at: "t0" });
});
