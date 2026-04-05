"use client";

import { useState } from "react";

interface QuickDeployModalProps {
  onClose: () => void;
  onDeployed: () => void;
}

const inputClasses =
  "w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export default function QuickDeployModal({ onClose, onDeployed }: QuickDeployModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [services, setServices] = useState({ voiceAgent: true, chatbot: true, website: true });
  const [deploying, setDeploying] = useState(false);
  const [step, setStep] = useState(0); // 0=form, 1=scraping, 2=deploying, 3=done
  const [result, setResult] = useState<{ success: boolean; message: string; slug?: string } | null>(
    null
  );

  async function handleQuickDeploy(e: React.FormEvent) {
    e.preventDefault();
    setDeploying(true);
    setResult(null);
    const businessName = form.businessName || "Unnamed";
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      // Step 1: Scrape the website
      setStep(1);
      let websiteKnowledge = "";
      let pagesScraped = 0;
      if (form.websiteUrl) {
        try {
          const scrapeRes = await fetch("/api/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: form.websiteUrl }),
          });
          if (scrapeRes.ok) {
            const scrapeData = await scrapeRes.json();
            websiteKnowledge = scrapeData.knowledgeBase || "";
            pagesScraped = scrapeData.pagesScraped || 0;
          }
        } catch {
          /* continue without scrape */
        }
      }

      // Step 2: Deploy selected services
      setStep(2);
      const deployed: string[] = [];
      const failed: string[] = [];

      const baseConfig = {
        businessName,
        industry: form.industry || "",
        websiteUrl: form.websiteUrl || "",
        websiteKnowledge,
        pagesScraped: String(pagesScraped),
        businessPhone: form.businessPhone || "",
        bookingUrl: form.bookingUrl || "",
        servicesOffered: form.servicesOffered || "",
        businessHours: form.businessHours || "Monday-Friday 8am-6pm",
      };

      // Voice Agent
      if (services.voiceAgent && form.vapiApiKey) {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: businessName,
            industry: form.industry || "",
            contactName: form.contactName || "",
            contactEmail: form.contactEmail || "",
            contactPhone: form.businessPhone || "",
            service: "voice-agent",
            serviceConfig: {
              ...baseConfig,
              vapiApiKey: form.vapiApiKey,
              transferNumber: form.transferNumber || "",
            },
          }),
        });
        if (res.ok) deployed.push("AI Voice Agent");
        else failed.push("AI Voice Agent");
      }

      // Chatbot
      if (services.chatbot) {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: businessName,
            industry: form.industry || "",
            contactName: form.contactName || "",
            contactEmail: form.contactEmail || "",
            contactPhone: form.businessPhone || "",
            service: "chatbot",
            serviceConfig: {
              ...baseConfig,
              primaryColor: form.brandColor || "#3B82F6",
              leadEmail: form.contactEmail || "",
            },
          }),
        });
        if (res.ok) deployed.push("AI Chatbot");
        else failed.push("AI Chatbot");
      }

      // Website
      if (services.website) {
        const res = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: businessName,
            industry: form.industry || "",
            contactName: form.contactName || "",
            contactEmail: form.contactEmail || "",
            contactPhone: form.businessPhone || "",
            service: "website",
            serviceConfig: {
              ...baseConfig,
              brandColor: form.brandColor || "#3B82F6",
              domain: form.domain || "",
            },
          }),
        });
        if (res.ok) deployed.push("Website");
        else failed.push("Website");
      }

      setStep(3);
      const portalUrl = `${window.location.origin}/client/${slug}`;
      const msg =
        deployed.length > 0
          ? `Deployed ${deployed.join(", ")} for "${businessName}".${
              pagesScraped > 0 ? ` Scraped ${pagesScraped} pages for context.` : ""
            }${failed.length > 0 ? ` Failed: ${failed.join(", ")}.` : ""}\n\nClient portal link (shareable):\n${portalUrl}`
          : "No services were deployed. Please select at least one service and fill in the required fields.";

      setResult({ success: deployed.length > 0, message: msg, slug });
      onDeployed();
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
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
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <span className="bg-gradient-to-r from-purple-500 to-accent bg-clip-text text-transparent">
                  Quick Deploy
                </span>
              </h2>
              <p className="text-text-muted text-xs mt-1">
                Set up AI voice agent, chatbot, and website in one go. Toggle off any service you
                don&apos;t need.
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
              <span className="text-4xl block mb-3">
                {result.success ? "\uD83D\uDE80" : "\u274C"}
              </span>
              <p
                className={`text-sm font-medium mb-2 ${
                  result.success ? "text-success" : "text-red-400"
                }`}
              >
                {result.success ? "Services Deployed!" : "Deployment Failed"}
              </p>
              <p className="text-text-muted text-xs leading-relaxed whitespace-pre-line">
                {result.message.split("\n\nClient portal")[0]}
              </p>
            </div>

            {/* Shareable Client Link */}
            {result.success && result.slug && (
              <div className="mt-4 bg-bg-primary border border-border rounded-xl p-4">
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Shareable Client Link
                </p>
                <p className="text-text-muted text-xs mb-2">
                  Text this link to your client so they can see what&apos;s been set up:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/80 text-accent text-xs p-3 rounded-lg font-mono break-all select-all">
                    {typeof window !== "undefined" && window.location.origin}/client/{result.slug}
                  </code>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${window.location.origin}/client/${result.slug}`
                      )
                    }
                    className="px-3 py-2 text-xs bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              {result.success && (
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors"
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
          <form onSubmit={handleQuickDeploy} className="p-6 space-y-5">
            {/* Service Toggles */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Services to Deploy
              </label>
              <div className="flex gap-3">
                {(
                  [
                    { key: "voiceAgent" as const, label: "AI Voice Agent", icon: "\uD83D\uDCDE" },
                    { key: "chatbot" as const, label: "AI Chatbot", icon: "\uD83D\uDCAC" },
                    { key: "website" as const, label: "Website", icon: "\uD83C\uDF10" },
                  ] as const
                ).map((svc) => (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() => setServices((p) => ({ ...p, [svc.key]: !p[svc.key] }))}
                    className={`flex-1 flex items-center gap-2 p-3 rounded-xl border text-left text-sm transition-all ${
                      services[svc.key]
                        ? "border-accent bg-accent/10 text-text-primary"
                        : "border-border bg-bg-primary/30 text-text-muted opacity-60"
                    }`}
                  >
                    <span className="text-lg">{svc.icon}</span>
                    <span className="font-medium text-xs">{svc.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Core Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.businessName || ""}
                  onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
                  className={inputClasses}
                  placeholder="ABC Plumbing"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Industry <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.industry || ""}
                  onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
                  className={inputClasses}
                  placeholder="e.g., HVAC, Dental"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Website URL <span className="text-red-400">*</span>
              </label>
              <input
                required
                value={form.websiteUrl || ""}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                onBlur={(e) => {
                  if (e.target.value && !/^https?:\/\//i.test(e.target.value))
                    setForm((p) => ({ ...p, websiteUrl: "https://" + e.target.value }));
                }}
                className={inputClasses}
                placeholder="https://abcplumbing.com (we'll scan this to build AI context)"
              />
              <p className="text-text-muted text-xs mt-1">
                We&apos;ll scrape your website to automatically train the AI voice agent and chatbot.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Business Phone</label>
                <input
                  value={form.businessPhone || ""}
                  onChange={(e) => setForm((p) => ({ ...p, businessPhone: e.target.value }))}
                  className={inputClasses}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Booking/Calendar URL
                </label>
                <input
                  value={form.bookingUrl || ""}
                  onChange={(e) => setForm((p) => ({ ...p, bookingUrl: e.target.value }))}
                  className={inputClasses}
                  placeholder="https://calendly.com/..."
                />
              </div>
            </div>

            {/* Conditional: Vapi key if voice agent is selected */}
            {services.voiceAgent && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Vapi API Key <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.vapiApiKey || ""}
                  onChange={(e) => setForm((p) => ({ ...p, vapiApiKey: e.target.value }))}
                  className={inputClasses}
                  placeholder="Client's Vapi API key from dashboard.vapi.ai"
                />
              </div>
            )}

            {/* Optional extras - collapsible */}
            <details className="group">
              <summary className="text-xs text-accent cursor-pointer font-medium hover:text-accent-dark transition-colors">
                More options (contact info, services list, brand color...)
              </summary>
              <div className="mt-3 space-y-4 pt-3 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Contact Name</label>
                    <input
                      value={form.contactName || ""}
                      onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                      className={inputClasses}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail || ""}
                      onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                      className={inputClasses}
                      placeholder="john@abcplumbing.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Services Offered
                  </label>
                  <textarea
                    value={form.servicesOffered || ""}
                    onChange={(e) => setForm((p) => ({ ...p, servicesOffered: e.target.value }))}
                    className={inputClasses + " min-h-[60px] resize-y"}
                    placeholder="List the main services (one per line)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">Brand Color</label>
                    <input
                      value={form.brandColor || ""}
                      onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))}
                      className={inputClasses}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">
                      Transfer-to Number
                    </label>
                    <input
                      value={form.transferNumber || ""}
                      onChange={(e) => setForm((p) => ({ ...p, transferNumber: e.target.value }))}
                      className={inputClasses}
                      placeholder="Number for live transfers"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Business Hours</label>
                  <input
                    value={form.businessHours || ""}
                    onChange={(e) => setForm((p) => ({ ...p, businessHours: e.target.value }))}
                    className={inputClasses}
                    placeholder="Mon-Fri 8am-6pm MST"
                  />
                </div>
              </div>
            </details>

            {/* Progress indicator during deploy */}
            {deploying && (
              <div className="bg-bg-primary border border-accent/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
                  <p className="text-sm text-text-secondary">
                    {step === 1 && "Scanning website to build AI knowledge base..."}
                    {step === 2 && "Deploying selected services..."}
                  </p>
                </div>
              </div>
            )}

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
                className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-accent text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-accent-dark transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                {deploying ? "Deploying..." : "Deploy All"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
