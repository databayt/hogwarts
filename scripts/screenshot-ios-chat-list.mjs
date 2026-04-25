import { mkdir } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { chromium } from "@playwright/test"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "..", "kun", "ios-chat-list-screenshots")

const EMAIL = process.env.ADMIN_EMAIL || "admin@kingfahad.edu"
const PASSWORD = process.env.ADMIN_PASSWORD || "1234"
const BASE = process.env.BASE_URL || "http://kingfahad.localhost:3000"

async function main() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  })
  const page = await context.newPage()

  page.on("console", (msg) => {
    if (msg.type() === "error") console.log("[browser error]", msg.text())
  })

  // No auth needed — wa-preview page renders IosChatList with mock data.

  console.log("Navigating to /wa-preview (EN)")
  await page.goto(`${BASE}/en/wa-preview`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: join(OUT, "03-wa-preview-en.png"),
    fullPage: false,
  })

  // Scroll to reveal encrypt footer
  await page.evaluate(() => {
    const scroller = document.querySelector('[class*="overflow-y-auto"]')
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  })
  await page.waitForTimeout(500)
  await page.screenshot({
    path: join(OUT, "03b-wa-preview-en-scrolled.png"),
    fullPage: false,
  })
  console.log("EN preview saved")

  console.log("Navigating to /wa-preview (AR)")
  await page.goto(`${BASE}/ar/wa-preview`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await page.screenshot({
    path: join(OUT, "04-wa-preview-ar.png"),
    fullPage: false,
  })
  await page.evaluate(() => {
    const scroller = document.querySelector('[class*="overflow-y-auto"]')
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  })
  await page.waitForTimeout(500)
  await page.screenshot({
    path: join(OUT, "04b-wa-preview-ar-scrolled.png"),
    fullPage: false,
  })
  console.log("AR preview saved")

  await browser.close()
  console.log(`\nSaved to ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
