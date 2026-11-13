#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// live-smoke.mjs -- a scripted three-role live class: the end-to-end happy path of the
// live-class block (src/components/school-dashboard/live). Student, teacher and parent each
// get their own browser (a fresh temporary Chrome profile per role, never the user's own
// profile), FAKE camera and microphone only.
//
//   node scripts/live-smoke.mjs --help
//   node scripts/live-smoke.mjs                       # demo school, class found from /live
//   node scripts/live-smoke.mjs --session <id>        # name a class by its conference id
//   node scripts/live-smoke.mjs --slot <timetableId>  # name a class by its timetable slot
//
// WHAT IT CHECKS (each prints PASS or FAIL, the run ends "N/N passed", exit 1 on any FAIL)
//   media devices are fake (before anyone signs in; aborts otherwise) -- every seat signs
//   in and lands on the dashboard -- the join link / room URL resolves to the room card --
//   pressing Join connects (Leave control appears, no alert) -- the student sees the waiting
//   line when alone -- the parent has no camera/hand control -- the student receives the
//   teacher's camera -- teacher and student see each other in the people list, and names are
//   names (no login code, no address) -- the teacher sees the student's raised hand -- a chat
//   message from the student reaches the teacher -- the parent reads it, with no chat box
//   (read-only notice) -- no console `error` beyond known noise -- everyone leaves cleanly.
//
// THE WALK-IN MODEL. There is no "start class" button: the first person inside opens the
// room, so the student enters first, the parent watches, the teacher arrives last and comes
// in live. (Ad-hoc sessions that are still `scheduled` must be opened by their host first:
// pass --host-first.) See live/README.md and live/ISSUE.md.
//
// HOW A JOINABLE CLASS IS OBTAINED AT ANY HOUR (no database write by this script)
//   A real timetable slot is joinable only inside its window (live/join-window.ts: from a
//   few minutes before the period to its end), so a slot is joinable only at its own hour.
//   The demo school is the exception: demo-clock.ts keeps three slot-less sessions that
//   straddle "now" -- ids `clockshow0<schoolId>` (running, 20 min in, 25 to go),
//   `clockshow1<schoolId>` (nearly over) and `clockshow2<schoolId>` (starts in 10 min). The
//   /live landing repairs them at read time (`ensureDemoClock`) whenever one of them has
//   gone stale, on a demo tenant only, pinned to the DEMO STUDENT's section
//   (student@balqalam.com). So at any hour: sign in as the student, open /<lang>/live, and
//   `clockshow0...` is a live, joinable class. With no --session/--slot this script does
//   exactly that (it opens /live as the student and takes the first `clockshow0` link).
//   Caveat: the class's host is the slot's own teacher, not necessarily teacher@. If the
//   teacher seat is refused the room, pass --teacher <that teacher's email> (a demo teacher
//   is teacherNN@balqalam.com) and, if the parent seat sees no class, a parent of that
//   student with --parent.
//   Alternative, for a real slot: a temporary class created by SQL (NOT done by this
//   script). Recipe, on the demo school (domain 'demo') only, ids prefixed `tmplive`:
//     1. INSERT one `periods` row for today at HH:MM (50 min, isBreak false), copying
//        schoolId/yearId/gradeId from "Period 1".
//     2. INSERT one `timetables` row for today's dayOfWeek, that periodId, weekOffset 0,
//        sectionId = student@'s section, teacherId = teacher@'s teacher row, and a
//        subjectId taught by that teacher (copy termId/classroomId/rotationWeek/
//        constraintViolations from a template slot of the section).
//     3. Run with --slot <that timetables.id> inside the window.
//     4. Clean up afterwards: delete live_class_* rows of its sessions, attendances for
//        its timetableId, notifications that point at it, then the timetable and period
//        rows (only ids LIKE 'tmplive%').
//
// SAFETY. Refuses any host whose first label is not `demo` unless --allow-host. No secrets
// in this file: the password is env SMOKE_PASSWORD (default: the public demo password).
// Joining does what a real join does (participant and attendance rows on the DEMO school).
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const HELP = `live-smoke.mjs -- scripted three-role live class (student, teacher, parent)

  --base <url>       default https://demo.balqalam.com (local: http://demo.localhost:3000)
  --lang ar|en       room language, default ar
  --session <id>     conference id to open (default: the demo's running clockshow0 class)
  --slot <id>        timetable slot id: enter through /live/join/<slot>
  --host-first       the teacher enters first (ad-hoc sessions that need their host)
  --student <email>  default student@balqalam.com
  --teacher <email>  default teacher43@balqalam.com (the host of the demo's clockshow0 class)
  --parent <email>   optional parent seat (must be a guardian of the class's student)
  --timeout <sec>    per-wait ceiling, default 90
  --out <dir>        failure screenshots (default: a new OS temp dir)
  --headed           show the browsers
  --allow-host       permit a host whose first label is not "demo"
  --help
Env: SMOKE_PASSWORD (default 1234, the public demo password)`

const argv = process.argv.slice(2)
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(HELP)
  process.exit(0)
}
const flag = (k) => argv.includes(`--${k}`)
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`)
  return i === -1 || i + 1 >= argv.length ? d : argv[i + 1]
}

const base = arg("base", "https://demo.balqalam.com").replace(/\/$/, "")
const lang = arg("lang", "ar")
let sessionId = arg("session")
const slot = arg("slot")
const hostFirst = flag("host-first")
const headed = flag("headed")
const T = Number(arg("timeout", "90")) * 1000
const password = process.env.SMOKE_PASSWORD || "1234"
const out = arg("out", mkdtempSync(join(tmpdir(), "live-smoke-")))
const emails = {
  student: arg("student", "student@balqalam.com"),
  // teacher43 hosts the demo's clockshow0 class; for another class pass its host.
  teacher: arg("teacher", "teacher43@balqalam.com"),
  parent: arg("parent", null), // optional: the parent must be a guardian of the class's student
}

if (!["ar", "en"].includes(lang)) {
  console.error("--lang must be ar or en")
  process.exit(2)
}
let hostname
try {
  hostname = new URL(base).hostname
} catch {
  console.error(`bad --base: ${base}`)
  process.exit(2)
}
if (hostname.split(".")[0] !== "demo" && !flag("allow-host")) {
  console.error(
    `REFUSED: ${hostname} is not a demo host (first label must be "demo"). Pass --allow-host to override.`
  )
  process.exit(2)
}
mkdirSync(out, { recursive: true })

// The strings the room prints (src/components/internationalization/dictionaries/<lang>/live-classes.json).
const L =
  lang === "ar"
    ? {
        join: /^انضمام/,
        leave: "مغادرة",
        chat: /النقاش/,
        send: "إرسال",
        hand: "رفع اليد",
        handToast: /رفع يده/,
        camera: /الكاميرا/,
        readOnly: /الدردشة للقراءة فقط/,
        waiting: /لم يدخل المعلم بعد/,
        alone: "أنت وحدك في هذه الغرفة",
      }
    : {
        join: /^Join/,
        leave: "Leave",
        chat: /Discussion/,
        send: "Send",
        hand: "Raise hand",
        handToast: /raised (his|her|their) hand/i,
        camera: /camera/i,
        readOnly: /Chat is read-only/i,
        waiting: /teacher (has not|hasn't) (joined|arrived)/i,
        alone: "You are alone in this room",
      }

let playwright
try {
  playwright = await import("@playwright/test")
} catch {
  console.error(
    "Playwright is not installed here: run pnpm install in the repo root."
  )
  process.exit(2)
}
const { chromium } = playwright

const results = []
const t0 = Date.now()
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`
let shotN = 0

async function check(seat, ok, what, detail = "") {
  results.push({ ok, what })
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${what}${detail ? `  (${detail})` : ""}`
  )
  if (!ok && seat?.page) {
    await seat.page
      .screenshot({
        path: join(
          out,
          `fail-${String(++shotN).padStart(2, "0")}-${seat.name}.png`
        ),
      })
      .catch(() => {})
  }
  return ok
}

const profiles = []
const seats = []

async function openSeat(name) {
  const dir = mkdtempSync(join(tmpdir(), `live-smoke-${name}-`))
  profiles.push(dir)
  const mobile = name === "student"
  const ctx = await chromium.launchPersistentContext(dir, {
    channel: "chrome",
    headless: !headed,
    viewport: mobile
      ? { width: 390, height: 844 }
      : { width: name === "teacher" ? 1440 : 1280, height: 800 },
    locale: lang,
    isMobile: mobile,
    hasTouch: mobile,
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  })
  await ctx.grantPermissions(["camera", "microphone"], {
    origin: new URL(base).origin,
  })
  const page = ctx.pages()[0] ?? (await ctx.newPage())
  const seat = { name, ctx, page, errors: [] }
  page.on("console", (m) => {
    if (m.type() === "error") seat.errors.push(m.text().slice(0, 300))
  })
  page.on("pageerror", (e) =>
    seat.errors.push(`pageerror: ${String(e).slice(0, 300)}`)
  )
  seats.push(seat)
  return seat
}

// The chrome fades after three seconds; a MOUSE move brings it back (a tap would toggle it).
async function wake(page) {
  const v = page.viewportSize()
  await page.mouse.move(v.width / 2, v.height / 3)
  await page.mouse.move(v.width / 2 + 8, v.height / 3 + 8)
  await page.waitForTimeout(450)
}

async function login(s) {
  // Through the auth API on the seat's own context (shares its cookies): faster than the
  // role-picker UI and not racy. Confirmed against /api/auth/session.
  const { ctx } = s
  const email = emails[s.name]
  let who = null
  try {
    const csrf = await (
      await ctx.request.get(`${base}/api/auth/csrf`, { timeout: T })
    ).json()
    await ctx.request.post(`${base}/api/auth/callback/credentials`, {
      form: {
        csrfToken: csrf.csrfToken,
        identifier: email,
        password,
        schoolId: "",
      },
      maxRedirects: 0,
      timeout: T,
    })
    const session = await (
      await ctx.request.get(`${base}/api/auth/session`, { timeout: T })
    ).json()
    who = session?.user?.email ?? null
    s.displayName = session?.user?.name ?? null
  } catch (e) {
    who = `error: ${String(e).slice(0, 80)}`
  }
  await check(
    s,
    who?.toLowerCase() === email.toLowerCase(),
    `${s.name} signs in (session is ${email})`,
    `${who ?? "no session"} at ${since()}`
  )
}

// Without --session/--slot: the demo's running class, found the way a student finds it.
async function discoverSession(s) {
  await s.page.goto(`${base}/${lang}/live`, {
    waitUntil: "domcontentloaded",
    timeout: T,
  })
  const deadline = Date.now() + 30000
  while (Date.now() < deadline) {
    const hrefs = await s.page.$$eval("a[href]", (as) =>
      as.map((a) => a.getAttribute("href") ?? "")
    )
    const hit = hrefs
      .map((h) => h.match(/\/live\/(clockshow0[^/?#]+)/))
      .find(Boolean)
    if (hit) return hit[1]
    await s.page.waitForTimeout(1500)
  }
  return null
}

async function enter(s) {
  const { page } = s
  const started = Date.now()
  const target = sessionId
    ? `${base}/${lang}/live/${sessionId}/room`
    : `${base}/${lang}/live/join/${slot}`
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: T })
  await page.waitForURL(/\/live\/[^/]+\/room/, { timeout: T }).catch(() => {})
  const joinBtn = page.getByRole("button", { name: L.join }).first()
  const onCard = await joinBtn
    .waitFor({ timeout: T })
    .then(() => true)
    .catch(() => false)
  await check(
    s,
    onCard,
    `${s.name}: the link resolves to the room card`,
    `${Date.now() - started}ms`
  )
  if (!onCard) return false
  const pressed = Date.now()
  // The card is server-rendered: wait for hydration (network idle), then click ONCE. A
  // second click while a join is in flight is not a neutral retry.
  await page.waitForLoadState("networkidle", { timeout: T }).catch(() => {})
  const leave = page.getByRole("button", { name: L.leave }).first()
  await joinBtn.click({ timeout: 10000 }).catch(() => {})
  const connected = await leave
    .waitFor({ timeout: T })
    .then(() => true)
    .catch(() => false)
  // A device or connection notice is a finding, not noise.
  const alert = connected
    ? await page
        .getByRole("alert")
        .first()
        .textContent({ timeout: 1500 })
        .catch(() => null)
    : null
  await check(
    s,
    connected && !alert,
    `${s.name}: Join connects to the room`,
    alert
      ? `alert: ${alert.trim().slice(0, 100)}`
      : `${Date.now() - pressed}ms, at ${since()}`
  )
  return connected && !alert
}

// Opens the people list, waits until it holds someone, returns its lines and count.
async function people(s) {
  const { page } = s
  await wake(page)
  const btn = page
    .locator('button[aria-controls="conference-participants-panel"]')
    .first()
  const found = await btn
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (!found) return { n: 0, lines: [], missing: true }
  const count = async () => {
    const t = `${(await btn.getAttribute("aria-label").catch(() => "")) ?? ""} ${(await btn.innerText().catch(() => "")) ?? ""}`
    return Number(t.match(/\((\d+)\)/)?.[1] ?? 0)
  }
  let n = 0
  for (let i = 0; i < 15 && n === 0; i++) {
    n = await count()
    if (n === 0) await page.waitForTimeout(1500)
  }
  if ((await btn.getAttribute("aria-expanded")) !== "true")
    await btn.click().catch(() => {})
  const region = page.locator("#conference-participants-panel")
  await region.waitFor({ timeout: 5000 }).catch(() => {})
  const text = (await region.innerText().catch(() => "")) ?? ""
  const lines = text
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
  if ((await btn.getAttribute("aria-expanded")) === "true")
    await btn.click().catch(() => {})
  return { n, lines, missing: false }
}

async function leaveRoom(s) {
  const leave = s.page.getByRole("button", { name: L.leave }).first()
  // On a phone the discussion panel covers the whole room, and Playwright
  // still calls the Leave control underneath "visible". So step out of any
  // open panel first, whatever isVisible() says.
  {
    // The panel's back button is labelled "Close" (إغلاق). Several buttons can
    // carry that name; only one is on screen, so click the visible one.
    const closers = await s.page
      .getByRole("button", { name: /^(إغلاق|Close|رجوع|Back)$/ })
      .all()
    // Topmost first: a click only lands on a button that really receives it.
    for (const b of closers.reverse()) {
      if (!(await b.isVisible().catch(() => false))) continue
      const landed = await b
        .click({ timeout: 1500 })
        .then(() => true)
        .catch(() => false)
      if (landed) break
    }
    await s.page.waitForTimeout(600)
  }
  await wake(s.page)
  await leave.click({ timeout: 10000 }).catch(() => {})
  // A confirm step may sit between the control and the exit; take it if present.
  await s.page
    .getByRole("button", { name: L.leave })
    .last()
    .click({ timeout: 1500 })
    .catch(() => {})
  const gone = await leave
    .waitFor({ state: "detached", timeout: 20000 })
    .then(() => true)
    .catch(async () => !(await leave.isVisible().catch(() => false)))
  const alert = await s.page
    .getByRole("alert")
    .first()
    .textContent({ timeout: 800 })
    .catch(() => null)
  await check(
    s,
    gone && !alert,
    `${s.name} leaves cleanly`,
    alert ? alert.trim().slice(0, 80) : ""
  )
}

let exitCode = 1
// A hard ceiling: a browser that will not close must never hang the caller
// (a deploy script, a monitor). Eight minutes covers a slow run twice over.
setTimeout(() => {
  console.log("\nHARD STOP: the run exceeded its 8-minute ceiling")
  process.exit(2)
}, 8 * 60_000).unref()
try {
  // 0. Prove the devices are fake before anyone can publish.
  {
    const probe = await openSeat("probe")
    await probe.page.goto(`${base}/en/login`, {
      waitUntil: "domcontentloaded",
      timeout: T,
    })
    const labels = await probe.page
      .evaluate(async () => {
        const st = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        })
        const l = st.getTracks().map((t) => `${t.kind}:${t.label}`)
        st.getTracks().forEach((t) => t.stop())
        return l
      })
      .catch((e) => [`error:${String(e)}`])
    const fake = labels.length > 0 && labels.every((l) => /fake/i.test(l))
    await check(probe, fake, "media devices are fake", labels.join(" | "))
    await probe.ctx.close()
    seats.splice(seats.indexOf(probe), 1)
    if (!fake) {
      console.error("ABORT: a real device may be reachable")
      process.exit(3)
    }
  }

  const student = await openSeat("student")
  const teacher = await openSeat("teacher")
  const parent = emails.parent ? await openSeat("parent") : null
  // One seat at a time: the demo server is small and parallel heavy loads distort the test.
  for (const seat of [student, teacher, parent]) if (seat) await login(seat)
  if (!parent) console.log("SKIP  parent seat skipped (no --parent)")

  if (!sessionId && !slot) {
    const found = await discoverSession(student)
    await check(
      student,
      Boolean(found),
      "a joinable demo class (clockshow0) is offered on /live",
      found ?? "none found"
    )
    if (!found)
      throw new Error(
        "no joinable class: pass --session or --slot (see the header comment)"
      )
    sessionId = found
  }

  const inRoom = new Set()
  const go = async (s) => {
    if (await enter(s)) inRoom.add(s.name)
  }

  if (hostFirst) await go(teacher)
  // 1. Walk-in: the student is the first one in.
  await go(student)
  if (!hostFirst && !sessionId) {
    await student.page.waitForTimeout(2500)
    const waiting = await student.page
      .getByText(L.waiting)
      .first()
      .isVisible()
      .catch(() => false)
    const alone = await student.page
      .getByText(L.alone)
      .first()
      .isVisible()
      .catch(() => false)
    await check(
      student,
      waiting || alone,
      "student alone is told so on the stage",
      waiting ? "waiting for the teacher" : alone ? "alone line" : "no line"
    )
  }

  // 2. The parent watches.
  if (parent) {
    await go(parent)
    const cam = await parent.page
      .getByRole("button", { name: L.camera })
      .count()
    const hand = await parent.page.getByRole("button", { name: L.hand }).count()
    await check(
      parent,
      cam === 0 && hand === 0,
      "parent has no camera or hand control",
      `camera ${cam}, hand ${hand}`
    )
  }

  // 3. The teacher arrives and comes in live.
  if (!hostFirst) await go(teacher)
  await teacher.page.waitForTimeout(6000)

  if (inRoom.has("student") && inRoom.has("teacher")) {
    const video = await student.page.evaluate(() =>
      [...document.querySelectorAll("video")].map((v) => ({
        w: v.videoWidth,
        ready: v.readyState,
      }))
    )
    await check(
      student,
      video.some((v) => v.w > 0 && v.ready >= 2),
      "student receives the teacher's camera",
      JSON.stringify(video)
    )

    // 4. People lists, both ways.
    const tp = await people(teacher)
    await check(
      teacher,
      tp.n >= 1 && tp.lines.length > 0,
      "teacher sees the student in the people list",
      `${tp.n}: ${tp.lines.join(" | ").slice(0, 120)}${tp.missing ? " (people button missing)" : ""}`
    )
    // The people list is the host's tool by design (ParticipantsPanel returns null without
    // canModerate), so the student side of "see each other" is the teacher's name on the stage.
    const tName = teacher.displayName
    const seen = tName
      ? await student.page
          .getByText(tName)
          .first()
          .isVisible()
          .catch(() => false)
      : false
    await check(
      student,
      seen,
      "student sees the teacher on the stage by name",
      tName ?? "no session name"
    )
    const sp = { lines: [] }
    const leaked = [...tp.lines, ...sp.lines].filter(
      (n) => /^\d{5,}$/.test(n) || n.includes("@")
    )
    await check(
      teacher,
      leaked.length === 0,
      "people are listed by name, not by login code or address",
      leaked.join(" | ")
    )

    // 5. Hand.
    await wake(student.page)
    await student.page
      .getByRole("button", { name: L.hand })
      .first()
      .click({ timeout: 10000 })
      .catch(() => {})
    const toast = await teacher.page
      .getByText(L.handToast)
      .first()
      .waitFor({ timeout: 10000 })
      .then(() => true)
      .catch(() => false)
    await check(teacher, toast, "teacher sees the raised hand")

    // 6. Chat: student sends, teacher receives.
    await wake(student.page)
    await student.page
      .getByRole("button", { name: L.chat })
      .first()
      .click({ timeout: 10000 })
      .catch(() => {})
    const text = `smoke ${Date.now()}`
    const box = student.page
      .locator('textarea, [contenteditable="true"]')
      .last()
    await box.click({ timeout: 10000 }).catch(() => {})
    await student.page.keyboard.type(text)
    // On a phone Enter is a new line; the disc sends.
    await student.page
      .getByRole("button", { name: L.send })
      .last()
      .click({ timeout: 10000 })
      .catch(() => {})
    await wake(teacher.page)
    await teacher.page
      .getByRole("button", { name: L.chat })
      .first()
      .click({ timeout: 10000 })
      .catch(() => {})
    const got = await teacher.page
      .getByText(text)
      .first()
      .waitFor({ timeout: 15000 })
      .then(() => true)
      .catch(() => false)
    await check(teacher, got, "teacher receives the student's chat message")

    if (parent && inRoom.has("parent")) {
      await wake(parent.page)
      await parent.page
        .getByRole("button", { name: L.chat })
        .first()
        .click({ timeout: 10000 })
        .catch(() => {})
      await parent.page.waitForTimeout(800)
      const boxes = await parent.page
        .locator('textarea, [contenteditable="true"]')
        .count()
      const says = await parent.page
        .getByText(L.readOnly)
        .first()
        .isVisible()
        .catch(() => false)
      await check(
        parent,
        boxes === 0 && says,
        "parent seat has no chat box and says it is read-only",
        `composer ${boxes}, notice ${says}`
      )
      const sees = await parent.page
        .getByText(text)
        .first()
        .isVisible()
        .catch(() => false)
      await check(parent, sees, "parent reads the class chat")
    }
  } else {
    await check(
      null,
      false,
      "student and teacher are both in the room",
      [...inRoom].join(",") || "nobody"
    )
  }

  // 7. Everyone leaves cleanly (teacher last).
  for (const s of [student, parent, teacher].filter(
    (x) => x && inRoom.has(x.name)
  ))
    await leaveRoom(s)
} catch (e) {
  await check(seats[0], false, "smoke threw", String(e).slice(0, 300))
  for (const s of seats)
    await s.page
      .screenshot({ path: join(out, `throw-${s.name}.png`) })
      .catch(() => {})
} finally {
  const noise =
    /DataChannel|favicon|ERR_ABORTED|Failed to load resource|ResizeObserver|Notification/i
  const st = seats.find((x) => x.name === "student")
  if (st) {
    try {
      const href = await st.page.$eval('link[rel="manifest"]', (a) => a.href)
      const r = await st.ctx.request.get(href, { timeout: 30000 })
      const body = await r.text()
      let json = true
      try {
        JSON.parse(body)
      } catch {
        json = false
      }
      console.log(
        `INFO  manifest ${href}: ${r.status()} ${r.headers()["content-type"] ?? "?"} first200=${JSON.stringify(body.slice(0, 200))}`
      )
      await check(
        st,
        r.ok() && json,
        "the page's manifest is valid JSON",
        `${r.status()}`
      )
    } catch (e) {
      console.log(`INFO  manifest not checked: ${String(e).slice(0, 100)}`)
    }
  }
  for (const s of seats) {
    const real = s.errors.filter((e) => !noise.test(e))
    await check(
      s,
      real.length === 0,
      `${s.name}: no console errors beyond known noise`,
      real.slice(0, 3).join(" || ")
    )
    await Promise.race([
      s.ctx.close().catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ])
  }
  for (const d of profiles) rmSync(d, { recursive: true, force: true })
  const failed = results.filter((r) => !r.ok)
  console.log(
    `\n${results.length - failed.length}/${results.length} passed in ${since()}`
  )
  if (failed.length) console.log(`screenshots of failures: ${out}`)
  exitCode = failed.length ? 1 : 0
}
process.exit(exitCode)
