import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAIN_STAGES, isStage, timeline, newPortalToken, isPortalTokenFormat, portalUrl,
  buildChecklist, toggleChecklistItem, checklistProgress, clientNeeds, applyFeedback, stageAfterSetupAll,
} from "./lifecycle.ts";

test("stages: guard and timeline states", () => {
  assert.deepEqual(MAIN_STAGES, ["signed_up", "kickoff", "building", "review", "live"]);
  assert.equal(isStage("review"), true);
  assert.equal(isStage("deleted"), false);
  assert.equal(isStage(undefined), false);
  const t = timeline("building");
  assert.deepEqual(t.map((s) => s.state), ["done", "done", "current", "upcoming", "upcoming"]);
  assert.deepEqual(timeline("live").map((s) => s.state), ["done", "done", "done", "done", "current"]);
  // Side stages keep the client at the start of the timeline.
  assert.deepEqual(timeline("proposal").map((s) => s.state), ["current", "upcoming", "upcoming", "upcoming", "upcoming"]);
});

test("portal tokens: random, url-safe, validated", () => {
  const a = newPortalToken();
  const b = newPortalToken();
  assert.notEqual(a, b);
  assert.equal(a.length, 32);
  assert.equal(isPortalTokenFormat(a), true);
  assert.equal(isPortalTokenFormat("abc"), false);
  assert.equal(isPortalTokenFormat("a".repeat(24) + "/../"), false);
  assert.equal(isPortalTokenFormat("a".repeat(65)), false);
  // Tokens created by the SQL backfill are 64 hex chars.
  assert.equal(isPortalTokenFormat("0123456789abcdef".repeat(4)), true);
  assert.equal(portalUrl("https://jontri.com/", a), `https://jontri.com/p/${a}`);
});

test("checklist: built from services, keeps done state, unknown services get a generic item", () => {
  const list = buildChecklist(["chatbot", "voice-agent", "custom-thing"]);
  const ids = list.map((i) => i.id);
  assert.ok(ids.includes("kickoff-call"));
  assert.ok(ids.includes("chatbot-embed"));
  assert.ok(ids.includes("voice-number"));
  assert.ok(ids.includes("custom-thing-build"));
  assert.equal(new Set(ids).size, ids.length);
  const toggled = toggleChecklistItem(list, "chatbot-embed", true);
  assert.equal(toggled.find((i) => i.id === "chatbot-embed")?.done, true);
  assert.equal(list.find((i) => i.id === "chatbot-embed")?.done, false, "original not mutated");
  const rebuilt = buildChecklist(["chatbot", "voice-agent", "custom-thing"], toggled);
  assert.equal(rebuilt.find((i) => i.id === "chatbot-embed")?.done, true);
  assert.deepEqual(checklistProgress(toggled), { done: 1, total: list.length });
  assert.ok(clientNeeds(list).every((i) => i.owner === "client"));
  assert.ok(clientNeeds(list).some((i) => i.id === "chatbot-embed"));
});

test("feedback: approve only from review, changes from review or live", () => {
  assert.deepEqual(applyFeedback("review", "approve"), { ok: true, stage: "live" });
  assert.equal(applyFeedback("live", "approve").ok, false);
  assert.equal(applyFeedback("building", "approve").ok, false);
  assert.deepEqual(applyFeedback("review", "changes"), { ok: true, stage: "building" });
  assert.deepEqual(applyFeedback("live", "changes"), { ok: true, stage: "building" });
  assert.equal(applyFeedback("kickoff", "changes").ok, false);
});

test("set up all moves early stages to building only", () => {
  assert.equal(stageAfterSetupAll("signed_up"), "building");
  assert.equal(stageAfterSetupAll("kickoff"), "building");
  assert.equal(stageAfterSetupAll("review"), "review");
  assert.equal(stageAfterSetupAll("live"), "live");
});
