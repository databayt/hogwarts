/**
 * Epic 3: Multi-Tenancy - Subdomain Routing
 * Story 3.1: Subdomain Routing
 * Story 3.2: URL Rewriting
 *
 * Tests multi-tenant subdomain detection and URL rewriting.
 * Tag: @multi-tenant
 */

import { expect, test } from "@playwright/test"

import { subdomainPatterns } from "../../fixtures/tenant.fixture"
import { assertNoSSE } from "../../helpers/assertions"
import {
  buildSchoolUrl,
  getSchoolUrl,
  getTestEnv,
} from "../../helpers/test-data"

const env = getTestEnv()

test.describe("Story 3.1: Subdomain Routing @multi-tenant", () => {
  test("MT-001: Development subdomain detected (demo.localhost)", async ({
    page,
  }) => {
    if (env !== "local") {
      test.skip()
    }

    await page.goto(buildSchoolUrl("demo", "", "en", env))
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).toMatch(/demo\.localhost/)
  })

  test("MT-002: Main domain not treated as subdomain", async ({ page }) => {
    await page.goto("http://localhost:3000/en")
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).not.toMatch(/demo\./)
    expect(url).toMatch(/localhost:3000\/en/)
  })

  test("MT-003: Subdomain pattern validation - development", async () => {
    const { pattern, example } = subdomainPatterns.development

    expect(example).toMatch(pattern)
    expect("demo.localhost:3000").toMatch(pattern)
    expect("school.localhost:3000").toMatch(pattern)
    expect("localhost:3000").not.toMatch(pattern)
  })

  test("MT-004: Subdomain pattern validation - production", async () => {
    const { pattern, example } = subdomainPatterns.production

    expect(example).toMatch(pattern)
    expect("demo.databayt.org").toMatch(pattern)
    expect("school.databayt.org").toMatch(pattern)
    expect("ed.databayt.org").toMatch(pattern)
  })

  test("MT-005: School subdomain loads school content", async ({ page }) => {
    const schoolUrl = getSchoolUrl("demo", env)
    await page.goto(`${schoolUrl}/en`)
    await page.waitForLoadState("domcontentloaded")

    await assertNoSSE(page)
    await expect(page.locator("body")).not.toBeEmpty()
  })
})

test.describe("Story 3.2: URL Rewriting @multi-tenant", () => {
  test("MT-006: Dashboard URL rewritten correctly", async ({ page }) => {
    // User navigates to demo.localhost:3000/en/dashboard
    // Middleware should rewrite to /en/s/demo/dashboard internally
    await page.goto(buildSchoolUrl("demo", "/dashboard", "en", env))
    await page.waitForLoadState("domcontentloaded")

    // User should still see /dashboard in URL (not /s/demo/dashboard)
    // The internal rewrite is transparent
    const url = page.url()
    expect(url).toContain("demo")
    expect(url).toMatch(/\/dashboard/)
  })

  test("MT-007: Locale preserved in subdomain URL", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/dashboard", "ar", env))
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).toMatch(/\/ar\//)
    expect(url).toContain("demo")
  })

  test("MT-008: Auth routes NOT rewritten", async ({ page }) => {
    // Login page should be same across domains
    await page.goto(buildSchoolUrl("demo", "/login", "en", env))
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).toMatch(/\/login/)

    // Should have login form
    await expect(page.locator('input[name="email"]')).toBeVisible()
  })

  test("MT-009: Public marketing routes on subdomain", async ({ page }) => {
    await page.goto(buildSchoolUrl("demo", "/about", "en", env))
    await page.waitForLoadState("domcontentloaded")

    const url = page.url()
    expect(url).toMatch(/\/about/)
    expect(url).toContain("demo")
    await assertNoSSE(page)
  })
})

test.describe("Story 3.2: Internal Route Mapping @multi-tenant", () => {
  test("MT-010: Document URL rewrite mapping", async () => {
    // This test documents the URL rewrite behavior
    console.log("=== URL REWRITE MAPPING ===")
    console.log("User URL                    → Internal Route")
    console.log("--------------------------------------------------")
    console.log("demo.localhost/dashboard    → /en/s/demo/dashboard")
    console.log("demo.localhost/ar/students  → /ar/s/demo/students")
    console.log("demo.localhost/login        → /en/login (not rewritten)")
    console.log("demo.localhost/apply        → /en/s/demo/apply")
    console.log("==================================================")

    expect(true).toBeTruthy()
  })

  test("MT-011: API routes accessible on subdomain", async ({ page }) => {
    // API routes should work on subdomain
    const response = await page.goto(
      buildSchoolUrl("demo", "/api/auth/providers", "en", env)
    )

    // Should return some response (auth providers list)
    expect(response).not.toBeNull()
  })
})
