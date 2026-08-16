import { Prisma } from "../generated/prisma/client.js";
import { InUseError, ValidationError } from "../errors/application-error.js";

/**
 * Defense-in-depth translation of database constraint failures into the
 * public error contract. Repositories validate referential and uniqueness
 * rules at the application boundary first; this only catches races that
 * reach the database anyway.
 */
export function translateKnownPrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ValidationError("A resource with that name already exists.");
    }
    if (error.code === "P2003") {
      throw new InUseError(
        "This resource is still referenced by another record.",
      );
    }
  }
  throw error;
}
