import path from "path"
import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  css: {
    postcss: {},
  },
  resolve: {
    // Explicit alias resolution for tests files (excluded from tsconfig.json)
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mock Next.js server modules that don't work in Vitest
      "next/server": path.resolve(
        __dirname,
        "./src/tests/mocks/next-server.ts"
      ),
      // Mock server-only guard (throws outside RSC context)
      "server-only": path.resolve(
        __dirname,
        "./src/tests/mocks/server-only.ts"
      ),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/tests/**/*.test.{ts,tsx}"],
    exclude: [
      "src/tests/**/*.integration.test.{ts,tsx}",
      "src/tests/e2e/**",
      "node_modules",
    ],
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      // Measure product code, never the relocated tests/infra.
      include: ["src/components/**", "src/lib/**", "src/app/**"],
      exclude: ["src/tests/**", "**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    css: false,
    pool: "threads",
    minThreads: 2,
    maxThreads: 8,
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
})
