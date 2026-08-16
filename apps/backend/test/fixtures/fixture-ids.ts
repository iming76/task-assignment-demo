/**
 * Test-only identifiers, disjoint from seed-ids.ts by construction (different
 * leading byte: "b" vs "a").
 */
export const testFixtureIds = {
  categories: {
    frontend: "b0000000-0000-4000-8000-000000000001",
  },
  skills: {
    react: "b0000000-0000-4000-8000-000000000101",
  },
  developers: {
    testDeveloper: "b0000000-0000-4000-8000-000000000201",
  },
} as const;
