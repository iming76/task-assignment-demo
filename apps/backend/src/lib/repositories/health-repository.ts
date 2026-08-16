import type { PrismaClient } from "../../generated/prisma/client.js";

/**
 * Isolates the one piece of infrastructure state `GET /health` reports on,
 * so the route/service layers stay unaware of Prisma.
 */
export interface HealthRepository {
  ping(): Promise<void>;
}

export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly client: PrismaClient) {}

  async ping(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }
}
