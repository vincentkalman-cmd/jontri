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
