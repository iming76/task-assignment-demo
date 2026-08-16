import type { PrismaClient } from "../../src/generated/prisma/client.js";
import { testSeedIds } from "./seed-ids.js";

const categories = [
  { id: testSeedIds.categories.frontend, name: "Frontend" },
  { id: testSeedIds.categories.backend, name: "Backend" },
];

const skills = [
  {
    id: testSeedIds.skills.react,
    name: "React",
    description:
      "UI library for building interactive frontend interfaces from reusable components.",
    categoryId: testSeedIds.categories.frontend,
  },
  {
    id: testSeedIds.skills.typescript,
    name: "TypeScript",
    description:
      "Typed superset of JavaScript used for safer frontend and backend code.",
    categoryId: testSeedIds.categories.frontend,
  },
  {
    id: testSeedIds.skills.nodejs,
    name: "Node.js",
    description: "JavaScript runtime for building backend services and APIs.",
    categoryId: testSeedIds.categories.backend,
  },
  {
    id: testSeedIds.skills.postgresql,
    name: "PostgreSQL",
    description:
      "Relational database used for backend persistence and querying.",
    categoryId: testSeedIds.categories.backend,
  },
];

const developers = [
  { id: testSeedIds.developers.adaLovelace, name: "Ada Lovelace" },
  { id: testSeedIds.developers.graceHopper, name: "Grace Hopper" },
  { id: testSeedIds.developers.alanTuring, name: "Alan Turing" },
];

/**
 * Ada is an exact match for a Frontend task needing React + TypeScript. Grace
 * holds every seeded skill, a superset of any single-domain requirement. Alan
 * holds only Node.js, missing PostgreSQL for a full-stack Backend requirement.
 */
const developerSkills = [
  {
    developerId: testSeedIds.developers.adaLovelace,
    skillId: testSeedIds.skills.react,
  },
  {
    developerId: testSeedIds.developers.adaLovelace,
    skillId: testSeedIds.skills.typescript,
  },
  {
    developerId: testSeedIds.developers.graceHopper,
    skillId: testSeedIds.skills.react,
  },
  {
    developerId: testSeedIds.developers.graceHopper,
    skillId: testSeedIds.skills.typescript,
  },
  {
    developerId: testSeedIds.developers.graceHopper,
    skillId: testSeedIds.skills.nodejs,
  },
  {
    developerId: testSeedIds.developers.graceHopper,
    skillId: testSeedIds.skills.postgresql,
  },
  {
    developerId: testSeedIds.developers.alanTuring,
    skillId: testSeedIds.skills.nodejs,
  },
];

export async function seedTestData(client: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to seed test data outside NODE_ENV=test.");
  }

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
