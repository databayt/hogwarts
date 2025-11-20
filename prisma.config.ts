// Load environment variables from .env files
// Required for Prisma CLI to access DATABASE_URL in prisma.config.ts
import "dotenv/config"

import { defineConfig, env } from "prisma/config"
import path from "node:path"

/**
 * Prisma Configuration (v6.19+)
 *
 * Modern TypeScript-based configuration for Prisma CLI.
 * This file centralizes CLI configuration previously in package.json.
 *
 * Multi-File Schema Setup:
 * - Points to the `prisma` directory (not a single file) to enable multi-schema support
 * - All *.prisma files in prisma/models/ are automatically included
 * - Main schema.prisma defines datasource and generator blocks
 *
 * Configuration Structure:
 * - schema.prisma: Datasource and generator configuration
 * - prisma.config.ts: Schema path, migrations path, and seed command
 * - prisma/models/*.prisma: 33 model files with business logic
 *
 * Learn more:
 * - https://www.prisma.io/docs/orm/reference/prisma-config-reference
 * - https://www.prisma.io/blog/announcing-prisma-6-18-0
 */
export default defineConfig({
  // Schema engine configuration (required for v6.18+ and v7)
  engine: "classic",

  // Database connection configuration
  // Required when using engine: "classic"
  // The URL here can override the one in schema.prisma if needed
  datasource: {
    url: env("DATABASE_URL"),
  },

  // Multi-file schema support
  // Points to the prisma directory which contains:
  // - schema.prisma (datasource + generator config)
  // - models/*.prisma (33 model files)
  schema: path.join("prisma"),

  // Migrations configuration
  migrations: {
    // Directory for storing migration files
    path: path.join("prisma", "migrations"),

    // Seed command (replaces package.json prisma.seed config)
    // Uses tsx to execute TypeScript seed files
    seed: "tsx prisma/generator/seed.ts",
  },
})
