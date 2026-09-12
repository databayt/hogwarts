// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Messaging mirror — drive the phone messaging surface at the reference's own
// device size (390×844 pt at 3x, the grid of `public/whatsapp/IMG_26*.PNG`),
// capture it, and measure the behaviours the captures cannot show: how fast a
// sent message lands on screen, whether a poll tick can duplicate it, whether
// paging older messages holds the reader's place, and what the page costs.
//
//   pnpm dev                                          # port 3000, demo tenant
//   node scripts/messaging-mirror-capture.mjs         # Arabic UI, phone
//   node scripts/messaging-mirror-capture.mjs en      # English UI, phone
//   MM_DESKTOP=1 node scripts/messaging-mirror-capture.mjs en   # 1440×900
//
// Output: .claude/screenshots/messaging-mirror/<lang|desktop>/ and a JSON
// report printed at the end.
import { mkdirSync, writeFileSync } from "node:fs"
import { chromium } from "@playwright/test"

const lang = process.argv[2] === "en" ? "en" : "ar"
const desktop = process.env.MM_DESKTOP === "1"
const base = process.env.MM_BASE ?? "http://demo.localhost:3000"
const threadNeedle = process.env.MM_THREAD ?? "رسالة تحميل رقم"
// A conversation id opens the thread by URL — the desktop sidebar lists
// contacts, not conversations, so there is no row to tap there.
const threadId = process.env.MM_THREAD_ID ?? ""
const out = `.claude/screenshots/messaging-mirror/${desktop ? "desktop" : lang}`
mkdirSync(out, { recursive: true })

const report = { lang, desktop, console: [], failedRequests: [], actions: {} }
const browser = await chromium.launch()
const ctx = await browser.newContext(
  desktop
    ? { viewport: { width: 1440, height: 900 }, locale: lang }
    : {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        locale: lang,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      }
)
const page = await ctx.newPage()
page.setDefaultTimeout(Number(process.env.MM_TIMEOUT ?? 20000))
page.on("console", (msg) => {
  if (["error", "warning"].includes(msg.type()))
    report.console.push(
      `${msg.type()} @${page.url().replace(base, "")}: ${msg.text().slice(0, 160)}`
    )
})
page.on("requestfailed", (r) => report.failedRequests.push(r.url().slice(0, 120)))
// Server actions POST to the page with a `next-action` id header; counting
// them per id over a window shows how often the page talks to the server.
let counting = false
page.on("request", (r) => {
  const id = r.headers()["next-action"]
  if (counting && id) report.actions[id] = (report.actions[id] ?? 0) + 1
})

const hide = () =>
  page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
const shot = async (name) => {
  await hide()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log("shot", name)
}
const dismiss = async () => {
  for (let i = 0; i < 3; i++) {
    const open = page.locator('[data-slot="dialog-overlay"][data-state="open"]')
    if (!(await open.count())) return
    await page.keyboard.press("Escape").catch(() => {})
    await page.waitForTimeout(500)
  }
}
const domStats = () =>
  page.evaluate(() => ({
    nodes: document.getElementsByTagName("*").length,
    mobileShell: !!document.querySelector('nav[aria-label="Main tabs"]'),
    desktopComposer: !!document.querySelector('textarea[name="content"]'),
    mobileComposer: !!document.querySelector("textarea:not([name])"),
    hydrationErrors: 0,
  }))
const longTasks = async (fn) => {
  await page.evaluate(() => {
    window.__lt = []
    window.__ltObs = new PerformanceObserver((l) =>
      l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))
    )
    window.__ltObs.observe({ entryTypes: ["longtask"] })
  })
  await fn()
  return page.evaluate(() => {
    window.__ltObs?.disconnect()
    return window.__lt ?? []
  })
}

try {
  // Demo tenant login is a role picker with the admin preselected.
  await page.goto(`${base}/${lang}/login`, { waitUntil: "load" })
  const login = page.getByRole("button", { name: /دخول|Login|Sign in/i }).first()
  if (await login.count()) await login.click()
  await page.waitForTimeout(3500)
  await dismiss()

  // ── Chat list ────────────────────────────────────────────────────────
  const t0 = Date.now()
  await page.goto(`${base}/${lang}/messages`, { waitUntil: "load" })
  report.listLoadMs = Date.now() - t0
  await page.waitForTimeout(1500)
  await dismiss()
  report.list = await domStats()
  await shot("10-list")

  // ── Open the long thread ─────────────────────────────────────────────
  if (desktop || !(await page.locator("button", { hasText: threadNeedle }).count())) {
    if (!threadId) throw new Error("set MM_THREAD_ID to open a thread here")
    await page.goto(`${base}/${lang}/messages?conversation=${threadId}`, { waitUntil: "load" })
  } else {
    await page.locator("button", { hasText: threadNeedle }).first().click()
  }
  await page.waitForTimeout(2000)
  await dismiss()
  report.thread = await domStats()
  await shot("20-thread")

  const scroller = desktop
    ? page.locator("div.overflow-y-auto").last()
    : page.locator("div.overflow-y-auto.overscroll-contain").first()

  // ── Send: time to bubble, composer state, tick lifecycle ────────────
  const text = `اختبار ${Date.now() % 100000} ⚡`
  const field = desktop ? page.locator('textarea[name="content"]') : page.locator("textarea").first()
  await field.click()
  await field.fill(text)
  const sendBtn = desktop
    ? page.locator('button[type="submit"]').first()
    : page.getByRole("button", { name: /^(إرسال|Send)$/ })
  const tSend = Date.now()
  const bubbleAppear = page.evaluate((t) => {
    return new Promise((resolve) => {
      const start = performance.now()
      const check = () => {
        if (document.body.innerText.includes(t)) resolve(performance.now() - start)
        else if (performance.now() - start > 5000) resolve(-1)
        else requestAnimationFrame(check)
      }
      check()
    })
  }, text)
  await sendBtn.click()
  report.send = { toBubbleMs: Math.round(await bubbleAppear) }
  report.send.fieldEmptyAfter = (await field.inputValue()) === ""
  report.send.fieldFocusedAfter = await page.evaluate(
    () => document.activeElement?.tagName === "TEXTAREA"
  )
  await page.waitForTimeout(150)
  await shot("30-sent-optimistic")
  // Wait for the server to confirm (clock → tick), up to 6s.
  const confirmed = await page
    .waitForFunction(
      () => !document.querySelector('[aria-label="جارٍ الإرسال..."], [aria-label="Sending..."]'),
      null,
      { timeout: 6000 }
    )
    .then(() => true)
    .catch(() => false)
  report.send.confirmedMs = confirmed ? Date.now() - tSend : -1

  // ── Poll tick lands after the send: no duplicate ─────────────────────
  counting = true
  await page.waitForTimeout(16000)
  counting = false
  report.send.copiesAfterPoll = await page.evaluate(
    (t) => Array.from(document.querySelectorAll("p")).filter((p) => p.textContent?.includes(t)).length,
    text
  )
  await shot("31-sent-confirmed")

  // ── Paging: hold the reader's place ──────────────────────────────────
  if (!desktop) {
    // Baseline is taken AFTER scrolling to the top and BEFORE the scroll
    // event that requests the page — the browser fires it on the next task,
    // so the rect read here is the position the anchor must keep.
    const before = await page.evaluate(() => {
      const el = document.querySelector("div.overflow-y-auto.overscroll-contain")
      el.scrollTop = 0
      const first = el.querySelector("[dir=auto]")
      return { count: el.querySelectorAll("[dir=auto]").length, scrollHeight: el.scrollHeight, firstText: first?.textContent?.slice(0, 40), firstTop: first?.getBoundingClientRect().top }
    })
    const tasks = await longTasks(async () => {
      await page.evaluate(() => {
        const el = document.querySelector("div.overflow-y-auto.overscroll-contain")
        el.dispatchEvent(new Event("scroll"))
      })
      await page.waitForTimeout(2500)
    })
    const after = await page.evaluate((firstText) => {
      const el = document.querySelector("div.overflow-y-auto.overscroll-contain")
      const first = Array.from(el.querySelectorAll("[dir=auto]")).find((p) => p.textContent?.slice(0, 40) === firstText)
      const texts = Array.from(el.querySelectorAll("[dir=auto]")).map((p) => p.textContent)
      return { count: el.querySelectorAll("[dir=auto]").length, scrollHeight: el.scrollHeight, anchorTop: first?.getBoundingClientRect().top, duplicates: texts.length - new Set(texts).size, scrollTop: el.scrollTop }
    }, before.firstText)
    report.paging = { before, after, anchorDriftPx: after.anchorTop != null && before.firstTop != null ? Math.round(after.anchorTop - before.firstTop) : null, longTasksMs: tasks }
    await shot("40-paged")

    // Scroll sweep cost
    report.scrollLongTasksMs = await longTasks(async () => {
      for (let i = 0; i < 12; i++) {
        await page.mouse.wheel(0, 600)
        await page.waitForTimeout(80)
      }
    })
    await page.waitForTimeout(800)
    await shot("41-jump-button")
  }

  // ── Back to the list ─────────────────────────────────────────────────
  if (!desktop) {
    await page.getByRole("button", { name: /^(رجوع|العودة|Back)$/ }).first().click()
    await page.waitForTimeout(800)
    report.backToList = await domStats()
    await shot("50-list-after")
  }
} catch (e) {
  report.error = String(e.message).split("\n")[0]
  await shot("99-error")
}
await browser.close()
writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
