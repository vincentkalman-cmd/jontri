import { test } from "node:test";
import assert from "node:assert/strict";
import { monthlyLostRevenue, formatUsd, WEEKS_PER_MONTH } from "./missed-calls.ts";

test("computes calls x weeks x missed x booked x value", () => {
  const v = monthlyLostRevenue({ callsPerWeek: 60, missedPct: 25, avgJobValue: 450, bookPct: 40 });
  assert.equal(Math.round(v), Math.round(60 * WEEKS_PER_MONTH * 0.25 * 0.4 * 450));
});

test("zero missed calls means zero lost", () => {
  assert.equal(monthlyLostRevenue({ callsPerWeek: 100, missedPct: 0, avgJobValue: 500, bookPct: 50 }), 0);
});

test("clamps out-of-range and negative inputs", () => {
  const v = monthlyLostRevenue({ callsPerWeek: -5, missedPct: 150, avgJobValue: 100, bookPct: 50 });
  assert.equal(v, 0);
  const w = monthlyLostRevenue({ callsPerWeek: 10, missedPct: 150, avgJobValue: 100, bookPct: 200 });
  assert.equal(Math.round(w), Math.round(10 * WEEKS_PER_MONTH * 100));
});

test("formats whole US dollars", () => {
  assert.equal(formatUsd(11690.6), "$11,691");
  assert.equal(formatUsd(0), "$0");
});
