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

export function createSkillService(repository: SkillRepository): SkillService {
  const get = async (id: string): Promise<Skill> => {
    const skill = await repository.findById(id);
    if (!skill) throw new NotFoundError(`Skill with id ${id} not found`);
    return skill;
  };

  return {
    list: () => repository.list(),
    get,
    create: (input) => repository.create(input),
    update: async (id, input) => {
      await get(id); // Ensure skill exists
      return repository.update(id, input);
    },
    remove: async (id) => {
      await get(id); // Ensure skill exists
      await repository.delete(id);
    },
  };
}
