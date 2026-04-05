"use client";

import { useState, useEffect } from "react";
import type { Campaign } from "@/lib/outreach-types";
import { CampaignList } from "./CampaignList";
import { CampaignBuilder } from "./CampaignBuilder";
import { CampaignDetail } from "./CampaignDetail";

export function OutreachDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/outreach/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // API may not exist yet
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Outreach Hub
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            Discover leads, qualify with AI, and send personalized campaigns — all in one place
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-accent to-purple-500 text-white rounded-lg text-sm font-semibold hover:from-accent-dark hover:to-purple-600 transition-all shadow-lg shadow-accent/20"
        >
          + New Campaign
        </button>
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Campaign list */}
        <div className={`transition-all ${selectedCampaign ? "w-1/3 flex-shrink-0" : "w-full"}`}>
          <CampaignList
            campaigns={campaigns}
            loading={loading}
            selectedId={selectedCampaign?.id || null}
            onSelect={setSelectedCampaign}
            onNewCampaign={() => setShowBuilder(true)}
          />
        </div>

        {/* Campaign detail */}
        {selectedCampaign && (
          <div className="flex-1 min-w-0">
            <CampaignDetail
              campaign={selectedCampaign}
              onClose={() => setSelectedCampaign(null)}
              onRefresh={fetchCampaigns}
            />
          </div>
        )}
      </div>

      {/* Builder modal */}
      {showBuilder && (
        <CampaignBuilder
          onClose={() => setShowBuilder(false)}
          onCreated={() => {
            setShowBuilder(false);
            fetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
