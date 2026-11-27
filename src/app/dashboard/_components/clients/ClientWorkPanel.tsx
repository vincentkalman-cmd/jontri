"use client";

import { useState } from "react";
import type { DashboardClient } from "@/lib/dashboard-client";
import { ALL_STAGES, STAGE_LABELS, checklistProgress, type Stage } from "@/lib/lifecycle";
import { ProvisionResults, type ProvisionRow } from "../deploy/ProvisionResults";

const btn =
  "min-h-10 px-3 py-2 rounded-lg text-sm font-semibold transition-[background-color,color,opacity] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-wait";
const field = "bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-accent";

const SERVICE_LABELS: Record<string, string> = {
  chatbot: "AI Chatbot",
  "voice-agent": "AI Voice Agent",
  "seo-audit": "SEO Audit",
  "ai-seo": "AI Search",
  prospector: "Lead Prospecting",
  "review-mgmt": "Review Management",
  "follow-up": "Follow-Up Sequences",
  reporting: "Monthly Reporting",
};

/** Owner's per-client workspace: stage, Set up all, phone number, checklist, private notes. */
export default function ClientWorkPanel({ client, onUpdated }: { client: DashboardClient; onUpdated: (c?: DashboardClient) => void }) {
  const [busy, setBusy] = useState("");
  const [rows, setRows] = useState<ProvisionRow[] | null>(null);
  const [notes, setNotes] = useState(client.notes);
  const [areaCode, setAreaCode] = useState("");
  const [msg, setMsg] = useState("");
  const progress = checklistProgress(client.checklist);

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    setMsg("");
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Update failed");
        return;
      }
      if (body.stage === "review") setMsg("Stage set to Review. The client was emailed a link to approve.");
      onUpdated(data.client);
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function setUpAll() {
    setBusy("setup");
    setMsg("");
    setRows(null);
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}/setup-all`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Setup failed");
        return;
      }
      setRows(
        ((data.results || []) as Omit<ProvisionRow, "label">[]).map((r) => ({ ...r, label: SERVICE_LABELS[r.service] || r.service })),
      );
      onUpdated();
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy("");
    }
  }

  async function getNumber() {
    setBusy("phone");
    setMsg("");
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(client.slug)}/phone-number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ areaCode }),
      });
      const data = await res.json().catch(() => ({}));
      setMsg(res.ok ? `AI number: ${data.phoneNumber}` : data.error || "Couldn't get a number");
      if (res.ok) onUpdated();
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="stage" className="block text-xs text-text-muted uppercase tracking-wide mb-1">
            Stage
          </label>
          <select id="stage" value={client.stage} disabled={Boolean(busy)} onChange={(e) => patch({ stage: e.target.value as Stage }, "stage")} className={`${field} cursor-pointer`}>
            {ALL_STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={setUpAll} disabled={Boolean(busy)} className={`${btn} bg-accent text-accent-ink hover:bg-accent-light`}>
          {busy === "setup" ? "Setting up… (up to 2 min)" : "Set up all"}
        </button>
        {client.services["voice-agent"] && !client.phoneNumber && (
          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="area" className="block text-xs text-text-muted uppercase tracking-wide mb-1">
                Area code
              </label>
              <input
                id="area"
                inputMode="numeric"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="720"
                className={`${field} w-20`}
              />
            </div>
            <button type="button" onClick={getNumber} disabled={Boolean(busy)} className={`${btn} border border-accent/40 text-accent hover:bg-accent/10`}>
              {busy === "phone" ? "Getting number…" : "Get phone number"}
            </button>
          </div>
        )}
        {client.phoneNumber && (
          <p className="text-sm text-text-secondary">
            AI number: <span className="text-text-primary font-semibold">{client.phoneNumber}</span>
          </p>
        )}
      </div>
      {client.stage === "building" && (
        <p className="text-xs text-text-muted">When everything works, set the stage to Review. The client gets an email asking them to approve.</p>
      )}
      {msg && (
        <p role="status" className="text-sm text-text-secondary">
          {msg}
        </p>
      )}
      {rows && <ProvisionResults rows={rows} />}

      <section aria-labelledby="cl-h">
        <h3 id="cl-h" className="text-sm font-semibold text-text-primary mb-2">
          Checklist{" "}
          <span className="text-text-muted font-normal">
            ({progress.done}/{progress.total})
          </span>
        </h3>
        {client.checklist.length === 0 ? (
          <p className="text-sm text-text-muted">Run Set up all to generate the checklist.</p>
        ) : (
          <ul className="space-y-1.5">
            {client.checklist.map((item) => (
              <li key={item.id}>
                <label className="flex items-start gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={item.done}
                    disabled={Boolean(busy)}
                    onChange={(e) => patch({ checklistItem: { id: item.id, done: e.target.checked } }, "check")}
                    className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--color-accent)] cursor-pointer"
                  />
                  <span className={item.done ? "text-text-muted line-through" : "text-text-secondary"}>{item.label}</span>
                  {item.owner === "client" && <span className="text-[10px] uppercase tracking-wide text-accent mt-0.5">client</span>}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="notes-h">
        <h3 id="notes-h" className="text-sm font-semibold text-text-primary mb-2">
          <label htmlFor="client-notes">Notes (private)</label>
        </h3>
        <textarea id="client-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={5000} className={`${field} w-full`} />
        <button
          type="button"
          onClick={() => patch({ notes }, "notes")}
          disabled={Boolean(busy) || notes === client.notes}
          className={`${btn} mt-2 border border-border text-text-secondary hover:text-text-primary`}
        >
          {busy === "notes" ? "Saving…" : "Save notes"}
        </button>
      </section>
    </div>
  );
}
