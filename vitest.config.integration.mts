import path from "path"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.integration.test.{ts,tsx}"],
    setupFiles: ["./src/test/integration/setup.ts"],
    testTimeout: 30_000,
    pool: "forks",
    singleFork: true,
  },
})
