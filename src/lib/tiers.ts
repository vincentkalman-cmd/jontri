export interface TierService {
  key: string;
  label: string;
  icon: string;
}

export interface Tier {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  priceSubtext?: string;
  monthlyRateCents: number;
  services: TierService[];
  highlighted?: boolean;
  includesTier?: string;
}

export const TIERS: Tier[] = [
  {
    id: "tier-1",
    name: "AI Lead Engine",
    subtitle: "Fill your pipeline on autopilot",
    price: "$1,500",
    monthlyRateCents: 150_000,
    services: [
      { key: "voice-agent", label: "AI Voice Agent (24/7 Call Answering)", icon: "\u{1F4DE}" },
      { key: "prospector", label: "AI Lead Prospecting (Daily)", icon: "\u{1F3AF}" },
      { key: "chatbot", label: "AI Chatbot (After-Hours Lead Capture)", icon: "\u{1F4AC}" },
    ],
  },
  {
    id: "tier-2",
    name: "AI Operations Suite",
    subtitle: "Run your business with AI co-pilots",
    price: "$3,000",
    monthlyRateCents: 300_000,
    highlighted: true,
    includesTier: "tier-1",
    services: [
      { key: "review-mgmt", label: "AI Review Management", icon: "\u2B50" },
      { key: "seo-audit", label: "SEO Optimization", icon: "\u{1F50D}" },
      { key: "follow-up", label: "Automated Follow-Up Sequences", icon: "\u{1F4E7}" },
      { key: "reporting", label: "Monthly Reporting Dashboard", icon: "\u{1F4CA}" },
    ],
  },
  {
    id: "tier-3",
    name: "Full AI Transformation",
    subtitle: "Your dedicated AI department",
    price: "$5,000+",
    priceSubtext: "Custom pricing",
    monthlyRateCents: 500_000,
    includesTier: "tier-2",
    services: [
      { key: "ai-seo", label: "AI Platform SEO (ChatGPT, Perplexity, AI Overviews)", icon: "\u{1F916}" },
      { key: "n8n-workflows", label: "Custom Workflow Automation", icon: "\u2699\uFE0F" },
      { key: "ai-estimating", label: "AI-Powered Estimating & Quoting", icon: "\u{1F4B0}" },
      { key: "strategy-calls", label: "Dedicated Strategy Calls", icon: "\u{1F91D}" },
    ],
  },
];

/**
 * Get all service keys included in a tier (including inherited tiers).
 */
export function getTierServices(tierId: string): string[] {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) return [];

  const ownKeys = tier.services.map((s) => s.key);

  if (tier.includesTier) {
    return [...getTierServices(tier.includesTier), ...ownKeys];
  }

  return ownKeys;
}

/**
 * Get all service objects for a tier (including inherited).
 */
export function getTierServiceObjects(tierId: string): TierService[] {
  const tier = TIERS.find((t) => t.id === tierId);
  if (!tier) return [];

  if (tier.includesTier) {
    return [...getTierServiceObjects(tier.includesTier), ...tier.services];
  }

  return [...tier.services];
}

/**
 * Find which tier a service belongs to (the lowest tier that includes it).
 */
export function getServiceTier(serviceKey: string): Tier | null {
  for (const tier of TIERS) {
    if (tier.services.some((s) => s.key === serviceKey)) {
      return tier;
    }
  }
  return null;
}

/**
 * Get a tier by ID.
 */
export function getTier(tierId: string): Tier | undefined {
  return TIERS.find((t) => t.id === tierId);
}
