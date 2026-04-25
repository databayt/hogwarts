import { mkdir } from "fs/promises"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { chromium } from "@playwright/test"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, "..", "..", "kun", "ios-chat-list-screenshots")

const BASE = process.env.BASE_URL || "http://localhost:3000"

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

  page.on("console", (m) => {
    if (m.type() === "error") console.log("[browser error]", m.text())
  })

  console.log("EN /wa-preview/chat")
  await page.goto(`${BASE}/en/wa-preview/chat`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await page.keyboard.press("Escape").catch(() => {})
  await page.waitForTimeout(400)
  await page.screenshot({
    path: join(OUT, "05-chat-view-en-top.png"),
    fullPage: false,
  })

  await page.evaluate(() => {
    const scroller = document.querySelector('[class*="overflow-y-auto"]')
    if (scroller) scroller.scrollTop = scroller.scrollHeight
  })
  await page.waitForTimeout(500)
  await page.screenshot({
    path: join(OUT, "05b-chat-view-en-bottom.png"),
    fullPage: false,
  })

  console.log("EN /wa-preview/chat-reply")
  await page.goto(`${BASE}/en/wa-preview/chat-reply`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await page.keyboard.press("Escape").catch(() => {})
  await page.waitForTimeout(400)
  await page.screenshot({
    path: join(OUT, "07-chat-reply-en.png"),
    fullPage: false,
  })

  console.log("AR /wa-preview/chat")
  await page.goto(`${BASE}/ar/wa-preview/chat`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  })
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await page.keyboard.press("Escape").catch(() => {})
  await page.waitForTimeout(400)
  await page.screenshot({
    path: join(OUT, "06-chat-view-ar-top.png"),
    fullPage: false,
  })

  await browser.close()
  console.log(`\nSaved to ${OUT}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
