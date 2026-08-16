import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import { testSeedIds } from "../fixtures/seed-ids.js";
import { seedTestData } from "../fixtures/seed.js";
import { testFixtureIds } from "../fixtures/fixture-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function allIds(ids: Record<string, Record<string, string>>): string[] {
  return Object.values(ids).flatMap((group) => Object.values(group));
}

describe("test seed / fixture ID disjointness", () => {
  it("shares no UUID between the test seed and focused fixtures", () => {
    const seedIds = new Set(allIds(testSeedIds));
    const fixtureIds = allIds(testFixtureIds);

    for (const id of fixtureIds) {
      expect(seedIds.has(id)).toBe(false);
    }
  });
});

describe("test data seed", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses to run outside NODE_ENV=test", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(seedTestData(prisma)).rejects.toThrow(/NODE_ENV=test/);
  });

  it("creates the documented categories, skills, developers, and relationships", async () => {
    await resetDatabase();
    await seedTestData(prisma);

    const [categories, skills, developers, developerSkills] = await Promise.all(
      [
        prisma.category.findMany({ orderBy: { name: "asc" } }),
        prisma.skill.findMany({ orderBy: { name: "asc" } }),
        prisma.developer.findMany({ orderBy: { name: "asc" } }),
        prisma.developerSkill.findMany(),
      ],
    );

    expect(categories.map((c) => c.name)).toEqual(["Backend", "Frontend"]);
    expect(skills.map((s) => s.name)).toEqual([
      "Node.js",
      "PostgreSQL",
      "React",
      "TypeScript",
    ]);
    expect(developers.map((d) => d.name)).toEqual([
      "Ada Lovelace",
      "Alan Turing",
      "Grace Hopper",
    ]);
    expect(developerSkills).toHaveLength(7);

    const skillNamesFor = async (developerId: string): Promise<string[]> => {
      const links = await prisma.developerSkill.findMany({
        where: { developerId },
        include: { skill: true },
        orderBy: { skill: { name: "asc" } },
      });
      return links.map((link) => link.skill.name);
    };

    await expect(
      skillNamesFor(testSeedIds.developers.adaLovelace),
    ).resolves.toEqual(["React", "TypeScript"]);
    await expect(
      skillNamesFor(testSeedIds.developers.graceHopper),
    ).resolves.toEqual(["Node.js", "PostgreSQL", "React", "TypeScript"]);
    await expect(
      skillNamesFor(testSeedIds.developers.alanTuring),
    ).resolves.toEqual(["Node.js"]);
  });

  it("is idempotent: running twice leaves the same records and relationships", async () => {
    await resetDatabase();
    await seedTestData(prisma);
    await seedTestData(prisma);

    const [categoryCount, skillCount, developerCount, developerSkillCount] =
      await Promise.all([
        prisma.category.count(),
        prisma.skill.count(),
        prisma.developer.count(),
        prisma.developerSkill.count(),
      ]);

    expect(categoryCount).toBe(2);
    expect(skillCount).toBe(4);
    expect(developerCount).toBe(3);
    expect(developerSkillCount).toBe(7);

    const categories = await prisma.category.findMany();
    expect(categories.map((c) => c.id).sort()).toEqual(
      [testSeedIds.categories.frontend, testSeedIds.categories.backend].sort(),
    );
  });
});
