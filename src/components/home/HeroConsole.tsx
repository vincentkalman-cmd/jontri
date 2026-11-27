"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { HERO_SCENES, type SceneStep } from "@/lib/home-content";
import { Icon, Wave } from "./Icons";

const TYPE_MS = 650;
const MSG_MS = 900;
const OTHER_MS = 700;
const HOLD_MS = 2600;

function timeline(steps: SceneStep[]) {
  // Returns [typingAt | null, showAt] per step and total duration.
  let t = 150;
  const marks = steps.map((s) => {
    const isMsg = s.kind === "ai" || s.kind === "cu";
    const typingAt = isMsg ? t : null;
    if (isMsg) t += TYPE_MS;
    const showAt = t;
    t += isMsg ? MSG_MS : OTHER_MS;
    return { typingAt, showAt };
  });
  return { marks, total: t + HOLD_MS };
}

function Step({ s }: { s: SceneStep }) {
  switch (s.kind) {
    case "ai":
    case "cu":
      return (
        <div className={`m ${s.kind} in`}>
          <span className="who">{s.who}</span>
          {s.text}
        </div>
      );
    case "sys":
    case "note":
      return <div className={`m ${s.kind} in`}>{s.text}</div>;
    case "wave":
      return <Wave />;
    case "stars":
      return <div className="stars" aria-label="5 stars">★★★★★</div>;
    case "lead":
      return (
        <div className="lead">
          <span>
            {s.name}
            <small>{s.meta}</small>
          </span>
          <span className="tagx">{s.tag}</span>
          <span className="score">{s.score}</span>
        </div>
      );
    case "gpt":
      return (
        <div className="gpt">
          <div className="q">⌕ {s.query}</div>
          {s.before}
          <span className="hl">{s.highlight}</span>
          {s.after}
        </div>
      );
  }
}

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function HeroConsole() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState<"ai" | "cu" | null>(null);
  const [run, setRun] = useState(0); // restarts progress bar animation
  const feedRef = useRef<HTMLDivElement>(null);
  const scene = HERO_SCENES[idx];

  const goTo = (i: number) => {
    setShown(0);
    setTyping(null);
    setIdx(i);
    setRun((r) => r + 1);
  };

  useEffect(() => {
    const { marks, total } = timeline(scene.steps);
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (!reduce) {
      marks.forEach((m, i) => {
        const st = scene.steps[i];
        if (m.typingAt !== null && (st.kind === "ai" || st.kind === "cu")) {
          const kind = st.kind;
          timers.push(setTimeout(() => setTyping(kind), m.typingAt));
        }
        timers.push(
          setTimeout(() => {
            setTyping(null);
            setShown(i + 1);
          }, m.showAt),
        );
      });
    }
    timers.push(setTimeout(() => goTo((idx + 1) % HERO_SCENES.length), reduce ? 7000 : total));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, run, reduce]);

  const visible = reduce ? scene.steps.length : shown;

  const { total } = timeline(scene.steps);

  return (
    <div className="console" aria-label="Live examples of Jontri AI at work">
      <div className="rail" role="tablist" aria-label="AI capabilities">
        <div className="rt">Your AI crew</div>
        {HERO_SCENES.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={i === idx}
            className={`cap${i === idx ? " on" : ""}`}
            onClick={() => goTo(i)}
          >
            <span className="row">
              <Icon name={s.icon} />
              {s.label}
            </span>
            <span className="bar">
              {i === idx && <i key={run} style={{ animation: `jh-fill ${total}ms linear forwards` }} />}
            </span>
          </button>
        ))}
      </div>
      <div className="screen">
        <div className="top">
          <span>{scene.title}</span>
          <span className="live">{scene.status}</span>
        </div>
        <div className="feed" ref={feedRef} aria-live="off">
          {scene.steps.slice(0, visible).map((s, i) => (
            <Step key={`${idx}-${i}`} s={s} />
          ))}
          {typing && (
            <div className={`m ${typing} in`} aria-hidden>
              <span className="typing">
                <i />
                <i />
                <i />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
