import { test } from "node:test";
import assert from "node:assert/strict";
import { toDashboardClient, groupByStage } from "./dashboard-client.ts";

const row = { name: "A", slug: "a", industry: "HVAC", description: "", contact_name: "Dana", contact_email: "d@x.co", contact_phone: "1", services: {}, created_at: "2026-11-28", status: "active", stage: "kickoff", portal_token: "t".repeat(32), billing_status: "unpaid", checklist: [], notes: "" };

test("maps contact columns and defaults bad values", () => {
  const c = toDashboardClient(row, { onboarding: { goals: "x" }, phoneNumber: "+1720" });
  assert.deepEqual(c.contact, { name: "Dana", email: "d@x.co", phone: "1" });
  assert.equal(c.stage, "kickoff");
  assert.equal(c.phoneNumber, "+1720");
  assert.deepEqual(c.onboarding, { goals: "x" });
  const bad = toDashboardClient({ ...row, stage: "weird", checklist: "nope", notes: null });
  assert.equal(bad.stage, "signed_up");
  assert.deepEqual(bad.checklist, []);
  assert.equal(bad.notes, "");
});

test("groups by stage with the kickoff queue first and no empty groups", () => {
  const cs = [toDashboardClient({ ...row, slug: "l", stage: "live" }), toDashboardClient({ ...row, slug: "k", stage: "kickoff" }), toDashboardClient({ ...row, slug: "k2", stage: "kickoff" })];
  const g = groupByStage(cs);
  assert.deepEqual(g.map((x) => x.stage), ["kickoff", "live"]);
  assert.equal(g[0].clients.length, 2);
});
