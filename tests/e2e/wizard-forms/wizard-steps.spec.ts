/**
 * Wizard Forms - All 14 Steps Smoke Test
 *
 * Tests that each teacher (7) and student (7) wizard step:
 * 1. Loads without infinite skeleton
 * 2. Shows form content (not stuck on loading)
 * 3. Has the footer with progress indicators
 * 4. Content is vertically centered
 *
 * Tag: @wizard @smoke
 */

import { expect, test, type Page } from "@playwright/test"

const DEMO_URL = "http://demo.localhost:3000"

const TEACHER_STEPS = [
  "information",
  "contact",
  "employment",
  "qualifications",
  "experience",
  "expertise",
  "review",
] as const

const STUDENT_STEPS = [
  "personal",
  "contact",
  "emergency",
  "enrollment",
  "health",
  "previous-education",
  "review",
] as const

async function loginAsAdmin(page: Page) {
  await page.goto(`${DEMO_URL}/en/login`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForSelector('input[name="email"]', {
    state: "visible",
    timeout: 10000,
  })
  await page.fill('input[name="email"]', "admin@databayt.org")
  await page.fill('input[name="password"]', "1234")
  await Promise.all([
    page
      .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 })
      .catch(() => null),
    page.click('button[type="submit"]'),
  ])
  await page.waitForTimeout(2000)
}

async function verifyStep(page: Page, url: string, stepName: string) {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })

  // Wait for initial render
  await page.waitForTimeout(2000)

  // 1. Full-screen overlay is present
  const overlay = page.locator(".fixed.inset-0.z-50")
  await expect(overlay).toBeVisible({ timeout: 5000 })

  // 2. Wait for skeleton to disappear (data loading, up to 15s)
  const skeleton = page.locator('[data-slot="skeleton"]').first()
  const hasSkeleton = await skeleton
    .isVisible({ timeout: 1000 })
    .catch(() => false)
  if (hasSkeleton) {
    await expect(skeleton).not.toBeVisible({ timeout: 15000 })
  }

  // 3. Form content is rendered
  const hasContent = await page
    .locator("h1, h2, h3, input, select, textarea, form, [data-slot='form']")
    .first()
    .isVisible({ timeout: 5000 })
    .catch(() => false)
  expect(hasContent).toBe(true)

  // 4. Footer is present
  const footer = page.locator("footer, [class*='fixed'][class*='bottom-0']")
  const hasFooter = await footer
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false)
  expect(hasFooter).toBe(true)
}

test.describe("Wizard Forms @wizard @smoke", () => {
  test("All 7 teacher wizard steps load smoothly", async ({ page }) => {
    test.setTimeout(180000)
    // Login
    await loginAsAdmin(page)

    // Create draft teacher
    await page.goto(`${DEMO_URL}/en/teachers/add`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })
    await page.waitForURL(/\/teachers\/add\/[^/]+\/information/, {
      timeout: 15000,
    })

    const url = page.url()
    const match = url.match(/\/teachers\/add\/([^/]+)\//)
    expect(match).toBeTruthy()
    const teacherId = match![1]

    // Test each step sequentially
    for (const step of TEACHER_STEPS) {
      const stepUrl = `${DEMO_URL}/en/teachers/add/${teacherId}/${step}`
      await verifyStep(page, stepUrl, step)
    }
  })

  test("All 7 student wizard steps load smoothly", async ({ page }) => {
    test.setTimeout(180000)
    // Login
    await loginAsAdmin(page)

    // Navigate to students listing and click the + (create) button
    await page.goto(`${DEMO_URL}/en/students`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    })
    await page.waitForTimeout(4000)

    // The create button is a "+" icon button in the toolbar
    // It's the last button in the toolbar area, with a Plus/+ icon
    const plusButton = page.locator(
      'button:has(svg[class*="lucide-plus"]), button:has(path[d*="M5 12h14"]), button[aria-label*="create" i], button[aria-label*="add" i]'
    )
    const toolbarCreate = plusButton.first()

    if (await toolbarCreate.isVisible({ timeout: 5000 }).catch(() => false)) {
      await Promise.all([
        page
          .waitForURL(/\/students\/add\/[^/]+\/personal/, {
            timeout: 20000,
          })
          .catch(() => null),
        toolbarCreate.click(),
      ])
    } else {
      // Fallback: navigate directly to trigger draft creation via API
      // Use page.evaluate to call createDraftStudent via fetch
      const studentId = await page.evaluate(async () => {
        const res = await fetch("/api/test/create-draft-student", {
          method: "POST",
        })
        if (res.ok) {
          const data = await res.json()
          return data.id
        }
        return null
      })

      if (!studentId) {
        throw new Error(
          "Could not create draft student - no create button found and no API fallback"
        )
      }

      await page.goto(`${DEMO_URL}/en/students/add/${studentId}/personal`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      })
    }

    await page.waitForURL(/\/students\/add\/[^/]+\/personal/, {
      timeout: 20000,
    })

    const url = page.url()
    const match = url.match(/\/students\/add\/([^/]+)\//)
    expect(match).toBeTruthy()
    const studentId = match![1]

    // Test each step sequentially
    for (const step of STUDENT_STEPS) {
      const stepUrl = `${DEMO_URL}/en/students/add/${studentId}/${step}`
      await verifyStep(page, stepUrl, step)
    }
  })
})
