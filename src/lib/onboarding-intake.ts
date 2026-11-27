/** Sign-up payload validation and per-service config building. Pure — no app imports. */

export type PackageId = "tier-1" | "tier-2" | "tier-3" | "custom";
const PACKAGES: readonly PackageId[] = ["tier-1", "tier-2", "tier-3", "custom"];

export interface SetupDetails {
  servicesOffered: string;
  businessHours: string;
  bookingUrl: string;
  transferNumber: string;
  leadEmail: string;
  brandColor: string;
  googleBusinessUrl: string;
  targetArea: string;
}

export interface Intake {
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  packageId: PackageId;
  details: SetupDetails;
  acceptName: string;
  termsVersion: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function s(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return "";
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > max ? null : t;
}

/** "" stays "", bare domains get https://, anything not http(s) is rejected (null). */
function link(v: string): string | null {
  if (!v) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withScheme);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().replace(/\/$/, "") : null;
  } catch {
    return null;
  }
}

export function validateIntake(raw: unknown, termsVersion: string): { ok: true; data: Intake } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Invalid request" };
  const r = raw as Record<string, unknown>;
  const d = (r.details && typeof r.details === "object" ? r.details : {}) as Record<string, unknown>;

  const contactName = s(r.contactName, 120);
  const businessName = s(r.businessName, 120);
  const email = s(r.email, 200)?.toLowerCase() ?? null;
  const phone = s(r.phone, 40);
  const industry = s(r.industry, 80);
  const acceptName = s(r.acceptName, 120);
  const website = link(s(r.website, 300) ?? "");
  if (!contactName || !businessName || !phone || !industry) return { ok: false, error: "Please fill in your name, business name, phone and industry." };
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };
  if (website === null) return { ok: false, error: "Please enter a valid website address." };
  if (!PACKAGES.includes(r.packageId as PackageId)) return { ok: false, error: "Please choose a package." };
  if (r.termsVersion !== termsVersion) return { ok: false, error: "The terms were updated. Please refresh the page and review them again." };
  if (r.agreed !== true || !acceptName || acceptName.length < 2) return { ok: false, error: "Please type your full name and check the box to accept the terms." };

  const fields = {
    servicesOffered: s(d.servicesOffered, 2000),
    businessHours: s(d.businessHours, 200),
    bookingUrl: s(d.bookingUrl, 300),
    transferNumber: s(d.transferNumber, 40),
    leadEmail: s(d.leadEmail, 200),
    googleBusinessUrl: s(d.googleBusinessUrl, 300),
    targetArea: s(d.targetArea, 200),
  };
  if (Object.values(fields).some((v) => v === null)) return { ok: false, error: "One of the setup details is too long." };
  const bookingUrl = link(fields.bookingUrl as string);
  const googleBusinessUrl = link(fields.googleBusinessUrl as string);
  if (bookingUrl === null || googleBusinessUrl === null) return { ok: false, error: "Please check the links you entered (they should start with https://)." };
  const leadEmail = (fields.leadEmail as string).toLowerCase();
  if (leadEmail && !EMAIL_RE.test(leadEmail)) return { ok: false, error: "Please enter a valid email for lead notifications." };

  return {
    ok: true,
    data: {
      contactName,
      businessName,
      email,
      phone,
      website,
      industry,
      packageId: r.packageId as PackageId,
      acceptName,
      termsVersion,
      details: {
        servicesOffered: fields.servicesOffered as string,
        businessHours: fields.businessHours as string,
        bookingUrl,
        transferNumber: fields.transferNumber as string,
        leadEmail,
        // An unusable color is dropped, never a reason to reject the sign-up.
        brandColor: typeof d.brandColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(d.brandColor.trim()) ? d.brandColor.trim() : "",
        googleBusinessUrl,
        targetArea: fields.targetArea as string,
      },
    },
  };
}

export type DetailField = keyof SetupDetails;

const FIELDS_BY_SERVICE: Record<string, DetailField[]> = {
  chatbot: ["servicesOffered", "bookingUrl", "leadEmail", "brandColor"],
  "voice-agent": ["servicesOffered", "businessHours", "bookingUrl", "transferNumber"],
  "review-mgmt": ["googleBusinessUrl"],
  prospector: ["targetArea"],
  "ai-seo": ["targetArea"],
};

export function detailFieldsFor(services: string[]): DetailField[] {
  return [...new Set(services.flatMap((svc) => FIELDS_BY_SERVICE[svc] || []))];
}

export function buildServiceConfigs(services: string[], d: Intake): Record<string, Record<string, string>> {
  const common = { businessName: d.businessName, industry: d.industry, websiteUrl: d.website };
  const x = d.details;
  const out: Record<string, Record<string, string>> = {};
  for (const svc of services) {
    switch (svc) {
      case "chatbot":
        out[svc] = { ...common, servicesOffered: x.servicesOffered, bookingUrl: x.bookingUrl, leadEmail: x.leadEmail || d.email, primaryColor: x.brandColor };
        break;
      case "voice-agent":
        out[svc] = { ...common, servicesOffered: x.servicesOffered, bookingUrl: x.bookingUrl, businessHours: x.businessHours, transferNumber: x.transferNumber, businessPhone: d.phone };
        break;
      case "ai-seo":
        out[svc] = { ...common, targetQueries: `best ${d.industry}${x.targetArea ? ` in ${x.targetArea}` : ""}` };
        break;
      case "review-mgmt":
        out[svc] = { ...common, googleBusinessUrl: x.googleBusinessUrl };
        break;
      case "prospector":
        out[svc] = { ...common, targetArea: x.targetArea };
        break;
      default:
        out[svc] = { ...common };
    }
  }
  return out;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = base || "client";
  if (!(await exists(root))) return root;
  for (let n = 2; n < 100; n++) {
    const candidate = `${root}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now()}`;
}
