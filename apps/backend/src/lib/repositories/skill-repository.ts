import type {
  CreateSkillInput,
  PatchSkillInput,
  Skill,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

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

export class PrismaSkillRepository implements SkillRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(): Promise<Skill[]> {
    const skills = await this.client.skill.findMany({
      orderBy: { id: "asc" },
    });
    return skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      categoryId: s.categoryId,
    }));
  }

  async findById(id: string): Promise<Skill | null> {
    const skill = await this.client.skill.findUnique({
      where: { id },
    });
    if (!skill) return null;
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    };
  }

  async findByCategoryAndName(
    categoryId: string,
    name: string,
  ): Promise<Skill | null> {
    const skill = await this.client.skill.findFirst({
      where: { categoryId, name },
    });
    if (!skill) return null;
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    };
  }

  async create(
    input: CreateSkillInput,
    tx?: TransactionClient,
  ): Promise<Skill> {
    const client = tx ?? this.client;
    const skill = await client.skill.create({
      data: {
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
      },
    });
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    };
  }

  async update(
    id: string,
    input: PatchSkillInput,
    tx?: TransactionClient,
  ): Promise<Skill> {
    const client = tx ?? this.client;
    const skill = await client.skill.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        categoryId: input.categoryId,
      },
    });
    return {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    };
  }

  async delete(id: string): Promise<void> {
    await this.client.skill.delete({ where: { id } });
  }
}
