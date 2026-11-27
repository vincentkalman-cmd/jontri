import type { ProvisionResult } from "./provision";

/** Provision many services in parallel. A failure in one never affects the others. */
export async function runSetupAll(
  services: string[],
  configs: Record<string, Record<string, unknown>>,
  provision: (service: string, cfg: Record<string, unknown>) => Promise<ProvisionResult>,
): Promise<ProvisionResult[]> {
  return Promise.all(
    services.map(async (service): Promise<ProvisionResult> => {
      try {
        return await provision(service, configs[service] || {});
      } catch (e) {
        return { service, status: "error", detail: e instanceof Error ? e.message : "Setup failed" };
      }
    }),
  );
}

type ServiceStatus = { status: string; updated_at: string; detail?: string };

/**
 * Apply setup results onto a FRESH read of the client's config/services (taken after provisioning),
 * so anything changed while setup ran (feedback, a bought number, other edits) is kept.
 */
export function mergeSetupResults(
  freshConfig: Record<string, unknown>,
  freshServices: Record<string, ServiceStatus>,
  results: ProvisionResult[],
  now: string,
): { config: Record<string, unknown>; services: Record<string, ServiceStatus> } {
  const config: Record<string, unknown> = { ...freshConfig };
  const services: Record<string, ServiceStatus> = { ...freshServices };
  for (const r of results) {
    if (r.configPatch) {
      const cur = config[r.service];
      config[r.service] = { ...(cur && typeof cur === "object" ? (cur as Record<string, unknown>) : {}), ...r.configPatch };
    }
    services[r.service] = { status: r.status, detail: r.detail, updated_at: now };
  }
  return { config, services };
}
