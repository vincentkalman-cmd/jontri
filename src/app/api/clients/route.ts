import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { provisionService, type ProvisionResult } from "@/lib/provision";

// Provisioning can call Vapi / Claude / fetch the client site.
export const maxDuration = 60;

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET /api/clients — list all clients
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients, total: clients.length });
}

// POST /api/clients — create a new client or add a service to an existing one
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, industry, contactName, contactEmail, contactPhone, description, service, serviceConfig, tierId, billingType, monthlyRate } = body;

  if (!name) {
    return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  }

  const slug = slugify(name);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdmin();

  // Check if client exists
  const { data: existing } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .single();

  let client;

  if (!existing) {
    // Create new client
    const insertData: Record<string, unknown> = {
      slug,
      name,
      industry: industry || "",
      description: description || "",
      contact_name: contactName || "",
      contact_email: contactEmail || "",
      contact_phone: contactPhone || "",
      services: {},
      status: "active",
    };
    if (tierId) insertData.tier_id = tierId;
    if (billingType) insertData.billing_type = billingType;
    if (monthlyRate) insertData.monthly_rate = monthlyRate;

    const { data, error } = await supabase
      .from("clients")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    client = data;
  } else {
    client = existing;
    // Update contact info if provided and currently empty
    const updates: Record<string, string> = {};
    if (contactName && !client.contact_name) updates.contact_name = contactName;
    if (contactEmail && !client.contact_email) updates.contact_email = contactEmail;
    if (contactPhone && !client.contact_phone) updates.contact_phone = contactPhone;
    if (industry && !client.industry) updates.industry = industry;

    if (tierId) updates.tier_id = tierId;
    if (billingType) updates.billing_type = billingType;
    if (monthlyRate) updates.monthly_rate = String(monthlyRate);

    if (Object.keys(updates).length > 0) {
      const { data } = await supabase
        .from("clients")
        .update(updates)
        .eq("slug", slug)
        .select()
        .single();
      if (data) client = data;
    }
  }

  // Load existing config or create new one
  const { data: existingConfig } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();

  const prevConfig = existingConfig?.config || {};

  const config = {
    ...prevConfig,
    client: {
      name,
      industry: industry || "",
      description: description || prevConfig?.client?.description || "",
      website: serviceConfig?.websiteUrl || prevConfig?.client?.website || "",
    },
    sender: prevConfig.sender || {
      from_name: "Vincent Kalman",
      from_title: "Founder",
      from_company: "Jontri Consulting",
      booking_url: "https://calendly.com/vincent-jontri/30min",
    },
  };

  // Save service-specific config (keep server-generated fields like assistantId across redeploys)
  if (service && serviceConfig) {
    config[service] = { ...(prevConfig[service] || {}), ...serviceConfig };
  }

  // Set the service up for real, then record its true status.
  let provision: ProvisionResult | null = null;
  if (service) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    try {
      provision = await provisionService(service, slug, config[service] || {}, origin);
    } catch (e) {
      provision = { service, status: "error", detail: e instanceof Error ? e.message : "Setup failed" };
    }
    if (provision.configPatch) {
      config[service] = { ...(config[service] || {}), ...provision.configPatch };
    }
    const services = { ...(client.services || {}) };
    services[service] = { status: provision.status, detail: provision.detail, updated_at: now };
    const { data } = await supabase.from("clients").update({ services }).eq("slug", slug).select().single();
    if (data) client = data;
  }

  await supabase
    .from("client_configs")
    .upsert({ slug, config, updated_at: now });

  // Never echo secrets or bulky config back to the browser.
  const safeProvision = provision
    ? {
        service: provision.service,
        status: provision.status,
        detail: provision.detail,
        embedCode: provision.embedCode,
        assistantId: provision.assistantId,
        scores: provision.scores,
        aiScore: provision.aiScore,
      }
    : null;
  return NextResponse.json({ client, provision: safeProvision }, { status: 201 });
}
