"use client";

import type { Tier, TierService } from "@/lib/tiers";
import { getTierServiceObjects } from "@/lib/tiers";

interface TierCardProps {
  tier: Tier;
  onDeploy: (tier: Tier) => void;
}

export function TierCard({ tier, onDeploy }: TierCardProps) {
  const allServices = getTierServiceObjects(tier.id);
  const inheritedServices = tier.includesTier
    ? getTierServiceObjects(tier.includesTier)
    : [];

  return (
    <div
      className={`relative bg-bg-card rounded-2xl border p-6 flex flex-col transition-all hover:shadow-xl ${
        tier.highlighted
          ? "border-accent/50 shadow-lg shadow-accent/10 ring-1 ring-accent/20"
          : "border-border hover:border-accent/30"
      }`}
    >
      {/* Most Popular badge */}
      {tier.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-accent to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg shadow-accent/30">
            Most Popular
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-text-primary">{tier.name}</h3>
        <p className="text-text-muted text-sm mt-1">{tier.subtitle}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold text-text-primary tracking-tight">
            {tier.price}
          </span>
          <span className="text-text-muted text-sm">/mo</span>
        </div>
        {tier.priceSubtext && (
          <p className="text-text-muted text-xs mt-1">{tier.priceSubtext}</p>
        )}
      </div>

      {/* Includes previous tier */}
      {tier.includesTier && inheritedServices.length > 0 && (
        <div className="mb-4 bg-accent/5 border border-accent/15 rounded-lg px-3 py-2">
          <p className="text-accent text-xs font-semibold mb-1.5">
            Everything in{" "}
            {tier.includesTier === "tier-1"
              ? "AI Lead Engine"
              : "AI Operations Suite"}
            , plus:
          </p>
        </div>
      )}

      {/* Services list */}
      <ul className="space-y-3 mb-8 flex-1">
        {tier.services.map((svc: TierService) => (
          <li key={svc.key} className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5">{svc.icon}</span>
            <span className="text-text-secondary text-sm">{svc.label}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <button
        onClick={() => onDeploy(tier)}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
          tier.highlighted
            ? "bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35"
            : "bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20 hover:border-accent/50"
        }`}
      >
        Deploy This Package
      </button>
    </div>
  );
}
