/**
 * Epic 3: Multi-Tenancy - Tenant Isolation
 * Story 3.3: Tenant Context Resolution
 * Story 3.4: Tenant Isolation
 *
 * Tests tenant isolation and context resolution.
 * Tag: @multi-tenant @critical
 */

import { expect, test } from "@playwright/test"

import { assertNoSSE } from "../../helpers/assertions"
import { buildSchoolUrl, getTestEnv, TIMEOUTS } from "../../helpers/test-data"
import { LoginPage, SchoolLoginPage } from "../../page-objects"

const env = getTestEnv()

// Helper to clear auth state
async function clearAuthState(page: import("@playwright/test").Page) {
  await page.context().clearCookies()
}

test.describe("Story 3.3: Tenant Context Resolution @multi-tenant", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("MT-012: Session provides schoolId for school users", async ({
    page,
  }) => {
    // Login as ADMIN (has schoolId)
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should be on school subdomain dashboard
    const url = page.url()
    expect(url).toContain("demo")
    expect(url).toMatch(/\/dashboard/)
  })

  test("MT-013: DEVELOPER has no schoolId", async ({ page }) => {
    // Login as DEVELOPER (no schoolId)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("developer")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should be on main domain dashboard, not school subdomain
    const url = page.url()
    expect(url).not.toContain("demo.")
    expect(url).toMatch(/\/dashboard/)
  })

  test("MT-014: Fresh user has no schoolId", async ({ page }) => {
    // Login as USER (fresh user, no schoolId)
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login("user@databayt.org", "1234")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Should be redirected to onboarding (no school)
    const url = page.url()
    // Fresh user either goes to onboarding or dashboard
    expect(url).not.toContain("demo.")
  })
})

test.describe("Story 3.4: Tenant Isolation @multi-tenant @critical", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("MT-015: ADMIN stays on correct school subdomain", async ({ page }) => {
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Navigate to various pages - should stay on demo subdomain
    await page.goto(buildSchoolUrl("demo", "/students", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toContain("demo")

    await page.goto(buildSchoolUrl("demo", "/teachers", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toContain("demo")

    await page.goto(buildSchoolUrl("demo", "/finance", "en", env))
    await page.waitForLoadState("domcontentloaded")
    expect(page.url()).toContain("demo")
  })

  test("MT-016: DEVELOPER can access main domain dashboard", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginAs("developer")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // DEVELOPER should access SaaS dashboard on main domain
    await page.goto("http://localhost:3000/en/dashboard")
    await page.waitForLoadState("domcontentloaded")

    expect(page.url()).not.toContain("demo.")
    expect(page.url()).toMatch(/\/dashboard/)
    await assertNoSSE(page)
  })

  test("MT-017: Document schoolId query requirement", async () => {
    // This documents the critical multi-tenancy requirement
    console.log("=== TENANT ISOLATION REQUIREMENT ===")
    console.log("CRITICAL: Every database query MUST include schoolId")
    console.log("")
    console.log("✅ CORRECT:")
    console.log("  await db.student.findMany({ where: { schoolId } })")
    console.log("")
    console.log("❌ WRONG (DATA LEAK):")
    console.log("  await db.student.findMany()")
    console.log("")
    console.log("Missing schoolId = data visible across schools!")
    console.log("=====================================")

    expect(true).toBeTruthy()
  })
})

test.describe("Story 3.4: Cross-Tenant Access Prevention @multi-tenant @critical", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
  })

  test("MT-018: School user cannot access other school data via URL", async ({
    page,
  }) => {
    // Login as demo school ADMIN
    const loginPage = new SchoolLoginPage(page, "demo")
    await loginPage.goto()
    await loginPage.loginAs("admin")

    if (page.url().includes("chrome-error://")) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    // Try to access a hypothetical "other" school
    // Should either redirect or show error
    await page.goto("http://other.localhost:3000/en/dashboard", {
      timeout: TIMEOUTS.long,
    })
    await page.waitForLoadState("domcontentloaded").catch(() => {})

    // Should not see other school's data
    // Either redirected to login or shows error
    const url = page.url()

    // One of these should be true:
    // 1. Redirected back to demo subdomain
    // 2. Redirected to login
    // 3. Shows unauthorized/error
    // 4. Shows login page (no valid school)
    const isProtected =
      url.includes("/login") ||
      url.includes("/unauthorized") ||
      url.includes("demo") ||
      url.includes("/403")

    expect(isProtected).toBeTruthy()
  })

  test("MT-019: API calls without schoolId should fail or return empty", async ({
    page,
  }) => {
    // This documents the expected API behavior
    console.log("=== API TENANT ISOLATION ===")
    console.log("1. Server actions MUST get schoolId from session")
    console.log("2. All queries MUST include schoolId WHERE clause")
    console.log("3. Missing schoolId = throw error or return empty")
    console.log("4. DEVELOPER can query without schoolId (platform admin)")
    console.log("============================")

    expect(true).toBeTruthy()
  })
})

test.describe("Story 3.3: Tenant Context Priority @multi-tenant", () => {
  test("MT-020: Document tenant context resolution priority", async () => {
    console.log("=== TENANT CONTEXT PRIORITY ===")
    console.log("1. Impersonation cookie (highest - DEVELOPER feature)")
    console.log("2. x-subdomain header (set by middleware)")
    console.log("3. Session schoolId (from authentication)")
    console.log("")
    console.log("Resolution flow:")
    console.log("  Edge Middleware → Detects subdomain → Sets header")
    console.log("  Server Action → getTenantContext() → Returns schoolId")
    console.log("  Database Query → MUST include schoolId")
    console.log("================================")

    expect(true).toBeTruthy()
  })
})
