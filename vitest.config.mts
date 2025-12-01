import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: [
      "src/components/platform/operator/**/*.test.{ts,tsx}",
      "src/app/(platform)/operator/**/*.test.{ts,tsx}",
      "src/components/table/**/*.test.{ts,tsx}",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});


