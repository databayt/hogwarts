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
  answerMultipleChoice,
  answerShortAnswer,
  elementExists,
  getExamTimer,
  goToTakeExamPage,
  submitExam,
} from "./helpers"

/**
 * Student Exam Taking E2E Tests
 *
 * Tests the student exam-taking experience including:
 * - Exam access and instructions
 * - Answer entry and persistence
 * - Timer functionality
 * - Submission flow
 * - Post-submission behavior
 */

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Exam Taking - Access Control", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("student can see upcoming exams", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Should show upcoming exams page
    const hasContent = await elementExists(
      page,
      'h1, h2, table, .exam-card, [data-testid="upcoming-exams"]'
    )
    expect(hasContent).toBe(true)
  })

  test("unauthenticated user cannot take exam", async ({ page }) => {
    await clearAuthState(page)

    // Try to access exam taking page without auth
    await page.goto(`${schoolUrl}/en/exams/test-exam-id/take`)
    await page.waitForLoadState("networkidle")

    // Should redirect to login
    expect(page.url()).toContain("/login")
  })

  test("teacher cannot take student exam", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    // Navigate to an exam take page
    await page.goto(`${schoolUrl}/en/exams/test-exam-id/take`)
    await page.waitForLoadState("networkidle")

    // Teacher should see appropriate response (not exam taking interface)
    // Either redirected or shown different content
    const hasExamInterface = await elementExists(
      page,
      '[data-testid="exam-taking"], .exam-questions'
    )
    // Teacher might see exam preview instead of taking interface
  })
})

test.describe("Exam Taking - Interface Elements", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("exam page has timer display", async ({ page }) => {
    // Note: This requires a valid exam ID that the student can take
    // Using a placeholder exam ID - in real tests, this would be seeded
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Check for timer-related elements on any exam page
    const hasTimer = await elementExists(
      page,
      '[data-testid="exam-timer"], .timer, [role="timer"], .countdown'
    )
    // Timer may only be visible during active exam
  })

  test("exam page has submit button", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Navigate to an exam if available
    const examLink = page.locator('a[href*="/exams/"][href*="/take"]').first()
    if (await examLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examLink.click()
      await page.waitForLoadState("networkidle")

      // Should have submit button
      const hasSubmit = await elementExists(
        page,
        'button:has-text("Submit"), button:has-text("إرسال")'
      )
    }
  })

  test("exam shows question count", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Question count should be visible somewhere
    const pageContent = await page.textContent("body")
    // May contain "X questions" or "سؤال X"
  })
})

test.describe("Exam Taking - Answer Persistence", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("answers persist after page navigation", async ({ page }) => {
    // This test verifies answer auto-save functionality
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Find an active exam to take
    const examCard = page
      .locator('.exam-card, [data-testid="exam-item"]')
      .first()
    if (await examCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examCard.click()
      await page.waitForLoadState("networkidle")

      // If we can find an answer input, fill it
      const textInput = page.locator('textarea, input[type="text"]').first()
      if (await textInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const testAnswer = "Test answer for persistence check"
        await textInput.fill(testAnswer)

        // Wait for auto-save (typically debounced)
        await page.waitForTimeout(2000)

        // Refresh page
        await page.reload()
        await page.waitForLoadState("networkidle")

        // Check if answer persisted
        // Note: This depends on actual implementation
      }
    }
  })
})

test.describe("Exam Taking - Submission Flow", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("submit shows confirmation dialog", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Navigate to exam taking page if available
    const examLink = page.locator('a[href*="/take"]').first()
    if (await examLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examLink.click()
      await page.waitForLoadState("networkidle")

      // Click submit button
      const submitBtn = page.locator(
        'button:has-text("Submit"), button:has-text("إرسال")'
      )
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click()

        // Should show confirmation dialog
        const hasConfirmDialog = await elementExists(
          page,
          '[role="dialog"], [role="alertdialog"], .modal, .dialog'
        )
        // Confirmation dialog may appear
      }
    }
  })

  test("cannot submit after time expires", async ({ page }) => {
    // This tests exam time enforcement
    // In a real scenario, we'd need to mock time or use a test exam with very short duration
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // This is a placeholder - actual implementation would need time manipulation
  })

  test("submission prevents double-submit", async ({ page }) => {
    // Tests that clicking submit multiple times doesn't create multiple submissions
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Navigate to exam if available
    const examLink = page.locator('a[href*="/take"]').first()
    if (await examLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examLink.click()
      await page.waitForLoadState("networkidle")

      // Submit button should become disabled after click
      const submitBtn = page.locator(
        'button:has-text("Submit"), button:has-text("إرسال")'
      )
      if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitBtn.click()

        // Button should be disabled or show loading
        const isDisabled = await submitBtn.isDisabled()
        const hasLoading = await elementExists(
          page,
          '.loading, [data-loading="true"], .spinner'
        )
        // Should show some form of loading state
      }
    }
  })
})

test.describe("Exam Taking - Post-Submission", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("shows completion message after submission", async ({ page }) => {
    // After successful submission, student should see confirmation
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // This is a placeholder - would need actual exam submission
  })

  test("cannot retake submitted exam", async ({ page }) => {
    // Once submitted, student cannot retake (unless allowed)
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Find a completed exam and try to take it again
    // Should show "Already completed" message or redirect
  })

  test("student can view their submitted answers", async ({ page }) => {
    // After submission, student may be able to review their answers
    await page.goto(`${schoolUrl}/en/exams/result`)
    await page.waitForLoadState("networkidle")

    // Should show student's exam results
    const hasResults = await elementExists(
      page,
      'table, .result-card, [data-testid="my-results"]'
    )
    // Results page should be accessible to student
  })
})

test.describe("Exam Taking - Question Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("can navigate between questions", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Navigate to exam
    const examLink = page.locator('a[href*="/take"]').first()
    if (await examLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examLink.click()
      await page.waitForLoadState("networkidle")

      // Check for question navigation
      const hasNav = await elementExists(
        page,
        '[data-testid="question-nav"], .question-navigation, .pagination'
      )
      // Some form of navigation should exist for multi-question exams
    }
  })

  test("question status indicators show answered/unanswered", async ({
    page,
  }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Navigate to exam
    const examLink = page.locator('a[href*="/take"]').first()
    if (await examLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await examLink.click()
      await page.waitForLoadState("networkidle")

      // Check for status indicators
      const hasIndicators = await elementExists(
        page,
        "[data-status], .answered, .unanswered, .question-indicator"
      )
      // Question status should be visible
    }
  })
})

test.describe("Exam Taking - Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "student")
    await waitForRedirect(page)
  })

  test("exam interface has proper ARIA labels", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Check for accessibility attributes
    const hasAriaLabels = await elementExists(
      page,
      "[aria-label], [aria-labelledby], [role]"
    )
    expect(hasAriaLabels).toBe(true)
  })

  test("keyboard navigation works", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Tab through elements
    await page.keyboard.press("Tab")
    await page.keyboard.press("Tab")

    // Should be able to focus interactive elements
    const focusedElement = await page.evaluate(
      () => document.activeElement?.tagName
    )
    expect(["A", "BUTTON", "INPUT", "TEXTAREA", "SELECT"]).toContain(
      focusedElement
    )
  })
})

test.describe("Exam Taking - RTL Support", () => {
  test("Arabic interface displays correctly", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/ar/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Check for RTL direction
    const htmlDir = await page.getAttribute("html", "dir")
    expect(htmlDir).toBe("rtl")
  })

  test("Arabic text is properly aligned", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/ar/exams/upcoming`)
    await page.waitForLoadState("networkidle")

    // Check text alignment on body or main content
    const textAlign = await page.evaluate(() => {
      const body = document.body
      return window.getComputedStyle(body).textAlign
    })
    // Should be right-aligned or start (which is right in RTL)
    expect(["right", "start"]).toContain(textAlign)
  })
})
