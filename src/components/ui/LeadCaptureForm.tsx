"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";

export function LeadCaptureForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Placeholder: log the lead capture data
    console.log("Lead captured:", { name, email });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center py-4">
        <div className="text-3xl mb-3 text-success">&#10003;</div>
        <h3 className="text-xl font-bold text-text-primary mb-2">
          Check Your Inbox!
        </h3>
        <p className="text-text-secondary text-sm">
          Your free AI Audit Checklist is on its way. Keep an eye on your email.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="First name"
          aria-label="First name"
          className="flex-1 bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          placeholder="Your best email"
          aria-label="Email address"
          className="flex-1 bg-bg-primary border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full sm:w-auto">
        Get the Free Checklist
      </Button>
      <p className="text-xs text-text-muted">
        No spam, ever. Unsubscribe anytime.
      </p>
    </form>
  );
}
