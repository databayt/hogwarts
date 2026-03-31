/**
 * Lifecycle Test - Phase 4: Review & Approve Application as Admin
 * Login as user@databayt.org (kingfahad ADMIN) → Navigate to application → SUBMITTED → UNDER_REVIEW → SHORTLISTED → SELECTED → Enroll
 */
import { mkdirSync } from "fs"
import { chromium } from "@playwright/test"

mkdirSync("tests/lifecycle/screenshots", { recursive: true })

const BASE = "http://kingfahad.localhost:3000"
const APP_ID = "cmnebg8qt000d8o10oqtcqa7g"
const LOCALE = "en"

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  const page = await ctx.newPage()
  page.on("dialog", (d) => d.accept())
  page.setDefaultTimeout(30000)

  // Capture server action responses
  const actionResponses = []
  page.on("response", async (res) => {
    const url = res.url()
    if (
      url.includes("admission/applications") &&
      res.request().method() === "POST"
    ) {
      try {
        const body = await res.text()
        actionResponses.push({
          status: res.status(),
          url,
          body: body.substring(0, 300),
        })
      } catch {}
    }
  })

  async function go(url) {
    await page.goto(url, { waitUntil: "load", timeout: 60000 }).catch(() => {})
    await sleep(4000)
  }

  try {
    // LOGIN
    console.log("=== LOGIN as user@databayt.org (kingfahad ADMIN) ===")
    await page.goto(`${BASE}/${LOCALE}/login`, {
      waitUntil: "networkidle",
      timeout: 90000,
    })
    await sleep(3000)
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 20000,
    })
    await page
      .locator('input[name="email"], input[type="email"]')
      .first()
      .fill("user@databayt.org")
    await page
      .locator('input[name="password"], input[type="password"]')
      .first()
      .fill("1234")
    await page.locator('button[type="submit"]').first().click()

    for (let i = 0; i < 15; i++) {
      await sleep(2000)
      if (!page.url().includes("/login")) break
    }

    const cookies = await ctx.cookies()
    const hasSession = cookies.some((c) => c.name === "authjs.session-token")
    console.log(`  Logged in: ${hasSession}, URL: ${page.url()}`)
    if (!hasSession) throw new Error("Login failed")

    // Dismiss WelcomeDialog on first page load
    await sleep(2000)
    if (
      await page
        .locator('[role="dialog"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape")
      await sleep(1000)
    }

    // Navigate to application detail
    console.log("\n=== APPLICATION DETAIL ===")
    await go(`${BASE}/${LOCALE}/admission/applications/${APP_ID}`)
    console.log(`  URL: ${page.url()}`)

    // Dismiss dialog if it reappears
    await sleep(2000)
    if (
      await page
        .locator('[role="dialog"]')
        .first()
        .isVisible({ timeout: 2000 })
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape")
      await sleep(1000)
    }

    // Wait for page content
    await page
      .waitForSelector(
        'button:has-text("Update Status"), button:has-text("تحديث الحالة")',
        { timeout: 15000 }
      )
      .catch(() => console.log("  Warning: Update Status not found yet"))
    await sleep(1000)

    await page
      .screenshot({
        path: "tests/lifecycle/screenshots/review-detail.png",
        timeout: 5000,
      })
      .catch(() => {})

    // Status progression: SUBMITTED → UNDER_REVIEW → SHORTLISTED → SELECTED
    const transitions = [
      { display: "Under Review", value: "UNDER_REVIEW" },
      { display: "Shortlisted", value: "SHORTLISTED" },
      { display: "Selected", value: "SELECTED" },
    ]

    for (const target of transitions) {
      console.log(`\n=== UPDATE STATUS → ${target.value} ===`)

      const updateBtn = page
        .locator(
          'button:has-text("Update Status"), button:has-text("تحديث الحالة")'
        )
        .first()

      if (await updateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await updateBtn.click()
        await sleep(1000)

        const option = page
          .locator(`[role="menuitem"]:has-text("${target.display}")`)
          .first()

        if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option.click()
          await sleep(4000)
          console.log(`  Clicked "${target.display}" → waiting for update...`)

          // Check toast for result
          const toasts = await page
            .locator("[data-sonner-toast]")
            .allTextContents()
            .catch(() => [])
          if (toasts.length) console.log(`  Toasts: ${JSON.stringify(toasts)}`)

          // Log action responses
          if (actionResponses.length) {
            console.log(
              `  Action responses: ${JSON.stringify(actionResponses.slice(-1))}`
            )
          }
        } else {
          console.log(`  Option "${target.display}" not in dropdown`)
          await page.keyboard.press("Escape")
          await sleep(500)
        }
      } else {
        console.log("  Update Status button not found")
      }
    }

    // CONFIRM ENROLLMENT
    console.log("\n=== CONFIRM ENROLLMENT ===")
    await sleep(2000)

    const enrollBtn = page
      .locator(
        'button:has-text("Confirm Enrollment"), button:has-text("تأكيد القبول")'
      )
      .first()

    if (await enrollBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("  Clicking Confirm Enrollment...")
      actionResponses.length = 0 // clear for fresh capture
      await enrollBtn.click()
      await sleep(12000)

      // Check toasts
      const toasts = await page
        .locator("[data-sonner-toast]")
        .allTextContents()
        .catch(() => [])
      console.log(`  Toasts: ${JSON.stringify(toasts)}`)

      // Check action responses
      if (actionResponses.length) {
        console.log(`  Action responses: ${JSON.stringify(actionResponses)}`)
      }
    } else {
      console.log("  Confirm Enrollment button not visible")
      // Get page body to understand what's on screen
      const text = await page
        .locator("main, [class*='content']")
        .first()
        .textContent({ timeout: 3000 })
        .catch(() => "")
      console.log(`  Page text (first 300): ${text.substring(0, 300)}`)
    }

    await page
      .screenshot({
        path: "tests/lifecycle/screenshots/review-final.png",
        timeout: 5000,
      })
      .catch(() => {})

    // Verify in students list
    console.log("\n=== CHECK STUDENTS ===")
    await go(`${BASE}/${LOCALE}/students/manage`)
    const bodyText = await page.textContent("body").catch(() => "")
    if (bodyText.includes("Ahmed") || bodyText.includes("Ali")) {
      console.log("  Student Ahmed Ali found!")
    } else {
      console.log("  Student not found yet")
    }

    console.log("\nPhase 4 complete!")
  } catch (err) {
    console.error(`\nERROR: ${err.message}`)
    await page
      .screenshot({
        path: "tests/lifecycle/screenshots/review-error.png",
        timeout: 5000,
      })
      .catch(() => {})
  } finally {
    await browser.close()
    console.log("Done.")
  }
}

main().catch(console.error)
