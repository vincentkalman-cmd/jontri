import type Anthropic from "@anthropic-ai/sdk";

/**
 * Claude 5.5 models think by default, which can spend a small max_tokens budget
 * before any text is written. For short JSON/text tasks, turn thinking off.
 * Haiku accepts {type:"disabled"}; Sonnet 5.5 requires {type:"between_tools"}
 * (not yet in this SDK version's types).
 */
export const NO_THINKING_HAIKU = { type: "disabled" } as const;
export const NO_THINKING_SONNET = { type: "between_tools" } as unknown as Anthropic.ThinkingConfigParam;

/** All text blocks of a response joined (skips thinking blocks). */
export function textOf(resp: Anthropic.Message): string {
  return resp.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
}
