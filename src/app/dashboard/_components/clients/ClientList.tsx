"use client";

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

interface ClientListProps {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  onSelectClient: (client: Client) => void;
  onNewClient: () => void;
}

export default function ClientList({
  clients,
  selectedClient,
  loading,
  onSelectClient,
  onNewClient,
}: ClientListProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
        All Clients {clients.length > 0 && `(${clients.length})`}
      </h2>

      {loading ? (
        <p className="text-text-muted text-center py-12">Loading...</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 bg-bg-card border border-border rounded-xl">
          <p className="text-text-secondary text-lg mb-2">No clients yet</p>
          <p className="text-text-muted text-sm mb-6">
            Clients appear here when they complete the onboarding form or you
            create them manually.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/onboarding"
              className="px-4 py-2.5 border border-accent text-accent rounded-lg text-sm font-medium hover:bg-accent/10 transition-colors"
            >
              Send Onboarding Link
            </a>
            <button
              onClick={onNewClient}
              className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
            >
              + New Client
            </button>
          </div>
        </div>
      ) : (
        clients.map((client) => {
          const serviceCount = Object.keys(client.services || {}).length;
          const pendingCount = Object.values(client.services || {}).filter(
            (s) => s.status === "pending"
          ).length;
          return (
            <button
              key={client.slug}
              onClick={() => onSelectClient(client)}
              className={`w-full text-left bg-bg-card border rounded-xl p-4 hover:bg-bg-card-hover transition-colors ${
                selectedClient?.slug === client.slug
                  ? "border-accent/50 bg-bg-card-hover"
                  : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-text-primary font-semibold truncate">
                      {client.name}
                    </h3>
                    {client.onboarding && (
                      <span
                        className="flex-shrink-0 w-2 h-2 rounded-full bg-accent"
                        title="Onboarded via form"
                      />
                    )}
                    {client.tier_id && (
                      <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 uppercase tracking-wide">
                        {client.tier_id}
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-sm truncate">
                    {client.industry}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.status === "active"
                        ? "bg-success/15 text-success"
                        : "bg-border text-text-muted"
                    }`}
                  >
                    {client.status}
                  </span>
                  <p className="text-text-muted text-xs mt-1">
                    {serviceCount > 0
                      ? `${serviceCount} service${serviceCount > 1 ? "s" : ""}${
                          pendingCount > 0 ? ` (${pendingCount} pending)` : ""
                        }`
                      : "no services"}
                  </p>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
}
