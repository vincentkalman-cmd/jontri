"use client";

import { useState } from "react";
import { ProvisionResults, rowFromResponse, type ProvisionRow } from "./ProvisionResults";

interface AutomationField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "url" | "textarea" | "select";
  options?: string[];
  required?: boolean;
}

interface AutomationService {
  name: string;
  description: string;
  icon: string;
  status: "live" | "coming-soon";
  serviceKey?: string;
  fields?: AutomationField[];
}

interface DeployModalProps {
  service: AutomationService;
  onClose: () => void;
  onDeployed: () => void;
}

const inputClasses =
  "w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function DeployModal({ service, onClose, onDeployed }: DeployModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; rows: ProvisionRow[] } | null>(null);

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!service.serviceKey) return;
    setDeploying(true);
    setResult(null);

    try {
      const businessName = form.businessName || "Unnamed";
      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const serviceConfig = { ...form };

      // For voice-agent and chatbot, scrape the website to build knowledge base
      const websiteUrl = form.websiteUrl;
      if (websiteUrl && ["voice-agent", "chatbot"].includes(service.serviceKey)) {
        try {
          const scrapeRes = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: websiteUrl }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            serviceConfig.websiteKnowledge = scrapeData.knowledgeBase;
            serviceConfig.pagesScraped = String(scrapeData.pagesScraped);
            if (scrapeData.meta?.title) serviceConfig.websiteTitle = scrapeData.meta.title;
            if (scrapeData.meta?.description) serviceConfig.websiteDescription = scrapeData.meta.description;
          }
        } catch {
          // Continue without scrape data
        }
      }

      // Create or update client with the service config
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          industry: form.industry || "",
          contactName: form.contactName || "",
          contactEmail: form.contactEmail || form.leadEmail || form.senderEmail || "",
          contactPhone: form.contactPhone || form.businessPhone || "",
          description: `${service.name} deployment`,
          service: service.serviceKey,
          serviceConfig,
        }),
      });

      const row = await rowFromResponse(res, service.serviceKey, service.name);
      if (row.status !== "error") {
        const pagesNote = serviceConfig.pagesScraped
          ? ` Scanned ${serviceConfig.pagesScraped} pages from their website for context.`
          : "";
        setResult({ success: true, message: `${service.name} for "${businessName}" (${slug}).${pagesNote}`, rows: [row] });
        onDeployed();
      } else {
        setResult({ success: false, message: row.detail, rows: [] });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again.", rows: [] });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border p-6 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{service.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-text-primary">{service.name}</h2>
                <p className="text-text-muted text-xs">{service.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary text-xl leading-none p-1"
            >
              &times;
            </button>
          </div>
        </div>

        {result ? (
          /* Result Screen */
          <div className="p-6">
            <div
              className={`rounded-xl border p-6 text-center ${
                result.success
                  ? "border-success/30 bg-success/5"
                  : "border-red-400/30 bg-red-400/5"
              }`}
            >
              <span className="text-4xl block mb-3">{result.success ? "\u2705" : "\u274C"}</span>
              <p
                className={`text-sm font-medium mb-2 ${
                  result.success ? "text-success" : "text-red-400"
                }`}
              >
                {result.success ? "Service Saved" : "Setup Failed"}
              </p>
              <p className="text-text-muted text-xs leading-relaxed">
                {result.message}
              </p>
            </div>

            <ProvisionResults rows={result.rows} />

            <div className="flex justify-end gap-3 mt-4">
              {result.success && (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-accent text-accent-ink rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors"
                >
                  View in Clients
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-text-secondary border border-border rounded-lg text-sm hover:text-text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Deploy Form */
          <form onSubmit={handleDeploy} className="p-6 space-y-4">
            <p className="text-xs text-text-secondary bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
              Fill in the client details below to configure and deploy this automation.
            </p>

            {service.fields?.map((field) => (
              <div key={field.key}>
                <label className="block text-sm text-text-secondary mb-1.5">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    required={field.required}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    className={inputClasses + " min-h-[80px] resize-y"}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : field.type === "select" ? (
                  <select
                    required={field.required}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    className={inputClasses}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "url" ? "text" : field.type || "text"}
                    required={field.required}
                    value={form[field.key] || ""}
                    onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                    onBlur={(e) => {
                      if (
                        field.type === "url" &&
                        e.target.value &&
                        !/^https?:\/\//i.test(e.target.value)
                      ) {
                        setForm((p) => ({ ...p, [field.key]: "https://" + e.target.value }));
                      }
                    }}
                    className={inputClasses}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

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
                disabled={deploying}
                className="px-6 py-2.5 bg-accent text-accent-ink rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors disabled:opacity-50"
              >
                {deploying ? "Deploying..." : `Deploy ${service.name}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
