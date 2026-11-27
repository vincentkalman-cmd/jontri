export type AuditCategory = "seo" | "speed" | "ai" | "trust";

export interface AuditCheck {
  id: string;
  category: AuditCategory;
  label: string;
  weight: number;
  pass: boolean;
  /** Plain-English fix shown/used when the check fails. */
  fix: string;
}

export interface AuditInput {
  html: string;
  finalUrl: string;
  responseMs: number;
  hasLlmsTxt: boolean;
}

export interface AuditResult {
  scores: Record<AuditCategory, number>;
  checks: AuditCheck[];
}

const count = (s: string, re: RegExp) => (s.match(re) || []).length;

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? m[1] : null;
}

function metaContent(html: string, key: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const k = (attr(tag, "name") || attr(tag, "property") || "").toLowerCase();
    if (k === key) return attr(tag, "content");
  }
  return null;
}

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function auditHtml({ html, finalUrl, responseMs, hasLlmsTxt }: AuditInput): AuditResult {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  const desc = metaContent(html, "description") || "";
  const h1s = count(html, /<h1\b/gi);
  const subheads = count(html, /<h[23]\b/gi);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgsWithAlt = imgs.filter((t) => (attr(t, "alt") || "").trim().length > 0).length;
  const robots = (metaContent(html, "robots") || "").toLowerCase();
  const ldBlocks = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  const ld = ldBlocks.join(" ");
  const text = visibleText(html);
  const words = text.split(" ").filter(Boolean).length;
  const bytes = new TextEncoder().encode(html).length;
  const scripts = count(html, /<script\b[^>]*\bsrc=/gi);
  const https = finalUrl.startsWith("https://");

  const checks: AuditCheck[] = [
    // Google SEO
    { id: "title", category: "seo", label: "Descriptive page title", weight: 15,
      pass: title.length >= 15 && title.length <= 65,
      fix: "Rewrite the page title to 15-65 characters naming your main service and city." },
    { id: "desc", category: "seo", label: "Meta description", weight: 15,
      pass: desc.length >= 50 && desc.length <= 170,
      fix: "Add a 50-170 character meta description that sells the click in Google results." },
    { id: "h1", category: "seo", label: "One clear H1 heading", weight: 15, pass: h1s === 1,
      fix: "Use exactly one H1 heading that says what you do and where." },
    { id: "canonical", category: "seo", label: "Canonical URL", weight: 10,
      pass: /<link[^>]*rel=["']canonical["']/i.test(html),
      fix: "Add a canonical link so Google knows which URL is the official one." },
    { id: "og", category: "seo", label: "Social share tags", weight: 10,
      pass: !!metaContent(html, "og:title") && !!metaContent(html, "og:image"),
      fix: "Add Open Graph title and image so links look good when shared." },
    { id: "alt", category: "seo", label: "Image alt text", weight: 15,
      pass: imgs.length === 0 || imgsWithAlt / imgs.length >= 0.8,
      fix: "Describe your images with alt text (e.g. 'technician repairing furnace in Denver')." },
    { id: "links", category: "seo", label: "Internal links", weight: 10,
      pass: count(html, /<a\b[^>]*href=["'](\/|#)/gi) >= 5,
      fix: "Link to your service pages from the homepage so Google can find them." },
    { id: "indexable", category: "seo", label: "Indexable by Google", weight: 10, pass: !robots.includes("noindex"),
      fix: "Remove the 'noindex' tag. It hides this page from Google entirely." },

    // Speed & mobile
    { id: "viewport", category: "speed", label: "Mobile viewport", weight: 25,
      pass: !!metaContent(html, "viewport"),
      fix: "Add a mobile viewport tag so the site displays properly on phones." },
    { id: "response", category: "speed", label: "Fast server response", weight: 25, pass: responseMs < 1200,
      fix: `Your server took ${Math.round(responseMs)}ms to respond. Faster hosting or caching would help.` },
    { id: "weight", category: "speed", label: "Lightweight page", weight: 20, pass: bytes < 300_000,
      fix: "The page HTML is heavy. Trim unused builder code and inline content." },
    { id: "https", category: "speed", label: "Secure HTTPS", weight: 15, pass: https,
      fix: "Serve the site over HTTPS. Browsers flag non-secure sites and Google ranks them lower." },
    { id: "scripts", category: "speed", label: "Few blocking scripts", weight: 15, pass: scripts <= 15,
      fix: `The page loads ${scripts} scripts. Removing unused plugins and trackers would speed it up.` },

    // AI search readiness
    { id: "schema", category: "ai", label: "Structured data", weight: 25, pass: ldBlocks.length > 0,
      fix: "Add structured data (JSON-LD) so ChatGPT and Google can read your services, hours, and area." },
    { id: "biztype", category: "ai", label: "Business type declared", weight: 20,
      pass: /"@type"\s*:\s*"[^"]*(LocalBusiness|Organization|Service|Contractor|Plumber|HVACBusiness|Electrician|RoofingContractor|MedicalSpa|DaySpa|HealthAndBeautyBusiness|ProfessionalService)/i.test(ld),
      fix: "Declare your business type (e.g. HVACBusiness, Plumber) in structured data so AI assistants can recommend you." },
    { id: "faq", category: "ai", label: "FAQ answers", weight: 15,
      pass: /FAQPage/i.test(ld) || /frequently asked|faq/i.test(text),
      fix: "Add an FAQ answering real customer questions. AI assistants quote these directly." },
    { id: "llms", category: "ai", label: "llms.txt file", weight: 10, pass: hasLlmsTxt,
      fix: "Add an llms.txt file summarizing your business for AI crawlers." },
    { id: "sections", category: "ai", label: "Clear service sections", weight: 15, pass: subheads >= 3,
      fix: "Break your services into clear headed sections. AI models extract answers from them." },
    { id: "depth", category: "ai", label: "Enough content", weight: 15, pass: words >= 300,
      fix: `The homepage has only ~${words} words. Explain your services, area, and process in more detail.` },

    // Trust signals
    { id: "phone", category: "trust", label: "Phone number visible", weight: 25,
      pass: /\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/.test(text) || /href=["']tel:/i.test(html),
      fix: "Put a click-to-call phone number at the top of the page." },
    { id: "address", category: "trust", label: "Location / service area", weight: 20,
      pass: /\b[A-Z]{2}\s\d{5}\b/.test(text) || /service area|serving\s+[A-Z]/i.test(text),
      fix: "State your address or service area so locals (and Google Maps) trust you." },
    { id: "reviews", category: "trust", label: "Reviews on the page", weight: 25,
      pass: /review|testimonial|★|stars?\b/i.test(text),
      fix: "Show real customer reviews on the homepage. It's the #1 trust signal for local services." },
    { id: "secure", category: "trust", label: "Secure connection", weight: 15, pass: https,
      fix: "Switch to HTTPS so visitors don't see a 'Not secure' warning." },
    { id: "contact", category: "trust", label: "Easy way to reach you", weight: 15,
      pass: /<form\b/i.test(html) || /href=["']mailto:/i.test(html),
      fix: "Add a simple contact form or email link." },
  ];

  const scores = { seo: 0, speed: 0, ai: 0, trust: 0 } as Record<AuditCategory, number>;
  for (const cat of Object.keys(scores) as AuditCategory[]) {
    const inCat = checks.filter((c) => c.category === cat);
    const total = inCat.reduce((s, c) => s + c.weight, 0);
    const got = inCat.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
    scores[cat] = Math.round((got / total) * 100);
  }
  return { scores, checks };
}
