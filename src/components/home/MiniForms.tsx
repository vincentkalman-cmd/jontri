"use client";

import { FormEvent, useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

async function post(body: Record<string, string>): Promise<boolean> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function ContactMini() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setState((await post({ email, message, source: "contact" })) ? "sent" : "error");
  }

  return (
    <div className="card" id="contact">
      <h4>Send us a note</h4>
      <p>Tell us about your business and we&apos;ll get back to you.</p>
      {state === "sent" ? (
        <p className="okmsg">✓ Thanks! We&apos;ll be in touch soon.</p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
          <label className="sr-only" htmlFor="c-msg">What do you need help with?</label>
          <input id="c-msg" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What do you need help with?" maxLength={2000} />
          <div className="row">
            <label className="sr-only" htmlFor="c-email">Email</label>
            <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
            <button className="btn btn-sig" disabled={state === "sending"}>{state === "sending" ? "…" : "Send"}</button>
          </div>
          {state === "error" && <p className="err">Couldn&apos;t send. Please email hello@jontri.com.</p>}
        </form>
      )}
    </div>
  );
}

export function ChecklistMini() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    setState((await post({ email, source: "checklist" })) ? "sent" : "error");
  }

  return (
    <div className="card">
      <h4>Free AI Readiness Checklist</h4>
      <p>10 points to find where AI saves you the most. Takes 15 minutes.</p>
      {state === "sent" ? (
        <p className="okmsg">✓ Check your inbox.</p>
      ) : (
        <form className="row" onSubmit={submit}>
          <label className="sr-only" htmlFor="cl-email">Email for checklist</label>
          <input id="cl-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
          <button className="btn btn-ghost" disabled={state === "sending"}>{state === "sending" ? "…" : "Get it"}</button>
        </form>
      )}
      {state === "error" && <p className="err">Couldn&apos;t send. Please try again.</p>}
    </div>
  );
}
