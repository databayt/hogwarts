// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Books mirror — capture our two Books surfaces at the reference's own device
// size, so they can be laid next to the iPhone captures in `public/books-app/`
// crop for crop. Same pixel grid as the phone: 390×844 pt at 3x → 1170×2532.
//
//   pnpm dev                                   # port 3000, demo tenant seeded
//   node scripts/books-mirror-capture.mjs      # → .claude/screenshots/books-mirror/
//   node scripts/books-mirror-capture.mjs en   # English UI
//
// Then `python3 scripts/books-mirror-crops.py` cuts the acceptance rectangles
// from both sides. Blueprint: .claude/plans/books-app-mirror-blueprint.md §17.
import { mkdirSync } from "node:fs"
import { chromium } from "@playwright/test"

const lang = process.argv[2] === "en" ? "en" : "ar"
const base = process.env.BOOKS_BASE ?? "http://demo.localhost:3000"
const subject = process.env.BOOKS_SUBJECT ?? "sd-g12-biology"
const out = `.claude/screenshots/books-mirror/${lang}`
mkdirSync(out, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  locale: lang,
})
const page = await ctx.newPage()
page.setDefaultTimeout(Number(process.env.BOOKS_TIMEOUT ?? 15000))

// The Next devtools badge has a pre-existing hydration warning that opens the
// overlay and eats clicks; it is not part of the product.
const hide = () =>
  page
    .addStyleTag({ content: "nextjs-portal{display:none!important}" })
    .catch(() => {})
const shot = async (name) => {
  await hide()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log("shot", name)
}
// The welcome "Quick Guide" dialog opens over the first page of a fresh
// session and intercepts every tap until closed.
const dismiss = async () => {
  for (let i = 0; i < 3; i++) {
    const open = page.locator('[data-slot="dialog-overlay"][data-state="open"]')
    if (!(await open.count())) return
    const close = page
      .locator('[data-slot="dialog-close"], [role="dialog"] button')
      .first()
    if (await close.count()) {
      try {
        await close.click({ timeout: 2000, force: true })
      } catch {
        /* fall through to Escape */
      }
    }
    await page.keyboard.press("Escape").catch(() => {})
    await page.waitForTimeout(600)
  }
}
// The cover screen ignores taps today (blueprint §15.1); keys always work.
const turn = async (n = 1) => {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press("ArrowDown")
    await page.waitForTimeout(450)
  }
}
const scrollTo = (y) =>
  page.evaluate((y) => {
    for (const el of document.querySelectorAll("*")) {
      if (el.scrollHeight > el.clientHeight + 50) el.scrollTop = y
    }
    window.scrollTo(0, y)
  }, y)

try {
  // Demo tenant login is a role picker with the admin preselected.
  await page.goto(`${base}/${lang}/login`, { waitUntil: "load" })
  const login = page
    .getByRole("button", { name: /دخول|Login|Sign in/i })
    .first()
  if (await login.count()) await login.click()
  await page.waitForTimeout(3500)
  await dismiss()

  // ── Store page (IMG_2572 / 2573 / 2577) ─────────────────────────────
  await page.goto(`${base}/${lang}/library`, { waitUntil: "load" })
  await dismiss()
  await shot("00-library-home")
  const href = await page
    .locator('a[href*="/library/books/"]')
    .first()
    .getAttribute("href")
  if (href) {
    await page.goto(`${base}${href}`, { waitUntil: "load" })
    await dismiss()
    await shot("10-store-top")
    await scrollTo(760)
    await page.waitForTimeout(600)
    await shot("11-store-scrolled")
    const more = page.getByRole("button", { name: /^(More|المزيد)$/ }).first()
    if (await more.count()) {
      await more.click()
      await page.waitForTimeout(800)
      await shot("12-store-publisher")
    }
  }

  // ── Reader (IMG_2578 … 2598) ────────────────────────────────────────
  await page.goto(`${base}/${lang}/subjects/${subject}/textbook`, {
    waitUntil: "load",
  })
  await page.waitForTimeout(2500)
  await dismiss()
  await shot("20-reader-cover")
  await turn(1)
  await shot("21-reader-contents-page")
  await turn(8)
  await shot("22-reader-page")
  const menu = page.locator(".book-menu-button").first()
  await menu.click()
  await page.waitForTimeout(700)
  await shot("23-reader-menu")
  await page.locator(".book-pill-scrub").first().click()
  await page.waitForTimeout(1000)
  await shot("24-reader-contents-sheet")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(700)
  await menu.click()
  await page.waitForTimeout(600)
  await page.locator(".book-menu .book-pill").last().click()
  await page.waitForTimeout(1000)
  await shot("25-reader-settings")
  const customize = page.locator(".book-customize").first()
  if (await customize.count()) {
    await customize.click()
    await page.waitForTimeout(1000)
    await shot("26-reader-customize")
  }
  await page.keyboard.press("Escape")
  await page.waitForTimeout(700)
  await menu.click()
  await page.waitForTimeout(600)
  await page.locator(".book-menu .book-pill").nth(1).click()
  await page.waitForTimeout(1000)
  await page.keyboard.type(lang === "ar" ? "الخلية" : "cell")
  await page.waitForTimeout(900)
  await shot("27-reader-search")
  await page.keyboard.press("Escape")
  await page.waitForTimeout(700)
  // Line guide (IMG_2610) and a bookmark (IMG_2612/2613): the two round-row
  // actions that change the page itself.
  await menu.click()
  await page.waitForTimeout(600)
  const rounds = page.locator(".book-menu-round-row .book-round")
  if ((await rounds.count()) >= 4) {
    await rounds.nth(2).click()
    await page.waitForTimeout(600)
    await page.mouse.move(195, 420)
    await page.waitForTimeout(400)
    await shot("29-reader-line-guide")
    await menu.click()
    await page.waitForTimeout(600)
    await rounds.nth(2).click()
    await page.waitForTimeout(500)
    await menu.click()
    await page.waitForTimeout(600)
    await rounds.nth(3).click()
    await page.waitForTimeout(600)
    await shot("30-reader-bookmarked")
  }
  await page.mouse.click(195, 500)
  await page.waitForTimeout(600)
  await shot("28-reader-chrome-hidden")
} catch (e) {
  console.error("ERR", String(e.message).split("\n")[0])
  await shot("99-error")
}
await browser.close()
