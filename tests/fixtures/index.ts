// Combined test with all fixtures
import { mergeTests } from "@playwright/test"

import { test as authTest } from "./auth.fixture"
import { test as tenantTest } from "./tenant.fixture"

/**
 * Fixtures Index
 *
 * Re-exports all Playwright fixtures for convenient imports.
 */

// Auth fixtures (multi-role authentication)
export { expect, test } from "./auth.fixture"
export type { AuthFixtures } from "./auth.fixture"

// Tenant fixtures (multi-tenant context)
export {
  getTestSchoolUrl,
  subdomainPatterns,
  urlRewriteExpectations,
  verifyTenantIsolation,
} from "./tenant.fixture"
export type { TenantContext, TenantFixtures } from "./tenant.fixture"

/**
 * Combined test with auth + tenant fixtures
 */
export const combinedTest = mergeTests(authTest, tenantTest)
