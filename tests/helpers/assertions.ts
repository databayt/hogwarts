/**
 * Custom Assertion Helpers
 *
 * Extended assertions for multi-tenant testing scenarios.
 */

import type { Page } from "@playwright/test"
import { expect } from "@playwright/test"

import { SELECTORS, TIMEOUTS, type Locale } from "./test-data"
import { urlMatchers } from "./url-builder"

// =============================================================================
// PAGE STATE ASSERTIONS
// =============================================================================

/**
 * Assert page loaded without server-side exceptions
 */
export async function assertNoSSE(page: Page): Promise<void> {
  const hasSSE = await page
    .locator(SELECTORS.sseError)
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)

  expect(hasSSE, "Page should not have server-side exceptions").toBeFalsy()
}

/**
 * Assert page is authenticated (has auth indicators)
 */
export async function assertAuthenticated(page: Page): Promise<void> {
  const userMenu = page.locator(SELECTORS.userMenu)
  const dashboardLink = page.locator(SELECTORS.dashboardLink)

  const hasUserMenu = await userMenu
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)
  const hasDashboardLink = await dashboardLink
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)

  expect(
    hasUserMenu || hasDashboardLink,
    "Page should show authenticated state indicators"
  ).toBeTruthy()
}

/**
 * Assert page is NOT authenticated
 */
export async function assertNotAuthenticated(page: Page): Promise<void> {
  const userMenu = page.locator(SELECTORS.userMenu)

  const hasUserMenu = await userMenu
    .isVisible({ timeout: TIMEOUTS.short })
    .catch(() => false)

  expect(hasUserMenu, "Page should not show authenticated state").toBeFalsy()
}

/**
 * Assert redirect to login page occurred
 */
export async function assertRedirectedToLogin(page: Page): Promise<void> {
  const url = page.url()
  expect(
    urlMatchers.isLoginPage(url),
    `Expected login redirect, got: ${url}`
  ).toBeTruthy()
}

/**
 * Assert redirect to dashboard occurred
 */
export async function assertRedirectedToDashboard(page: Page): Promise<void> {
  const url = page.url()
  expect(
    urlMatchers.isDashboardPage(url),
    `Expected dashboard redirect, got: ${url}`
  ).toBeTruthy()
}

/**
 * Assert redirect to onboarding occurred
 */
export async function assertRedirectedToOnboarding(page: Page): Promise<void> {
  const url = page.url()
  expect(
    urlMatchers.isOnboardingPage(url),
    `Expected onboarding redirect, got: ${url}`
  ).toBeTruthy()
}

// =============================================================================
// URL ASSERTIONS
// =============================================================================

/**
 * Assert URL contains expected path
 */
export function assertUrlContains(page: Page, path: string): void {
  expect(page.url()).toContain(path)
}

/**
 * Assert URL does NOT contain path
 */
export function assertUrlNotContains(page: Page, path: string): void {
  expect(page.url()).not.toContain(path)
}

/**
 * Assert URL matches pattern
 */
export function assertUrlMatches(page: Page, pattern: RegExp): void {
  expect(page.url()).toMatch(pattern)
}

/**
 * Assert URL is on school subdomain
 */
export function assertOnSchoolSubdomain(page: Page, subdomain?: string): void {
  const url = page.url()
  expect(
    urlMatchers.isSchoolSubdomain(url, subdomain),
    `Expected school subdomain${subdomain ? ` (${subdomain})` : ""}, got: ${url}`
  ).toBeTruthy()
}

/**
 * Assert URL is on main domain
 */
export function assertOnMainDomain(page: Page): void {
  const url = page.url()
  expect(
    urlMatchers.isMainDomain(url),
    `Expected main domain, got: ${url}`
  ).toBeTruthy()
}

/**
 * Assert URL has specific locale
 */
export function assertHasLocale(page: Page, locale: Locale): void {
  const url = page.url()
  expect(
    urlMatchers.hasLocale(url, locale),
    `Expected locale ${locale} in URL: ${url}`
  ).toBeTruthy()
}

// =============================================================================
// ELEMENT ASSERTIONS
// =============================================================================

/**
 * Assert login form is visible
 */
export async function assertLoginFormVisible(page: Page): Promise<void> {
  await expect(page.locator(SELECTORS.emailInput)).toBeVisible()
  await expect(page.locator(SELECTORS.passwordInput)).toBeVisible()
  await expect(page.locator(SELECTORS.submitButton)).toBeVisible()
}

/**
 * Assert sidebar is visible
 */
export async function assertSidebarVisible(page: Page): Promise<void> {
  await expect(page.locator(SELECTORS.sidebar).first()).toBeVisible()
}

/**
 * Assert main content area is visible
 */
export async function assertMainContentVisible(page: Page): Promise<void> {
  await expect(page.locator(SELECTORS.mainContent).first()).toBeVisible()
}

/**
 * Assert table has rows
 */
export async function assertTableHasRows(
  page: Page,
  minRows: number = 1
): Promise<void> {
  const rows = page.locator(SELECTORS.tableRow)
  await expect(rows).toHaveCount(minRows)
}

/**
 * Assert toast notification appeared
 */
export async function assertToastVisible(
  page: Page,
  type: "success" | "error" = "success"
): Promise<void> {
  const selector =
    type === "success" ? SELECTORS.toastSuccess : SELECTORS.toastError
  await expect(page.locator(selector).first()).toBeVisible({
    timeout: TIMEOUTS.medium,
  })
}

// =============================================================================
// ACCESS CONTROL ASSERTIONS
// =============================================================================

/**
 * Assert access is allowed (not redirected to login or error)
 */
export async function assertAccessAllowed(page: Page): Promise<void> {
  const url = page.url()

  // Should not be on login, unauthorized, or 403 page
  expect(
    urlMatchers.isLoginPage(url),
    "Should not redirect to login"
  ).toBeFalsy()
  expect(
    url.includes("/unauthorized"),
    "Should not show unauthorized"
  ).toBeFalsy()
  expect(url.includes("/403"), "Should not show 403").toBeFalsy()

  // Should not have SSE
  await assertNoSSE(page)
}

/**
 * Assert access is blocked (redirected to login or shows error)
 */
export async function assertAccessBlocked(page: Page): Promise<void> {
  const url = page.url()

  const isBlocked =
    urlMatchers.isLoginPage(url) ||
    url.includes("/unauthorized") ||
    url.includes("/403") ||
    url.includes("/dashboard") // Redirected to safe route

  expect(isBlocked, `Expected access blocked, but got: ${url}`).toBeTruthy()
}

// =============================================================================
// HTTP ASSERTIONS
// =============================================================================

/**
 * Assert HTTP response status is OK
 */
export function assertStatusOk(status: number | undefined): void {
  expect(status, "Response status should be defined").toBeDefined()
  expect(status!, "Response status should be < 400").toBeLessThan(400)
}

/**
 * Assert HTTP response status matches expected
 */
export function assertStatus(
  status: number | undefined,
  expected: number
): void {
  expect(status, "Response status should be defined").toBeDefined()
  expect(status).toBe(expected)
}

// =============================================================================
// LOCALE ASSERTIONS
// =============================================================================

/**
 * Assert page has RTL direction (Arabic)
 */
export async function assertRtlDirection(page: Page): Promise<void> {
  const htmlDir = await page.locator("html").getAttribute("dir")
  const hasRtlSection = await page
    .locator('[dir="rtl"]')
    .first()
    .isVisible()
    .catch(() => false)

  expect(
    htmlDir === "rtl" || hasRtlSection,
    "Page should have RTL direction for Arabic"
  ).toBeTruthy()
}

/**
 * Assert page has LTR direction (English)
 */
export async function assertLtrDirection(page: Page): Promise<void> {
  const htmlDir = await page.locator("html").getAttribute("dir")

  // LTR is default, so either null or "ltr" is acceptable
  expect(
    htmlDir === null || htmlDir === "ltr",
    "Page should have LTR direction for English"
  ).toBeTruthy()
}

// =============================================================================
// COMBINED ASSERTIONS
// =============================================================================

/**
 * Assert page loaded successfully (status OK, no SSE, content visible)
 */
export async function assertPageLoadedSuccessfully(
  page: Page,
  response?: { status(): number }
): Promise<void> {
  if (response) {
    assertStatusOk(response.status())
  }

  await assertNoSSE(page)
  await expect(page.locator("body")).not.toBeEmpty()
}

/**
 * Assert protected page behavior for unauthenticated user
 */
export async function assertProtectedRoute(page: Page): Promise<void> {
  // Should redirect to login
  await assertRedirectedToLogin(page)
}

/**
 * Assert dashboard page loaded for authenticated user
 */
export async function assertDashboardLoaded(page: Page): Promise<void> {
  await assertRedirectedToDashboard(page)
  await assertNoSSE(page)
  await assertSidebarVisible(page)
}
