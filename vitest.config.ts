import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["test/unit-test/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    setupFiles: ["test/unit-test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
