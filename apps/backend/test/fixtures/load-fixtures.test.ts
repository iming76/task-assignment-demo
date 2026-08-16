import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/lib/prisma.js";
import { applicationSeedIds } from "../../prisma/seed-ids.js";
import { loadFixtures } from "./load-fixtures.js";
import { testFixtureIds } from "./fixture-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

describe("loadFixtures", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("refuses to load outside NODE_ENV=test", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(loadFixtures(prisma)).rejects.toThrow(/NODE_ENV=test/);
  });

  it("loads test-only records under NODE_ENV=test without touching application seed IDs", async () => {
    await resetDatabase();

    await loadFixtures(prisma);

    const developer = await prisma.developer.findUniqueOrThrow({
      where: { id: testFixtureIds.developers.testDeveloper },
    });
    expect(developer.name).toBe("Fixture Developer");

    const applicationDeveloper = await prisma.developer.findUnique({
      where: { id: applicationSeedIds.developers.adaLovelace },
    });
    expect(applicationDeveloper).toBeNull();

    await resetDatabase();
  });
});
