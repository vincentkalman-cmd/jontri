"use client";

import { TIERS, type Tier } from "@/lib/tiers";
import { TierCard } from "./TierCard";

interface TierSelectorProps {
  onDeployTier: (tier: Tier) => void;
  onSwitchToAlaCarte: () => void;
}

export function TierSelector({ onDeployTier, onSwitchToAlaCarte }: TierSelectorProps) {
  return (
    <div>
      {/* Section header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          AI Automation Packages
        </h2>
        <p className="text-text-secondary max-w-xl mx-auto">
          Choose a managed package for predictable results and pricing, or pick
          individual services below.
        </p>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} onDeploy={onDeployTier} />
        ))}
      </div>

      {/* A la carte link */}
      <div className="text-center">
        <button
          onClick={onSwitchToAlaCarte}
          className="text-text-muted hover:text-accent text-sm transition-colors group"
        >
          Or pick individual services{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1">
            &rarr;
          </span>
        </button>
      </div>
    </div>
  );
}
