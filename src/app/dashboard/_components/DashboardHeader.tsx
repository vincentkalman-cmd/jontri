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
    <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-accent mb-3">Admin</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.04em] leading-none text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-3">
          Manage clients, deploy AI services, and run outreach campaigns
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-bg-card border border-border rounded-lg p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onViewChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                view === tab.key
                  ? "bg-accent text-accent-ink"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onQuickDeploy}
          className="px-5 py-2.5 bg-gradient-to-r from-accent to-accent-light text-accent-ink rounded-lg text-sm font-semibold hover:from-accent-dark hover:to-accent transition-colors shadow-lg shadow-accent/20 whitespace-nowrap cursor-pointer"
        >
          Quick Deploy
        </button>
        <button
          onClick={() => {
            onViewChange("clients");
            onNewClient();
          }}
          className="px-5 py-2.5 bg-accent text-accent-ink rounded-lg text-sm font-semibold hover:bg-accent-dark transition-colors whitespace-nowrap cursor-pointer"
        >
          + New Client
        </button>
        <button
          onClick={onSignOut}
          className="px-4 py-2.5 text-text-muted border border-border rounded-lg text-sm hover:text-text-primary hover:border-text-muted transition-colors whitespace-nowrap cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
