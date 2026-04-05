"use client";

import { useState } from "react";
import type { Tier } from "@/lib/tiers";
import { getTierServices, getTierServiceObjects } from "@/lib/tiers";

interface TierDeployModalProps {
  tier: Tier;
  onClose: () => void;
  onDeployed: () => void;
}

const inputClasses =
  "w-full bg-bg-card border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors";

export function TierDeployModal({ tier, onClose, onDeployed }: TierDeployModalProps) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [deploying, setDeploying] = useState(false);
  const [step, setStep] = useState(0); // 0=form, 1=scraping, 2=deploying, 3=done
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    slug?: string;
    deployed: string[];
    failed: string[];
  } | null>(null);

  const allServices = getTierServiceObjects(tier.id);
  const serviceKeys = getTierServices(tier.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDeploying(true);
    setResult(null);

    const businessName = form.businessName || "Unnamed";
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    try {
      // Step 1: Scrape website for AI context
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
          // Not a blocker
        }
      }

      // Step 2: Create client with tier and deploy all services
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

      // Deploy each service in the tier
      for (const key of serviceKeys) {
        const serviceConfig = { ...baseConfig } as Record<string, string>;

        // Add service-specific fields
        if (key === "voice-agent" && form.vapiApiKey) {
          serviceConfig.vapiApiKey = form.vapiApiKey;
          serviceConfig.transferNumber = form.transferNumber || "";
        }
        if (key === "chatbot") {
          serviceConfig.primaryColor = form.brandColor || "#3B82F6";
          serviceConfig.leadEmail = form.contactEmail || "";
        }
        if (key === "website") {
          serviceConfig.brandColor = form.brandColor || "#3B82F6";
          serviceConfig.domain = form.domain || "";
        }
        if (key === "seo-audit") {
          serviceConfig.targetKeywords = form.targetKeywords || "";
          serviceConfig.targetLocation = form.targetLocation || "";
        }

        try {
          const res = await fetch("/api/clients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: businessName,
              industry: form.industry || "",
              contactName: form.contactName || "",
              contactEmail: form.contactEmail || "",
              contactPhone: form.businessPhone || "",
              service: key,
              serviceConfig,
              tierId: tier.id,
              billingType: "tier",
              monthlyRate: tier.monthlyRateCents,
            }),
          });
          if (res.ok) {
            const svc = allServices.find((s) => s.key === key);
            deployed.push(svc?.label || key);
          } else {
            failed.push(key);
          }
        } catch {
          failed.push(key);
        }
      }

      setStep(3);
      const portalUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/client/${slug}`
          : `/client/${slug}`;

      setResult({
        success: deployed.length > 0,
        message:
          deployed.length > 0
            ? `${tier.name} package deployed for "${businessName}" with ${deployed.length} services.${
                pagesScraped > 0
                  ? ` Scraped ${pagesScraped} pages for AI context.`
                  : ""
              }${
                failed.length > 0 ? ` Failed: ${failed.join(", ")}.` : ""
              }`
            : "No services were deployed. Please check the required fields.",
        slug,
        deployed,
        failed,
      });
      onDeployed();
    } catch {
      setResult({
        success: false,
        message: "Network error. Please try again.",
        deployed: [],
        failed: [],
      });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-secondary border border-border rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-bg-secondary border-b border-border p-6 pb-4 z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="bg-gradient-to-r from-accent to-purple-500 bg-clip-text text-transparent text-lg font-bold">
                  {tier.name}
                </span>
                <span className="text-text-muted text-sm">
                  {tier.price}/mo
                </span>
              </div>
              <p className="text-text-muted text-xs mt-1">
                Deploy {allServices.length} AI services for a client
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
          <div className="p-6">
            <div
              className={`rounded-xl border p-6 text-center ${
                result.success
                  ? "border-success/30 bg-success/5"
                  : "border-red-400/30 bg-red-400/5"
              }`}
            >
              <span className="text-4xl block mb-3">
                {result.success ? "\u{1F680}" : "\u274C"}
              </span>
              <p
                className={`text-sm font-medium mb-2 ${
                  result.success ? "text-success" : "text-red-400"
                }`}
              >
                {result.success
                  ? "Package Deployed!"
                  : "Deployment Failed"}
              </p>
              <p className="text-text-muted text-xs leading-relaxed">
                {result.message}
              </p>
            </div>

            {/* Services deployed list */}
            {result.deployed.length > 0 && (
              <div className="mt-4 space-y-2">
                {result.deployed.map((svc) => (
                  <div
                    key={svc}
                    className="flex items-center gap-2 text-xs text-success"
                  >
                    <span>\u2713</span>
                    <span>{svc}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Portal link */}
            {result.success && result.slug && (
              <div className="mt-4 bg-bg-primary border border-border rounded-xl p-4">
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Client Portal Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-black/80 text-accent text-xs p-3 rounded-lg font-mono break-all select-all">
                    {typeof window !== "undefined"
                      ? window.location.origin
                      : ""}
                    /client/{result.slug}
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
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-text-secondary border border-border rounded-lg text-sm hover:text-text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Services included */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Services Included
              </label>
              <div className="flex flex-wrap gap-2">
                {allServices.map((svc) => (
                  <span
                    key={svc.key}
                    className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full font-medium border border-accent/20"
                  >
                    <span>{svc.icon}</span>
                    {svc.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Core fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.businessName || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, businessName: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setForm((p) => ({ ...p, industry: e.target.value }))
                  }
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
                onChange={(e) =>
                  setForm((p) => ({ ...p, websiteUrl: e.target.value }))
                }
                onBlur={(e) => {
                  if (
                    e.target.value &&
                    !/^https?:\/\//i.test(e.target.value)
                  ) {
                    setForm((p) => ({
                      ...p,
                      websiteUrl: "https://" + e.target.value,
                    }));
                  }
                }}
                className={inputClasses}
                placeholder="https://abcplumbing.com"
              />
              <p className="text-text-muted text-xs mt-1">
                We&apos;ll scan this to train the AI voice agent and chatbot.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Business Phone
                </label>
                <input
                  value={form.businessPhone || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, businessPhone: e.target.value }))
                  }
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
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bookingUrl: e.target.value }))
                  }
                  className={inputClasses}
                  placeholder="https://calendly.com/..."
                />
              </div>
            </div>

            {/* Vapi key (needed for voice agent in Tier 1+) */}
            {serviceKeys.includes("voice-agent") && (
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">
                  Vapi API Key <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.vapiApiKey || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, vapiApiKey: e.target.value }))
                  }
                  className={inputClasses}
                  placeholder="Client's Vapi API key"
                />
              </div>
            )}

            {/* More options */}
            <details className="group">
              <summary className="text-xs text-accent cursor-pointer font-medium hover:text-accent-dark transition-colors">
                More options (contact info, brand color, services list...)
              </summary>
              <div className="mt-3 space-y-4 pt-3 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">
                      Contact Name
                    </label>
                    <input
                      value={form.contactName || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          contactName: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          contactEmail: e.target.value,
                        }))
                      }
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
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        servicesOffered: e.target.value,
                      }))
                    }
                    className={inputClasses + " min-h-[60px] resize-y"}
                    placeholder="List main services (one per line)"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-1.5">
                      Brand Color
                    </label>
                    <input
                      value={form.brandColor || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          brandColor: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          transferNumber: e.target.value,
                        }))
                      }
                      className={inputClasses}
                      placeholder="Number for live transfers"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Progress */}
            {deploying && (
              <div className="bg-bg-primary border border-accent/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
                  <p className="text-sm text-text-secondary">
                    {step === 1 && "Scanning website for AI context..."}
                    {step === 2 && "Deploying services..."}
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
                className="px-6 py-2.5 bg-gradient-to-r from-accent to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-accent-dark hover:to-purple-600 transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
              >
                {deploying
                  ? "Deploying..."
                  : `Deploy ${tier.name} Package`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
