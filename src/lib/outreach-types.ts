export type PipelineMode = "email" | "website-agent";

export type CampaignStatus =
  | "draft"
  | "discovering"
  | "qualifying"
  | "generating"
  | "sending"
  | "completed"
  | "failed";

export type LeadStatus =
  | "discovered"
  | "qualified"
  | "disqualified"
  | "email_generated"
  | "sent";

export type EmailStatus = "pending" | "generated" | "sent" | "failed";

export type PipelineStage =
  | "discover"
  | "qualify"
  | "generate-emails"
  | "score-sites"
  | "send";

export interface CampaignConfig {
  maxLeads: number;
  minScore: number;
  emailTone: string;
  customGuidelines: string[];
  targetLocation?: string;
  idealCustomer?: string;
  serviceFocus?: string;
  maxSiteScore?: number;         // website-agent mode: only redesign sites at or below this
  requireWebsite?: boolean;      // website-agent mode: skip businesses without a website
}

export interface CampaignStats {
  leadsFound: number;
  leadsQualified: number;
  emailsGenerated: number;
  emailsSent: number;
  avgScore: number;
  sitesScored?: number;
}

export interface Campaign {
  id: string;
  name: string;
  query: string;
  mode: PipelineMode;
  status: CampaignStatus;
  config: CampaignConfig;
  stats: CampaignStats;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  company: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  industry: string;
  rating: number;
  review_count: number;
  google_maps_url: string;
  ai_score: number | null;
  ai_reasoning: string;
  pain_points: string;
  personalized_hook: string;
  site_score: number | null;
  site_issues: string;
  demo_url: string;
  email_subject: string;
  email_body: string;
  email_status: EmailStatus;
  status: LeadStatus;
  created_at: string;
}

export interface PipelineProgress {
  stage: PipelineStage;
  current: number;
  total: number;
  message: string;
}

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  maxLeads: 20,
  minScore: 6,
  emailTone: "professional but conversational, not pushy",
  customGuidelines: ["Do NOT use phrases like 'I hope this email finds you well'"],
  requireWebsite: true,
  maxSiteScore: 5,
};

export const PIPELINE_STAGES: { key: PipelineStage; label: string; icon: string }[] = [
  { key: "discover", label: "Discover Leads", icon: "\u{1F50E}" },
  { key: "qualify", label: "AI Qualification", icon: "\u{1F3AF}" },
  { key: "score-sites", label: "Score Websites", icon: "\u{1F4CA}" },
  { key: "generate-emails", label: "Generate Emails", icon: "\u270D\uFE0F" },
  { key: "send", label: "Send Campaign", icon: "\u{1F680}" },
];
