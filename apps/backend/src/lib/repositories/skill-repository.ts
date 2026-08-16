import type {
  CreateSkillInput,
  PatchSkillInput,
  Skill,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import {
  NotFoundError,
  ValidationError,
  InUseError,
} from "../../errors/application-error.js";
import { translateKnownPrismaError } from "../prisma-error.js";

/** Persistence boundary for skills. */
export interface SkillRepository {
  list(tx?: TransactionClient): Promise<Skill[]>;
  findById(id: string, tx?: TransactionClient): Promise<Skill | null>;
  findByCategoryAndName(
    categoryId: string,
    name: string,
    tx?: TransactionClient,
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

  async list(tx?: TransactionClient): Promise<Skill[]> {
    const client = tx ?? this.client;
    const skills = await client.skill.findMany({
      orderBy: { id: "asc" },
    });
    return skills.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      categoryId: s.categoryId,
    }));
  }

  async findById(id: string, tx?: TransactionClient): Promise<Skill | null> {
    const client = tx ?? this.client;
    const skill = await client.skill.findUnique({
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
    tx?: TransactionClient,
  ): Promise<Skill | null> {
    const client = tx ?? this.client;
    const skill = await client.skill.findFirst({
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
    const run = async (client: TransactionClient | PrismaClient) => {
      await validateCategoryExists(client, input.categoryId);
      await validateNameAvailable(client, input.categoryId, input.name);
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
    };

    try {
      if (tx) return await run(tx);
      return await this.client.$transaction((inner) => run(inner));
    } catch (error) {
      translateKnownPrismaError(error);
    }
  }

  async update(
    id: string,
    input: PatchSkillInput,
    tx?: TransactionClient,
  ): Promise<Skill> {
    const run = async (client: TransactionClient | PrismaClient) => {
      const current = await client.skill.findUnique({ where: { id } });
      if (!current) throw new NotFoundError(`Skill with id ${id} not found`);

      const categoryId = input.categoryId ?? current.categoryId;
      const name = input.name ?? current.name;

      if (input.categoryId !== undefined) {
        await validateCategoryExists(client, input.categoryId);
      }
      if (input.name !== undefined || input.categoryId !== undefined) {
        await validateNameAvailable(client, categoryId, name, id);
      }

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
    };

    try {
      if (tx) return await run(tx);
      return await this.client.$transaction((inner) => run(inner));
    } catch (error) {
      translateKnownPrismaError(error);
    }
  }

  async delete(id: string): Promise<void> {
    const [developerCount, taskCount] = await Promise.all([
      this.client.developerSkill.count({ where: { skillId: id } }),
      this.client.taskSkill.count({ where: { skillId: id } }),
    ]);
    if (developerCount > 0 || taskCount > 0) {
      throw new InUseError(
        `Skill with id ${id} is still referenced by a developer or task`,
      );
    }

    try {
      await this.client.skill.delete({ where: { id } });
    } catch (error) {
      translateKnownPrismaError(error);
    }
  }
}

async function validateCategoryExists(
  client: TransactionClient | PrismaClient,
  categoryId: string,
): Promise<void> {
  const category = await client.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) {
    throw new NotFoundError(`Category with id ${categoryId} not found`);
  }
}

/** Rejects with ValidationError if another skill already uses this name within the category. */
async function validateNameAvailable(
  client: TransactionClient | PrismaClient,
  categoryId: string,
  name: string,
  excludeId?: string,
): Promise<void> {
  const existing = await client.skill.findFirst({
    where: { categoryId, name },
    select: { id: true },
  });
  if (existing && existing.id !== excludeId) {
    throw new ValidationError(
      `A skill named "${name}" already exists in this category`,
    );
  }
}
