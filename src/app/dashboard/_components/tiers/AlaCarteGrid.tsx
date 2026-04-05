"use client";

interface AutomationField {
  key: string;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "url" | "textarea" | "select";
  options?: string[];
  required?: boolean;
}

export interface AutomationService {
  name: string;
  description: string;
  icon: string;
  status: "live" | "coming-soon";
  serviceKey?: string;
  fields?: AutomationField[];
}

export const AUTOMATIONS: { category: string; services: AutomationService[] }[] = [
  {
    category: "Lead Generation & Sales",
    services: [
      {
        name: "AI Lead Prospecting", icon: "\u{1F3AF}", status: "live", serviceKey: "prospector",
        description: "Automatically find, qualify, and score leads using AI. Generates personalized outreach emails and pushes to campaign tools.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "industry", label: "Industry / Niche", placeholder: "e.g., HVAC, Dental, Real Estate", required: true },
          { key: "targetLocation", label: "Target Location", placeholder: "e.g., Phoenix, AZ or Nationwide" },
          { key: "idealCustomer", label: "Ideal Customer Profile", placeholder: "e.g., Homeowners, age 30-60, income $75k+", type: "textarea" },
          { key: "apolloApiKey", label: "Apollo API Key", placeholder: "Your Apollo.io API key" },
          { key: "instantlyApiKey", label: "Instantly API Key", placeholder: "Your Instantly.ai API key" },
          { key: "senderEmail", label: "Sender Email", placeholder: "outreach@clientdomain.com", type: "email" },
          { key: "dailyLeadTarget", label: "Daily Lead Target", placeholder: "e.g., 50" },
        ],
      },
      {
        name: "AI Voice Agent", icon: "\u{1F4DE}", status: "live", serviceKey: "voice-agent",
        description: "24/7 AI-powered phone agent that handles inbound/outbound calls, books appointments, and qualifies leads.",
        fields: [
          { key: "vapiApiKey", label: "Client Vapi API Key", placeholder: "Your Vapi API key from dashboard.vapi.ai", required: true },
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "websiteUrl", label: "Website URL", placeholder: "https://abcplumbing.com (we'll scan this to train the agent)", type: "url", required: true },
          { key: "businessPhone", label: "Business Phone", placeholder: "+1 (555) 123-4567", required: true },
          { key: "industry", label: "Industry", placeholder: "e.g., HVAC, Dental", required: true },
          { key: "greeting", label: "Custom Greeting", placeholder: "Thank you for calling ABC Plumbing, how can I help you?", type: "textarea" },
          { key: "servicesOffered", label: "Services Offered", placeholder: "List the main services (one per line)", type: "textarea" },
          { key: "bookingUrl", label: "Booking/Calendar URL", placeholder: "https://calendly.com/...", type: "url" },
          { key: "transferNumber", label: "Transfer-to Number", placeholder: "Number to transfer live calls to" },
          { key: "businessHours", label: "Business Hours", placeholder: "e.g., Mon-Fri 8am-6pm MST" },
        ],
      },
      {
        name: "AI Chatbot", icon: "\u{1F4AC}", status: "live", serviceKey: "chatbot",
        description: "Website chatbot that answers questions, captures leads, and books meetings in real-time.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "websiteUrl", label: "Website URL", placeholder: "https://abcplumbing.com", type: "url", required: true },
          { key: "industry", label: "Industry", placeholder: "e.g., HVAC, Dental", required: true },
          { key: "botPersonality", label: "Bot Personality", placeholder: "e.g., Friendly, professional, concise", type: "select", options: ["Friendly & Casual", "Professional & Formal", "Warm & Helpful", "Direct & Efficient"] },
          { key: "servicesOffered", label: "Services / FAQ Topics", placeholder: "List services and common questions the bot should handle", type: "textarea" },
          { key: "bookingUrl", label: "Booking URL", placeholder: "https://calendly.com/...", type: "url" },
          { key: "leadEmail", label: "Send Leads To", placeholder: "leads@clientdomain.com", type: "email" },
          { key: "primaryColor", label: "Brand Color (hex)", placeholder: "#3B82F6" },
        ],
      },
      { name: "Email Campaign Automation", description: "Automated drip campaigns with AI-written copy, A/B testing, and smart send-time optimization.", icon: "\u{1F4E7}", status: "coming-soon" },
      { name: "CRM Auto-Sync", description: "Automatically sync leads, deals, and contacts across all platforms (HubSpot, Salesforce, Zoho).", icon: "\u{1F504}", status: "coming-soon" },
    ],
  },
  {
    category: "Marketing & Online Presence",
    services: [
      {
        name: "Website Builder", icon: "\u{1F310}", status: "live", serviceKey: "website",
        description: "AI-generated landing pages and full websites optimized for conversion, SEO, and mobile.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "industry", label: "Industry", placeholder: "e.g., HVAC, Dental", required: true },
          { key: "websiteGoal", label: "Website Goal", placeholder: "e.g., Generate leads, Book appointments", type: "select", options: ["Generate Leads", "Book Appointments", "Sell Products", "Showcase Portfolio", "Informational"] },
          { key: "servicesOffered", label: "Services to Feature", placeholder: "List main services (one per line)", type: "textarea" },
          { key: "brandColor", label: "Brand Color (hex)", placeholder: "#3B82F6" },
          { key: "domain", label: "Domain Name", placeholder: "abcplumbing.com" },
          { key: "phone", label: "Phone Number", placeholder: "+1 (555) 123-4567" },
          { key: "address", label: "Business Address", placeholder: "123 Main St, Phoenix, AZ" },
        ],
      },
      {
        name: "SEO Optimization", icon: "\u{1F50D}", status: "live", serviceKey: "seo-audit",
        description: "Comprehensive SEO analysis and ongoing optimization. Keyword strategy, technical fixes, content recommendations, and ranking monitoring.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "websiteUrl", label: "Website URL", placeholder: "https://abcplumbing.com", type: "url", required: true },
          { key: "targetKeywords", label: "Target Keywords", placeholder: "e.g., plumber phoenix, emergency plumbing, drain cleaning", type: "textarea" },
          { key: "competitors", label: "Top Competitors", placeholder: "List competitor websites (one per line)", type: "textarea" },
          { key: "targetLocation", label: "Target Location", placeholder: "e.g., Phoenix, AZ metro area" },
          { key: "googleBusinessUrl", label: "Google Business Profile URL", placeholder: "https://g.page/...", type: "url" },
        ],
      },
      {
        name: "AI Platform SEO", icon: "\u{1F916}", status: "live", serviceKey: "ai-seo",
        description: "Optimize your business for AI search engines \u2014 ChatGPT, Perplexity, Google AI Overviews. Ensure your brand appears in AI-generated answers.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "websiteUrl", label: "Website URL", placeholder: "https://abcplumbing.com", type: "url", required: true },
          { key: "targetQueries", label: "Target AI Queries", placeholder: "What questions should AI answer about your business? (one per line)", type: "textarea" },
          { key: "competitors", label: "Competitors", placeholder: "List main competitors (one per line)", type: "textarea" },
          { key: "structuredDataUrl", label: "Existing Schema/Structured Data URL", placeholder: "https://...", type: "url" },
        ],
      },
      {
        name: "Review Management", icon: "\u2B50", status: "live", serviceKey: "review-mgmt",
        description: "Monitor, respond to, and generate Google/Yelp reviews automatically. Reputation scoring dashboard.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "googleBusinessUrl", label: "Google Business Profile URL", placeholder: "https://g.page/...", type: "url", required: true },
          { key: "yelpUrl", label: "Yelp Business URL", placeholder: "https://yelp.com/biz/...", type: "url" },
          { key: "replyTone", label: "Reply Tone", placeholder: "How should we respond to reviews?", type: "select", options: ["Friendly & Grateful", "Professional & Courteous", "Warm & Personal", "Brief & Direct"] },
          { key: "reviewRequestEmail", label: "Review Request Email", placeholder: "Template or custom message to request reviews", type: "textarea" },
          { key: "notifyEmail", label: "Notify on Negative Reviews", placeholder: "owner@business.com", type: "email" },
        ],
      },
      { name: "Social Media Automation", description: "AI-generated posts, scheduling, and engagement tracking across all major platforms.", icon: "\u{1F4F1}", status: "coming-soon" },
      { name: "Google Ads Management", description: "Automated ad creation, bidding, and optimization using AI for maximum ROI.", icon: "\u{1F4CA}", status: "coming-soon" },
    ],
  },
  {
    category: "Operations & Workflow",
    services: [
      {
        name: "Client Onboarding", icon: "\u{1F680}", status: "live", serviceKey: "onboarding",
        description: "Automated onboarding flow that collects info, sets up services, and provisions client accounts.",
        fields: [
          { key: "businessName", label: "Business Name", placeholder: "ABC Plumbing", required: true },
          { key: "contactName", label: "Contact Name", placeholder: "John Smith", required: true },
          { key: "contactEmail", label: "Contact Email", placeholder: "john@abcplumbing.com", type: "email", required: true },
          { key: "contactPhone", label: "Contact Phone", placeholder: "+1 (555) 123-4567" },
          { key: "industry", label: "Industry", placeholder: "e.g., HVAC, Dental", required: true },
          { key: "servicesNeeded", label: "Services Needed", placeholder: "Which automations does this client need?", type: "textarea" },
        ],
      },
      { name: "Invoice & Payment Automation", description: "Auto-generate invoices, send reminders, and track payments with accounting software integration.", icon: "\u{1F4B0}", status: "coming-soon" },
      { name: "Document Generation", description: "AI-powered proposals, contracts, and reports generated from templates with client data.", icon: "\u{1F4C4}", status: "coming-soon" },
      { name: "Appointment Scheduling", description: "Smart scheduling with calendar sync, reminders, and no-show follow-ups.", icon: "\u{1F4C5}", status: "coming-soon" },
      { name: "Task & Project Management", description: "Automated task creation, assignment, and progress tracking for client deliverables.", icon: "\u2705", status: "coming-soon" },
    ],
  },
  {
    category: "Analytics & Intelligence",
    services: [
      { name: "Business Intelligence Dashboard", description: "Real-time KPI tracking, revenue analytics, and AI-powered performance insights.", icon: "\u{1F4C8}", status: "coming-soon" },
      { name: "Customer Sentiment Analysis", description: "AI analysis of reviews, support tickets, and social mentions to gauge customer satisfaction.", icon: "\u{1F9E0}", status: "coming-soon" },
      { name: "Competitor Monitoring", description: "Track competitor pricing, marketing, and online presence with automated alerts.", icon: "\u{1F441}\uFE0F", status: "coming-soon" },
    ],
  },
];

interface AlaCarteGridProps {
  onDeployService: (service: AutomationService) => void;
}

export function AlaCarteGrid({ onDeployService }: AlaCarteGridProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          Individual Services
        </h2>
        <p className="text-text-secondary">
          Deploy any service a la carte for a client
        </p>
      </div>
      {AUTOMATIONS.map((cat) => (
        <div key={cat.category}>
          <h3 className="text-lg font-bold text-text-primary mb-4">
            {cat.category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.services.map((svc) => (
              <button
                key={svc.name}
                type="button"
                disabled={svc.status !== "live"}
                onClick={() => svc.status === "live" && onDeployService(svc)}
                className={`bg-bg-card border rounded-xl p-5 transition-all text-left ${
                  svc.status === "live"
                    ? "border-accent/30 hover:border-accent/60 cursor-pointer hover:shadow-lg hover:shadow-accent/5"
                    : "border-border opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{svc.icon}</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      svc.status === "live"
                        ? "bg-success/15 text-success"
                        : "bg-border text-text-muted"
                    }`}
                  >
                    {svc.status === "live" ? "Live" : "Coming Soon"}
                  </span>
                </div>
                <h4 className="text-text-primary font-semibold text-sm mb-1.5">
                  {svc.name}
                </h4>
                <p className="text-text-muted text-xs leading-relaxed">
                  {svc.description}
                </p>
                {svc.status === "live" && (
                  <p className="text-accent text-xs font-medium mt-3">
                    Click to deploy &rarr;
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
