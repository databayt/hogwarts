// Two parties on the same thread without a socket server: the teacher sends
// while the admin is scrolled up into history. The admin's thread must not
// jump, the jump button must count the arrival, the row badge must update on
// the list, and the message must arrive within one poll interval.
import { chromium } from "@playwright/test"
const base = "http://demo.localhost:3000"
const threadId = process.env.MM_THREAD_ID
const lang = "ar"
const browser = await chromium.launch()
let step = "start"
const at = (name) => { step = name; console.log("step:", name) }
// The welcome "Quick Guide" dialog opens over the first authed page of a
// fresh session and intercepts every tap until closed.
const dismiss = async (page) => {
  // The Next devtools badge sits at the bottom-start corner — over the send
  // button in RTL — and takes the tap. It is not part of the product.
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {})
  for (let i = 0; i < 4; i++) {
    const open = page.locator('[data-slot="dialog-overlay"][data-state="open"]')
    if (!(await open.count())) return
    await page.keyboard.press("Escape").catch(() => {})
    await page.waitForTimeout(500)
  }
}
const mk = async (role) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: lang,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" })
  const page = await ctx.newPage()
  page.setDefaultTimeout(20000)
  await page.goto(`${base}/${lang}/login`, { waitUntil: "load" })
  // The picker is a Select: open it, choose the role, then Login. The
  // admin is preselected, so only another role has to be chosen.
  at(`login ${role}`)
  if (!/مدير المدرسة|Admin/.test(String(role))) {
    await page.locator("#demo-role").click()
    await page.getByRole("option", { name: role }).first().click()
  }
  await page.getByRole("button", { name: /دخول|Login|Sign in/i }).first().click()
  await page.waitForTimeout(3500)
  await dismiss(page)
  return page
}
const report = {}
const pages = {}
try {
  const admin = await mk(/مدير المدرسة|Admin/i)
  const teacher = await mk(/^معلم$|^Teacher$/i)
  pages.admin = admin
  pages.teacher = teacher
  at("admin opens thread")
  await admin.goto(`${base}/${lang}/messages?conversation=${threadId}`, { waitUntil: "load" })
  await admin.waitForTimeout(2000)
  await dismiss(admin)
  // scroll the admin up into history
  await admin.evaluate(() => { const el = document.querySelector("div.overflow-y-auto.overscroll-contain"); el.scrollTop = el.scrollHeight - el.clientHeight - 900; el.dispatchEvent(new Event("scroll")) })
  await admin.waitForTimeout(500)
  const before = await admin.evaluate(() => { const el = document.querySelector("div.overflow-y-auto.overscroll-contain"); return { scrollTop: el.scrollTop, jump: !!document.querySelector('button[aria-label="التمرير للأسفل"]') } })
  // teacher opens the same thread and sends
  at("teacher opens thread")
  await teacher.goto(`${base}/${lang}/messages?conversation=${threadId}`, { waitUntil: "load" })
  await teacher.waitForTimeout(2000)
  await dismiss(teacher)
  const text = `رد المعلمة ${Date.now() % 100000}`
  at("teacher fills")
  await teacher.locator("textarea").first().fill(text)
  const t0 = Date.now()
  await teacher.getByRole("button", { name: /^(إرسال|Send)$/ }).click()
  // wait for it on the admin's side (poll ≤ 5s)
  const arrived = await admin.waitForFunction((t) => document.body.innerText.includes(t), text, { timeout: 12000 }).then(() => Date.now() - t0).catch(() => -1)
  await admin.waitForTimeout(400)
  const after = await admin.evaluate(() => { const el = document.querySelector("div.overflow-y-auto.overscroll-contain"); const jump = document.querySelector('button[aria-label="التمرير للأسفل"]'); return { scrollTop: el.scrollTop, jump: !!jump, badge: jump?.textContent?.trim() } })
  report.incoming = { arrivedMs: arrived, scrollBefore: before.scrollTop, scrollAfter: after.scrollTop, jumpBefore: before.jump, jumpAfter: after.jump, badge: after.badge }
  at("admin taps jump")
  await admin.locator('button[aria-label="التمرير للأسفل"]').click().catch(() => {})
  await admin.waitForTimeout(900)
  report.afterJump = await admin.evaluate(() => { const el = document.querySelector("div.overflow-y-auto.overscroll-contain"); return { fromBottom: el.scrollHeight - el.scrollTop - el.clientHeight, jump: !!document.querySelector('button[aria-label="التمرير للأسفل"]') } })
  at("admin back to list")
  await admin.getByRole("button", { name: /^(رجوع|العودة|Back)$/ }).first().click()
  await admin.waitForTimeout(800)
  report.listPreviewHasText = await admin.evaluate((t) => document.body.innerText.includes(t), text)
  // second party's list badge: teacher goes back to list; admin sends; teacher's row should get a badge within a list poll (≤15s)
  at("teacher back to list")
  await teacher.getByRole("button", { name: /^(رجوع|العودة|Back)$/ }).first().click()
  await teacher.waitForTimeout(800)
  at("admin reopens thread from list")
  // The row's preview is the teacher's reply now; find it by the contact.
  await admin.locator("button", { hasText: /مينيرفا|Minerva/ }).first().click()
  await admin.waitForTimeout(1500)
  const t2 = `رد المدير ${Date.now() % 100000}`
  await admin.locator("textarea").first().fill(t2)
  const t1 = Date.now()
  await admin.getByRole("button", { name: /^(إرسال|Send)$/ }).click()
  const badgeMs = await teacher.waitForFunction((t) => document.body.innerText.includes(t), t2, { timeout: 25000 }).then(() => Date.now() - t1).catch(() => -1)
  report.listPollPreviewMs = badgeMs
  report.teacherRowBadge = await teacher.evaluate((t) => { const row = Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes(t)); return row ? row.textContent.match(/\d+/g)?.slice(-1)[0] : null }, t2)
} catch (e) {
  report.error = `${step}: ${String(e.message).split("\n")[0]}`
  for (const [name, pg] of Object.entries(pages)) await pg.screenshot({ path: `.claude/screenshots/messaging-mirror/two-party-${name}-error.png` }).catch(() => {})
}
await browser.close()
console.log(JSON.stringify(report, null, 2))
