import type { Category } from "@repo/shared-types";
import { NotFoundError } from "../errors/application-error.js";
import type { CategoryRepository } from "../lib/repositories/category-repository.js";

export interface CategoryService {
  list(): Promise<Category[]>;
  get(id: string): Promise<Category>;
}

export function createCategoryService(
  repository: CategoryRepository,
): CategoryService {
  const get = async (id: string): Promise<Category> => {
    const category = await repository.findById(id);
    if (!category) throw new NotFoundError(`Category with id ${id} not found`);
    return category;
  };

  return {
    list: () => repository.list(),
    get,
  };
}
