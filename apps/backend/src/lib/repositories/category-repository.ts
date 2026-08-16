import type { Category } from "@repo/shared-types";
import type { PrismaClient } from "../../generated/prisma/client.js";

/** Persistence boundary for categories. Read-only per the documented API. */
export interface CategoryRepository {
  list(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
}

export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(): Promise<Category[]> {
    const categories = await this.client.category.findMany({
      orderBy: { id: "asc" },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }

  async findById(id: string): Promise<Category | null> {
    const category = await this.client.category.findUnique({
      where: { id },
    });
    if (!category) return null;
    return {
      id: category.id,
      name: category.name,
    };
  }
}
