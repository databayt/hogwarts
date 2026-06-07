/**
 * Tenant Fixture
 *
 * Provides multi-tenant context helpers for Playwright tests.
 * Handles subdomain routing, tenant isolation, and context resolution.
 */

import { test as base, type Page } from "@playwright/test"

import {
  buildSchoolUrl,
  getSchoolUrl,
  getTestEnv,
  TIMEOUTS,
  type Locale,
  type TestEnv,
} from "../helpers/test-data"
import { createDemoSchoolBuilder, UrlBuilder } from "../helpers/url-builder"

// =============================================================================
// TENANT CONTEXT TYPES
// =============================================================================

export interface TenantContext {
  subdomain: string
  schoolId: string | null
  locale: Locale
  env: TestEnv
}

export interface TenantFixtures {
  // Current tenant context
  tenantContext: TenantContext

  // URL builders
  urlBuilder: UrlBuilder
  demoSchoolBuilder: UrlBuilder

  // Navigation helpers
  goToSchool: (
    subdomain: string,
    path?: string,
    locale?: Locale
  ) => Promise<void>
  goToDemoSchool: (path?: string, locale?: Locale) => Promise<void>

  // Subdomain detection
  getCurrentSubdomain: () => string | null
  isOnSchoolSubdomain: () => boolean
  isOnMainDomain: () => boolean

  // Tenant isolation helpers
  setImpersonationCookie: (schoolId: string) => Promise<void>
  clearImpersonationCookie: () => Promise<void>
  getSubdomainHeader: () => Promise<string | null>
}

// =============================================================================
// SUBDOMAIN UTILITIES
// =============================================================================

/**
 * Extract subdomain from URL
 */
function extractSubdomain(url: string, env: TestEnv): string | null {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname

    if (env === "local") {
      // Pattern: subdomain.localhost
      const match = hostname.match(/^([^.]+)\.localhost$/)
      return match ? match[1] : null
    } else {
      // Production pattern: subdomain.databayt.org
      // Exclude "ed" as it's the main domain
      const match = hostname.match(/^([^.]+)\.databayt\.org$/)
      if (match && match[1] !== "ed") {
        return match[1]
      }
      return null
    }
  } catch {
    return null
  }
}

/**
 * Check if URL is on a school subdomain
 */
function isSchoolSubdomain(url: string, env: TestEnv): boolean {
  return extractSubdomain(url, env) !== null
}

/**
 * Check if URL is on main domain
 */
function isMainDomain(url: string, env: TestEnv): boolean {
  return !isSchoolSubdomain(url, env)
}

// =============================================================================
// FIXTURE IMPLEMENTATION
// =============================================================================

export const test = base.extend<TenantFixtures>({
  // Current tenant context based on page URL
  tenantContext: async ({ page }, use) => {
    const env = getTestEnv()
    const url = page.url()
    const subdomain = extractSubdomain(url, env)

    const context: TenantContext = {
      subdomain: subdomain ?? "",
      schoolId: subdomain, // In this app, subdomain === schoolId for demo
      locale: url.includes("/ar/") ? "ar" : "en",
      env,
    }

    await use(context)
  },

  // URL builder for current environment
  urlBuilder: async ({}, use) => {
    await use(new UrlBuilder(getTestEnv()))
  },

  // Pre-configured demo school URL builder
  demoSchoolBuilder: async ({}, use) => {
    await use(createDemoSchoolBuilder("en", getTestEnv()))
  },

  // Navigate to a school subdomain
  goToSchool: async ({ page }, use) => {
    await use(
      async (subdomain: string, path: string = "", locale: Locale = "en") => {
        const url = buildSchoolUrl(subdomain, path, locale, getTestEnv())
        await page.goto(url)
        await page.waitForLoadState("domcontentloaded")
      }
    )
  },

  // Navigate to demo school
  goToDemoSchool: async ({ page }, use) => {
    await use(async (path: string = "", locale: Locale = "en") => {
      const url = buildSchoolUrl("demo", path, locale, getTestEnv())
      await page.goto(url)
      await page.waitForLoadState("domcontentloaded")
    })
  },

  // Get current subdomain from URL
  getCurrentSubdomain: async ({ page }, use) => {
    await use(() => extractSubdomain(page.url(), getTestEnv()))
  },

  // Check if on school subdomain
  isOnSchoolSubdomain: async ({ page }, use) => {
    await use(() => isSchoolSubdomain(page.url(), getTestEnv()))
  },

  // Check if on main domain
  isOnMainDomain: async ({ page }, use) => {
    await use(() => isMainDomain(page.url(), getTestEnv()))
  },

  // Set impersonation cookie (DEVELOPER feature)
  setImpersonationCookie: async ({ page }, use) => {
    await use(async (schoolId: string) => {
      const env = getTestEnv()
      const domain = env === "local" ? "localhost" : ".databayt.org"

      await page.context().addCookies([
        {
          name: "impersonate-school",
          value: schoolId,
          domain,
          path: "/",
          httpOnly: true,
          secure: env === "production",
          sameSite: "Lax",
        },
      ])
    })
  },

  // Clear impersonation cookie
  clearImpersonationCookie: async ({ page }, use) => {
    await use(async () => {
      const cookies = await page.context().cookies()
      const impersonateCookie = cookies.find(
        (c) => c.name === "impersonate-school"
      )

      if (impersonateCookie) {
        await page.context().clearCookies({
          name: "impersonate-school",
        })
      }
    })
  },

  // Get x-subdomain header value (if accessible)
  getSubdomainHeader: async ({ page }, use) => {
    await use(async () => {
      // This is a documentation helper - headers aren't directly accessible from page
      // In real tests, you'd intercept network requests to check headers
      const subdomain = extractSubdomain(page.url(), getTestEnv())
      return subdomain
    })
  },
})

export { expect } from "@playwright/test"

// =============================================================================
// TEST HELPERS FOR TENANT ISOLATION
// =============================================================================

/**
 * Verify tenant isolation by checking data doesn't leak
 */
export async function verifyTenantIsolation(
  page: Page,
  expectedSchoolId: string
): Promise<boolean> {
  // This would typically check:
  // 1. Data displayed belongs to expected school
  // 2. API calls include schoolId
  // 3. No cross-tenant data visible

  const url = page.url()
  const env = getTestEnv()
  const currentSubdomain = extractSubdomain(url, env)

  return currentSubdomain === expectedSchoolId
}

/**
 * Get school base URL for testing
 */
export function getTestSchoolUrl(subdomain: string = "demo"): string {
  return getSchoolUrl(subdomain, getTestEnv())
}

/**
 * Subdomain routing test patterns
 */
export const subdomainPatterns = {
  production: {
    pattern: /^([^.]+)\.databayt\.org$/,
    example: "demo.databayt.org",
  },
  preview: {
    pattern: /^([^-]+)---([^.]+)\.vercel\.app$/,
    example: "tenant---branch.vercel.app",
  },
  development: {
    pattern: /^([^.]+)\.localhost(:\d+)?$/,
    example: "demo.localhost:3000",
  },
}

/**
 * URL rewriting expectations
 */
export const urlRewriteExpectations = {
  // User-facing URL -> Internal route
  dashboard: {
    userUrl: "/dashboard",
    internalRoute: "/en/s/{subdomain}/dashboard",
  },
  students: {
    userUrl: "/students",
    internalRoute: "/en/s/{subdomain}/students",
  },
  // Auth routes should NOT be rewritten
  login: {
    userUrl: "/login",
    internalRoute: "/en/login", // Same, no subdomain prefix
  },
}
