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
    // Explicit alias resolution for test files (excluded from tsconfig.json)
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mock Next.js server modules that don't work in Vitest
      "next/server": path.resolve(__dirname, "./src/test/mocks/next-server.ts"),
      // Mock server-only guard (throws outside RSC context)
      "server-only": path.resolve(__dirname, "./src/test/mocks/server-only.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["src/**/*.integration.test.{ts,tsx}", "node_modules"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
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
