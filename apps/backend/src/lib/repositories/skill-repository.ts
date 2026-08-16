import type {
  CreateSkillInput,
  PatchSkillInput,
  Skill,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";

/** Persistence boundary for skills. */
export interface SkillRepository {
  list(): Promise<Skill[]>;
  findById(id: string): Promise<Skill | null>;
  findByCategoryAndName(
    categoryId: string,
    name: string,
  ): Promise<Skill | null>;
  create(input: CreateSkillInput, tx?: TransactionClient): Promise<Skill>;
  update(
    id: string,
    input: PatchSkillInput,
    tx?: TransactionClient,
  ): Promise<Skill>;
  delete(id: string): Promise<void>;
}
