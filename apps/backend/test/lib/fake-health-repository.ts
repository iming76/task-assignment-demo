import type { HealthRepository } from "../../src/lib/repositories/health-repository.js";

export class FakeHealthRepository implements HealthRepository {
  constructor(private readonly onPing: () => Promise<void> = async () => {}) {}

  ping(): Promise<void> {
    return this.onPing();
  }
}
