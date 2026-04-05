"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ServiceDetail {
  status: string;
  businessPhone?: string;
  businessHours?: string;
  embedCode?: string;
}

interface ClientPortal {
  name: string;
  slug: string;
  industry: string;
  status: string;
  services: Record<string, ServiceDetail>;
  createdAt: string;
}

const SERVICE_META: Record<string, { label: string; icon: string; description: string }> = {
  "voice-agent": { label: "AI Voice Agent", icon: "\u{1F4DE}", description: "24/7 AI-powered phone agent handling calls, booking appointments, and answering questions." },
  chatbot: { label: "AI Chatbot", icon: "\u{1F4AC}", description: "Website chatbot that answers visitor questions, captures leads, and books meetings." },
  website: { label: "AI Website", icon: "\u{1F310}", description: "AI-optimized website built for conversions, SEO, and mobile performance." },
  prospector: { label: "Lead Generation", icon: "\u{1F3AF}", description: "Automated lead prospecting, qualification, and personalized outreach." },
  "seo-audit": { label: "SEO Optimization", icon: "\u{1F50D}", description: "Ongoing SEO monitoring, keyword tracking, and optimization recommendations." },
  "review-mgmt": { label: "Review Management", icon: "\u2B50", description: "Automated review monitoring, responses, and reputation management." },
  "ai-seo": { label: "AI Platform SEO", icon: "\u{1F916}", description: "Optimized for AI search engines \u2014 ChatGPT, Perplexity, Google AI Overviews." },
  "follow-up": { label: "Automated Follow-Ups", icon: "\u{1F4E7}", description: "Intelligent follow-up sequences that nurture leads automatically." },
  "reporting": { label: "Reporting Dashboard", icon: "\u{1F4CA}", description: "Monthly performance reports with AI-powered insights." },
  "n8n-workflows": { label: "Custom Workflows", icon: "\u2699\uFE0F", description: "Custom automation workflows tailored to your business processes." },
  "ai-estimating": { label: "AI Estimating", icon: "\u{1F4B0}", description: "AI-powered estimating and quoting for faster, more accurate proposals." },
  "strategy-calls": { label: "Strategy Calls", icon: "\u{1F91D}", description: "Dedicated strategy sessions with your AI automation team." },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Setting Up", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  configured: { label: "Configured", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  active: { label: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  completed: { label: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  dry_run: { label: "Testing", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

export default function ClientPortalPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ClientPortal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/client-portal?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          setError("Client not found");
          return;
        }
        const json = await res.json();
        setData(json);
      })
      .catch(() => setError("Could not load client data"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-6xl mb-4">🔒</p>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Client Not Found</h1>
          <p className="text-text-muted text-sm">This link may be invalid or the client hasn&apos;t been set up yet.</p>
        </div>
      </div>
    );
  }

  const serviceEntries = Object.entries(data.services);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border bg-bg-secondary/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center text-accent font-bold text-lg">
              {data.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{data.name}</h1>
              <p className="text-text-muted text-sm">{data.industry}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Your AI Services</h2>
          <p className="text-text-muted text-sm">
            Here&apos;s an overview of the AI-powered services set up for your business by Jontri Consulting.
          </p>
        </div>

        {serviceEntries.length === 0 ? (
          <div className="text-center py-16 bg-bg-card border border-border rounded-xl">
            <p className="text-4xl mb-3">🔧</p>
            <p className="text-text-secondary text-sm">No services have been deployed yet.</p>
            <p className="text-text-muted text-xs mt-1">Your services will appear here once they&apos;re configured.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {serviceEntries.map(([key, svc]) => {
              const meta = SERVICE_META[key] || { label: key, icon: "⚙️", description: "" };
              const statusInfo = STATUS_LABELS[svc.status] || { label: svc.status, color: "bg-border text-text-muted border-border" };

              return (
                <div key={key} className="bg-bg-card border border-border rounded-xl p-6 hover:border-accent/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{meta.icon}</span>
                      <div>
                        <h3 className="text-text-primary font-semibold">{meta.label}</h3>
                        <p className="text-text-muted text-xs">{meta.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Service-specific details */}
                  {key === "voice-agent" && svc.businessPhone && (
                    <div className="mt-4 bg-bg-primary/50 border border-border rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Business Phone</p>
                          <p className="text-sm text-text-primary font-medium">{svc.businessPhone}</p>
                        </div>
                        {svc.businessHours && (
                          <div>
                            <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Business Hours</p>
                            <p className="text-sm text-text-primary">{svc.businessHours}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {key === "chatbot" && svc.embedCode && (
                    <div className="mt-4 bg-bg-primary/50 border border-border rounded-lg p-4">
                      <p className="text-xs text-text-muted mb-2 font-medium">Embed Code</p>
                      <p className="text-text-muted text-xs mb-2">Add this to your website, right before the closing &lt;/body&gt; tag:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-black/80 text-green-400 text-xs p-3 rounded-lg font-mono break-all select-all">
                          {svc.embedCode}
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(svc.embedCode || "")}
                          className="px-3 py-2 text-xs bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors font-medium flex-shrink-0"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-text-muted text-xs">
            Powered by <a href="https://jontri.com" className="text-accent hover:text-accent-dark transition-colors font-medium">Jontri Consulting</a> &middot; AI-Powered Business Automation
          </p>
          <p className="text-text-muted/50 text-xs mt-1">
            Questions? Contact your account manager or visit jontri.com
          </p>
        </div>
      </main>
    </div>
  );
}
