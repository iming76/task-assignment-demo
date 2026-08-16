import type { Category } from "@repo/shared-types";
import { NotFoundError } from "../errors/application-error.js";
import type { CategoryRepository } from "../lib/repositories/category-repository.js";

export interface CategoryService {
  list(): Promise<Category[]>;
  get(id: string): Promise<Category>;
}

export class DefaultCategoryService implements CategoryService {
  constructor(private readonly repository: CategoryRepository) {}

  async list(): Promise<Category[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<Category> {
    const category = await this.repository.findById(id);
    if (!category) throw new NotFoundError(`Category with id ${id} not found`);
    return category;
  }
}
