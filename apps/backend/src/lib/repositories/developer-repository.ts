import type {
  CreateDeveloperInput,
  Developer,
  PatchDeveloperInput,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { NotFoundError, InUseError } from "../../errors/application-error.js";
import { translateKnownPrismaError } from "../prisma-error.js";

/**
 * Persistence boundary for developers. Implementations own Prisma access and
 * return the flattened public `Developer` shape (skills as `skillIds`).
 */
export interface DeveloperRepository {
  list(tx?: TransactionClient): Promise<Developer[]>;
  findById(id: string, tx?: TransactionClient): Promise<Developer | null>;
  create(
    input: CreateDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer>;
  update(
    id: string,
    input: PatchDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer>;
  delete(id: string): Promise<void>;
}

/**
 * Flattens Prisma developer and developer_skills join table into the public
 * Developer shape with skillIds as a flat string array.
 */
async function flattenDeveloper(developerRecord: {
  id: string;
  name: string;
  skills: Array<{ skillId: string }>;
}): Promise<Developer> {
  return {
    id: developerRecord.id,
    name: developerRecord.name,
    skillIds: developerRecord.skills.map((s) => s.skillId).sort(),
  };
}

export class PrismaDeveloperRepository implements DeveloperRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(tx?: TransactionClient): Promise<Developer[]> {
    const client = tx ?? this.client;
    const developers = await client.developer.findMany({
      include: { skills: { select: { skillId: true } } },
      orderBy: { id: "asc" },
    });
    return Promise.all(
      developers.map((developer) => flattenDeveloper(developer)),
    );
  }

  async findById(
    id: string,
    tx?: TransactionClient,
  ): Promise<Developer | null> {
    const client = tx ?? this.client;
    const developer = await client.developer.findUnique({
      where: { id },
      include: { skills: { select: { skillId: true } } },
    });
    if (!developer) return null;
    return flattenDeveloper(developer);
  }

  async create(
    input: CreateDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer> {
    const run = async (client: TransactionClient | PrismaClient) => {
      await validateSkillIds(client, input.skillIds ?? []);
      const developer = await client.developer.create({
        data: {
          name: input.name,
          skills: {
            create: (input.skillIds ?? []).map((skillId) => ({ skillId })),
          },
        },
        include: { skills: { select: { skillId: true } } },
      });
      return flattenDeveloper(developer);
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
    input: PatchDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer> {
    const run = async (client: TransactionClient | PrismaClient) => {
      if (input.skillIds !== undefined) {
        await validateSkillIds(client, input.skillIds);
      }
      const developer = await client.developer.update({
        where: { id },
        data: {
          name: input.name,
          skills:
            input.skillIds !== undefined
              ? {
                  deleteMany: {},
                  create: input.skillIds.map((skillId) => ({ skillId })),
                }
              : undefined,
        },
        include: { skills: { select: { skillId: true } } },
      });
      return flattenDeveloper(developer);
    };

    try {
      if (tx) return await run(tx);
      return await this.client.$transaction((inner) => run(inner));
    } catch (error) {
      translateKnownPrismaError(error);
    }
  }

  async delete(id: string): Promise<void> {
    const assignedCount = await this.client.task.count({
      where: { assigneeId: id },
    });
    if (assignedCount > 0) {
      throw new InUseError(
        `Developer with id ${id} is still assigned to a task`,
      );
    }

    try {
      await this.client.developer.delete({ where: { id } });
    } catch (error) {
      translateKnownPrismaError(error);
    }
  }
}

/** Rejects with NotFoundError if any skillId does not reference an existing Skill. */
async function validateSkillIds(
  client: TransactionClient | PrismaClient,
  skillIds: string[],
): Promise<void> {
  if (skillIds.length === 0) return;
  const uniqueIds = [...new Set(skillIds)];
  const found = await client.skill.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  const foundIds = new Set(found.map((s) => s.id));
  const missing = uniqueIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    throw new NotFoundError(`Skill with id ${missing[0]} not found`);
  }
}
