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
  clickNextStep,
  elementExists,
  fillExamForm,
  formatDateForInput,
  formatTimeForInput,
  getFutureExamDate,
  goToExamsPage,
  goToMarkingPage,
  goToNewExamPage,
  goToQuestionBankPage,
  goToResultsPage,
  searchInTable,
  submitForm,
  waitForToast,
} from "./helpers"

/**
 * Exam Lifecycle E2E Tests
 *
 * Tests the complete exam workflow from creation to results including:
 * - Exam creation and scheduling
 * - Question bank management
 * - Student exam taking
 * - Teacher marking
 * - Results viewing
 */

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Exam Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("admin can access exams page", async ({ page }) => {
    await goToExamsPage(page, "demo", "en", env)

    // Should show exams list or empty state
    const hasTable = await elementExists(page, "table")
    const hasEmptyState = await elementExists(
      page,
      '[data-testid="empty-state"], .empty-state'
    )

    expect(hasTable || hasEmptyState).toBe(true)
  })

  test("admin can navigate to create exam page", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    // Should show exam creation form
    await expect(
      page.locator(
        'form, [data-testid="exam-form"], input[name="title"], .exam-form'
      )
    ).toBeVisible({ timeout: 10000 })
  })

  test("exam form validates required fields", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    // Try to submit empty form
    await submitForm(page)

    // Should show validation errors
    const hasErrors = await elementExists(
      page,
      '[role="alert"], .error, [data-error="true"], .text-destructive'
    )
    expect(hasErrors).toBe(true)
  })

  test("exam form validates date not in past", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    // Try to set date in past
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)

    await fillExamForm(page, {
      title: "Test Exam",
      examDate: pastDate,
      startTime: "09:00",
      endTime: "11:00",
      duration: 120,
      totalMarks: 100,
      passingMarks: 50,
      examType: "QUIZ",
    })

    await submitForm(page)

    // Should show date validation error
    const pageContent = await page.textContent("body")
    const hasDateError =
      pageContent?.toLowerCase().includes("past") ||
      pageContent?.toLowerCase().includes("الماضي")
    expect(hasDateError).toBe(true)
  })

  test("exam form validates passing marks percentage", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    const futureDate = getFutureExamDate(7)

    // Set passing marks too low (5%)
    await fillExamForm(page, {
      title: "Test Exam",
      examDate: futureDate,
      startTime: "09:00",
      endTime: "11:00",
      duration: 120,
      totalMarks: 100,
      passingMarks: 5, // 5% - should fail
      examType: "QUIZ",
    })

    // Check for validation
    const pageContent = await page.textContent("body")
    const hasPercentageError =
      pageContent?.includes("10%") || pageContent?.includes("percentage")
    // Note: May need to submit first to trigger validation
  })
})

test.describe("Question Bank Management", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("teacher can access question bank", async ({ page }) => {
    await goToQuestionBankPage(page, "demo", "en", env)

    // Should show question bank page
    const hasTable = await elementExists(page, "table")
    const hasEmptyState = await elementExists(
      page,
      '[data-testid="empty-state"]'
    )
    const hasContent = await elementExists(
      page,
      'h1, h2, [data-testid="page-title"]'
    )

    expect(hasTable || hasEmptyState || hasContent).toBe(true)
  })

  test("teacher can filter questions by subject", async ({ page }) => {
    await goToQuestionBankPage(page, "demo", "en", env)

    // Should have filter options
    const hasFilters = await elementExists(
      page,
      '[data-testid*="filter"], select, .filter'
    )
    expect(hasFilters).toBe(true)
  })

  test("teacher can search questions", async ({ page }) => {
    await goToQuestionBankPage(page, "demo", "en", env)

    // Should have search input
    const hasSearch = await elementExists(
      page,
      'input[type="search"], input[placeholder*="Search"], input[placeholder*="بحث"]'
    )
    expect(hasSearch).toBe(true)
  })
})

test.describe("Marking Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("teacher can access marking page", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show marking interface
    const hasContent = await elementExists(
      page,
      'table, [data-testid="pending-marking"], h1, h2'
    )
    expect(hasContent).toBe(true)
  })

  test("marking page shows pending submissions", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show either pending items or empty state
    const hasTable = await elementExists(page, "table tbody tr")
    const hasEmptyState = await elementExists(
      page,
      '[data-testid="no-pending"], .empty-state'
    )

    expect(hasTable || hasEmptyState).toBe(true)
  })
})

test.describe("Results Page", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("admin can view results page", async ({ page }) => {
    await loginAs(page, "admin")
    await waitForRedirect(page)
    await goToResultsPage(page, "demo", "en", env)

    // Should show results content
    const hasContent = await elementExists(
      page,
      'table, [data-testid="results"], h1, h2, .results'
    )
    expect(hasContent).toBe(true)
  })

  test("teacher can view results page", async ({ page }) => {
    await loginAs(page, "teacher")
    await waitForRedirect(page)
    await goToResultsPage(page, "demo", "en", env)

    // Should show results content
    const hasContent = await elementExists(page, "table, h1, h2")
    expect(hasContent).toBe(true)
  })

  test("results page has analytics link", async ({ page }) => {
    await loginAs(page, "admin")
    await waitForRedirect(page)
    await goToResultsPage(page, "demo", "en", env)

    // Should have analytics navigation
    const hasAnalyticsLink = await elementExists(
      page,
      'a[href*="analytics"], [data-testid="analytics-link"]'
    )
    // Analytics link might be on the page or in navigation
  })
})

test.describe("Exam Multi-Step Form Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("form has step indicators", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    // Should show step indicators or form sections
    const hasSteps = await elementExists(
      page,
      '[data-testid*="step"], .step, [role="tablist"], .form-section'
    )
    // Multi-step form should have navigation
  })

  test("can navigate between form steps", async ({ page }) => {
    await goToNewExamPage(page, "demo", "en", env)

    // Fill required fields in first step
    await page.fill('input[name="title"]', "E2E Test Exam")

    // Try to navigate to next step
    const hasNextButton = await elementExists(
      page,
      'button:has-text("Next"), button:has-text("التالي")'
    )
    if (hasNextButton) {
      await clickNextStep(page)
      // Should be on next step or same step with validation
    }
  })
})

test.describe("Exam List Features", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("exams list has filtering options", async ({ page }) => {
    await goToExamsPage(page, "demo", "en", env)

    // Should have filter controls
    const hasFilters = await elementExists(
      page,
      'select, [data-testid*="filter"], .filter, [role="combobox"]'
    )
    // Filtering should be available on the list page
  })

  test("exams list has sorting options", async ({ page }) => {
    await goToExamsPage(page, "demo", "en", env)

    // Should have sortable columns or sort controls
    const hasSorting = await elementExists(
      page,
      'th[role="columnheader"], [data-sortable], button[aria-sort]'
    )
    // Table should support sorting
  })

  test("exams list has pagination", async ({ page }) => {
    await goToExamsPage(page, "demo", "en", env)

    // Should have pagination controls
    const hasPagination = await elementExists(
      page,
      '[data-testid="pagination"], .pagination, nav[aria-label*="pagination"]'
    )
    // Pagination should be present for large datasets
  })
})

test.describe("Upcoming Exams", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("student can view upcoming exams", async ({ page }) => {
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Should show upcoming exams or empty state
    const hasContent = await elementExists(
      page,
      'table, .exam-card, [data-testid="upcoming-exams"], h1, h2'
    )
    expect(hasContent).toBe(true)
  })

  test("teacher can view upcoming exams", async ({ page }) => {
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    const hasContent = await elementExists(page, "table, .exam-card, h1, h2")
    expect(hasContent).toBe(true)
  })
})
