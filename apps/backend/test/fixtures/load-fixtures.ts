import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { testFixtureIds } from "./fixture-ids.js";

/**
 * Refuses to run outside a test process. Vitest sets NODE_ENV=test (see
 * vitest.config.ts), so this is the only signal available to keep fixture
 * writes off the single Compose-provisioned database used for both dev and
 * tests (see design.md risk on fixtures targeting the wrong database).
 */
function assertTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to load test fixtures outside NODE_ENV=test.");
  }
}

export async function loadFixtures(client: PrismaClient): Promise<void> {
  assertTestEnvironment();

  const category = await client.category.upsert({
    where: { id: testFixtureIds.categories.frontend },
    create: {
      id: testFixtureIds.categories.frontend,
      name: "Fixture Frontend",
    },
    update: { name: "Fixture Frontend" },
  });

  const skill = await client.skill.upsert({
    where: { id: testFixtureIds.skills.react },
    create: {
      id: testFixtureIds.skills.react,
      name: "Fixture React",
      description: "Fixture-only skill used to verify test isolation.",
      categoryId: category.id,
    },
    update: {
      name: "Fixture React",
      description: "Fixture-only skill used to verify test isolation.",
      categoryId: category.id,
    },
  });

  const developer = await client.developer.upsert({
    where: { id: testFixtureIds.developers.testDeveloper },
    create: {
      id: testFixtureIds.developers.testDeveloper,
      name: "Fixture Developer",
    },
    update: { name: "Fixture Developer" },
  });

  await client.developerSkill.upsert({
    where: {
      developerId_skillId: {
        developerId: developer.id,
        skillId: skill.id,
      },
    },
    create: { developerId: developer.id, skillId: skill.id },
    update: {},
  });
}
