import type {
  CreateSkillInput,
  PatchSkillInput,
  Skill,
} from "@repo/shared-types";
import { NotFoundError } from "../errors/application-error.js";
import type { SkillRepository } from "../lib/repositories/skill-repository.js";

export interface SkillService {
  list(): Promise<Skill[]>;
  get(id: string): Promise<Skill>;
  create(input: CreateSkillInput): Promise<Skill>;
  update(id: string, input: PatchSkillInput): Promise<Skill>;
  remove(id: string): Promise<void>;
}

export class DefaultSkillService implements SkillService {
  constructor(private readonly repository: SkillRepository) {}

  async list(): Promise<Skill[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<Skill> {
    const skill = await this.repository.findById(id);
    if (!skill) throw new NotFoundError(`Skill with id ${id} not found`);
    return skill;
  }

  async create(input: CreateSkillInput): Promise<Skill> {
    return this.repository.create(input);
  }

  async update(id: string, input: PatchSkillInput): Promise<Skill> {
    await this.get(id); // Ensure skill exists
    return this.repository.update(id, input);
  }

  async remove(id: string): Promise<void> {
    await this.get(id); // Ensure skill exists
    await this.repository.delete(id);
  }
}
