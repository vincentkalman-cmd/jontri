/**
 * Outreach pipeline configuration.
 * Ported from prospector/config.py for use in Next.js API routes.
 */

// Sender defaults (used when no client-specific config is loaded)
export const SENDER = {
  fromName: process.env.FROM_NAME || "Vincent Kalman",
  fromTitle: process.env.FROM_TITLE || "Founder",
  fromCompany: process.env.FROM_COMPANY || "Jontri Consulting",
  bookingUrl: process.env.BOOKING_URL || "https://calendly.com/jontri/consultation",
};

// Default ICP (Ideal Customer Profile)
export const DEFAULT_ICP = {
  personTitles: [
    "Owner", "President", "CEO", "Founder",
    "Vice President", "VP", "Executive Director",
    "Director of Operations", "COO", "General Manager",
    "Director of Business Development",
  ],
  personLocations: ["Colorado, United States"],
  keywords: "construction OR HVAC OR mechanical OR plumbing OR sheet metal OR heating OR cooling",
  employeeRange: "1,500",
};

// Claude prompts (ported verbatim from prospector/qualifier.py)
export const QUALIFY_PROMPT = `\
You are a sales intelligence analyst for {company}, an AI consulting firm that helps \
businesses automate operations, reduce costs, and grow revenue using AI.

Analyze this prospect and return a JSON object with:
- "score": integer 1-10 (10 = perfect fit)
- "reasoning": one sentence explaining the score
- "pain_points": list of 2-3 likely pain points this business faces that AI could solve
- "personalized_hook": a one-sentence opener referencing something specific about their business

Prospect:
- Company: {company_name}
- Industry: {industry}
- Location: {city}, {state}
- Phone: {phone}
- Website: {website}
- Rating: {rating} ({review_count} reviews)

Our ideal customer: {ideal_customer_description}

{service_focus_line}

Return ONLY valid JSON, no markdown fences.`;

export const EMAIL_PROMPT = `\
You are writing a cold outreach email on behalf of {from_name}, {from_title} at {from_company}.

Write a short, personalized cold email (under {max_words} words) to this prospect:
- Company: {company_name}
- Industry: {industry}
- Location: {city}, {state}
- Pain points: {pain_points}
- Personalized hook: {hook}

Guidelines:
- Subject line should be casual and curiosity-driven (not salesy)
- Open with the personalized hook
- Reference one specific pain point
- Briefly mention how AI automation could help (be specific to their industry)
- End with a soft CTA linking to a free consultation: {booking_url}
- Tone: {tone}
{custom_guidelines}

Return as JSON with keys: "subject", "body"
Return ONLY valid JSON, no markdown fences.`;

export const SITE_SCORE_PROMPT = `\
You are a web design analyst evaluating a business website for quality and modernity.

Score this website 1-10:
1-3: Severely outdated (broken layout, no mobile, Flash, early 2000s design)
4-5: Outdated (poor UX, not mobile-friendly, cluttered, slow-looking)
6-7: Acceptable (functional but unimpressive, basic template)
8-10: Modern (clean design, responsive, good UX — do not recommend redesign)

Business: {business_name}
Industry: {industry}
URL: {url}

Website content:
Title: {title}
Description: {meta_description}

Page content (first 3000 chars):
{content}

Return ONLY valid JSON with:
- "score": integer 1-10
- "issues": list of specific problems found
- "worth_redesigning": boolean
- "summary": one sentence assessment
- "strengths": list of things done well (if any)

No markdown fences.`;

/**
 * Fill template placeholders in a prompt string.
 * Uses {key} syntax matching the Python format strings.
 */
export function fillPrompt(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in values ? String(values[key]) : match;
  });
}

// Instantly.ai API config
export const INSTANTLY_CONFIG = {
  baseUrl: "https://api.instantly.ai/api/v2",
  campaignPrefix: process.env.INSTANTLY_CAMPAIGN_PREFIX || "",
  schedule: {
    from: "09:00",
    to: "17:00",
    days: [1, 2, 3, 4, 5],
    timezone: process.env.INSTANTLY_TIMEZONE || "America/Denver",
  },
};

// Google Maps Places API config
export const GMAPS_CONFIG = {
  baseUrl: "https://maps.googleapis.com/maps/api/place",
};
