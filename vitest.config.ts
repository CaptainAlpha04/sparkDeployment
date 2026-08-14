import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // DB tests share one database and mutate overlapping rows. Running test
    // files in parallel produces false failures, particularly in the
    // registration concurrency suite.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
