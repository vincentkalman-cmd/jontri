"use client";

import { useSyncExternalStore } from "react";

type CallState = "idle" | "connecting" | "live" | "error";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_DEMO_ASSISTANT_ID;
export const VOICE_DEMO_ENABLED = Boolean(PUBLIC_KEY && ASSISTANT_ID);

// One shared call for every button on the page.
let state: CallState = "idle";
const listeners = new Set<() => void>();
const set = (s: CallState) => {
  state = s;
  listeners.forEach((l) => l());
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let vapi: any = null;

async function toggleCall() {
  if (state === "live" || state === "connecting") {
    vapi?.stop();
    set("idle");
    return;
  }
  set("connecting");
  try {
    if (!vapi) {
      const { default: Vapi } = await import("@vapi-ai/web");
      vapi = new Vapi(PUBLIC_KEY!);
      vapi.on("call-start", () => set("live"));
      vapi.on("call-end", () => set("idle"));
      vapi.on("error", () => set("error"));
    }
    await vapi.start(ASSISTANT_ID!);
  } catch {
    set("error");
  }
}

function useCallState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => "idle" as CallState,
  );
}

const LABEL: Record<CallState, string> = {
  idle: "",
  connecting: "Connecting…",
  live: "End call",
  error: "Mic blocked? Try again",
};

export function TalkToAI({ label = "Talk to our AI", className = "btn btn-sig" }: { label?: string; className?: string }) {
  const s = useCallState();

  if (!VOICE_DEMO_ENABLED) {
    return (
      <a className={className} href="#contact">
        <span className="pulse" aria-hidden />
        Get a live demo
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={toggleCall} aria-live="polite" data-state={s}>
      <span className="pulse" aria-hidden />
      {s === "idle" ? label : LABEL[s]}
    </button>
  );
}
