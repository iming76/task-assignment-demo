import type { Category } from "@repo/shared-types";

export interface CategoryService {
  list(): Promise<Category[]>;
  get(id: string): Promise<Category>;
}
