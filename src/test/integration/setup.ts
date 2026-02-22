/**
 * Integration Test Setup
 *
 * Prepares the environment for integration tests that run against
 * a real database (Neon branch).
 *
 * Usage: vitest --config vitest.config.integration.mts --run
 */

import { afterAll, beforeAll } from "vitest"

beforeAll(async () => {
  // Verify DATABASE_URL is set (should point to a Neon branch, not production)
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL is required for integration tests. " +
        "Create a Neon branch first: neon branches create --name integration-tests"
    )
  }

  // Safety check: refuse to run against production
  if (
    dbUrl.includes("main") &&
    !dbUrl.includes("branch") &&
    !process.env.ALLOW_PRODUCTION_DB
  ) {
    throw new Error(
      "Refusing to run integration tests against production database. " +
        "Use a Neon branch or set ALLOW_PRODUCTION_DB=1"
    )
  }

  console.log(
    "[integration] Using database:",
    dbUrl.replace(/:[^:@]+@/, ":***@")
  )
})

afterAll(async () => {
  console.log("[integration] Test suite complete")
})
