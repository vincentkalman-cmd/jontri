"use client";

export type DashboardView = "packages" | "automations" | "clients" | "outreach";

interface DashboardHeaderProps {
  view: DashboardView;
  onViewChange: (view: DashboardView) => void;
  onQuickDeploy: () => void;
  onNewClient: () => void;
  onSignOut: () => void;
}

const TABS: { key: DashboardView; label: string }[] = [
  { key: "packages", label: "Packages" },
  { key: "automations", label: "A La Carte" },
  { key: "clients", label: "Clients" },
  { key: "outreach", label: "Outreach" },
];

export function DashboardHeader({
  view,
  onViewChange,
  onQuickDeploy,
  onNewClient,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Manage clients, deploy AI services, and run outreach campaigns
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex bg-bg-card border border-border rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onViewChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === tab.key
                  ? "bg-accent text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onQuickDeploy}
          className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-accent text-white rounded-lg text-sm font-semibold hover:from-purple-600 hover:to-accent-dark transition-all shadow-lg shadow-accent/20"
        >
          Quick Deploy
        </button>
        <button
          onClick={() => {
            onViewChange("clients");
            onNewClient();
          }}
          className="px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors"
        >
          + New Client
        </button>
        <button
          onClick={onSignOut}
          className="px-4 py-2.5 text-text-muted border border-border rounded-lg text-sm hover:text-text-primary hover:border-text-muted transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
