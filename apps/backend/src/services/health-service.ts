import type { HealthRepository } from "../lib/repositories/health-repository.js";

export interface HealthStatus {
  status: "ok";
}

export interface HealthService {
  check(): Promise<HealthStatus>;
}

export class DefaultHealthService implements HealthService {
  constructor(private readonly repository: HealthRepository) {}

  async check(): Promise<HealthStatus> {
    await this.repository.ping();
    return { status: "ok" };
  }
}
