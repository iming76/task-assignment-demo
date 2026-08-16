import type { Developer, Skill } from "@repo/shared-types";

export function skillName(skills: Skill[], skillId: string): string {
  return skills.find((skill) => skill.id === skillId)?.name ?? skillId;
}

export function developerName(
  developers: Developer[],
  developerId: string,
): string {
  return (
    developers.find((developer) => developer.id === developerId)?.name ??
    developerId
  );
}
