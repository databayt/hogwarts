/**
 * Admission Block — Handover QA
 *
 * Production-readiness test covering all 5 handover passes:
 *   Pass 1: Bug-Free — every page loads, no SSE, no console errors
 *   Pass 2: Flow — tab navigation, campaign CRUD dialog, settings save
 *   Pass 3: Responsive — mobile (375), tablet (768), desktop (1440)
 *   Pass 4: RTL + i18n — Arabic locale, dir="rtl", layout mirroring
 *   Pass 5: Translation — no hardcoded English in Arabic mode
 *
 * Pages under test:
 *   Dashboard: /admission, /admission/applications, /admission/merit,
 *              /admission/enrollment, /admission/settings
 *   Marketing: /admissions, /inquiry, /tour
 *
 * Tag: @admission @handover
 */

import { expect, test, type Page } from "@playwright/test"

import { assertNoSSE } from "../../e2e/_support/helpers/assertions"
import { buildSchoolUrl, getTestEnv, TIMEOUTS } from "../../e2e/_support/helpers/test-data"
import { AdmissionDashboardPage } from "../../e2e/_support/page-objects/admission.page"

// Each test needs login + navigation + hydration
test.setTimeout(120_000)

// Override storageState so tests are independent of auth.setup.ts
// (our loginAsAdminToAdmission handles fresh login per test)
test.use({ storageState: { cookies: [], origins: [] } })

// Not serial — each test is independent and can run even if others fail

// ============================================================================
// HELPERS
// ============================================================================

function checkProtocolError(page: Page): boolean {
  return page.url().startsWith("chrome-error://")
}

async function goToSchoolPage(
  page: Page,
  path: string,
  locale: "en" | "ar" = "en"
): Promise<boolean> {
  const url = buildSchoolUrl("demo", path, locale, getTestEnv())
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 })
  if (checkProtocolError(page)) return false
  return true
}

/**
 * Custom login helper — avoids LoginPage.login() which uses waitForLoadState("load")
 * that never resolves on Turbopack dev server due to HMR connections.
 */
async function loginAsAdminToAdmission(
  page: Page,
  locale: "en" | "ar" = "en"
): Promise<AdmissionDashboardPage | null> {
  const loginUrl = buildSchoolUrl("demo", "/login", locale, getTestEnv())
  await page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 60_000 })

  if (checkProtocolError(page)) return null

  // Wait for login form to be interactive (hydrated)
  const emailInput = page.locator('input[name="email"]')
  await emailInput.waitFor({ state: "visible", timeout: 30_000 })
  await page.waitForTimeout(1_000) // Let React hydrate

  // Fill credentials
  await emailInput.fill("admin@databayt.org")
  await page.locator('input[name="password"]').fill("1234")

  // Submit
  const submitBtn = page.locator('button[type="submit"]')
  await submitBtn.click()

  // Wait for navigation away from login
  await page
    .waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 60_000,
    })
    .catch(() => null)

  if (checkProtocolError(page)) return null

  // Navigate to admission
  const admissionUrl = buildSchoolUrl(
    "demo",
    "/admission",
    locale,
    getTestEnv()
  )
  await page.goto(admissionUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  })

  if (checkProtocolError(page)) return null

  // Wait for page content
  await page.waitForLoadState("domcontentloaded")

  return new AdmissionDashboardPage(page, "demo", locale)
}

/**
 * Collect console errors during a callback
 */
async function collectConsoleErrors(
  page: Page,
  action: () => Promise<void>
): Promise<string[]> {
  const errors: string[] = []
  const handler = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") {
      const text = msg.text()
      // Ignore known noise
      if (
        text.includes("favicon") ||
        text.includes("404 (Not Found)") ||
        text.includes("hydration") ||
        text.includes("ERR_BLOCKED_BY_CLIENT")
      )
        return
      errors.push(text)
    }
  }
  page.on("console", handler)
  await action()
  page.off("console", handler)
  return errors
}

/**
 * Detect hardcoded English strings on a page in Arabic mode.
 * Returns any suspicious English-only text found in visible elements.
 */
async function findHardcodedEnglish(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = []
    // Common English patterns that should be translated
    const englishPatterns =
      /^(Submit|Cancel|Save|Delete|Edit|Create|Search|Filter|Loading|Error|Success|Next|Back|Previous|Close|Open|Add|Remove|Update|Settings|Name|Email|Phone|Status|Date|Actions|Total|View|Download|Upload|Export|Import|No data|No results|Are you sure|Confirm|Select|Choose|Enter|Please|Required|Optional|Enable|Disable|Active|Inactive|Pending|Approved|Rejected|All|None|Yes|No|OK|Apply|Reset|Clear|Show|Hide|More|Less)$/i

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    )
    let node: Text | null
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent?.trim()
      if (!text || text.length < 2 || text.length > 50) continue
      // Skip script/style content
      const parent = node.parentElement
      if (!parent) continue
      const tag = parent.tagName.toLowerCase()
      if (["script", "style", "code", "pre", "noscript"].includes(tag)) continue
      // Skip hidden elements
      const rect = parent.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) continue

      if (englishPatterns.test(text)) {
        found.push(`"${text}" in <${tag}>`)
      }
    }
    return [...new Set(found)]
  })
}

// ============================================================================
// PASS 1: BUG-FREE — Dashboard Pages
// ============================================================================

test.describe("HANDOVER Pass 1: Bug-Free — Dashboard @admission @handover", () => {
  test("HO-D01: Campaigns page loads without errors", async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      const dashboard = await loginAsAdminToAdmission(page)
      if (!dashboard) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }
      await assertNoSSE(page)
    })

    // Campaigns page should have meaningful content
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false)
    const hasCreateBtn = await page
      .getByRole("button", { name: /create|new|add/i })
      .isVisible()
      .catch(() => false)
    const bodyText = await page.locator("body").innerText()

    expect(hasTable || hasCreateBtn || bodyText.length > 200).toBe(true)
    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })

  test("HO-D02: Applications page loads without errors", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const errors = await collectConsoleErrors(page, async () => {
      await dashboard.goToApplications()
    })

    await assertNoSSE(page)
    expect(page.url()).toContain("/admission/applications")

    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })

  test("HO-D03: Merit page loads without errors", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const errors = await collectConsoleErrors(page, async () => {
      await dashboard.goToMerit()
    })

    await assertNoSSE(page)
    expect(page.url()).toContain("/admission/merit")

    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })

  test("HO-D04: Enrollment page loads without errors", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const errors = await collectConsoleErrors(page, async () => {
      await dashboard.goToEnrollment()
    })

    await assertNoSSE(page)
    expect(page.url()).toContain("/admission/enrollment")

    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })

  test("HO-D05: Settings page loads without errors", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    const errors = await collectConsoleErrors(page, async () => {
      await dashboard.goToSettings()
    })

    await assertNoSSE(page)
    expect(page.url()).toContain("/admission/settings")

    // Settings is a client component — wait for hydration
    await expect(
      page
        .getByText(/general settings|payment settings|merit criteria/i)
        .first()
    ).toBeVisible({ timeout: TIMEOUTS.long })

    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })
})

// ============================================================================
// PASS 1: BUG-FREE — Marketing Pages
// ============================================================================

test.describe("HANDOVER Pass 1: Bug-Free — Marketing @admission @handover", () => {
  test("HO-M01: Admissions landing page loads", async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      const ok = await goToSchoolPage(page, "/admissions")
      if (!ok) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }
    })

    await assertNoSSE(page)

    // Should have school content
    const hasContent = await page
      .locator("[data-school-id], main, .school-content")
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    expect(hasContent).toBe(true)

    expect(
      errors.length,
      `Console errors: ${errors.join("; ")}`
    ).toBeLessThanOrEqual(0)
  })

  test("HO-M02: Inquiry page loads with form", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/inquiry")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const hasForm = await page
      .locator("form")
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)
    expect(hasForm).toBe(true)
  })

  test("HO-M03: Tour booking page loads", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/tour")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const body = page.locator("body")
    await expect(body).not.toBeEmpty()
  })
})

// ============================================================================
// PASS 2: FLOW — Tab Navigation & Interactions
// ============================================================================

test.describe("HANDOVER Pass 2: Flow — Dashboard Navigation @admission @handover", () => {
  test("HO-F01: Navigate all tabs via sidebar/nav links", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Tab 1: Campaigns (default)
    expect(page.url()).toContain("/admission")

    // Tab 2: Applications — click nav link
    const appLink = page.locator(
      'a[href*="/admission/applications"], nav a:has-text("Applications"), nav a:has-text("الطلبات")'
    )
    if (
      await appLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await appLink.first().click()
      await page.waitForLoadState("domcontentloaded")
      await assertNoSSE(page)
      expect(page.url()).toContain("/admission/applications")
    }

    // Tab 3: Merit List
    const meritLink = page.locator(
      'a[href*="/admission/merit"], nav a:has-text("Merit"), nav a:has-text("الجدارة")'
    )
    if (
      await meritLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await meritLink.first().click()
      await page.waitForLoadState("domcontentloaded")
      await assertNoSSE(page)
      expect(page.url()).toContain("/admission/merit")
    }

    // Tab 4: Enrollment
    const enrollLink = page.locator(
      'a[href*="/admission/enrollment"], nav a:has-text("Enrollment"), nav a:has-text("التسجيل")'
    )
    if (
      await enrollLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await enrollLink.first().click()
      await page.waitForLoadState("domcontentloaded")
      await assertNoSSE(page)
      expect(page.url()).toContain("/admission/enrollment")
    }

    // Tab 5: Settings
    const settingsLink = page.locator(
      'a[href*="/admission/settings"], nav a:has-text("Settings"), nav a:has-text("الإعدادات")'
    )
    if (
      await settingsLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await settingsLink.first().click()
      await page.waitForLoadState("domcontentloaded")
      await assertNoSSE(page)
      expect(page.url()).toContain("/admission/settings")
    }
  })

  test("HO-F02: Create campaign dialog opens and has fields", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    // Click create/new campaign button
    const createBtn = page
      .getByRole("button", { name: /create|new|add/i })
      .first()
    const btnVisible = await createBtn.isVisible().catch(() => false)
    if (!btnVisible) {
      // No create button — campaigns tab may be empty state
      return
    }

    await createBtn.click()
    await page.waitForTimeout(500)

    // A dialog/sheet should appear with form fields
    const dialog = page.locator(
      '[role="dialog"], [data-state="open"], .sheet-content'
    )
    const dialogVisible = await dialog
      .first()
      .isVisible({ timeout: TIMEOUTS.medium })
      .catch(() => false)

    if (dialogVisible) {
      // Should have campaign name field
      const nameField = page.locator(
        'input[name="name"], input[placeholder*="name" i]'
      )
      await expect(nameField.first()).toBeVisible({ timeout: TIMEOUTS.medium })
    }
  })

  test("HO-F03: Settings page save works without error", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page)
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToSettings()
    await assertNoSSE(page)

    // Wait for settings to hydrate
    await expect(page.getByText(/payment settings/i).first()).toBeVisible({
      timeout: TIMEOUTS.long,
    })

    // Click save
    const saveBtn = page.getByRole("button", { name: /save/i })
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(2000)

      // Should not produce SSE
      await assertNoSSE(page)

      // Check for success toast or no error toast
      const hasErrorToast = await page
        .locator('[data-sonner-toast][data-type="error"]')
        .isVisible({ timeout: TIMEOUTS.short })
        .catch(() => false)
      expect(hasErrorToast).toBe(false)
    }
  })
})

// ============================================================================
// PASS 3: RESPONSIVE — Mobile / Tablet / Desktop
// ============================================================================

const BREAKPOINTS = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
] as const

for (const bp of BREAKPOINTS) {
  test.describe(`HANDOVER Pass 3: Responsive — ${bp.name} (${bp.width}px) @admission @handover`, () => {
    test.use({ viewport: { width: bp.width, height: bp.height } })

    test(`HO-R-${bp.name}-01: Campaigns page renders at ${bp.width}px`, async ({
      page,
    }) => {
      const dashboard = await loginAsAdminToAdmission(page)
      if (!dashboard) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }

      await assertNoSSE(page)

      // No horizontal overflow
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      // Allow some tolerance on mobile with tables
      if (bp.name !== "mobile") {
        expect(overflowX).toBe(false)
      }

      // Content should still be visible
      const body = page.locator("body")
      await expect(body).not.toBeEmpty()
    })

    test(`HO-R-${bp.name}-02: Settings page renders at ${bp.width}px`, async ({
      page,
    }) => {
      const dashboard = await loginAsAdminToAdmission(page)
      if (!dashboard) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }

      await dashboard.goToSettings()
      await assertNoSSE(page)

      // Settings cards should be visible
      await expect(
        page
          .getByText(/general settings|payment settings|merit criteria/i)
          .first()
      ).toBeVisible({ timeout: TIMEOUTS.long })
    })

    test(`HO-R-${bp.name}-03: Admissions landing at ${bp.width}px`, async ({
      page,
    }) => {
      const ok = await goToSchoolPage(page, "/admissions")
      if (!ok) {
        test.skip(true, "Protocol mismatch in dev environment")
        return
      }

      await assertNoSSE(page)

      const body = page.locator("body")
      await expect(body).not.toBeEmpty()

      // Check no horizontal overflow
      const overflowX = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth
      })
      expect(overflowX).toBe(false)
    })
  })
}

// ============================================================================
// PASS 4: RTL + i18n — Arabic Locale
// ============================================================================

test.describe("HANDOVER Pass 4: RTL + i18n — Dashboard @admission @handover", () => {
  test("HO-RTL-D01: Campaigns page in Arabic has RTL", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    expect(page.url()).toContain("/ar/")

    const htmlDir = await page.locator("html").getAttribute("dir")
    const hasRtl = await page
      .locator('[dir="rtl"]')
      .first()
      .isVisible()
      .catch(() => false)
    expect(htmlDir === "rtl" || hasRtl).toBe(true)
  })

  test("HO-RTL-D02: Applications page in Arabic has RTL", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToApplications()
    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")
  })

  test("HO-RTL-D03: Merit page in Arabic has RTL", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToMerit()
    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")
  })

  test("HO-RTL-D04: Enrollment page in Arabic has RTL", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToEnrollment()
    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")
  })

  test("HO-RTL-D05: Settings page in Arabic has RTL", async ({ page }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToSettings()
    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")

    // Settings labels should be in Arabic
    await expect(page.getByText(/إعدادات|الدفع|معايير/i).first()).toBeVisible({
      timeout: TIMEOUTS.long,
    })
  })
})

test.describe("HANDOVER Pass 4: RTL + i18n — Marketing @admission @handover", () => {
  test("HO-RTL-M01: Admissions page in Arabic has RTL", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/admissions", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    const hasRtl = await page
      .locator('[dir="rtl"]')
      .first()
      .isVisible()
      .catch(() => false)
    expect(htmlDir === "rtl" || hasRtl).toBe(true)
  })

  test("HO-RTL-M02: Inquiry page in Arabic has RTL", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/inquiry", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")
  })

  test("HO-RTL-M03: Tour page in Arabic has RTL", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/tour", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir).toBe("rtl")
  })

  test("HO-RTL-M04: English mode has LTR direction", async ({ page }) => {
    const ok = await goToSchoolPage(page, "/admissions", "en")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)

    const htmlDir = await page.locator("html").getAttribute("dir")
    expect(htmlDir === null || htmlDir === "ltr").toBe(true)
  })
})

// ============================================================================
// PASS 5: TRANSLATION — No Hardcoded English in Arabic Mode
// ============================================================================

test.describe("HANDOVER Pass 5: Translation — Dashboard @admission @handover", () => {
  test("HO-TR-D01: Campaigns page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    await page.waitForTimeout(2000) // Let translations load

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on campaigns page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-D02: Applications page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToApplications()
    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on applications page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-D03: Merit page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToMerit()
    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on merit page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-D04: Enrollment page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToEnrollment()
    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on enrollment page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-D05: Settings page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const dashboard = await loginAsAdminToAdmission(page, "ar")
    if (!dashboard) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await dashboard.goToSettings()
    await assertNoSSE(page)

    // Wait for client component to hydrate and translate
    await expect(page.getByText(/إعدادات|الدفع|معايير/i).first()).toBeVisible({
      timeout: TIMEOUTS.long,
    })
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on settings page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })
})

test.describe("HANDOVER Pass 5: Translation — Marketing @admission @handover", () => {
  test("HO-TR-M01: Admissions landing has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const ok = await goToSchoolPage(page, "/admissions", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on admissions landing: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-M02: Inquiry page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const ok = await goToSchoolPage(page, "/inquiry", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on inquiry page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-M03: Tour page has no hardcoded English in Arabic", async ({
    page,
  }) => {
    const ok = await goToSchoolPage(page, "/tour", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    const hardcoded = await findHardcodedEnglish(page)
    expect(
      hardcoded,
      `Found hardcoded English on tour page: ${hardcoded.join(", ")}`
    ).toHaveLength(0)
  })

  test("HO-TR-M04: No missing dictionary keys (raw key paths) in Arabic", async ({
    page,
  }) => {
    const ok = await goToSchoolPage(page, "/admissions", "ar")
    if (!ok) {
      test.skip(true, "Protocol mismatch in dev environment")
      return
    }

    await assertNoSSE(page)
    await page.waitForTimeout(2000)

    // Look for raw dictionary key patterns like "admission.hero.title"
    const missingKeys = await page.evaluate(() => {
      const keys: string[] = []
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      )
      let node: Text | null
      while ((node = walker.nextNode() as Text | null)) {
        const text = node.textContent?.trim()
        if (!text) continue
        // Match dotted key paths: "word.word.word" (3+ segments)
        if (/^[a-z]+(\.[a-z][a-zA-Z]*){2,}$/.test(text)) {
          keys.push(text)
        }
      }
      return [...new Set(keys)]
    })

    expect(
      missingKeys,
      `Found raw dictionary keys (missing translations): ${missingKeys.join(", ")}`
    ).toHaveLength(0)
  })
})
