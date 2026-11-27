"use client";

import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  LuPhoneCall, LuMessagesSquare, LuGlobe, LuCrosshair, LuSearch, LuStar, LuSparkles, LuRepeat,
  LuChartBar, LuWorkflow, LuCalculator, LuHandshake, LuSettings, LuCheck, LuCalendar, LuWrench,
} from "react-icons/lu";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Kicker, PageGlow, panelCls, primaryBtn, ghostBtn, inputCls } from "@/components/site/ui";
import type { PortalServiceView } from "@/lib/portal-view";
import type { Stage } from "@/lib/lifecycle";

const SCORE_LABELS: Record<string, string> = { seo: "Google SEO", ai: "AI search", speed: "Speed & mobile", trust: "Trust signals" };

const SERVICE_META: Record<string, { label: string; icon: IconType; description: string }> = {
  "voice-agent": { label: "AI Voice Agent", icon: LuPhoneCall, description: "24/7 AI-powered phone agent handling calls, booking appointments, and answering questions." },
  chatbot: { label: "AI Chatbot", icon: LuMessagesSquare, description: "Website chatbot that answers visitor questions, captures leads, and books meetings." },
  website: { label: "AI Website", icon: LuGlobe, description: "AI-optimized website built for conversions, SEO, and mobile performance." },
  prospector: { label: "Lead Generation", icon: LuCrosshair, description: "Automated lead prospecting, qualification, and personalized outreach." },
  "seo-audit": { label: "SEO Optimization", icon: LuSearch, description: "Ongoing SEO monitoring, keyword tracking, and optimization recommendations." },
  "review-mgmt": { label: "Review Management", icon: LuStar, description: "Automated review monitoring, responses, and reputation management." },
  "ai-seo": { label: "AI Platform SEO", icon: LuSparkles, description: "Optimized for AI search engines — ChatGPT, Perplexity, Google AI Overviews." },
  "follow-up": { label: "Automated Follow-Ups", icon: LuRepeat, description: "Intelligent follow-up sequences that nurture leads automatically." },
  reporting: { label: "Reporting Dashboard", icon: LuChartBar, description: "Monthly performance reports with AI-powered insights." },
  "n8n-workflows": { label: "Custom Workflows", icon: LuWorkflow, description: "Custom automation workflows tailored to your business processes." },
  "ai-estimating": { label: "AI Estimating", icon: LuCalculator, description: "AI-powered estimating and quoting for faster, more accurate proposals." },
  "strategy-calls": { label: "Strategy Calls", icon: LuHandshake, description: "Dedicated strategy sessions with your AI automation team." },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Setting Up", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  configured: { label: "Configured", color: "bg-accent/15 text-accent-light border-accent/30" },
  active: { label: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  completed: { label: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  dry_run: { label: "Testing", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  needs_setup: { label: "Waiting on info", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  manual: { label: "In progress", color: "bg-accent/15 text-accent-light border-accent/30" },
  error: { label: "Being fixed", color: "bg-red-500/15 text-red-400 border-red-500/30" },
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

interface Props {
  token: string;
  name: string;
  industry: string;
  slug: string;
  stage: Stage;
  steps: { key: Stage; label: string; state: "done" | "current" | "upcoming" }[];
  services: Record<string, PortalServiceView>;
  needs: { id: string; label: string; done: boolean }[];
  progress: { done: number; total: number };
  bookingUrl: string;
  chatColor: string;
}

export function PortalView(p: Props) {
  const [stage, setStage] = useState<Stage>(p.stage);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState<"" | "approve" | "changes">("");
  const [message, setMessage] = useState("");
  const hasChatbot = Boolean(p.services.chatbot);
  const voice = p.services["voice-agent"];
  const serviceEntries = Object.entries(p.services);

  // Load the client's own chatbot so they can try it (bottom-right bubble).
  useEffect(() => {
    if (!hasChatbot) return;
    const s = document.createElement("script");
    s.src = `/api/chatbot?client=${encodeURIComponent(p.slug)}&color=${encodeURIComponent(p.chatColor)}`;
    s.async = true;
    document.body.appendChild(s);
    return () => {
      s.remove();
    };
  }, [hasChatbot, p.slug, p.chatColor]);

  async function send(action: "approve" | "changes") {
    if (action === "changes" && !note.trim()) {
      setMessage("Tell us what you'd like changed.");
      return;
    }
    setSending(action);
    setMessage("");
    try {
      const res = await fetch(`/api/portal/${encodeURIComponent(p.token)}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStage(data.stage);
      setNote("");
      setMessage(action === "approve" ? "Approved. Your AI crew is live." : "Got it. We'll make the changes and let you know.");
    } catch {
      setMessage("Couldn't reach us. Check your connection and try again.");
    } finally {
      setSending("");
    }
  }

  // Timeline from the live stage (it changes after Approve / Request changes).
  const idx = Math.max(0, p.steps.findIndex((x) => x.key === stage));

  return (
    <>
      <SiteNav minimal />
      <div className="relative min-h-screen overflow-hidden bg-bg-primary">
        <PageGlow />
        <header className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-6">
          <Kicker>Client portal</Kicker>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">{p.name}</h1>
          {p.industry && <p className="text-text-secondary mt-2">{p.industry}</p>}
        </header>

        <main className="relative max-w-4xl mx-auto px-4 sm:px-6 pb-16 space-y-8">
          {/* Timeline */}
          <section aria-label="Progress" className={`${panelCls} p-5 sm:p-6`}>
            <ol className="grid grid-cols-5 gap-1 sm:gap-2">
              {p.steps.map((s, i) => {
                const done = i < idx;
                const current = i === idx;
                return (
                  <li key={s.key} className="flex flex-col items-center text-center gap-2" aria-current={current ? "step" : undefined}>
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        done
                          ? "bg-accent text-accent-ink"
                          : current
                            ? "bg-accent/15 text-accent shadow-[inset_0_0_0_2px_var(--color-accent)]"
                            : "bg-white/[.04] text-text-muted"
                      }`}
                    >
                      {done ? <LuCheck size={16} aria-hidden /> : i + 1}
                    </span>
                    <span className={`text-[11px] sm:text-xs leading-tight ${current ? "text-text-primary font-semibold" : "text-text-muted"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ol>
            {(stage === "proposal" || stage === "paused") && (
              <p className="mt-4 text-sm text-text-secondary text-center">
                {stage === "proposal" ? "We're preparing your custom proposal." : "Your services are paused. Reply to any Jontri email to restart."}
              </p>
            )}
            {(stage === "signed_up" || stage === "kickoff" || stage === "proposal") && (
              <div className="mt-5 flex justify-center">
                <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} ${focusRing}`}>
                  <LuCalendar size={18} aria-hidden /> Book your kickoff call
                </a>
              </div>
            )}
          </section>

          {/* What we need from you */}
          {p.needs.length > 0 && (
            <section aria-labelledby="needs-h">
              <h2 id="needs-h" className="text-2xl font-bold text-text-primary mb-1">What we need from you</h2>
              <p className="text-text-muted text-sm mb-3">
                Setup progress: {p.progress.done} of {p.progress.total} steps done
              </p>
              <ul className="space-y-2">
                {p.needs.map((n) => (
                  <li key={n.id} className={`${panelCls} px-4 py-3 flex items-center gap-3 text-sm`}>
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${n.done ? "bg-accent text-accent-ink" : "bg-white/[.06] text-text-muted"}`}
                      aria-hidden
                    >
                      {n.done ? <LuCheck size={14} /> : null}
                    </span>
                    <span className={n.done ? "text-text-muted line-through" : "text-text-primary"}>
                      {n.label}
                      <span className="sr-only">{n.done ? " (done)" : " (to do)"}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Try it */}
          {(hasChatbot || voice?.phoneNumber) && (
            <section aria-labelledby="try-h" className={`${panelCls} p-6`}>
              <h2 id="try-h" className="text-2xl font-bold text-text-primary mb-2">Try it yourself</h2>
              {hasChatbot && <p className="text-text-secondary text-sm">Your chatbot is in the bottom-right corner of this page. Ask it what a customer would.</p>}
              {voice?.phoneNumber && (
                <p className="text-text-secondary text-sm mt-2">
                  Call your AI receptionist:{" "}
                  <a href={`tel:${voice.phoneNumber}`} className={`text-accent font-semibold underline-offset-4 hover:underline active:opacity-80 rounded ${focusRing}`}>
                    {voice.phoneNumber}
                  </a>
                </p>
              )}
            </section>
          )}

          {/* Services */}
          <section aria-labelledby="crew-h">
            <h2 id="crew-h" className="text-2xl font-bold text-text-primary mb-1">Your AI crew</h2>
            <p className="text-text-secondary text-sm mb-4">Everything Jontri is setting up for your business, and its current status.</p>
            {serviceEntries.length === 0 ? (
              <div className={`text-center py-16 ${panelCls}`}>
                <LuWrench size={30} className="mx-auto mb-3 text-accent" aria-hidden />
                <p className="text-text-secondary text-sm">We&apos;ll list your services here after your kickoff call.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceEntries.map(([key, svc]) => {
                  const meta = SERVICE_META[key] || { label: key, icon: LuSettings, description: "" };
                  const Icon = meta.icon;
                  const statusInfo = STATUS_LABELS[svc.status] || { label: svc.status, color: "bg-border text-text-muted border-border" };
                  return (
                    <div key={key} className={`${panelCls} p-6`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/12 text-accent">
                            <Icon size={20} aria-hidden />
                          </span>
                          <div>
                            <h3 className="text-text-primary font-semibold">{meta.label}</h3>
                            <p className="text-text-muted text-xs">{meta.description}</p>
                          </div>
                        </div>
                        <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${statusInfo.color}`}>{statusInfo.label}</span>
                      </div>

                      {svc.scores && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(svc.scores).map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-bg-primary/60 border border-border p-3 text-center">
                              <p className="text-2xl font-display font-extrabold text-text-primary leading-none">{v}</p>
                              <p className="text-[11px] text-text-muted mt-1.5">{SCORE_LABELS[k] || k}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {svc.fixes && svc.fixes.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {svc.fixes.map((f, i) => (
                            <li key={i} className="text-sm text-text-secondary bg-bg-primary/50 border border-border rounded-lg px-3 py-2">
                              <span className="text-text-primary font-medium">{f.label}:</span> {f.fix}
                            </li>
                          ))}
                        </ul>
                      )}

                      {typeof svc.aiScore === "number" && (
                        <p className="mt-4 text-sm text-text-secondary">
                          AI search visibility: <span className="text-text-primary font-semibold">{svc.aiScore}/10</span>
                        </p>
                      )}

                      {svc.recommendations && svc.recommendations.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {svc.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-text-secondary bg-bg-primary/50 border border-border rounded-lg px-3 py-2">
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}

                      {key === "voice-agent" && (svc.businessPhone || svc.phoneNumber) && (
                        <div className="mt-4 bg-bg-primary/50 border border-border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {svc.phoneNumber && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">AI phone number</p>
                              <p className="text-sm text-text-primary font-medium">{svc.phoneNumber}</p>
                            </div>
                          )}
                          {svc.businessPhone && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Business phone</p>
                              <p className="text-sm text-text-primary font-medium">{svc.businessPhone}</p>
                            </div>
                          )}
                          {svc.businessHours && (
                            <div>
                              <p className="text-xs text-text-muted uppercase tracking-wide mb-0.5">Business hours</p>
                              <p className="text-sm text-text-primary">{svc.businessHours}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {key === "chatbot" && svc.embedCode && (
                        <div className="mt-4 bg-bg-primary/50 border border-border rounded-lg p-4">
                          <p className="text-xs text-text-muted mb-2 font-medium">Embed code</p>
                          <p className="text-text-muted text-xs mb-2">Add this to your website, right before the closing &lt;/body&gt; tag (or ask us to do it):</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-black/80 text-accent-light text-xs p-3 rounded-lg font-mono break-all select-all">{svc.embedCode}</code>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(svc.embedCode || "")}
                              className={`min-h-11 px-4 text-xs bg-accent text-accent-ink rounded-lg hover:bg-accent-light active:opacity-80 transition-[background-color,opacity] font-semibold flex-shrink-0 cursor-pointer ${focusRing}`}
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
          </section>

          {/* Review */}
          {(stage === "review" || stage === "live") && (
            <section aria-labelledby="review-h" className={`${panelCls} p-6`}>
              <h2 id="review-h" className="text-2xl font-bold text-text-primary mb-2">
                {stage === "review" ? "Ready for your review" : "Want something changed?"}
              </h2>
              <label htmlFor="fb-note" className="block text-sm text-text-secondary mb-2">
                Notes for the Jontri team{stage === "review" ? " (optional when approving)" : ""}
              </label>
              <textarea id="fb-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} rows={3} className={inputCls} />
              <div className="mt-4 flex flex-wrap gap-3">
                {stage === "review" && (
                  <button type="button" onClick={() => send("approve")} disabled={Boolean(sending)} className={`${primaryBtn} ${focusRing}`}>
                    {sending === "approve" ? "Approving…" : "Approve and go live"}
                  </button>
                )}
                <button type="button" onClick={() => send("changes")} disabled={Boolean(sending)} className={`${ghostBtn} ${focusRing}`}>
                  {sending === "changes" ? "Sending…" : "Request changes"}
                </button>
              </div>
              {message && (
                <p role="status" className="mt-3 text-sm text-text-secondary">
                  {message}
                </p>
              )}
            </section>
          )}
          {message && stage !== "review" && stage !== "live" && (
            <p role="status" className="text-sm text-text-secondary text-center">
              {message}
            </p>
          )}
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
