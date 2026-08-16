import type {
  CreateDeveloperInput,
  Developer,
  PatchDeveloperInput,
} from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";

/**
 * Persistence boundary for developers. Implementations own Prisma access and
 * return the flattened public `Developer` shape (skills as `skillIds`).
 */
export interface DeveloperRepository {
  list(): Promise<Developer[]>;
  findById(id: string): Promise<Developer | null>;
  create(
    input: CreateDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer>;
  update(
    id: string,
    input: PatchDeveloperInput,
    tx?: TransactionClient,
  ): Promise<Developer>;
  delete(id: string): Promise<void>;
}
