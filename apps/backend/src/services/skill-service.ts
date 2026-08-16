import type {
  CreateSkillInput,
  PatchSkillInput,
  Skill,
} from "@repo/shared-types";

export interface SkillService {
  list(): Promise<Skill[]>;
  get(id: string): Promise<Skill>;
  create(input: CreateSkillInput): Promise<Skill>;
  update(id: string, input: PatchSkillInput): Promise<Skill>;
  remove(id: string): Promise<void>;
}
