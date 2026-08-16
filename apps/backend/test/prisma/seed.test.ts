import { describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import { applicationSeedIds } from "../../prisma/seed-ids.js";
import { seedApplicationData } from "../../prisma/seed.js";
import { testFixtureIds } from "../fixtures/fixture-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function allIds(ids: Record<string, Record<string, string>>): string[] {
  return Object.values(ids).flatMap((group) => Object.values(group));
}

describe("application seed / test fixture ID disjointness", () => {
  it("shares no UUID between the application seed and test fixtures", () => {
    const applicationIds = new Set(allIds(applicationSeedIds));
    const fixtureIds = allIds(testFixtureIds);

    for (const id of fixtureIds) {
      expect(applicationIds.has(id)).toBe(false);
    }
  });
});

describe("application seed", () => {
  it("creates the documented categories, skills, developers, and relationships", async () => {
    await resetDatabase();
    await seedApplicationData(prisma);

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
      skillNamesFor(applicationSeedIds.developers.adaLovelace),
    ).resolves.toEqual(["React", "TypeScript"]);
    await expect(
      skillNamesFor(applicationSeedIds.developers.graceHopper),
    ).resolves.toEqual(["Node.js", "PostgreSQL", "React", "TypeScript"]);
    await expect(
      skillNamesFor(applicationSeedIds.developers.alanTuring),
    ).resolves.toEqual(["Node.js"]);
  });

  it("is idempotent: running twice leaves the same records and relationships", async () => {
    await resetDatabase();
    await seedApplicationData(prisma);
    await seedApplicationData(prisma);

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
      [
        applicationSeedIds.categories.frontend,
        applicationSeedIds.categories.backend,
      ].sort(),
    );
  });
});
