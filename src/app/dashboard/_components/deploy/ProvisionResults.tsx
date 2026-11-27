"use client";

import { useState } from "react";

export interface ProvisionRow {
  service: string;
  label: string;
  status: "active" | "needs_setup" | "manual" | "error";
  detail: string;
  embedCode?: string;
  assistantId?: string;
  scores?: Record<string, number>;
  aiScore?: number;
}

const BADGE: Record<ProvisionRow["status"], { text: string; cls: string }> = {
  active: { text: "Live", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  needs_setup: { text: "Needs info", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  manual: { text: "Handled by Jontri", cls: "bg-accent/10 text-accent-light border-accent/25" },
  error: { text: "Failed", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const SCORE_LABELS: Record<string, string> = { seo: "Google SEO", ai: "AI search", speed: "Speed", trust: "Trust" };

/** Parse a /api/clients response into a result row. */
export async function rowFromResponse(res: Response, service: string, label: string): Promise<ProvisionRow> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { service, label, status: "error", detail: data.error || `Save failed (${res.status})` };
  const p = data.provision || {};
  return {
    service,
    label,
    status: p.status || "manual",
    detail: p.detail || "Saved.",
    embedCode: p.embedCode,
    assistantId: p.assistantId,
    scores: p.scores,
    aiScore: p.aiScore,
  };
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="px-3 py-2 text-xs bg-accent text-accent-ink rounded-lg hover:bg-accent-light transition-colors font-semibold flex-shrink-0 cursor-pointer"
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function ProvisionResults({ rows }: { rows: ProvisionRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-4 space-y-3">
      {rows.map((r) => {
        const b = BADGE[r.status] || BADGE.manual;
        return (
          <div key={r.service} className="bg-bg-primary border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-text-primary">{r.label}</p>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${b.cls}`}>{b.text}</span>
            </div>
            <p className="text-text-secondary text-xs mt-1.5 leading-relaxed">{r.detail}</p>

            {r.scores && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {Object.entries(r.scores).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-bg-card border border-border px-2 py-2 text-center">
                    <p className="text-lg font-bold text-text-primary leading-none">{v}</p>
                    <p className="text-[10px] text-text-muted mt-1">{SCORE_LABELS[k] || k}</p>
                  </div>
                ))}
              </div>
            )}

            {typeof r.aiScore === "number" && r.aiScore > 0 && (
              <p className="mt-2 text-xs text-text-muted">
                AI search visibility: <span className="text-text-primary font-semibold">{r.aiScore}/10</span>
              </p>
            )}

            {r.assistantId && (
              <p className="mt-2 text-xs text-text-muted font-mono break-all">Vapi assistant: {r.assistantId}</p>
            )}

            {r.embedCode && (
              <div className="mt-3">
                <p className="text-xs text-text-muted mb-1.5">Paste before &lt;/body&gt; on the client&apos;s website:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/80 text-accent-light text-xs p-3 rounded-lg font-mono break-all select-all">
                    {r.embedCode}
                  </code>
                  <CopyButton text={r.embedCode} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
