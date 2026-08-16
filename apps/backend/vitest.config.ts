import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Test files share one PostgreSQL database (see docker-compose.yml) and
    // each resets it in beforeEach; running files in parallel races that reset.
    fileParallelism: false,
  },
});
