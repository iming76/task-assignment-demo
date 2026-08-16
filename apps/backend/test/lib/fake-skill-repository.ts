import type { Skill } from "@repo/shared-types";
import type { SkillRepository } from "../../src/lib/repositories/skill-repository.js";

/** In-memory catalog for skill-inference tests; only `list` is exercised. */
export class FakeSkillRepository implements SkillRepository {
  constructor(private readonly skills: Skill[]) {}

  async list(): Promise<Skill[]> {
    return this.skills;
  }

  async findById(id: string): Promise<Skill | null> {
    return this.skills.find((skill) => skill.id === id) ?? null;
  }

  async findByCategoryAndName(
    categoryId: string,
    name: string,
  ): Promise<Skill | null> {
    return (
      this.skills.find(
        (skill) => skill.categoryId === categoryId && skill.name === name,
      ) ?? null
    );
  }

  create(): Promise<Skill> {
    throw new Error("not implemented in FakeSkillRepository");
  }

  update(): Promise<Skill> {
    throw new Error("not implemented in FakeSkillRepository");
  }

  delete(): Promise<void> {
    throw new Error("not implemented in FakeSkillRepository");
  }
}
