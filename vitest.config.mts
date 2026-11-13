import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["test/unit-test/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    setupFiles: ["test/unit-test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
