"use client";

interface StatsBarProps {
  activeClients: number;
  totalServices: number;
  pendingServices: number;
  totalClients: number;
}

export function StatsBar({
  activeClients,
  totalServices,
  pendingServices,
  totalClients,
}: StatsBarProps) {
  const stats = [
    { label: "Active Clients", value: activeClients, color: "text-text-primary" },
    { label: "Services Deployed", value: totalServices, color: "text-text-primary" },
    {
      label: "Pending Setup",
      value: pendingServices,
      color: pendingServices > 0 ? "text-yellow-400" : "text-text-primary",
    },
    { label: "Total Clients", value: totalClients, color: "text-text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-bg-card border border-border rounded-xl p-5"
        >
          <p className="text-text-muted text-sm">{stat.label}</p>
          <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
