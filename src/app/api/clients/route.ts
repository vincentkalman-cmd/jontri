import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  // If a service is being deployed, add it to the services JSONB
  if (service) {
    const services = client.services || {};
    services[service] = { status: "pending", updated_at: now };
    const { data } = await supabase
      .from("clients")
      .update({ services })
      .eq("slug", slug)
      .select()
      .single();
    if (data) client = data;
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
      description: description || "",
      website: serviceConfig?.websiteUrl || prevConfig?.client?.website || "",
    },
    sender: prevConfig.sender || {
      from_name: "Vincent Kalman",
      from_title: "Founder",
      from_company: "Jontri Consulting",
      booking_url: "https://calendly.com/jontri/consultation",
    },
  };

  // Save service-specific config
  if (service && serviceConfig) {
    config[service] = serviceConfig;
  }

  await supabase
    .from("client_configs")
    .upsert({ slug, config, updated_at: now });

  return NextResponse.json({ client }, { status: 201 });
}
