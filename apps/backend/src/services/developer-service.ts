import type {
  CreateDeveloperInput,
  Developer,
  PatchDeveloperInput,
} from "@repo/shared-types";

export interface DeveloperService {
  list(): Promise<Developer[]>;
  get(id: string): Promise<Developer>;
  create(input: CreateDeveloperInput): Promise<Developer>;
  update(id: string, input: PatchDeveloperInput): Promise<Developer>;
  remove(id: string): Promise<void>;
}
