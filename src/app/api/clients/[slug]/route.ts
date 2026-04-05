import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// GET /api/clients/[slug] — get single client
export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Load config
  const { data: configRow } = await supabase
    .from("client_configs")
    .select("config")
    .eq("slug", slug)
    .single();

  return NextResponse.json({ client, config: configRow?.config || null });
}

// DELETE /api/clients/[slug]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: `Client '${slug}' removed` });
}
