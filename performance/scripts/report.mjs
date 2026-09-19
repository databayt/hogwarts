// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Turn a run directory (bundle.json, probe.json, browser-*.json — whichever
 * exist) into summary.json + REPORT.md, judge it against the budgets, and
 * compare it with the committed baseline.
 *
 *   node performance/scripts/report.mjs --run performance/reports/latest
 *   node performance/scripts/report.mjs --run <dir> --check         # exit 1 on a regression or a banned library
 *   node performance/scripts/report.mjs --run <dir> --save-baseline # promote this run to performance/baseline.json
 */
import fs from "node:fs"
import path from "node:path"

import { arg, fmtKB, fmtMs, labRoot, mdTable, median, readJson } from "./lib.mjs"

const runDir = path.resolve(arg("run") || path.join(labRoot, "reports/latest"))
const check = arg("check") === "true"
const saveBaseline = arg("save-baseline") === "true"
const budgets = readJson(path.join(labRoot, "config/budgets.json"))
const baselineFile = path.join(labRoot, "baseline.json")
const baseline = fs.existsSync(baselineFile) ? readJson(baselineFile) : null

const load = (name) => {
  const f = path.join(runDir, name)
  return fs.existsSync(f) ? readJson(f) : null
}
const bundle = load("bundle.json")
const probe = load("probe.json")
// One section per file, keyed by what follows `browser-`: `mobile`, `none`,
// `none-login`, `none-v8`… so a tagged run never overwrites a plain one.
const browsers = fs
  .readdirSync(runDir)
  .filter((f) => /^browser-.+\.json$/.test(f))
  .sort()
  .map((f) => ({ ...readJson(path.join(runDir, f)), key: f.slice(8, -5) }))

const kb = (b) => (b == null ? null : Math.round(b / 102.4) / 10)
const verdict = (value, budget, lowerIsBetter = true) => {
  if (value == null || !budget) return "—"
  const worse = (limit) => (lowerIsBetter ? value > limit : value < limit)
  return worse(budget.fail) ? "FAIL" : worse(budget.warn) ? "WARN" : worse(budget.target) ? "ok" : "PASS"
}

// ---- summarise ----------------------------------------------------------------
const summary = {
  generatedAt: new Date().toISOString(),
  run: path.basename(runDir),
  buildId: bundle?.buildId ?? null,
  vantage: browsers[0]?.meta.vantage ?? probe?.vantage ?? null,
  static: {},
  pages: {},
  navigation: {},
  interaction: {},
  login: {},
  database: probe?.database ?? null,
  latency: probe?.latency ?? null,
  payloads: probe?.payloads ?? null,
}

if (bundle) {
  for (const r of bundle.trackedRoutes) {
    summary.static[r.path] = {
      jsFiles: r.js.files,
      initialJsGzipKB: kb(r.js.gzip),
      initialCssGzipKB: kb(r.css.gzip),
      libs: r.libs,
    }
  }
}

const med = (rows, pick) => median(rows.map(pick).filter((v) => v != null))
for (const b of browsers) {
  const profile = b.key
  const groups = new Map()
  for (const p of b.pages) {
    const key = `${p.role} ${p.route} ${p.mode}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(p)
  }
  summary.pages[profile] = {}
  for (const [key, rows] of groups) {
    summary.pages[profile][key] = {
      runs: rows.length,
      ttfbMs: Math.round(med(rows, (r) => r.metrics.ttfb)),
      docWaitMs: Math.round(med(rows, (r) => r.metrics.serverWait)),
      fcpMs: Math.round(med(rows, (r) => r.metrics.fcp)),
      lcpMs: Math.round(med(rows, (r) => r.metrics.lcp)),
      cls: Math.round(med(rows, (r) => r.metrics.cls) * 1000) / 1000,
      tbtMs: Math.round(med(rows, (r) => r.metrics.tbt)),
      requests: med(rows, (r) => r.net.requests),
      networkRequests: med(rows, (r) => r.net.networkRequests),
      transferKB: kb(med(rows, (r) => r.net.transfer)),
      htmlTransferKB: kb(med(rows, (r) => r.net.byType.document?.transfer)),
      htmlDecodedKB: kb(med(rows, (r) => r.metrics.htmlDecoded)),
      flightKB: kb(med(rows, (r) => r.metrics.flightBytes)),
      jsTransferKB: kb(med(rows, (r) => r.net.byType.script?.transfer ?? 0)),
      fontTransferKB: kb(med(rows, (r) => r.net.byType.font?.transfer ?? 0)),
      prefetches: med(rows, (r) => r.net.byType.rscPrefetch?.requests ?? 0),
      serverActions: med(rows, (r) => r.net.byType.serverAction?.requests ?? 0),
      lcpElement: rows[0].metrics.lcpElement,
    }
  }

  const navGroups = new Map()
  for (const n of b.navigations) {
    const key = `${n.role} ${n.from} → ${n.to}`
    if (!navGroups.has(key)) navGroups.set(key, [])
    navGroups.get(key).push(n)
  }
  summary.navigation[profile] = {}
  for (const [key, rows] of navGroups) {
    summary.navigation[profile][key] = {
      runs: rows.length,
      visualResponseMs: med(rows, (r) => r.visualResponseMs),
      urlChangeMs: med(rows, (r) => r.urlChangeMs),
      settledMs: med(rows, (r) => r.settledMs),
      transferKB: kb(med(rows, (r) => r.net.transfer)),
      rscWaitMs: med(rows, (r) => r.net.dynamicWaits.find((w) => w.type === "rsc")?.wait ?? null),
      arrived: rows.every((r) => r.arrived),
    }
  }

  const durations = b.interactions.map((i) => i.duration)
  summary.interaction[profile] = {
    samples: durations.length,
    medianMs: median(durations),
    worstMs: durations.length ? Math.max(...durations) : null,
  }

  if (b.login.length === 0) continue
  // `submitToDashboardMs` without the `signIn` detail is the pre-fix wall-clock
  // figure that included the settle window; it is not reported.
  const timedLogins = b.login.filter((l) => l.signIn)
  summary.login[profile] = {
    runs: b.login.length,
    lcpMs: Math.round(med(b.login, (l) => l.loginPage.metrics.lcp)),
    ttfbMs: Math.round(med(b.login, (l) => l.loginPage.metrics.ttfb)),
    tbtMs: Math.round(med(b.login, (l) => l.loginPage.metrics.tbt)),
    htmlTransferKB: kb(med(b.login, (l) => l.loginPage.net.byType.document?.transfer)),
    htmlDecodedKB: kb(med(b.login, (l) => l.loginPage.metrics.htmlDecoded)),
    flightKB: kb(med(b.login, (l) => l.loginPage.metrics.flightBytes)),
    jsTransferKB: kb(med(b.login, (l) => l.loginPage.net.byType.script?.transfer ?? 0)),
    transferKB: kb(med(b.login, (l) => l.loginPage.net.transfer)),
    requests: med(b.login, (l) => l.loginPage.net.requests),
    submitToDashboardMs: timedLogins.length
      ? Math.round(med(timedLogins, (l) => l.signIn.toLcpMs))
      : null,
    signInActionMs: timedLogins.length
      ? Math.round(med(timedLogins, (l) => l.signIn.toNavigationStartMs))
      : null,
  }
}

// ---- judge ------------------------------------------------------------------------
const problems = [] // what --check fails on
const notes = []

if (bundle) {
  const banned = budgets.static.bannedInInitialJs
  for (const r of bundle.allRoutes) {
    for (const lib of r.libs) {
      const rule = banned[lib]
      if (rule && !rule.except.includes(r.path))
        notes.push({ kind: "banned", route: r.path, lib })
    }
  }
}

function compare(label, now, then, tolerancePct, minDelta = 0) {
  if (now == null || then == null) return null
  const delta = now - then
  const pct = then === 0 ? 0 : (delta / then) * 100
  const regressed = delta > minDelta && pct > tolerancePct
  if (regressed) problems.push(`${label}: ${then} → ${now} (+${pct.toFixed(0)}%)`)
  return { then, now, pct, regressed }
}
const diffs = []
if (baseline) {
  const tol = budgets.regression
  for (const [route, s] of Object.entries(summary.static)) {
    const old = baseline.static?.[route]
    if (!old) continue
    const d = compare(`${route} initial JS (gzip KB)`, s.initialJsGzipKB, old.initialJsGzipKB, tol.bytesTolerancePct, tol.minBytesDeltaKB)
    if (d) diffs.push({ what: `${route} initial JS`, unit: "KB", ...d })
    const c = compare(`${route} initial CSS (gzip KB)`, s.initialCssGzipKB, old.initialCssGzipKB, tol.bytesTolerancePct, tol.minBytesDeltaKB)
    if (c && c.then !== c.now) diffs.push({ what: `${route} initial CSS`, unit: "KB", ...c })
    const before = new Set(old.libs ?? [])
    for (const lib of s.libs) if (!before.has(lib) && budgets.static.bannedInInitialJs[lib]) problems.push(`${route}: ${lib} entered the initial JS`)
  }
  for (const [profile, pages] of Object.entries(summary.pages)) {
    for (const [key, s] of Object.entries(pages)) {
      const old = baseline.pages?.[profile]?.[key]
      if (!old) continue
      for (const [metric, unit, tolerance] of [
        ["htmlDecodedKB", "KB", tol.bytesTolerancePct],
        ["transferKB", "KB", tol.bytesTolerancePct * 2],
        ["lcpMs", "ms", tol.timingTolerancePct],
        ["ttfbMs", "ms", tol.timingTolerancePct],
      ]) {
        const before = problems.length
        const d = compare(`${profile} ${key} ${metric}`, s[metric], old[metric], tolerance, unit === "KB" ? tol.minBytesDeltaKB : 100)
        // Lab timings from a laptop are advisory: report them, do not gate on them.
        if (unit === "ms" && problems.length > before) notes.push({ kind: "timing", text: problems.pop() })
        if (d && Math.abs(d.pct) >= 3) diffs.push({ what: `${profile} · ${key} · ${metric}`, unit, ...d })
      }
    }
  }
}

fs.writeFileSync(path.join(runDir, "summary.json"), JSON.stringify(summary, null, 2))
if (saveBaseline) {
  fs.writeFileSync(baselineFile, JSON.stringify(summary, null, 2) + "\n")
  console.log(`baseline ← ${summary.run}`)
}

// ---- markdown ------------------------------------------------------------------------
const md = []
const v = summary.vantage
md.push(`# Performance report — ${summary.run}`)
md.push(
  `Build \`${summary.buildId ?? "unknown"}\`${v ? ` · measured from **${v.country}** through Cloudflare **${v.colo}**` : ""}. ` +
    `Timings are lab medians from one vantage point, not field data; bytes are exact.`
)

if (summary.latency) {
  md.push(`## Where the time goes before the browser`)
  md.push(mdTable(["tier", "n", "min", "p50", "p95"], summary.latency.map((l) => [l.name, l.samples, fmtMs(l.min), fmtMs(l.p50), fmtMs(l.p95)])))
  const d = summary.database
  md.push(
    `**Database round trip** (container → Neon, \`SELECT 1\` on a warm pool): min ${fmtMs(d.min)} · p50 ${fmtMs(d.p50)} · p95 ${fmtMs(d.p95)} · p99 ${fmtMs(d.p99)} — ` +
      `p50 ${verdict(d.p50, budgets.database.roundTripP50Ms)}, p95 ${verdict(d.p95, budgets.database.roundTripP95Ms)}.`
  )
}
if (summary.payloads?.length) {
  md.push(`## Public first screens — document payload`)
  md.push(mdTable(["url", "on the wire", "HTML", "RSC flight data", "share of HTML", "encoding"], summary.payloads.map((p) => [p.url, fmtKB(p.wireBytes), fmtKB(p.htmlBytes), fmtKB(p.flightBytes), `${Math.round(p.flightShare * 100)}%`, p.encoding])))
}

for (const [profile, login] of Object.entries(summary.login)) {
  md.push(`## Sign-in — profile \`${profile}\``)
  md.push(mdTable(["LCP", "TTFB", "TBT", "HTML (wire)", "HTML (decoded)", "flight data", "JS", "total", "requests", "sign-in action + redirect", "submit → dashboard LCP"], [[fmtMs(login.lcpMs), fmtMs(login.ttfbMs), fmtMs(login.tbtMs), `${login.htmlTransferKB} KB`, `${login.htmlDecodedKB} KB`, `${login.flightKB} KB`, `${login.jsTransferKB} KB`, `${login.transferKB} KB`, login.requests, fmtMs(login.signInActionMs), fmtMs(login.submitToDashboardMs)]]))
}

for (const [profile, pages] of Object.entries(summary.pages)) {
  if (!Object.keys(pages).length) continue
  const lab = budgets.lab[profile] ?? budgets.lab[profile.split("-")[0]] ?? budgets.lab.mobile
  md.push(`## Page loads — profile \`${profile}\``)
  md.push(
    mdTable(
      ["role · route · mode", "TTFB", "doc wait", "LCP", "CLS", "TBT", "req", "total", "HTML wire", "HTML decoded", "flight", "JS", "prefetch", "LCP verdict"],
      Object.entries(pages).map(([key, s]) => [key, fmtMs(s.ttfbMs), fmtMs(s.docWaitMs), fmtMs(s.lcpMs), s.cls, fmtMs(s.tbtMs), s.requests, `${s.transferKB} KB`, `${s.htmlTransferKB} KB`, `${s.htmlDecodedKB} KB`, `${s.flightKB} KB`, `${s.jsTransferKB} KB`, s.prefetches, verdict(s.lcpMs, lab.lcpMs)])
    )
  )
}
for (const [profile, navs] of Object.entries(summary.navigation)) {
  if (!Object.keys(navs).length) continue
  md.push(`## Navigation (click in the sidebar) — profile \`${profile}\``)
  md.push(
    mdTable(
      ["role · from → to", "visual response", "URL change", "settled", "RSC wait", "transfer", "response verdict", "settled verdict"],
      Object.entries(navs).map(([key, s]) => [key, fmtMs(s.visualResponseMs), fmtMs(s.urlChangeMs), fmtMs(s.settledMs), fmtMs(s.rscWaitMs), `${s.transferKB} KB`, verdict(s.visualResponseMs, budgets.navigation.visualResponseMs), verdict(s.settledMs, budgets.navigation.settledMs)])
    )
  )
  const i = summary.interaction[profile]
  if (i?.samples) md.push(`**Interaction** (click → next paint, ${i.samples} samples): median ${fmtMs(i.medianMs)}, worst ${fmtMs(i.worstMs)} — ${verdict(i.medianMs, budgets.interaction.durationMs)}.`)
}

if (bundle) {
  md.push(`## Initial JavaScript per tracked route (static, gzip)`)
  md.push(
    mdTable(
      ["route", "files", "JS", "CSS", "verdict", "heavy libraries loaded before hydration"],
      Object.entries(summary.static)
        .sort((a, b) => b[1].initialJsGzipKB - a[1].initialJsGzipKB)
        .map(([route, s]) => [route, s.jsFiles, `${s.initialJsGzipKB} KB`, `${s.initialCssGzipKB} KB`, verdict(s.initialJsGzipKB, { ...budgets.static.default.initialJsGzipKB, ...(budgets.static.routes[route]?.initialJsGzipKB ?? {}) }), s.libs.join(", ") || "—"])
    )
  )
  const banned = notes.filter((n) => n.kind === "banned")
  if (banned.length) {
    const byLib = new Map()
    for (const n of banned) byLib.set(n.lib, [...(byLib.get(n.lib) ?? []), n.route])
    md.push(`### Libraries in initial JS that serve a click, not a render`)
    md.push(mdTable(["library", "routes", "examples"], [...byLib].map(([lib, routes]) => [lib, routes.length, routes.slice(0, 6).join(" ")])))
  }
}

if (baseline) {
  md.push(`## Against the baseline (${baseline.run})`)
  md.push(
    diffs.length
      ? mdTable(["metric", "baseline", "now", "change", ""], diffs.sort((a, b) => a.pct - b.pct).map((d) => [d.what, `${d.then} ${d.unit}`, `${d.now} ${d.unit}`, `${d.pct > 0 ? "+" : ""}${d.pct.toFixed(0)}%`, d.regressed ? "REGRESSION" : d.pct < -3 ? "improved" : ""]))
      : "No metric moved by 3% or more."
  )
}
if (problems.length) md.push(`## Regressions\n${problems.map((p) => `- ${p}`).join("\n")}`)

fs.writeFileSync(path.join(runDir, "REPORT.md"), md.join("\n\n") + "\n")
console.log(`→ ${path.relative(process.cwd(), path.join(runDir, "REPORT.md"))}`)
console.log(`→ ${path.relative(process.cwd(), path.join(runDir, "summary.json"))}`)
if (problems.length) {
  console.log(`\n${problems.length} regression(s):\n${problems.map((p) => `  ✗ ${p}`).join("\n")}`)
  if (check) process.exit(1)
} else if (check) console.log(baseline ? "\nNo regressions against the baseline." : "\nNo baseline yet — nothing to compare.")
