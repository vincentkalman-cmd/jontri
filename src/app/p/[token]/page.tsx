import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { BOOKING_URL } from "@/lib/constants";
import { isPortalTokenFormat, isStage, timeline, clientNeeds, checklistProgress, type ChecklistItem } from "@/lib/lifecycle";
import { buildServiceViews } from "@/lib/portal-view";
import { PortalView } from "./PortalView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your Jontri portal", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPortalTokenFormat(token)) notFound();
  const supabase = getSupabaseAdmin();
  const { data: client } = await supabase
    .from("clients")
    .select("slug, name, industry, services, stage, checklist")
    .eq("portal_token", token)
    .maybeSingle();
  if (!client) notFound();
  const { data: cfgRow } = await supabase.from("client_configs").select("config").eq("slug", client.slug).maybeSingle();
  const config = (cfgRow?.config || {}) as Record<string, unknown>;
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://jontri.com";
  const stage = isStage(client.stage) ? client.stage : "signed_up";
  const checklist: ChecklistItem[] = Array.isArray(client.checklist) ? client.checklist : [];
  const services = buildServiceViews(client.services || {}, config, client.slug, origin);
  const chatCfg = (config.chatbot || {}) as Record<string, unknown>;
  const chatColor = typeof chatCfg.primaryColor === "string" && /^#[0-9a-fA-F]{3,8}$/.test(chatCfg.primaryColor) ? chatCfg.primaryColor : "#35E0C2";

  return (
    <PortalView
      token={token}
      name={client.name}
      industry={client.industry || ""}
      slug={client.slug}
      stage={stage}
      steps={timeline(stage)}
      services={services}
      needs={clientNeeds(checklist).map(({ id, label, done }) => ({ id, label, done }))}
      progress={checklistProgress(checklist)}
      bookingUrl={BOOKING_URL}
      chatColor={chatColor}
    />
  );
}
