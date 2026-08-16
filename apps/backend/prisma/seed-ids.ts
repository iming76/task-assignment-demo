/**
 * Stable identifiers for the idempotent application seed. Keep these fixed:
 * the seed script upserts by ID, and any change here creates new rows instead
 * of updating existing ones. Must stay disjoint from test/fixtures/fixture-ids.ts.
 */
export const applicationSeedIds = {
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
