/**
 * Stable identifiers for the test data seed. Keep these fixed so tests can
 * reference deterministic records. They must stay disjoint from fixture-ids.ts.
 */
export const testSeedIds = {
  categories: {
    frontend: "a0000000-0000-4000-8000-000000000001",
    backend: "a0000000-0000-4000-8000-000000000002",
  },
  skills: {
    react: "a0000000-0000-4000-8000-000000000101",
    typescript: "a0000000-0000-4000-8000-000000000102",
    nodejs: "a0000000-0000-4000-8000-000000000103",
    postgresql: "a0000000-0000-4000-8000-000000000104",
  },
  developers: {
    adaLovelace: "a0000000-0000-4000-8000-000000000201",
    graceHopper: "a0000000-0000-4000-8000-000000000202",
    alanTuring: "a0000000-0000-4000-8000-000000000203",
  },
} as const;
