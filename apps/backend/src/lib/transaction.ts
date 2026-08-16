import type { Prisma, PrismaClient } from "../generated/prisma/client.js";

/** The Prisma client shape available inside a transactional callback. */
export type TransactionClient = Prisma.TransactionClient;

/**
 * Runs related repository writes atomically. Application services depend on
 * this interface, never on Prisma directly, so tests can inject a fake that
 * runs the callback without a database.
 */
export interface TransactionRunner {
  run<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T>;
}

export class PrismaTransactionRunner implements TransactionRunner {
  constructor(private readonly client: PrismaClient) {}

  run<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction((tx) => work(tx));
  }
}
