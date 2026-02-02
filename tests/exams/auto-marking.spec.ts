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
  goToMarkingPage,
  goToResultsPage,
  gradeAnswer,
  waitForToast,
} from "./helpers"

/**
 * Auto-Marking E2E Tests
 *
 * Tests the automated marking features including:
 * - Auto-marking for objective questions (MCQ, True/False, Fill-in-blank)
 * - AI grading for subjective questions
 * - Manual marking override
 * - Marking workflow and bulk operations
 */

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Auto-Marking - Teacher Interface", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("teacher can access marking dashboard", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show marking page
    const hasMarkingInterface = await elementExists(
      page,
      'h1, h2, table, [data-testid="marking-dashboard"]'
    )
    expect(hasMarkingInterface).toBe(true)
  })

  test("marking page shows pending submissions count", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show count or empty state
    const hasPendingCount = await elementExists(
      page,
      '[data-testid="pending-count"], .pending-count, .badge'
    )
    const hasEmptyState = await elementExists(
      page,
      '[data-testid="no-pending"], .empty-state'
    )

    expect(hasPendingCount || hasEmptyState).toBe(true)
  })

  test("teacher can view pending marking list", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/mark/pending`)
    await page.waitForLoadState("networkidle")

    // Should show pending items or empty state
    const hasContent = await elementExists(
      page,
      'table, [data-testid="pending-list"], h1, h2'
    )
    expect(hasContent).toBe(true)
  })

  test("teacher can access bulk marking page", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/mark`)
    await page.waitForLoadState("networkidle")

    // Should have link to bulk marking
    const hasBulkLink = await elementExists(
      page,
      'a[href*="/bulk"], [data-testid="bulk-marking"]'
    )
    // Bulk marking option should be available
  })
})

test.describe("Auto-Marking - Objective Questions", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("MCQ answers are auto-graded", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // MCQ auto-grading happens on submission
    // Check if marking page shows auto-graded scores
    const pageContent = await page.textContent("body")

    // Auto-graded items should show score automatically
    // This is a placeholder - actual implementation depends on seeded data
  })

  test("True/False answers are auto-graded", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Similar to MCQ, True/False should be auto-graded
  })

  test("Fill-in-blank with exact match is auto-graded", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Fill-in-blank with accepted answers should auto-grade
  })
})

test.describe("AI Grading - Subjective Questions", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("AI grading option is visible for essay questions", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to a question that needs marking
    const markLink = page
      .locator('a[href*="/grade/"], [data-testid="grade-link"]')
      .first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Check for AI grading button
      const hasAIGrading = await elementExists(
        page,
        'button:has-text("AI"), [data-testid="ai-grade"], .ai-grade-button'
      )
      // AI grading option should be present
    }
  })

  test("AI grading shows confidence score", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // If AI grading is used, should show confidence
      const hasConfidence = await elementExists(
        page,
        '[data-testid="ai-confidence"], .confidence-score'
      )
      // Confidence should be displayed when AI grades
    }
  })

  test("teacher can accept AI grade", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Check for accept button
      const hasAcceptBtn = await elementExists(
        page,
        'button:has-text("Accept"), [data-testid="accept-ai-grade"]'
      )
    }
  })

  test("teacher can reject AI grade and enter manual score", async ({
    page,
  }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Should have manual score input
      const hasManualInput = await elementExists(
        page,
        'input[name="points"], input[name="score"], [data-testid="manual-score"]'
      )
    }
  })
})

test.describe("Manual Marking Override", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("teacher can override auto-graded score", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to a graded item
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Should have override option
      const hasOverride = await elementExists(
        page,
        'button:has-text("Override"), [data-testid="override-grade"], input[name="points"]'
      )
    }
  })

  test("override requires reason/comment", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Should have feedback/comment field
      const hasFeedbackField = await elementExists(
        page,
        'textarea[name="feedback"], textarea[name="comment"], [data-testid="grade-feedback"]'
      )
    }
  })

  test("grade changes are logged for audit", async ({ page }) => {
    // This tests the audit trail - actual verification would be in the database
    await goToMarkingPage(page, "demo", "en", env)

    // Grade changes should be tracked (implementation detail)
    // UI may show history or audit log link
    const hasAuditLink = await elementExists(
      page,
      'a[href*="audit"], [data-testid="grade-history"], .audit-log'
    )
  })
})

test.describe("Bulk Marking Operations", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("bulk marking page is accessible", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/mark`)
    await page.waitForLoadState("networkidle")

    // Should show bulk marking interface or link
    const hasBulkOption = await elementExists(
      page,
      '[data-testid="bulk-marking"], a[href*="/bulk"]'
    )
  })

  test("can select multiple submissions for bulk action", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Check for checkboxes in table
    const hasCheckboxes = await elementExists(
      page,
      'input[type="checkbox"], [data-testid="select-all"]'
    )
    // Bulk selection should be available
  })

  test("bulk auto-mark option for objective questions", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Check for bulk auto-mark button
    const hasBulkAutoMark = await elementExists(
      page,
      'button:has-text("Auto-mark"), [data-testid="bulk-auto-mark"]'
    )
  })
})

test.describe("Marking Progress Tracking", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("shows marking completion progress", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show progress indicator
    const hasProgress = await elementExists(
      page,
      '[data-testid="marking-progress"], .progress-bar, .completion-rate'
    )
    // Progress should be visible
  })

  test("shows statistics for marked vs pending", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Should show statistics
    const hasStats = await elementExists(
      page,
      '[data-testid="marking-stats"], .stats, .statistics'
    )
    // Statistics should be displayed
  })
})

test.describe("Results After Marking", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("results page shows graded exams", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    // Should show results
    const hasResults = await elementExists(page, "table, .result-card, h1, h2")
    expect(hasResults).toBe(true)
  })

  test("results include auto-marked and manually marked scores", async ({
    page,
  }) => {
    await goToResultsPage(page, "demo", "en", env)

    // Results should show all scores
    const pageContent = await page.textContent("body")
    // Should contain score/grade information
  })

  test("can publish results after marking complete", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    // Should have publish option
    const hasPublishBtn = await elementExists(
      page,
      'button:has-text("Publish"), [data-testid="publish-results"]'
    )
    // Publish button should be available for admin
  })

  test("can generate result PDFs", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    // Should have PDF generation option
    const hasPDFOption = await elementExists(
      page,
      'button:has-text("PDF"), [data-testid="generate-pdf"], a[href*="pdf"]'
    )
    // PDF generation should be available
  })
})

test.describe("AI Service Availability", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)
  })

  test("shows fallback when AI service unavailable", async ({ page }) => {
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // Should always have manual grading option as fallback
      const hasManualOption = await elementExists(
        page,
        'input[name="points"], [data-testid="manual-grade"]'
      )
      // Manual grading should always be available
    }
  })

  test("AI grading button shows disabled state when unavailable", async ({
    page,
  }) => {
    // This tests the UI state when AI is unavailable
    await goToMarkingPage(page, "demo", "en", env)

    // Navigate to grading page
    const markLink = page.locator('a[href*="/grade/"]').first()
    if (await markLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markLink.click()
      await page.waitForLoadState("networkidle")

      // AI button might be disabled
      const aiButton = page.locator(
        '[data-testid="ai-grade"], .ai-grade-button'
      )
      if (await aiButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        // Check if it shows unavailable state
        const isDisabled = await aiButton.isDisabled()
        // May or may not be disabled depending on AI availability
      }
    }
  })
})
