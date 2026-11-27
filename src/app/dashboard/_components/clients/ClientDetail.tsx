"use client";

import { useState } from "react";
import type { Client } from "./ClientList";
import ClientWorkPanel from "./ClientWorkPanel";
import { portalUrl } from "@/lib/lifecycle";

interface ClientDetailProps {
  client: Client;
  onClose: () => void;
  onRemove: (slug: string) => void;
  onUpdated: (c?: Client) => void;
}

const SERVICE_OPTIONS = [
  { name: "prospector", label: "Lead Generation", icon: "\uD83C\uDFAF" },
  { name: "voice-agent", label: "AI Voice Agent", icon: "\uD83D\uDCDE" },
  { name: "chatbot", label: "AI Chatbot", icon: "\uD83D\uDCAC" },
  { name: "seo-audit", label: "SEO Optimization", icon: "\uD83D\uDD0D" },
  { name: "website", label: "Website Builder", icon: "\uD83C\uDF10" },
  { name: "review-mgmt", label: "Review Management", icon: "\u2B50" },
  { name: "onboarding", label: "Onboarding", icon: "\uD83D\uDE80" },
  { name: "ai-seo", label: "AI Platform SEO", icon: "\uD83E\uDD16" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400",
  configured: "bg-accent/15 text-accent",
  completed: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  dry_run: "bg-purple-500/15 text-purple-400",
  error: "bg-red-500/15 text-red-400",
  needs_setup: "bg-yellow-500/15 text-yellow-400",
  manual: "bg-accent/10 text-accent-light",
};

const STATUS_TEXT: Record<string, string> = {
  active: "live",
  needs_setup: "needs info",
  manual: "by Jontri",
  error: "failed",
};

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-text-primary leading-relaxed">{value}</p>
    </div>
  );
}

export default function ClientDetail({
  client,
  onClose,
  onRemove,
  onUpdated,
}: ClientDetailProps) {
  const [tab, setTab] = useState<"work" | "services" | "onboarding" | "contact">("work");

  function handleShareLink() {
    navigator.clipboard.writeText(portalUrl(window.location.origin, client.portal_token));
    alert("Private portal link copied!");
  }

  const ob = (client.onboarding || {}) as Record<string, unknown>;
  const obStr = (k: string) => (typeof ob[k] === "string" ? (ob[k] as string) : "");
  const obDetails = ob.details && typeof ob.details === "object" ? (ob.details as Record<string, unknown>) : {};
  const obServices = Array.isArray(ob.services_requested) ? (ob.services_requested as unknown[]).filter((x): x is string => typeof x === "string") : [];

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-bg-card border border-border rounded-xl p-6 sticky top-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-text-primary">
                {client.name}
              </h2>
              {client.tier_id && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 uppercase tracking-wide">
                  {client.tier_id}
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm">
              {client.industry} &middot;{" "}
              <span className="text-text-secondary">{client.slug}</span>
              {client.onboarding && (
                <span className="ml-2 inline-flex items-center gap-1 text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  onboarded
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {client.portal_token && (
              <button
                onClick={handleShareLink}
                className="px-3 py-1.5 text-accent border border-accent/30 rounded-lg text-xs hover:bg-accent/10 transition-colors"
              >
                Copy portal link
              </button>
            )}
            <button
              onClick={() => onRemove(client.slug)}
              className="px-3 py-1.5 text-red-400 border border-red-400/30 rounded-lg text-xs hover:bg-red-400/10 transition-colors"
            >
              Remove
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-text-muted border border-border rounded-lg text-xs hover:text-text-primary transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {(["work", "services", "onboarding", "contact"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px capitalize ${
                tab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Work Tab */}
        {tab === "work" && <ClientWorkPanel key={client.slug} client={client} onUpdated={onUpdated} />}

        {/* Services Tab */}
        {tab === "services" && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              {SERVICE_OPTIONS.map((svc) => {
                const deployed = client.services?.[svc.name];
                const statusClass = deployed
                  ? STATUS_COLORS[deployed.status] || "bg-accent/15 text-accent"
                  : "";
                return (
                  <div
                    key={svc.name}
                    title={deployed?.detail || ""}
                    className={`rounded-xl border p-4 text-center transition-[color,background-color,border-color,box-shadow,opacity,transform] ${
                      deployed
                        ? "border-accent/30 bg-accent-glow"
                        : "border-border bg-bg-primary/30 opacity-40"
                    }`}
                  >
                    <span className="text-2xl">{svc.icon}</span>
                    <p className="text-text-primary text-xs font-medium mt-1.5">
                      {svc.label}
                    </p>
                    {deployed && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs mt-2 font-medium ${statusClass}`}
                      >
                        {STATUS_TEXT[deployed.status] || deployed.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Onboarding Tab */}
        {tab === "onboarding" && (
          <div>
            {client.onboarding ? (
              <div className="space-y-4">
                {obStr("submitted_at") && <InfoRow label="Submitted" value={new Date(obStr("submitted_at")).toLocaleString()} />}
                <InfoRow label="Package" value={obStr("package")} />
                <InfoRow label="Website" value={obStr("website")} />
                {Object.entries(obDetails)
                  .filter(([, v]) => typeof v === "string" && v)
                  .map(([k, v]) => (
                    <InfoRow key={k} label={k.replace(/([A-Z])/g, " $1")} value={v as string} />
                  ))}
                {obServices.length > 0 && (
                  <div>
                    <p className="text-xs text-text-muted uppercase tracking-wide mb-1.5">Services Requested</p>
                    <div className="flex flex-wrap gap-2">
                      {obServices.map((s) => (
                        <span key={s} className="text-xs bg-accent/15 text-accent px-2.5 py-1 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <InfoRow label="Project Description" value={obStr("project_description")} />
                <InfoRow label="Current Tools" value={obStr("current_tools")} />
                <InfoRow label="Monthly Budget" value={obStr("monthly_budget")} />
                <InfoRow label="Timeline" value={obStr("timeline")} />
                <InfoRow label="Goals" value={obStr("goals")} />
                <InfoRow label="Special Requirements" value={obStr("special_requirements")} />
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-text-secondary text-sm mb-2">
                  This client was created manually.
                </p>
                <p className="text-text-muted text-xs mb-4">
                  Send them the onboarding form to collect full project details:
                </p>
                <div className="bg-bg-primary/50 border border-border rounded-lg p-3 inline-block">
                  <code className="text-xs text-accent">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : ""}
                    /onboarding
                  </code>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Contact Tab */}
        {tab === "contact" && (
          <div className="space-y-4">
            <InfoRow label="Name" value={client.contact?.name} />
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Email" value={client.contact?.email} />
              <InfoRow label="Phone" value={client.contact?.phone} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Industry" value={client.industry} />
              <InfoRow
                label="Created"
                value={new Date(client.created_at).toLocaleString()}
              />
            </div>
            {client.description && (
              <InfoRow label="Description" value={client.description} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
