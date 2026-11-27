import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { sendMail } from "@/lib/mailer";
import { BOOKING_URL } from "@/lib/constants";
import { getTier, getTierServices } from "@/lib/tiers";
import { TERMS_VERSION } from "@/lib/terms";
import { validateIntake, buildServiceConfigs, slugify, uniqueSlug } from "@/lib/onboarding-intake";
import { newPortalToken, portalUrl, buildChecklist, clientNeeds, STAGE_LABELS, type Stage } from "@/lib/lifecycle";
import { ownerNewSignupEmail, clientWelcomeEmail } from "@/lib/lifecycle-emails";

// POST /api/onboarding — public sign-up: validate, accept terms, create the client + private portal, send emails.
export async function POST(request: NextRequest) {
  const limited = rateLimit(request, { limit: 5, windowMs: 10 * 60_000 });
  if (limited) return limited;

  const raw = await request.json().catch(() => null);
  const v = validateIntake(raw, TERMS_VERSION);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const d = v.data;

  const isCustom = d.packageId === "tier-3" || d.packageId === "custom";
  const services = d.packageId === "custom" ? [] : getTierServices(d.packageId);
  const stage: Stage = isCustom ? "proposal" : "kickoff";
  const now = new Date().toISOString();
  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || request.headers.get("x-real-ip") || "";
  const tier = getTier(d.packageId);
  const packageName = tier ? `${tier.name} (${tier.price}/mo)` : "Custom / à la carte";

  const supabase = getSupabaseAdmin();
  // A sign-up never merges into an existing client with the same name.
  const slug = await uniqueSlug(slugify(d.businessName), async (s) => {
    const { data } = await supabase.from("clients").select("slug").eq("slug", s).maybeSingle();
    return Boolean(data);
  });
  const token = newPortalToken();
  const checklist = buildChecklist(services);

  const { error: insertError } = await supabase.from("clients").insert({
    slug,
    name: d.businessName,
    industry: d.industry,
    description: d.details.servicesOffered,
    contact_name: d.contactName,
    contact_email: d.email,
    contact_phone: d.phone,
    services: Object.fromEntries(services.map((s) => [s, { status: "pending", updated_at: now }])),
    status: "active",
    tier_id: tier ? tier.id : null,
    billing_type: tier ? "tier" : "a-la-carte",
    monthly_rate: tier ? Math.round(tier.monthlyRateCents / 100) : 0,
    portal_token: token,
    stage,
    billing_status: isCustom ? null : "unpaid",
    contract_accepted_name: d.acceptName,
    contract_accepted_at: now,
    contract_accepted_ip: ip.slice(0, 64),
    checklist,
  });
  if (insertError) {
    console.error("onboarding insert failed:", insertError.message);
    return NextResponse.json({ error: "We couldn't save your sign-up. Please try again or email hello@jontri.com." }, { status: 500 });
  }

  const { error: configError } = await supabase.from("client_configs").upsert({
    slug,
    updated_at: now,
    config: {
      ...buildServiceConfigs(services, d),
      client: { name: d.businessName, industry: d.industry, description: d.details.servicesOffered, website: d.website },
      sender: { from_name: "Vincent Kalman", from_title: "Founder", from_company: "Jontri Consulting", booking_url: BOOKING_URL },
      onboarding: { package: d.packageId, details: d.details, website: d.website, terms_version: d.termsVersion, submitted_at: now },
    },
  });

  if (configError) {
    // Without the config the client can't be set up; undo the client row so a retry starts clean.
    console.error("onboarding config save failed:", configError.message);
    await supabase.from("clients").delete().eq("slug", slug);
    return NextResponse.json({ error: "We couldn't save your sign-up. Please try again or email hello@jontri.com." }, { status: 500 });
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const link = portalUrl(origin, token);
  const owner = process.env.OWNER_EMAIL || process.env.ZOHO_EMAIL;
  // Emails never block the sign-up; sendMail logs and returns false on failure.
  await Promise.all([
    owner
      ? sendMail({
          to: owner,
          replyTo: d.email,
          ...ownerNewSignupEmail({ businessName: d.businessName, contactName: d.contactName, email: d.email, phone: d.phone, packageName, stageLabel: STAGE_LABELS[stage], dashboardUrl: `${origin}/dashboard` }),
        })
      : Promise.resolve(false),
    sendMail({
      to: d.email,
      ...clientWelcomeEmail({ contactName: d.contactName, businessName: d.businessName, portalUrl: link, bookingUrl: BOOKING_URL, needs: clientNeeds(checklist).map((n) => n.label), awaitingProposal: isCustom }),
    }),
  ]);

  return NextResponse.json({ portalUrl: link, stage });
}
