"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DashboardHeader, type DashboardView } from "./_components/DashboardHeader";
import { StatsBar } from "./_components/StatsBar";
import { TierSelector } from "./_components/tiers/TierSelector";
import { TierDeployModal } from "./_components/tiers/TierDeployModal";
import { AlaCarteGrid, type AutomationService } from "./_components/tiers/AlaCarteGrid";
import ClientList from "./_components/clients/ClientList";
import ClientDetail from "./_components/clients/ClientDetail";
import NewClientModal from "./_components/clients/NewClientModal";
import DeployModal from "./_components/deploy/DeployModal";
import QuickDeployModal from "./_components/deploy/QuickDeployModal";
import { OutreachDashboard } from "./_components/outreach/OutreachDashboard";
import type { Tier } from "@/lib/tiers";

interface Onboarding {
  services_requested: string[];
  project_description: string;
  current_tools: string;
  monthly_budget: string;
  timeline: string;
  goals: string;
  special_requirements: string;
  submitted_at: string;
}

export interface Client {
  name: string;
  slug: string;
  industry: string;
  description: string;
  contact: { name: string; email: string; phone: string; address?: string };
  onboarding?: Onboarding;
  services: Record<string, { status: string; updated_at: string }>;
  created_at: string;
  status: string;
  tier_id?: string;
  billing_type?: string;
  monthly_rate?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<DashboardView>("packages");

  // Client state
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);

  // Deploy state
  const [deployService, setDeployService] = useState<AutomationService | null>(null);
  const [showQuickDeploy, setShowQuickDeploy] = useState(false);
  const [deployTier, setDeployTier] = useState<Tier | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/sign-in");
  }

  async function removeClient(slug: string) {
    if (!confirm(`Remove client "${slug}"? This only removes from the database.`)) return;
    await fetch(`/api/clients/${slug}`, { method: "DELETE" });
    setSelectedClient(null);
    fetchClients();
  }

  // Computed stats
  const activeCount = clients.filter((c) => c.status === "active").length;
  const totalServices = clients.reduce(
    (sum, c) => sum + Object.keys(c.services || {}).length,
    0
  );
  const pendingServices = clients.reduce(
    (sum, c) =>
      sum +
      Object.values(c.services || {}).filter((s) => s.status === "pending")
        .length,
    0
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-primary pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader
            view={view}
            onViewChange={setView}
            onQuickDeploy={() => setShowQuickDeploy(true)}
            onNewClient={() => setShowNewClient(true)}
            onSignOut={signOut}
          />

          {/* Packages (Tiers) View */}
          {view === "packages" && (
            <TierSelector
              onDeployTier={setDeployTier}
              onSwitchToAlaCarte={() => setView("automations")}
            />
          )}

          {/* A La Carte (Automations) View */}
          {view === "automations" && (
            <AlaCarteGrid onDeployService={setDeployService} />
          )}

          {/* Clients View */}
          {view === "clients" && (
            <>
              <StatsBar
                activeClients={activeCount}
                totalServices={totalServices}
                pendingServices={pendingServices}
                totalClients={clients.length}
              />
              <div className="flex gap-6">
                <div
                  className={`transition-all ${
                    selectedClient
                      ? "w-1/3 flex-shrink-0"
                      : "w-full"
                  }`}
                >
                  <ClientList
                    clients={clients}
                    selectedClient={selectedClient}
                    loading={loading}
                    onSelectClient={(c) => setSelectedClient(c)}
                    onNewClient={() => setShowNewClient(true)}
                  />
                </div>
                {selectedClient && (
                  <div className="flex-1 min-w-0">
                    <ClientDetail
                      client={selectedClient}
                      onClose={() => setSelectedClient(null)}
                      onRemove={removeClient}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Outreach View */}
          {view === "outreach" && <OutreachDashboard />}

          {/* Modals */}
          {deployService && (
            <DeployModal
              service={deployService}
              onClose={() => setDeployService(null)}
              onDeployed={fetchClients}
            />
          )}

          {showQuickDeploy && (
            <QuickDeployModal
              onClose={() => setShowQuickDeploy(false)}
              onDeployed={fetchClients}
            />
          )}

          {showNewClient && (
            <NewClientModal
              onClose={() => setShowNewClient(false)}
              onCreated={fetchClients}
            />
          )}

          {deployTier && (
            <TierDeployModal
              tier={deployTier}
              onClose={() => setDeployTier(null)}
              onDeployed={fetchClients}
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
