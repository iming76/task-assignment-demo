import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { applicationSeedIds } from "./seed-ids.js";

const categories = [
  { id: applicationSeedIds.categories.frontend, name: "Frontend" },
  { id: applicationSeedIds.categories.backend, name: "Backend" },
];

const skills = [
  {
    id: applicationSeedIds.skills.react,
    name: "React",
    description:
      "UI library for building interactive frontend interfaces from reusable components.",
    categoryId: applicationSeedIds.categories.frontend,
  },
  {
    id: applicationSeedIds.skills.typescript,
    name: "TypeScript",
    description:
      "Typed superset of JavaScript used for safer frontend and backend code.",
    categoryId: applicationSeedIds.categories.frontend,
  },
  {
    id: applicationSeedIds.skills.nodejs,
    name: "Node.js",
    description: "JavaScript runtime for building backend services and APIs.",
    categoryId: applicationSeedIds.categories.backend,
  },
  {
    id: applicationSeedIds.skills.postgresql,
    name: "PostgreSQL",
    description:
      "Relational database used for backend persistence and querying.",
    categoryId: applicationSeedIds.categories.backend,
  },
];

const developers = [
  { id: applicationSeedIds.developers.adaLovelace, name: "Ada Lovelace" },
  { id: applicationSeedIds.developers.graceHopper, name: "Grace Hopper" },
  { id: applicationSeedIds.developers.alanTuring, name: "Alan Turing" },
];

/**
 * Ada is an exact match for a Frontend task needing React + TypeScript. Grace
 * holds every seeded skill, a superset of any single-domain requirement. Alan
 * holds only Node.js, missing PostgreSQL for a full-stack Backend requirement.
 */
const developerSkills = [
  {
    developerId: applicationSeedIds.developers.adaLovelace,
    skillId: applicationSeedIds.skills.react,
  },
  {
    developerId: applicationSeedIds.developers.adaLovelace,
    skillId: applicationSeedIds.skills.typescript,
  },
  {
    developerId: applicationSeedIds.developers.graceHopper,
    skillId: applicationSeedIds.skills.react,
  },
  {
    developerId: applicationSeedIds.developers.graceHopper,
    skillId: applicationSeedIds.skills.typescript,
  },
  {
    developerId: applicationSeedIds.developers.graceHopper,
    skillId: applicationSeedIds.skills.nodejs,
  },
  {
    developerId: applicationSeedIds.developers.graceHopper,
    skillId: applicationSeedIds.skills.postgresql,
  },
  {
    developerId: applicationSeedIds.developers.alanTuring,
    skillId: applicationSeedIds.skills.nodejs,
  },
];

export async function seedApplicationData(client: PrismaClient): Promise<void> {
  for (const category of categories) {
    await client.category.upsert({
      where: { id: category.id },
      create: category,
      update: { name: category.name },
    });
  }

  for (const skill of skills) {
    await client.skill.upsert({
      where: { id: skill.id },
      create: skill,
      update: {
        name: skill.name,
        description: skill.description,
        categoryId: skill.categoryId,
      },
    });
  }

  for (const developer of developers) {
    await client.developer.upsert({
      where: { id: developer.id },
      create: developer,
      update: { name: developer.name },
    });
  }

  for (const link of developerSkills) {
    await client.developerSkill.upsert({
      where: {
        developerId_skillId: {
          developerId: link.developerId,
          skillId: link.skillId,
        },
      },
      create: link,
      update: {},
    });
  }
}

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const client = new PrismaClient({ adapter });
  try {
    await seedApplicationData(client);
  } finally {
    await client.$disconnect();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
