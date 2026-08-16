export interface Developer {
  id: string;
  name: string;
  skillIds: string[];
}

export interface CreateDeveloperInput {
  name: string;
  skillIds?: string[];
}

export interface PatchDeveloperInput {
  name?: string;
  skillIds?: string[];
}

export type DeveloperResponse = Developer;
export type DeveloperListResponse = Developer[];
