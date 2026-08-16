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

export class DefaultDeveloperService implements DeveloperService {
  constructor(private readonly repository: DeveloperRepository) {}

  async list(): Promise<Developer[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<Developer> {
    const developer = await this.repository.findById(id);
    if (!developer)
      throw new NotFoundError(`Developer with id ${id} not found`);
    return developer;
  }

  async create(input: CreateDeveloperInput): Promise<Developer> {
    return this.repository.create(input);
  }

  async update(id: string, input: PatchDeveloperInput): Promise<Developer> {
    await this.get(id); // Ensure developer exists
    return this.repository.update(id, input);
  }

  async remove(id: string): Promise<void> {
    await this.get(id); // Ensure developer exists
    await this.repository.delete(id);
  }
}
