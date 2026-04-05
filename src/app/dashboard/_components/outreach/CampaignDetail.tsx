"use client";

import { useState, useEffect } from "react";
import type { Campaign, Lead, PipelineStage } from "@/lib/outreach-types";
import { PIPELINE_STAGES } from "@/lib/outreach-types";

interface CampaignDetailProps {
  campaign: Campaign;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  discovered: "text-text-muted",
  qualified: "text-accent",
  disqualified: "text-red-400",
  email_generated: "text-yellow-400",
  sent: "text-success",
};

export function CampaignDetail({ campaign, onClose, onRefresh }: CampaignDetailProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningStage, setRunningStage] = useState<PipelineStage | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, message: "" });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, [campaign.id]);

  async function fetchLeads() {
    try {
      const res = await fetch(`/api/outreach/campaigns/${campaign.id}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
    }
  }

  async function runStage(stage: PipelineStage) {
    setRunningStage(stage);
    setProgress({ current: 0, total: 0, message: `Starting ${stage}...` });

    try {
      const res = await fetch(
        `/api/outreach/campaigns/${campaign.id}/${stage}`,
        { method: "POST" }
      );
      if (res.ok) {
        await fetchLeads();
        onRefresh();
      }
    } catch {
      // Handle error
    } finally {
      setRunningStage(null);
    }
  }

  // Determine which stages are available
  const stagesForMode = campaign.mode === "website-agent"
    ? PIPELINE_STAGES
    : PIPELINE_STAGES.filter((s) => s.key !== "score-sites");

  const qualifiedLeads = leads.filter((l) => l.ai_score && l.ai_score >= (campaign.config?.minScore || 6));
  const emailReady = leads.filter((l) => l.email_subject);
  const sentLeads = leads.filter((l) => l.email_status === "sent");

  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 sticky top-24">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-text-primary">{campaign.name}</h2>
          <p className="text-text-muted text-sm">
            {campaign.query} &middot;{" "}
            <span className="capitalize">{campaign.mode}</span> mode
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-text-muted border border-border rounded-lg text-xs hover:text-text-primary transition-colors"
        >
          Close
        </button>
      </div>

      {/* Pipeline stepper */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-secondary mb-3">Pipeline</h3>
        <div className="flex gap-2">
          {stagesForMode.map((stage) => {
            const isRunning = runningStage === stage.key;
            const isDone =
              (stage.key === "discover" && leads.length > 0) ||
              (stage.key === "qualify" && qualifiedLeads.length > 0) ||
              (stage.key === "score-sites" && leads.some((l) => l.site_score !== null)) ||
              (stage.key === "generate-emails" && emailReady.length > 0) ||
              (stage.key === "send" && sentLeads.length > 0);

            return (
              <button
                key={stage.key}
                onClick={() => !isRunning && runStage(stage.key)}
                disabled={isRunning}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  isDone
                    ? "border-success/30 bg-success/5"
                    : isRunning
                    ? "border-accent/50 bg-accent/10 animate-pulse"
                    : "border-border hover:border-accent/30 bg-bg-primary/30"
                }`}
              >
                <span className="text-xl block">{stage.icon}</span>
                <p className="text-text-primary text-xs font-medium mt-1">
                  {stage.label}
                </p>
                {isDone && (
                  <span className="text-success text-xs">\u2713</span>
                )}
                {isRunning && (
                  <div className="mt-1">
                    <div className="animate-spin w-3 h-3 border border-accent border-t-transparent rounded-full mx-auto" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {runningStage && progress.message && (
          <p className="text-text-muted text-xs mt-2 text-center">
            {progress.message}
          </p>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Discovered", value: leads.length },
          { label: "Qualified", value: qualifiedLeads.length },
          { label: "Emails Ready", value: emailReady.length },
          { label: "Sent", value: sentLeads.length },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-primary/50 border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-text-muted text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Leads table */}
      <div>
        <h3 className="text-sm font-semibold text-text-secondary mb-3">
          Leads {leads.length > 0 && `(${leads.length})`}
        </h3>

        {loading ? (
          <p className="text-text-muted text-center py-8">Loading leads...</p>
        ) : leads.length === 0 ? (
          <div className="text-center py-8 bg-bg-primary/30 border border-border rounded-xl">
            <p className="text-text-muted text-sm">
              No leads yet. Click &quot;Discover Leads&quot; above to start.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-text-muted text-xs font-medium py-2 pr-3">Company</th>
                  <th className="text-left text-text-muted text-xs font-medium py-2 pr-3">Location</th>
                  <th className="text-center text-text-muted text-xs font-medium py-2 pr-3">Score</th>
                  <th className="text-left text-text-muted text-xs font-medium py-2 pr-3">Status</th>
                  <th className="text-left text-text-muted text-xs font-medium py-2">Email</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                    className="border-b border-border/50 hover:bg-bg-card-hover cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 pr-3">
                      <p className="text-text-primary font-medium text-xs">{lead.company}</p>
                      {lead.phone && (
                        <p className="text-text-muted text-xs">{lead.phone}</p>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-text-muted text-xs">
                      {lead.city}{lead.state ? `, ${lead.state}` : ""}
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      {lead.ai_score !== null ? (
                        <span className={`font-bold text-xs ${
                          lead.ai_score >= 7 ? "text-success" :
                          lead.ai_score >= 5 ? "text-yellow-400" :
                          "text-red-400"
                        }`}>
                          {lead.ai_score}/10
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">--</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`text-xs font-medium ${STATUS_COLORS[lead.status] || "text-text-muted"}`}>
                        {lead.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs ${
                        lead.email_status === "sent" ? "text-success" :
                        lead.email_status === "generated" ? "text-yellow-400" :
                        "text-text-muted"
                      }`}>
                        {lead.email_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Lead detail slide */}
        {selectedLead && (
          <div className="mt-4 bg-bg-primary border border-accent/20 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-text-primary font-semibold text-sm">
                {selectedLead.company}
              </h4>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-text-muted hover:text-text-primary text-sm"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              {selectedLead.phone && (
                <div>
                  <span className="text-text-muted">Phone:</span>{" "}
                  <span className="text-text-primary">{selectedLead.phone}</span>
                </div>
              )}
              {selectedLead.website && (
                <div>
                  <span className="text-text-muted">Website:</span>{" "}
                  <span className="text-accent">{selectedLead.website}</span>
                </div>
              )}
              {selectedLead.email && (
                <div>
                  <span className="text-text-muted">Email:</span>{" "}
                  <span className="text-text-primary">{selectedLead.email}</span>
                </div>
              )}
              {selectedLead.rating > 0 && (
                <div>
                  <span className="text-text-muted">Rating:</span>{" "}
                  <span className="text-text-primary">
                    {selectedLead.rating} ({selectedLead.review_count} reviews)
                  </span>
                </div>
              )}
            </div>
            {selectedLead.ai_reasoning && (
              <div className="mb-3">
                <p className="text-text-muted text-xs mb-1">AI Reasoning:</p>
                <p className="text-text-secondary text-xs">{selectedLead.ai_reasoning}</p>
              </div>
            )}
            {selectedLead.pain_points && (
              <div className="mb-3">
                <p className="text-text-muted text-xs mb-1">Pain Points:</p>
                <p className="text-text-secondary text-xs">{selectedLead.pain_points}</p>
              </div>
            )}
            {selectedLead.email_subject && (
              <div className="bg-bg-card border border-border rounded-lg p-3">
                <p className="text-text-muted text-xs mb-1">Email Preview:</p>
                <p className="text-accent text-xs font-medium mb-1">
                  Subject: {selectedLead.email_subject}
                </p>
                <p className="text-text-secondary text-xs whitespace-pre-line leading-relaxed">
                  {selectedLead.email_body}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
