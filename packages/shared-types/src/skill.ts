export interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

export interface CreateSkillInput {
  name: string;
  description: string;
  categoryId: string;
}

export interface PatchSkillInput {
  name?: string;
  description?: string;
  categoryId?: string;
}

export type SkillResponse = Skill;
export type SkillListResponse = Skill[];
