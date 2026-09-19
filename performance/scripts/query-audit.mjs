// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server waterfall audit: how many database round trips does each route cost,
 * and how many of them wait on each other?
 *
 * Production's container is ~90 ms from Neon (see probe.json), so a render's
 * server time is close to  sequential steps × round trip.  Counting the steps
 * locally — where a query takes ~1 ms and the structure is all that shows —
 * predicts that time, and finds the waterfalls worth flattening.
 *
 *   PERF_TRACE=1 pnpm dev > /tmp/hogwarts-trace.log 2>&1      # terminal 1
 *   pnpm perf:queries -- --trace /tmp/hogwarts-trace.log      # terminal 2
 *
 * It signs in, opens each tracked route once, and attributes the traced
 * queries (src/lib/perf-trace.ts) to the route by time window. Per route:
 *
 *   renders   server renders the page load caused (document + prefetches + actions)
 *   queries   across all of them
 *   doc q     queries of the document's own render
 *   steps     of those, how many ran one after another ("waves")
 *   dupes     identical query + identical arguments, repeated in one render
 *   est. ms   steps × production round trip — the floor of the document's TTFB
 */
import fs from "node:fs"
import path from "node:path"

import { chromium } from "@playwright/test"

import { arg, ensureDir, labRoot, list, readJson, table } from "./lib.mjs"

const lab = readJson(path.join(labRoot, "config/lab.json"))
const target = lab.targets[arg("target", "local")]
const traceFile = arg("trace")
if (!traceFile || !fs.existsSync(traceFile)) {
  console.error("Start the app with PERF_TRACE=1 and its output redirected to a file, then pass --trace <file>.")
  process.exit(2)
}
const roles = list(arg("roles")) ?? ["admin", "teacher"]
const locale = arg("locale", lab.locale)
const outDir = ensureDir(path.resolve(arg("out") || path.join(labRoot, "reports/latest")))
const password = process.env.PERF_PASSWORD || "1234"
const probeFile = path.join(outDir, "probe.json")
const rtt = Number(arg("rtt")) || (fs.existsSync(probeFile) ? readJson(probeFile).database?.p50 : null) || 90

const readTrace = () =>
  fs
    .readFileSync(traceFile, "utf8")
    .split("\n")
    .filter((l) => l.startsWith('{"perf":"db"'))
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)

/** Sequential steps: a query that starts after everything before it has ended. */
function waves(queries) {
  let steps = 0
  let busyUntil = -Infinity
  for (const q of [...queries].sort((a, b) => a.t - b.t)) {
    if (q.t >= busyUntil) steps++
    busyUntil = Math.max(busyUntil, q.t + q.ms)
  }
  return steps
}

const browser = await chromium.launch()
const rows = []
for (const role of roles) {
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()
  await page.goto(`${target.tenantOrigin}/${locale}/login`, { waitUntil: "load", timeout: 120_000 })
  const field = page.locator('input[name="identifier"]')
  if (!(await field.isVisible().catch(() => false)))
    await page.getByRole("button", { name: /email|البريد/i }).last().click()
  await field.fill(lab.roles[role].identifier)
  await page.locator('input[name="password"]').fill(password)
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 120_000 })
  await page.waitForLoadState("load")
  await page.waitForTimeout(4000) // let the landing page's own prefetches drain

  for (const route of lab.routes[role] ?? []) {
    const from = Date.now()
    await page.goto(`${target.tenantOrigin}/${locale}${route}`, { waitUntil: "load", timeout: 180_000 }).catch(() => {})
    await page.waitForTimeout(5000) // prefetches + mount-time actions belong to this page load
    const to = Date.now()
    const inWindow = readTrace().filter((q) => q.t >= from && q.t <= to)
    const byRender = new Map()
    for (const q of inWindow) byRender.set(q.req, [...(byRender.get(q.req) ?? []), q])
    // The document's render is the first one to start in the window.
    const renders = [...byRender.values()].sort((a, b) => Math.min(...a.map((q) => q.t)) - Math.min(...b.map((q) => q.t)))
    const doc = renders[0] ?? []
    const seen = new Map()
    for (const q of doc) seen.set(`${q.q}#${q.sig}`, (seen.get(`${q.q}#${q.sig}`) ?? 0) + 1)
    const dupes = [...seen].filter(([, n]) => n > 1)
    const steps = waves(doc)
    rows.push({
      role,
      route,
      renders: renders.length,
      queries: inWindow.length,
      docQueries: doc.length,
      steps,
      dupes: dupes.reduce((n, [, c]) => n + c - 1, 0),
      dupeList: dupes.map(([k, n]) => `${k.split("#")[0]} ×${n}`),
      estimatedServerMs: Math.round(steps * rtt),
      sequence: [...doc].sort((a, b) => a.t - b.t).map((q) => q.q),
    })
    const r = rows[rows.length - 1]
    console.log(`${role} ${route}: ${r.renders} renders · ${r.queries} queries · document ${r.docQueries} in ${r.steps} steps · ${r.dupes} duplicate(s)`)
  }
  await context.close()
}
await browser.close()

fs.writeFileSync(path.join(outDir, "queries.json"), JSON.stringify({ generatedAt: new Date().toISOString(), roundTripMs: rtt, rows }, null, 2))
console.log(`\nServer waterfall — one production round trip ≈ ${rtt} ms\n`)
console.log(
  table(
    ["role", "route", "renders", "queries", "doc q", "steps", "dupes", "est. ms", "repeated in the document render"],
    rows.map((r) => [r.role, r.route, r.renders, r.queries, r.docQueries, r.steps, r.dupes, r.estimatedServerMs, r.dupeList.slice(0, 3).join(", ") || "—"])
  )
)
console.log(`\n→ ${path.relative(process.cwd(), path.join(outDir, "queries.json"))}`)
