import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getSchoolUrl,
  getTestEnv,
  goToSchoolLogin,
  loginAs,
  waitForRedirect,
} from "../auth/helpers"
import {
  elementExists,
  goToExamsPage,
  goToMarkingPage,
  goToQuestionBankPage,
  goToResultsPage,
} from "./helpers"

/**
 * Multi-Tenant Isolation E2E Tests
 *
 * Tests that ensure proper data isolation between schools:
 * - Users can only see their school's exams
 * - Cross-school data access is blocked
 * - API endpoints respect schoolId
 * - Navigation prevents cross-tenant access
 */

const env = getTestEnv()
const demoSchoolUrl = getSchoolUrl("demo", env)

test.describe("Multi-Tenant Exam Isolation", () => {
  test("user from demo school cannot access other school URLs directly", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Try to access a different school's exams (should redirect or show error)
    // Using a non-existent school subdomain
    const otherSchoolUrl = getSchoolUrl("other-school", env)
    await page.goto(`${otherSchoolUrl}/en/exams`)

    // Should either redirect to login or show error
    const currentUrl = page.url()
    const isOnLoginPage = currentUrl.includes("/login")
    const isOnErrorPage =
      currentUrl.includes("/error") || currentUrl.includes("/404")
    const hasErrorContent = await elementExists(
      page,
      '[data-testid="error"], .error'
    )

    // User should not see the exams list of another school
    expect(
      isOnLoginPage ||
        isOnErrorPage ||
        hasErrorContent ||
        !currentUrl.includes("other-school")
    ).toBe(true)
  })

  test("exams list only shows school-specific exams", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await goToExamsPage(page, "demo", "en", env)

    // If there are exams, they should all belong to demo school
    // Check page content doesn't show other school names
    const pageContent = await page.textContent("body")

    // Should not contain other school identifiers
    expect(pageContent?.includes("other-school")).toBe(false)
    expect(pageContent?.includes("different-school")).toBe(false)
  })

  test("question bank is school-specific", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await goToQuestionBankPage(page, "demo", "en", env)

    // Questions should only be from the user's school
    const pageContent = await page.textContent("body")
    expect(pageContent?.includes("other-school")).toBe(false)
  })

  test("marking page only shows submissions from user school", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await goToMarkingPage(page, "demo", "en", env)

    // Should only show demo school submissions
    const pageContent = await page.textContent("body")
    expect(pageContent?.includes("other-school")).toBe(false)
  })

  test("results are school-scoped", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    await goToResultsPage(page, "demo", "en", env)

    // Results should only be from demo school
    const pageContent = await page.textContent("body")
    expect(pageContent?.includes("other-school")).toBe(false)
  })
})

test.describe("Role-Based Access Control", () => {
  test("student cannot access marking page", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${demoSchoolUrl}/en/exams/mark`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Student should be redirected away from marking page
    // or shown unauthorized message
    const isOnMarkPage = currentUrl.includes("/exams/mark")
    const hasUnauthorized = await elementExists(
      page,
      '[data-testid="unauthorized"], .unauthorized'
    )
    const redirectedAway = !isOnMarkPage

    expect(redirectedAway || hasUnauthorized).toBe(true)
  })

  test("student cannot access exam creation page", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${demoSchoolUrl}/en/exams/new`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Student should not have access to create exams
    const isOnNewExamPage = currentUrl.includes("/exams/new")
    const hasUnauthorized = await elementExists(page, ".unauthorized")
    const redirectedAway = !isOnNewExamPage

    expect(redirectedAway || hasUnauthorized).toBe(true)
  })

  test("parent cannot access marking page", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "parent")
    await waitForRedirect(page)

    await page.goto(`${demoSchoolUrl}/en/exams/mark`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Parent should not access marking
    const isOnMarkPage = currentUrl.includes("/exams/mark")
    expect(isOnMarkPage).toBe(false)
  })

  test("teacher can access marking page", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await page.goto(`${demoSchoolUrl}/en/exams/mark`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Teacher should have access to marking
    expect(currentUrl).toContain("/exams/mark")
  })

  test("admin can access all exam pages", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Check admin can access exams list
    await page.goto(`${demoSchoolUrl}/en/exams`)
    expect(page.url()).toContain("/exams")

    // Check admin can access question bank
    await page.goto(`${demoSchoolUrl}/en/exams/qbank`)
    expect(page.url()).toContain("/qbank")

    // Check admin can access marking
    await page.goto(`${demoSchoolUrl}/en/exams/mark`)
    expect(page.url()).toContain("/mark")

    // Check admin can access results
    await page.goto(`${demoSchoolUrl}/en/exams/result`)
    expect(page.url()).toContain("/result")
  })
})

test.describe("Session Isolation", () => {
  test("session stays within school subdomain", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    // Navigate through exam pages
    await goToExamsPage(page, "demo", "en", env)
    expect(page.url()).toContain("demo")

    await goToQuestionBankPage(page, "demo", "en", env)
    expect(page.url()).toContain("demo")

    await goToMarkingPage(page, "demo", "en", env)
    expect(page.url()).toContain("demo")

    await goToResultsPage(page, "demo", "en", env)
    expect(page.url()).toContain("demo")
  })

  test("session persists across exam module pages", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Navigate through multiple pages
    await goToExamsPage(page, "demo", "en", env)
    await goToQuestionBankPage(page, "demo", "en", env)
    await goToMarkingPage(page, "demo", "en", env)

    // Should still be authenticated
    const currentUrl = page.url()
    expect(currentUrl).not.toContain("/login")
  })
})

test.describe("API Endpoint Protection", () => {
  test("direct API call without auth returns error", async ({ page }) => {
    await clearAuthState(page)

    // Try to access exam API without authentication
    const response = await page.request.get(`${demoSchoolUrl}/api/exams`)

    // Should return 401 or redirect
    expect([401, 302, 307]).toContain(response.status())
  })

  test("unauthenticated user cannot view exam details", async ({ page }) => {
    await clearAuthState(page)

    // Try to access exam details page
    await page.goto(`${demoSchoolUrl}/en/exams/some-exam-id`)
    await page.waitForLoadState("networkidle")

    const currentUrl = page.url()

    // Should redirect to login
    expect(currentUrl).toContain("/login")
  })
})

test.describe("Data Leakage Prevention", () => {
  test("exam URLs don't expose school IDs in URL structure", async ({
    page,
  }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    await goToExamsPage(page, "demo", "en", env)

    const currentUrl = page.url()

    // URL should use subdomain for school context, not expose internal IDs
    expect(currentUrl).toContain("demo")
    // Should not have schoolId as query parameter
    expect(currentUrl).not.toContain("schoolId=")
  })

  test("error pages don't leak school information", async ({ page }) => {
    await clearAuthState(page)

    // Access non-existent exam
    await page.goto(`${demoSchoolUrl}/en/exams/non-existent-id`)
    await page.waitForLoadState("networkidle")

    const pageContent = await page.textContent("body")

    // Error should not reveal internal IDs or school details
    expect(pageContent?.includes("database")).toBe(false)
    expect(pageContent?.includes("prisma")).toBe(false)
    expect(pageContent?.includes("SELECT")).toBe(false)
  })
})
