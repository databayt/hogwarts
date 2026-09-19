// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Browser-level performance flows. One request at a time — against production
 * this is one careful user, not a load test.
 *
 *   cold         fresh browser + session cookie only → open route
 *   warm         same browser again (HTTP cache, service worker, router cache)
 *   nav          click through the sidebar like a teacher between screens
 *   interaction  click → next paint on safe, non-mutating controls
 *
 *   node performance/playwright/run.mjs --target prod --profile mobile \
 *        --roles admin,teacher --routes /dashboard,/attendance --runs 3
 *
 * Writes <out>/browser-<profile>.json. `pnpm perf:report` turns it into the
 * tables and the budget verdicts.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { chromium, devices } from "@playwright/test"

import {
  arg,
  ensureDir,
  fmtKB,
  fmtMs,
  labRoot,
  list,
  readJson,
} from "../scripts/lib.mjs"
import {
  createNetworkLedger,
  pageProbe,
  readPageMetrics,
  settle,
} from "./collect.mjs"

const lab = readJson(path.join(labRoot, "config/lab.json"))
const targetName = arg("target", "prod")
const target = lab.targets[targetName]
if (!target) throw new Error(`unknown target "${targetName}"`)
const profileName = arg("profile", "mobile")
const profile = lab.profiles[profileName]
if (!profile) throw new Error(`unknown profile "${profileName}"`)

const locale = arg("locale", lab.locale)
const runs = Number(arg("runs", "3"))
const roles = list(arg("roles")) ?? Object.keys(lab.roles)
const onlyRoutes = list(arg("routes"))
const flows = new Set(list(arg("flows")) ?? ["cold", "warm", "nav", "interaction"])
const outDir = ensureDir(
  path.resolve(arg("out") || path.join(labRoot, "reports/latest"))
)
const password = process.env.PERF_PASSWORD || "1234" // the documented demo password
// Try a service-worker change against a deployed site before shipping it: the
// worker script is answered from this local file, everything else is real.
const swOverride = arg("sw-override") ? path.resolve(arg("sw-override")) : null
const headed = arg("headed") === "true"
const origin = target.tenantOrigin
const url = (p) => `${origin}/${locale}${p === "/" ? "" : p}`

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

const result = {
  meta: {
    target: targetName,
    origin,
    profile: profileName,
    profileSpec: profile,
    tag: arg("tag") ?? null,
    swOverride: swOverride ? path.relative(process.cwd(), swOverride) : null,
    locale,
    runs,
    startedAt: new Date().toISOString(),
    host: `${os.type()} ${os.arch()} ${os.cpus()[0]?.model ?? ""}`.trim(),
  },
  login: [],
  pages: [],
  navigations: [],
  interactions: [],
  errors: [],
}

// Where this run is measured FROM. Every production number is relative to it.
if (origin.startsWith("https://")) {
  try {
    const trace = await (await fetch(`${target.marketingOrigin}/cdn-cgi/trace`)).text()
    const pick = (k) => new RegExp(`^${k}=(.*)$`, "m").exec(trace)?.[1] ?? null
    result.meta.vantage = { colo: pick("colo"), country: pick("loc"), http: pick("http") }
  } catch {}
}

const browser = await chromium.launch({ headless: !headed })
result.meta.chromium = browser.version()

async function newSession({ storageState } = {}) {
  const context = await browser.newContext({
    ...(profile.device ? devices[profile.device] : { viewport: { width: 1440, height: 900 } }),
    locale: locale === "ar" ? "ar-SA" : "en-US",
    serviceWorkers: "allow",
    storageState,
    ignoreHTTPSErrors: true,
  })
  await context.addInitScript(pageProbe)
  if (swOverride) {
    await context.route("**/service-worker.js", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/javascript; charset=utf-8",
        headers: { "cache-control": "no-store" },
        body: fs.readFileSync(swOverride, "utf8"),
      })
    )
  }
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  await cdp.send("Network.enable")
  if (profile.network) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.network.latencyMs,
      downloadThroughput: (profile.network.downKbps * 1024) / 8,
      uploadThroughput: (profile.network.upKbps * 1024) / 8,
    })
  }
  if (profile.cpuSlowdown > 1)
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuSlowdown })
  const ledger = createNetworkLedger(cdp)
  return { context, page, ledger }
}

async function measureLoad(page, ledger, to) {
  ledger.mark()
  const started = Date.now()
  const response = await page.goto(to, { waitUntil: "commit", timeout: lab.settle.capMs })
  await settle(page, lab.settle)
  const metrics = await readPageMetrics(page)
  // Which service worker (if any) answered: its cache names carry its version.
  const swCaches = await page
    .evaluate(async () => (navigator.serviceWorker?.controller ? (await caches.keys()).filter((n) => n.includes("-static-")) : []))
    .catch(() => [])
  return {
    swCaches,
    status: response?.status() ?? null,
    finalUrl: page.url().replace(origin, ""),
    wallMs: Date.now() - started,
    metrics,
    net: ledger.summary(origin),
  }
}

/** The demo tenant opens on a role picker; the typed form is one click away. */
async function signIn(page, identifier) {
  const field = page.locator('input[name="identifier"]')
  if (!(await field.isVisible().catch(() => false))) {
    await page
      .getByRole("button", { name: /email|البريد/i })
      .last()
      .click({ timeout: 15_000 })
  }
  await field.waitFor({ state: "visible", timeout: 15_000 })
  await field.fill(identifier)
  await page.locator('input[name="password"]').fill(password)
  const clickedAt = Date.now()
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: lab.settle.capMs })
  // A local .env that builds tenant URLs on a production root sends the browser
  // off to that host after sign-in. The session cookie is set on THIS origin, so
  // the run can continue; there is just no landing page here to time.
  if (new URL(page.url()).origin !== origin)
    return { toFirstPaintMs: null, toLcpMs: null, toNavigationStartMs: null, landedOffOrigin: page.url() }
  await settle(page, lab.settle)
  // Click → the landing page's LCP, on the wall clock. NOT "now - clickedAt":
  // settle() ends with a deliberate quiet window that the user never waits for.
  const landing = await page.evaluate(() => ({
    origin: performance.timeOrigin,
    lcp: window.__perf?.lcp ?? null,
    fcp: window.__perf?.fcp ?? null,
  }))
  return {
    toFirstPaintMs: landing.fcp == null ? null : Math.round(landing.origin + landing.fcp - clickedAt),
    toLcpMs: landing.lcp == null ? null : Math.round(landing.origin + landing.lcp - clickedAt),
    // Until the dashboard document even starts: the sign-in action + redirect.
    toNavigationStartMs: Math.round(landing.origin - clickedAt),
  }
}

const closeOverlays = async (page) => {
  // The first authenticated page opens a tour dialog that swallows clicks.
  await page.keyboard.press("Escape").catch(() => {})
  await page.waitForTimeout(150)
}

for (const role of roles) {
  const account = lab.roles[role]
  if (!account) {
    result.errors.push(`unknown role ${role}`)
    continue
  }
  const routes = (lab.routes[role] ?? []).filter((r) => !onlyRoutes || onlyRoutes.includes(r))
  const statePath = path.join(os.tmpdir(), `hogwarts-perf-${targetName}-${role}.json`)

  for (let run = 1; run <= runs; run++) {
    // ---- the first screen anyone sees, then sign in ------------------------
    try {
      const s = await newSession()
      const loginPage = await measureLoad(s.page, s.ledger, url("/login"))
      const signedIn = await signIn(s.page, account.identifier)
      const submitToDashboardMs = signedIn.toLcpMs
      await closeOverlays(s.page)
      await s.context.storageState({ path: statePath })
      result.login.push({ role, run, loginPage, submitToDashboardMs, signIn: signedIn, landedOn: s.page.url().replace(origin, "") })
      log(`${role} #${run} login: LCP ${fmtMs(loginPage.metrics.lcp)} · HTML ${fmtKB(loginPage.metrics.htmlTransfer)} · submit→dashboard LCP ${fmtMs(submitToDashboardMs)} (action+redirect ${fmtMs(signedIn.toNavigationStartMs)})`)
      await s.context.close()
    } catch (e) {
      result.errors.push(`${role} #${run} login: ${e.message.split("\n")[0]}`)
      log(`${role} #${run} login FAILED: ${e.message.split("\n")[0]}`)
      continue
    }

    // ---- cold, then warm, per route ------------------------------------------
    if (flows.has("cold") || flows.has("warm")) {
      for (const route of routes) {
        const s = await newSession({ storageState: statePath })
        try {
          const cold = await measureLoad(s.page, s.ledger, url(route))
          if (flows.has("cold")) result.pages.push({ role, route, mode: "cold", run, ...cold })
          log(`${role} #${run} ${route} cold: TTFB ${fmtMs(cold.metrics.ttfb)} LCP ${fmtMs(cold.metrics.lcp)} TBT ${fmtMs(cold.metrics.tbt)} · ${cold.net.requests} req ${fmtKB(cold.net.transfer)} (HTML ${fmtKB(cold.metrics.htmlTransfer)}, JS ${fmtKB(cold.net.byType.script?.transfer)})`)
          if (flows.has("warm")) {
            await closeOverlays(s.page)
            await s.page.waitForTimeout(1500) // let the service worker take control
            const warm = await measureLoad(s.page, s.ledger, url(route))
            result.pages.push({ role, route, mode: "warm", run, ...warm })
            log(`${role} #${run} ${route} warm: TTFB ${fmtMs(warm.metrics.ttfb)} LCP ${fmtMs(warm.metrics.lcp)} TBT ${fmtMs(warm.metrics.tbt)} · ${warm.net.networkRequests} network req ${fmtKB(warm.net.transfer)}`)
          }
        } catch (e) {
          result.errors.push(`${role} #${run} ${route}: ${e.message.split("\n")[0]}`)
          log(`${role} #${run} ${route} FAILED: ${e.message.split("\n")[0]}`)
        }
        await s.context.close()
      }
    }

    // ---- soft navigation: click through the app -------------------------------
    const trail = (lab.navigation[role] ?? []).filter(Boolean)
    if (flows.has("nav") && trail.length > 1) {
      const s = await newSession({ storageState: statePath })
      try {
        await measureLoad(s.page, s.ledger, url(trail[0]))
        await closeOverlays(s.page)
        await s.page.waitForTimeout(2500) // viewport prefetches land, as they would for a person
        for (let i = 1; i < trail.length; i++) {
          const from = trail[i - 1]
          const to = trail[i]
          const href = `/${locale}${to}`
          const link = s.page.locator(`a[href="${href}"]`).first()
          let viaSheet = false
          if (!(await link.isVisible().catch(() => false))) {
            // Phone layout: the sidebar is a sheet that is not mounted until it
            // is opened. Open it the way a thumb would, THEN start the clock —
            // the measured tap is the one on the link.
            // Desktop-narrow: the shadcn sidebar trigger. Phone: the header's
            // "menu" popover (the sidebar trigger exists there but is hidden).
            const candidates = [
              s.page.locator('[data-slot="sidebar-trigger"], [data-sidebar="trigger"]').first(),
              s.page.locator('button[aria-haspopup="dialog"]').filter({ hasText: /menu|القائمة/i }).first(),
            ]
            let trigger = null
            for (const c of candidates) if (await c.isVisible().catch(() => false)) { trigger = c; break }
            if (trigger) {
              await trigger.click()
              await link.waitFor({ state: "visible", timeout: 5000 }).catch(() => {})
              await s.page.waitForTimeout(400) // the sheet's own slide-in is not part of the navigation
              viaSheet = true
            }
          }
          s.ledger.mark()
          await s.page.evaluate(() => window.__armNav())
          let synthetic = false
          if (await link.isVisible().catch(() => false)) await link.click()
          else {
            // Still not visible: if the anchor is in the DOM at all, a DOM click
            // drives the same Link handler.
            synthetic = true
            const found = await s.page.evaluate((h) => {
              const a = document.querySelector(`a[href="${h}"]`)
              if (!a) return false
              window.__nav.t0 = performance.now()
              a.click()
              return true
            }, href)
            if (!found) throw new Error(`no link to ${href} on ${from}`)
          }
          const started = Date.now()
          let state
          while (Date.now() - started < lab.settle.capMs) {
            state = await s.page.evaluate(() => ({
              ...window.__nav,
              now: performance.now(),
              path: location.pathname,
              skeletons: document.querySelectorAll('[data-slot="skeleton"], .animate-pulse').length,
            }))
            const quiet = state.lastMutation != null && state.now - state.lastMutation >= lab.settle.navQuietMs
            if (quiet && state.path === href && state.skeletons === 0) break
            await s.page.waitForTimeout(100)
          }
          const rel = (t) => (t == null || state.t0 == null ? null : Math.round(t - state.t0))
          const nav = {
            role, from, to, run, synthetic, viaSheet,
            visualResponseMs: rel(state.firstFrame ?? state.firstMutation),
            urlChangeMs: rel(state.urlChanged),
            settledMs: rel(state.lastMutation),
            arrived: state.path === href,
            skeletonsLeft: state.skeletons,
            net: s.ledger.summary(origin),
          }
          result.navigations.push(nav)
          log(`${role} #${run} nav ${from} → ${to}: response ${fmtMs(nav.visualResponseMs)} · url ${fmtMs(nav.urlChangeMs)} · settled ${fmtMs(nav.settledMs)} · ${nav.net.networkRequests} req ${fmtKB(nav.net.transfer)}`)
          await s.page.waitForTimeout(1200)
        }
      } catch (e) {
        result.errors.push(`${role} #${run} nav: ${e.message.split("\n")[0]}`)
        log(`${role} #${run} nav FAILED: ${e.message.split("\n")[0]}`)
      }
      await s.context.close()
    }

    // ---- interaction: click → next paint on controls that change nothing ---------
    if (flows.has("interaction")) {
      const s = await newSession({ storageState: statePath })
      try {
        await measureLoad(s.page, s.ledger, url("/dashboard"))
        await closeOverlays(s.page)
        const controls = s.page.locator(
          '[data-slot="sidebar-trigger"], header [aria-haspopup="menu"], header [aria-haspopup="dialog"]'
        )
        const count = Math.min(await controls.count(), 4)
        for (let i = 0; i < count; i++) {
          const control = controls.nth(i)
          if (!(await control.isVisible().catch(() => false))) continue
          const label =
            (await control.getAttribute("aria-label")) ||
            (await control.getAttribute("data-slot")) ||
            `control-${i}`
          await s.page.evaluate(() => (window.__perf.interactions = []))
          await control.click({ timeout: 5000 })
          await s.page.waitForTimeout(700)
          const entries = await s.page.evaluate(() => window.__perf.interactions)
          const worst = entries.sort((a, b) => b.duration - a.duration)[0]
          if (worst) {
            result.interactions.push({ role, route: "/dashboard", control: label, run, ...worst })
            log(`${role} #${run} interaction "${label}": ${fmtMs(worst.duration)} (input delay ${fmtMs(worst.inputDelay)}, handlers ${fmtMs(worst.processing)})`)
          }
          await s.page.keyboard.press("Escape").catch(() => {})
          await s.page.waitForTimeout(300)
        }
      } catch (e) {
        result.errors.push(`${role} #${run} interaction: ${e.message.split("\n")[0]}`)
      }
      await s.context.close()
    }
  }
  fs.rmSync(statePath, { force: true }) // a live session cookie — never leave it behind
}

await browser.close()
result.meta.finishedAt = new Date().toISOString()
const file = path.join(outDir, `browser-${profileName}${arg("tag") ? "-" + arg("tag") : ""}.json`)
fs.writeFileSync(file, JSON.stringify(result, null, 2))
console.log(`\n${result.pages.length} page loads · ${result.navigations.length} navigations · ${result.interactions.length} interactions · ${result.errors.length} errors`)
console.log(`→ ${path.relative(process.cwd(), file)}`)
