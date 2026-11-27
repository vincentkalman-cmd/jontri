/** Average weeks per month (52 / 12). */
export const WEEKS_PER_MONTH = 52 / 12;

export interface MissedCallInputs {
  callsPerWeek: number;
  missedPct: number; // 0-100
  avgJobValue: number;
  bookPct: number; // 0-100
}

/** Estimated revenue lost per month to calls that go unanswered. */
export function monthlyLostRevenue(i: MissedCallInputs): number {
  const clampPct = (n: number) => Math.min(Math.max(n, 0), 100) / 100;
  const calls = Math.max(i.callsPerWeek, 0);
  const value = Math.max(i.avgJobValue, 0);
  return calls * WEEKS_PER_MONTH * clampPct(i.missedPct) * clampPct(i.bookPct) * value;
}

export function formatUsd(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}
