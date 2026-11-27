"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface ScoreResult {
  site: string;
  name: string;
  scores: { seo: number; speed: number; ai: number; trust: number };
  passed: number;
  total: number;
  wins: { title: string; detail: string }[];
  token: string;
}

type Msg = { role: "user" | "assistant"; content: string };

const RINGS: { key: keyof ScoreResult["scores"]; label: string }[] = [
  { key: "seo", label: "Google SEO" },
  { key: "ai", label: "AI-search visibility" },
  { key: "speed", label: "Speed & mobile" },
  { key: "trust", label: "Trust signals" },
];

const ringColor = (v: number) => (v >= 80 ? "var(--ok)" : v >= 55 ? "var(--gold)" : "#FF8A6B");

function Ring({ value, label }: { value: number; label: string }) {
  const C = 2 * Math.PI * 40;
  const [off, setOff] = useState(C);
  useEffect(() => {
    const id = requestAnimationFrame(() => setOff(C * (1 - value / 100)));
    return () => cancelAnimationFrame(id);
  }, [value, C]);
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" aria-hidden>
        <circle className="bgc" cx="50" cy="50" r="40" />
        <circle className="fg" cx="50" cy="50" r="40" style={{ stroke: ringColor(value) }} strokeDasharray={C} strokeDashoffset={off} />
      </svg>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}

export function DemoLab() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState<"score" | "chat">("score");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);

  async function analyze(e: FormEvent) {
    e.preventDefault();
    if (!url.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/demo/site-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="lab" id="demo">
      <div className="wrap">
        <div className="reveal" style={{ textAlign: "center" }}>
          <span className="kicker">Demo lab</span>
          <h2 className="display h">Try it on your business.</h2>
          <p className="lede" style={{ margin: "0 auto" }}>
            Paste your website. In about 15 seconds you&apos;ll get a free SEO &amp; AI-search score, and a chatbot that
            already knows your business.
          </p>
        </div>
        <div className="lab-box reveal">
          <form className="urlbar" onSubmit={analyze}>
            <label className="in">
              <span aria-hidden>https://</span>
              <span className="sr-only">Your website</span>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourbusiness.com"
                inputMode="url"
                autoComplete="url"
                maxLength={300}
              />
            </label>
            <button className="btn btn-sig" type="submit" disabled={loading}>
              {loading ? "Analyzing…" : "Analyze my site →"}
            </button>
          </form>
          <div className="tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "score"} className={`tab${tab === "score" ? " on" : ""}`} onClick={() => setTab("score")}>
              SEO &amp; AI-search score
            </button>
            <button type="button" role="tab" aria-selected={tab === "chat"} className={`tab${tab === "chat" ? " on" : ""}`} onClick={() => setTab("chat")}>
              Your chatbot
            </button>
          </div>
          <div className="tabp" role="tabpanel">
            {loading ? (
              <div className="empty">
                <span className="typing" style={{ color: "var(--sig)" }}>
                  <i />
                  <i />
                  <i />
                </span>
                <br />
                Reading your site and running {tab === "score" ? "24 checks" : "the chatbot setup"}…
              </div>
            ) : error ? (
              <div className="empty">
                <p className="err" style={{ margin: 0 }}>{error}</p>
              </div>
            ) : !result ? (
              <div className="empty">
                {tab === "score"
                  ? "Enter your website above to see your score."
                  : "Enter your website above, then chat with an AI trained on it."}
              </div>
            ) : tab === "score" ? (
              <ScorePanel r={result} />
            ) : (
              <ChatPanel key={result.token} r={result} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScorePanel({ r }: { r: ScoreResult }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function send(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const report =
      RINGS.map((x) => `${x.label}: ${r.scores[x.key]}/100`).join("\n") +
      "\n\nQuick wins:\n" +
      r.wins.map((w, i) => `${i + 1}. ${w.title}: ${w.detail}`).join("\n");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "site-score", site: r.site, company: r.name, report }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <p className="mono" style={{ color: "var(--dim)", fontSize: 12, margin: "0 0 var(--s4)" }}>
        {r.site} · passed {r.passed} of {r.total} checks
      </p>
      <div className="scores">
        {RINGS.map((x) => (
          <Ring key={x.key} value={r.scores[x.key]} label={x.label} />
        ))}
      </div>
      <div className="wins">
        {r.wins.map((w, i) => (
          <div className="win" key={i}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            <span>
              <strong style={{ color: "var(--paper)" }}>{w.title}.</strong> {w.detail}
            </span>
          </div>
        ))}
      </div>
      {state === "sent" ? (
        <p className="okmsg" style={{ marginTop: "var(--s5)" }}>✓ Got it. Vince will email you a personal fix plan for {r.site}.</p>
      ) : (
        <form className="gate" onSubmit={send}>
          <label className="sr-only" htmlFor="score-email">Email</label>
          <input id="score-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email me a free, personal fix plan" />
          <button className="btn btn-sig" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send my plan"}
          </button>
          {state === "error" && <p className="err">Couldn&apos;t send. Please try again.</p>}
        </form>
      )}
    </>
  );
}

function ChatPanel({ r }: { r: ScoreResult }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: r.token, messages: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "The demo assistant is unavailable right now.");
      setMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="chatdemo">
        <div className="screen" style={{ minHeight: 0, borderRadius: 0, boxShadow: "none" }}>
          <div className="top">
            <span>Chatbot trained on {r.site}</span>
            <span className="live">ready</span>
          </div>
          <div className="feed" ref={feedRef} style={{ maxHeight: 360, overflowY: "auto" }}>
            <div className="m ai in">
              <span className="who">{r.name} assistant</span>
              Hi! I&apos;ve read {r.site}. Ask me anything a customer would, like services, area, or how to book.
            </div>
            {msgs.map((m, i) => (
              <div key={i} className={`m ${m.role === "user" ? "cu" : "ai"} in`}>
                <span className="who">{m.role === "user" ? "You" : `${r.name} assistant`}</span>
                {m.content}
              </div>
            ))}
            {busy && (
              <div className="m ai in" aria-hidden>
                <span className="typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </div>
        </div>
        <form className="chatin" onSubmit={send}>
          <label className="sr-only" htmlFor="demo-chat">Message</label>
          <input id="demo-chat" value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="e.g. Do you offer free estimates?" />
          <button disabled={busy}>Send</button>
        </form>
      </div>
      {error && <p className="err" style={{ textAlign: "center" }}>{error}</p>}
      <div className="sample">Demo only. Answers come from your public website. The real version is trained on everything you give us.</div>
    </>
  );
}
