"use client";

import type { Campaign } from "@/lib/outreach-types";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-border text-text-muted",
  discovering: "bg-accent/15 text-accent",
  qualifying: "bg-purple-500/15 text-purple-400",
  generating: "bg-yellow-500/15 text-yellow-400",
  sending: "bg-orange-500/15 text-orange-400",
  completed: "bg-success/15 text-success",
  failed: "bg-red-500/15 text-red-400",
};

interface CampaignListProps {
  campaigns: Campaign[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (campaign: Campaign) => void;
  onNewCampaign: () => void;
}

export function CampaignList({
  campaigns,
  loading,
  selectedId,
  onSelect,
  onNewCampaign,
}: CampaignListProps) {
  if (loading) {
    return <p className="text-text-muted text-center py-12">Loading campaigns...</p>;
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 bg-bg-card border border-border rounded-xl">
        <span className="text-5xl block mb-4">{"\uD83D\uDD0E"}</span>
        <p className="text-text-secondary text-lg mb-2">No campaigns yet</p>
        <p className="text-text-muted text-sm mb-6">
          Create your first outreach campaign to start discovering and qualifying leads.
        </p>
        <button
          onClick={onNewCampaign}
          className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors"
        >
          + New Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        Campaigns ({campaigns.length})
      </h3>
      {campaigns.map((campaign) => (
        <button
          key={campaign.id}
          onClick={() => onSelect(campaign)}
          className={`w-full text-left bg-bg-card border rounded-xl p-4 hover:bg-bg-card-hover transition-colors ${
            selectedId === campaign.id
              ? "border-accent/50 bg-bg-card-hover"
              : "border-border"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-text-primary font-semibold text-sm truncate">
              {campaign.name}
            </h4>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                STATUS_COLORS[campaign.status] || STATUS_COLORS.draft
              }`}
            >
              {campaign.status}
            </span>
          </div>
          <p className="text-text-muted text-xs truncate">{campaign.query}</p>
          <div className="flex gap-4 mt-2 text-xs text-text-muted">
            {campaign.stats?.leadsFound > 0 && (
              <span>{campaign.stats.leadsFound} leads</span>
            )}
            {campaign.stats?.leadsQualified > 0 && (
              <span>{campaign.stats.leadsQualified} qualified</span>
            )}
            {campaign.stats?.emailsSent > 0 && (
              <span>{campaign.stats.emailsSent} sent</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
