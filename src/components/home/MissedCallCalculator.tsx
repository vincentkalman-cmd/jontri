"use client";

import { useEffect, useRef, useState } from "react";
import { formatUsd, monthlyLostRevenue } from "@/lib/missed-calls";
import { TalkToAI } from "./TalkToAI";

const SLIDERS = [
  { key: "callsPerWeek", label: "Calls per week", min: 10, max: 300, step: 1, fmt: (v: number) => String(v) },
  { key: "missedPct", label: "Calls you miss", min: 5, max: 60, step: 1, fmt: (v: number) => `${v}%` },
  { key: "avgJobValue", label: "Average job value", min: 100, max: 5000, step: 50, fmt: (v: number) => formatUsd(v) },
  { key: "bookPct", label: "Callers who'd book", min: 10, max: 80, step: 1, fmt: (v: number) => `${v}%` },
] as const;

type Key = (typeof SLIDERS)[number]["key"];

export function MissedCallCalculator() {
  const [v, setV] = useState<Record<Key, number>>({ callsPerWeek: 60, missedPct: 25, avgJobValue: 450, bookPct: 40 });
  const target = monthlyLostRevenue(v);
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const from = shownRef.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / 600, 1);
      const e = 1 - Math.pow(1 - p, 3);
      shownRef.current = from + (target - from) * e;
      setShown(shownRef.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <section id="calc">
      <div className="wrap calc">
        <div className="reveal">
          <span className="kicker">The cost of voicemail</span>
          <h2 className="display h">What are missed calls costing you?</h2>
          <p className="lede">
            Most callers who hit voicemail don&apos;t leave a message. They call the next business on Google. Move the
            sliders to match your business.
          </p>
          <div className="panel" style={{ marginTop: "var(--s6)" }}>
            {SLIDERS.map((s, i) => (
              <div className="sl" key={s.key} style={i === SLIDERS.length - 1 ? { margin: 0 } : undefined}>
                <label htmlFor={`calc-${s.key}`}>
                  {s.label} <b>{s.fmt(v[s.key])}</b>
                </label>
                <input
                  id={`calc-${s.key}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={v[s.key]}
                  onChange={(e) => setV((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="reveal" style={{ textAlign: "center" }} aria-live="polite">
          <div className="lost-sub">You could be losing about</div>
          <div className="display lost">{formatUsd(shown)}</div>
          <div className="lost-sub">every month to missed calls</div>
          <div className="yr">{formatUsd(shown * 12)} a year</div>
          <div style={{ marginTop: "var(--s6)" }}>
            <TalkToAI label="Hear the AI that catches them" />
          </div>
        </div>
      </div>
    </section>
  );
}
