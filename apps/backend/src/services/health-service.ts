import type { HealthRepository } from "../lib/repositories/health-repository.js";

export interface HealthStatus {
  status: "ok";
}

export interface HealthService {
  check(): Promise<HealthStatus>;
}

export function createHealthService(
  repository: HealthRepository,
): HealthService {
  return {
    check: async () => {
      await repository.ping();
      return { status: "ok" };
    },
  };
}
