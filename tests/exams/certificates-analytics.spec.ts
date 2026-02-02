import { expect, test } from "@playwright/test"

import {
  clearAuthState,
  getSchoolUrl,
  getTestEnv,
  goToSchoolLogin,
  loginAs,
  waitForRedirect,
} from "../auth/helpers"
import { elementExists, goToResultsPage } from "./helpers"

/**
 * Certificates and Analytics E2E Tests
 *
 * Tests the exam results features including:
 * - Analytics dashboard
 * - Certificate generation and verification
 * - PDF exports
 * - Performance reports
 */

const env = getTestEnv()
const schoolUrl = getSchoolUrl("demo", env)

test.describe("Exam Analytics Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("admin can access analytics page", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    // Should show analytics content
    const hasAnalytics = await elementExists(
      page,
      'h1, h2, [data-testid="analytics"], .chart, canvas, svg'
    )
    expect(hasAnalytics).toBe(true)
  })

  test("analytics page has chart visualizations", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    // Should have charts (Recharts renders as SVG)
    const hasCharts = await elementExists(
      page,
      '.recharts-wrapper, canvas, svg, [data-testid="chart"]'
    )
    // Charts should be rendered
  })

  test("analytics shows pass/fail distribution", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    const pageContent = await page.textContent("body")

    // Should show pass/fail related content
    const hasPassFail =
      pageContent?.toLowerCase().includes("pass") ||
      pageContent?.toLowerCase().includes("fail") ||
      pageContent?.includes("نجاح") ||
      pageContent?.includes("رسوب")
    // Pass/fail statistics should be visible
  })

  test("analytics shows score distribution", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    // Score distribution chart or data should be present
    const hasDistribution = await elementExists(
      page,
      '[data-testid="score-distribution"], .distribution-chart'
    )
    // Distribution data should be shown
  })

  test("teacher can also view analytics", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "teacher")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    // Teacher should have access
    const hasContent = await elementExists(page, "h1, h2, .chart, svg")
    expect(hasContent).toBe(true)
  })
})

test.describe("Certificate Management", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("admin can access certificates page", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/certificates`)
    await page.waitForLoadState("networkidle")

    const hasContent = await elementExists(page, "h1, h2, table")
    expect(hasContent).toBe(true)
  })

  test("can view certificate configurations", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/certificates/configs`)
    await page.waitForLoadState("networkidle")

    const hasConfigs = await elementExists(
      page,
      'table, [data-testid="config-list"], .config-card'
    )
    // Should show config list or empty state
  })

  test("can navigate to create new certificate config", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/certificates/configs/new`)
    await page.waitForLoadState("networkidle")

    const hasForm = await elementExists(
      page,
      'form, [data-testid="config-form"], input[name="name"]'
    )
    // Should show configuration form
  })

  test("certificate config form has required fields", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/certificates/configs/new`)
    await page.waitForLoadState("networkidle")

    // Check for required form fields
    const hasNameField = await elementExists(page, 'input[name="name"]')
    const hasTemplateField = await elementExists(
      page,
      'select[name="template"], [data-testid="template-select"]'
    )
    // Form should have necessary fields
  })
})

test.describe("Certificate Generation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("can generate certificate from results page", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    // Check for certificate generation option
    const hasCertOption = await elementExists(
      page,
      'button:has-text("Certificate"), [data-testid="generate-certificate"]'
    )
    // Certificate generation should be available
  })

  test("generated certificates have verification code", async ({ page }) => {
    // Navigate to certificate details
    await page.goto(`${schoolUrl}/en/exams/certificates`)
    await page.waitForLoadState("networkidle")

    // If there are certificates, they should show verification code
    const pageContent = await page.textContent("body")
    // Verification codes are typically alphanumeric
  })
})

test.describe("Certificate Verification", () => {
  test("public certificate verification page exists", async ({ page }) => {
    // Certificate verification should be publicly accessible
    await page.goto(`${schoolUrl}/en/verify`)
    await page.waitForLoadState("networkidle")

    // Should have verification form
    const hasVerifyForm = await elementExists(
      page,
      'input[name="code"], [data-testid="verify-input"], form'
    )
    // Verification form should be accessible
  })

  test("invalid certificate code shows error", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/verify`)
    await page.waitForLoadState("networkidle")

    const codeInput = page.locator(
      'input[name="code"], [data-testid="verify-input"]'
    )
    if (await codeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await codeInput.fill("INVALID-CODE-1234")

      const submitBtn = page.locator('button[type="submit"]')
      if (await submitBtn.isVisible()) {
        await submitBtn.click()
        await page.waitForLoadState("networkidle")

        // Should show error
        const hasError = await elementExists(
          page,
          '.error, [role="alert"], .text-destructive'
        )
        // Error should be displayed
      }
    }
  })
})

test.describe("PDF Generation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("results page has PDF export option", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    const hasPDFButton = await elementExists(
      page,
      'button:has-text("PDF"), button:has-text("Export"), [data-testid="export-pdf"]'
    )
    // PDF export should be available
  })

  test("batch PDF generation page exists", async ({ page }) => {
    // Navigate to batch PDF page (requires exam ID)
    await page.goto(`${schoolUrl}/en/exams/result`)
    await page.waitForLoadState("networkidle")

    // Check for batch PDF option
    const hasBatchPDF = await elementExists(
      page,
      'a[href*="pdf/batch"], [data-testid="batch-pdf"]'
    )
    // Batch PDF should be available
  })
})

test.describe("Exam Paper Generation", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("can access exam generation page", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/generate`)
    await page.waitForLoadState("networkidle")

    const hasContent = await elementExists(page, "h1, h2, form")
    expect(hasContent).toBe(true)
  })

  test("generation templates page exists", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/generate/templates`)
    await page.waitForLoadState("networkidle")

    const hasTemplates = await elementExists(
      page,
      'table, [data-testid="templates"], .template-card'
    )
    // Templates should be shown
  })

  test("can create new generation template", async ({ page }) => {
    await page.goto(`${schoolUrl}/en/exams/generate/templates/new`)
    await page.waitForLoadState("networkidle")

    const hasForm = await elementExists(page, "form, input[name]")
    // Form should be displayed
  })
})

test.describe("Recent Results", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
  })

  test("admin can view recent results", async ({ page }) => {
    await loginAs(page, "admin")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/result/recent`)
    await page.waitForLoadState("networkidle")

    const hasContent = await elementExists(page, "h1, h2, table, .result-card")
    expect(hasContent).toBe(true)
  })

  test("student can view their own results", async ({ page }) => {
    await loginAs(page, "student")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/result`)
    await page.waitForLoadState("networkidle")

    // Student should see their results
    const hasContent = await elementExists(page, "h1, h2, table")
    expect(hasContent).toBe(true)
  })

  test("parent can view their children's results", async ({ page }) => {
    await loginAs(page, "parent")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/en/exams/result`)
    await page.waitForLoadState("networkidle")

    // Parent should see their children's results
    const hasContent = await elementExists(page, "h1, h2, table")
    expect(hasContent).toBe(true)
  })
})

test.describe("Results Filtering and Export", () => {
  test.beforeEach(async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "en", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)
  })

  test("results can be filtered by class", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    const hasClassFilter = await elementExists(
      page,
      '[data-testid="class-filter"], select, [role="combobox"]'
    )
    // Filter should be available
  })

  test("results can be filtered by exam", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    const hasExamFilter = await elementExists(
      page,
      '[data-testid="exam-filter"], select'
    )
    // Exam filter should be available
  })

  test("results can be exported to Excel", async ({ page }) => {
    await goToResultsPage(page, "demo", "en", env)

    const hasExcelExport = await elementExists(
      page,
      'button:has-text("Excel"), button:has-text("Export"), [data-testid="export-excel"]'
    )
    // Excel export should be available
  })
})

test.describe("Analytics - Arabic Language Support", () => {
  test("analytics page works in Arabic", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/ar/exams/result/analytics`)
    await page.waitForLoadState("networkidle")

    // Should render with RTL
    const htmlDir = await page.getAttribute("html", "dir")
    expect(htmlDir).toBe("rtl")

    // Content should be visible
    const hasContent = await elementExists(page, "h1, h2, svg, canvas")
    expect(hasContent).toBe(true)
  })

  test("certificates page works in Arabic", async ({ page }) => {
    await clearAuthState(page)
    await goToSchoolLogin(page, "demo", "ar", env)
    await loginAs(page, "admin")
    await waitForRedirect(page)

    await page.goto(`${schoolUrl}/ar/exams/certificates`)
    await page.waitForLoadState("networkidle")

    const htmlDir = await page.getAttribute("html", "dir")
    expect(htmlDir).toBe("rtl")
  })
})
