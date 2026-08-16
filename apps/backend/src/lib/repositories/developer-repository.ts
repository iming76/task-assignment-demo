import type {
  CreateDeveloperInput,
  Developer,
  PatchDeveloperInput,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

/**
 * Persistence boundary for developers. Implementations own Prisma access and
 * return the flattened public `Developer` shape (skills as `skillIds`).
 */
export interface DeveloperRepository {
  list(): Promise<Developer[]>;
  findById(id: string): Promise<Developer | null>;
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

  async list(): Promise<Developer[]> {
    const developers = await this.client.developer.findMany({
      include: { skills: { select: { skillId: true } } },
      orderBy: { id: "asc" },
    });
    return Promise.all(developers.map((d) => flattenDeveloper(d as any)));
  }

  async findById(id: string): Promise<Developer | null> {
    const developer = await this.client.developer.findUnique({
      where: { id },
      include: { skills: { select: { skillId: true } } },
    });
    if (!developer) return null;
    return flattenDeveloper(developer as any);
  }

  async create(
    input: CreateDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer> {
    const client = tx ?? this.client;
    const developer = await client.developer.create({
      data: {
        name: input.name,
        skills: {
          create: (input.skillIds ?? []).map((skillId) => ({ skillId })),
        },
      },
      include: { skills: { select: { skillId: true } } },
    });
    return flattenDeveloper(developer as any);
  }

  async update(
    id: string,
    input: PatchDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer> {
    const client = tx ?? this.client;
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
    return flattenDeveloper(developer as any);
  }

  async delete(id: string): Promise<void> {
    await this.client.developer.delete({ where: { id } });
  }
}
