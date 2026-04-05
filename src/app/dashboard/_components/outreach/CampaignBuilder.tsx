"use client";

import { useState } from "react";
import type { PipelineMode } from "@/lib/outreach-types";
import { DEFAULT_CAMPAIGN_CONFIG } from "@/lib/outreach-types";

interface CampaignBuilderProps {
  onClose: () => void;
  onCreated: () => void;
}

const inputClasses =
  "w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export function CampaignBuilder({ onClose, onCreated }: CampaignBuilderProps) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<PipelineMode>("email");
  const [maxLeads, setMaxLeads] = useState(DEFAULT_CAMPAIGN_CONFIG.maxLeads);
  const [minScore, setMinScore] = useState(DEFAULT_CAMPAIGN_CONFIG.minScore);
  const [emailTone, setEmailTone] = useState(DEFAULT_CAMPAIGN_CONFIG.emailTone);
  const [idealCustomer, setIdealCustomer] = useState("");
  const [serviceFocus, setServiceFocus] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/outreach/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || `Campaign - ${query}`,
          query,
          mode,
          config: {
            maxLeads,
            minScore,
            emailTone,
            idealCustomer,
            serviceFocus,
            customGuidelines: DEFAULT_CAMPAIGN_CONFIG.customGuidelines,
            requireWebsite: DEFAULT_CAMPAIGN_CONFIG.requireWebsite,
            maxSiteScore: DEFAULT_CAMPAIGN_CONFIG.maxSiteScore,
          },
        }),
      });
      if (res.ok) {
        onCreated();
      }
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-bg-secondary border-b border-border p-6 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                New Outreach Campaign
              </h2>
              <p className="text-text-muted text-xs mt-1">
                Discover leads, qualify with AI, and send personalized outreach
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-xl leading-none p-1"
            >
              &times;
            </button>
          </div>
        </div>

        <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* Campaign name */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Campaign Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClasses}
              placeholder="e.g., Dallas HVAC Q2 2026"
            />
          </div>

          {/* Search query */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Search Query <span className="text-red-400">*</span>
            </label>
            <input
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClasses}
              placeholder="e.g., plumbers in Dallas, TX"
            />
            <p className="text-text-muted text-xs mt-1">
              This is used to search Google Maps for businesses
            </p>
          </div>

          {/* Pipeline mode */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">
              Pipeline Mode
            </label>
            <div className="flex gap-3">
              {([
                {
                  key: "email" as PipelineMode,
                  label: "Email Outreach",
                  desc: "Discover \u2192 Qualify \u2192 Email",
                  icon: "\u{1F4E7}",
                },
                {
                  key: "website-agent" as PipelineMode,
                  label: "Website Agent",
                  desc: "Discover \u2192 Score Sites \u2192 Demo \u2192 Email",
                  icon: "\u{1F310}",
                },
              ]).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMode(m.key)}
                  className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                    mode === m.key
                      ? "border-accent bg-accent/10"
                      : "border-border bg-bg-primary/30 opacity-70"
                  }`}
                >
                  <span className="text-2xl block mb-1">{m.icon}</span>
                  <p className="text-text-primary text-sm font-medium">
                    {m.label}
                  </p>
                  <p className="text-text-muted text-xs mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Max Leads: {maxLeads}
              </label>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={maxLeads}
                onChange={(e) => setMaxLeads(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>5</span>
                <span>60</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Min AI Score: {minScore}
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-accent"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
          </div>

          {/* Email tone */}
          <div>
            <label className="block text-sm text-text-secondary mb-1.5">
              Email Tone
            </label>
            <select
              value={emailTone}
              onChange={(e) => setEmailTone(e.target.value)}
              className={inputClasses}
            >
              <option value="professional but conversational, not pushy">
                Professional & Conversational
              </option>
              <option value="friendly and casual">
                Friendly & Casual
              </option>
              <option value="direct and authoritative">
                Direct & Authoritative
              </option>
              <option value="warm and empathetic">
                Warm & Empathetic
              </option>
            </select>
          </div>

          {/* Advanced options */}
          <details className="group">
            <summary className="text-xs text-accent cursor-pointer font-medium hover:text-accent-dark transition-colors">
              Advanced options (ICP, service focus...)
            </summary>
            <div className="mt-3 space-y-4 pt-3 border-t border-border">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Ideal Customer Description
                </label>
                <textarea
                  value={idealCustomer}
                  onChange={(e) => setIdealCustomer(e.target.value)}
                  className={inputClasses + " min-h-[60px] resize-y"}
                  placeholder="e.g., Companies with 10-500 employees using manual processes..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Service Focus
                </label>
                <input
                  value={serviceFocus}
                  onChange={(e) => setServiceFocus(e.target.value)}
                  className={inputClasses}
                  placeholder="e.g., AI workflow automation for scheduling and dispatch"
                />
              </div>
            </div>
          </details>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-text-secondary text-sm hover:text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 bg-gradient-to-r from-accent to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-accent-dark hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
            >
              {creating ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
