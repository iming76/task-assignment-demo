import type { Category } from "@repo/shared-types";

/** Persistence boundary for categories. Read-only per the documented API. */
export interface CategoryRepository {
  list(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
}
