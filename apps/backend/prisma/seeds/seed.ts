import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { developers, skills } from "./seed-data.js";

export async function seedDatabase(client: PrismaClient): Promise<void> {
  await client.$transaction(async (transaction) => {
    const categoryIds = new Map<string, string>();
    const skillIds = new Map<string, string>();

    for (const skillGroup of skills) {
      const category = await transaction.category.upsert({
        where: { name: skillGroup.category },
        create: { name: skillGroup.category },
        update: {},
      });
      categoryIds.set(skillGroup.category, category.id);
    }

    for (const skillGroup of skills) {
      const categoryId = categoryIds.get(skillGroup.category);
      if (!categoryId) {
        throw new Error(`Missing seeded category: ${skillGroup.category}`);
      }

      for (const skillName of skillGroup.skills) {
        const skill = await transaction.skill.upsert({
          where: { name: skillName },
          create: {
            name: skillName,
            description: `${skillName} expertise for ${skillGroup.category} work.`,
            categoryId,
          },
          update: {
            description: `${skillName} expertise for ${skillGroup.category} work.`,
            categoryId,
          },
        });
        skillIds.set(skillName, skill.id);
      }
    }

    for (const developerData of developers) {
      const developer = await transaction.developer.upsert({
        where: { name: developerData.name },
        create: { name: developerData.name },
        update: {},
      });

      for (const skillName of developerData.skills) {
        const skillId = skillIds.get(skillName);
        if (!skillId) {
          throw new Error(`Missing seeded skill: ${skillName}`);
        }

        await transaction.developerSkill.upsert({
          where: {
            developerId_skillId: {
              developerId: developer.id,
              skillId,
            },
          },
          create: { developerId: developer.id, skillId },
          update: {},
        });
      }
    }
  });
}

export async function seedDatabaseIfEmpty(
  client: PrismaClient,
): Promise<boolean> {
  const counts = await client.$transaction([
    client.category.count(),
    client.skill.count(),
    client.developer.count(),
    client.task.count(),
  ]);

  if (counts.some((count) => count > 0)) {
    return false;
  }

  await seedDatabase(client);
  return true;
}
