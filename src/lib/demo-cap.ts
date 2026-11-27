import { getSupabaseAdmin } from "@/lib/supabase";

export const DEMO_DAILY_LIMIT = Number(process.env.DEMO_DAILY_LIMIT || 300);

/**
 * Claims one demo run against the global daily cap (Supabase `claim_demo_run`).
 * Fails open if the database/function isn't available, so per-IP rate limits
 * remain the only guard in that case.
 */
export async function claimDemoRun(): Promise<boolean> {
  try {
    const { data, error } = await getSupabaseAdmin().rpc("claim_demo_run", { p_limit: DEMO_DAILY_LIMIT });
    if (error) {
      console.error("claim_demo_run failed (failing open):", error.message);
      return true;
    }
    return data === true;
  } catch (e) {
    console.error("claim_demo_run unavailable (failing open):", e instanceof Error ? e.message : e);
    return true;
  }
}

export function demoSecret(): string | null {
  return process.env.DEMO_TOKEN_SECRET || process.env.JWT_SECRET || null;
}
