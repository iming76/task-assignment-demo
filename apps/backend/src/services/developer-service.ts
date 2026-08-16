import type {
  CreateDeveloperInput,
  Developer,
  PatchDeveloperInput,
} from "@repo/shared-types";
import { NotFoundError } from "../errors/application-error.js";
import type { DeveloperRepository } from "../lib/repositories/developer-repository.js";

export interface DeveloperService {
  list(): Promise<Developer[]>;
  get(id: string): Promise<Developer>;
  create(input: CreateDeveloperInput): Promise<Developer>;
  update(id: string, input: PatchDeveloperInput): Promise<Developer>;
  remove(id: string): Promise<void>;
}

export function createDeveloperService(
  repository: DeveloperRepository,
): DeveloperService {
  const get = async (id: string): Promise<Developer> => {
    const developer = await repository.findById(id);
    if (!developer)
      throw new NotFoundError(`Developer with id ${id} not found`);
    return developer;
  };

  return {
    list: () => repository.list(),
    get,
    create: (input) => repository.create(input),
    update: async (id, input) => {
      await get(id); // Ensure developer exists
      return repository.update(id, input);
    },
    remove: async (id) => {
      await get(id); // Ensure developer exists
      await repository.delete(id);
    },
  };
}
