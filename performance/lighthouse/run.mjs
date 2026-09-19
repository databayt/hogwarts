// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Lighthouse, as ONE instrument among several — used here for what it is good
 * at: main-thread cost (TBT, bootup, unused JavaScript) under its simulated
 * mid-range phone. It is not the goal and its score is not reported as one.
 *
 * No dependency is added for it: Lighthouse runs through `pnpm dlx` against
 * the Chromium that Playwright already installed, and signed-in routes get
 * their session from a Playwright login, passed as a Cookie header.
 *
 *   pnpm perf:lighthouse                                   # public first screens
 *   pnpm perf:lighthouse -- --target prod --role teacher --routes /dashboard,/attendance
 *   pnpm perf:lighthouse -- --runs 5
 *
 * For CI on public URLs use the assertions in ./lighthouserc.cjs:
 *   pnpm dlx @lhci/cli autorun --config=performance/lighthouse/lighthouserc.cjs
 */
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import { chromium } from "@playwright/test"

import { arg, ensureDir, fmtKB, fmtMs, labRoot, list, readJson, table } from "../scripts/lib.mjs"

const lab = readJson(path.join(labRoot, "config/lab.json"))
const targetName = arg("target", "prod")
const target = lab.targets[targetName]
const locale = arg("locale", lab.locale)
const runs = Number(arg("runs", "3"))
const role = arg("role")
const routes = list(arg("routes"))
const outDir = ensureDir(path.resolve(arg("out") || path.join(labRoot, "reports/latest")))
const work = fs.mkdtempSync(path.join(os.tmpdir(), "hogwarts-lh-"))

const urls = []
if (role) {
  for (const r of routes ?? lab.routes[role] ?? []) urls.push({ label: `${role} ${r}`, url: `${target.tenantOrigin}/${locale}${r}` })
} else {
  for (const r of lab.publicRoutes) {
    const origin = r.origin === "tenant" ? target.tenantOrigin : target.marketingOrigin
    urls.push({ label: r.path === "/" ? "home" : r.path, url: `${origin}/${locale}${r.path === "/" ? "" : r.path}` })
  }
}

// ---- a session for signed-in routes ---------------------------------------------
let headersFile = null
if (role) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await context.newPage()
  await page.goto(`${target.tenantOrigin}/${locale}/login`, { waitUntil: "load", timeout: 120_000 })
  const field = page.locator('input[name="identifier"]')
  if (!(await field.isVisible().catch(() => false)))
    await page.getByRole("button", { name: /email|البريد/i }).last().click()
  await field.fill(lab.roles[role].identifier)
  await page.locator('input[name="password"]').fill(process.env.PERF_PASSWORD || "1234")
  await page.locator('form button[type="submit"]').first().click()
  await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 120_000 })
  const cookies = await context.cookies(target.tenantOrigin)
  await browser.close()
  headersFile = path.join(work, "headers.json")
  fs.writeFileSync(headersFile, JSON.stringify({ Cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") }))
}

const audit = (lhr, id) => lhr.audits[id]?.numericValue ?? null
const results = []
for (const { label, url } of urls) {
  const samples = []
  for (let i = 1; i <= runs; i++) {
    const out = path.join(work, `lhr-${results.length}-${i}.json`)
    const run = spawnSync(
      "pnpm",
      [
        "dlx", "lighthouse@12", url,
        "--quiet", "--output=json", `--output-path=${out}`,
        "--only-categories=performance",
        '--chrome-flags=--headless=new --no-sandbox --ignore-certificate-errors',
        ...(headersFile ? [`--extra-headers=${headersFile}`] : []),
      ],
      { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, encoding: "utf8" }
    )
    if (run.status !== 0 || !fs.existsSync(out)) {
      console.warn(`${label} run ${i} failed: ${(run.stderr || "").split("\n").slice(-3).join(" ")}`)
      continue
    }
    const lhr = readJson(out)
    samples.push({
      score: Math.round((lhr.categories.performance.score ?? 0) * 100),
      fcp: audit(lhr, "first-contentful-paint"),
      lcp: audit(lhr, "largest-contentful-paint"),
      tbt: audit(lhr, "total-blocking-time"),
      cls: audit(lhr, "cumulative-layout-shift"),
      speedIndex: audit(lhr, "speed-index"),
      bootup: audit(lhr, "bootup-time"),
      mainThread: audit(lhr, "mainthread-work-breakdown"),
      bytes: audit(lhr, "total-byte-weight"),
      unusedJs: lhr.audits["unused-javascript"]?.details?.overallSavingsBytes ?? null,
      requests: lhr.audits["network-requests"]?.details?.items?.length ?? null,
      finalUrl: lhr.finalDisplayedUrl,
    })
  }
  if (!samples.length) continue
  // The median run by TBT — the number this instrument is here for.
  const mid = [...samples].sort((a, b) => a.tbt - b.tbt)[Math.floor(samples.length / 2)]
  results.push({ label, url, runs: samples.length, ...mid, signedOut: role ? /\/login/.test(mid.finalUrl ?? "") : false })
}
fs.rmSync(work, { recursive: true, force: true }) // the Cookie header lived here

fs.writeFileSync(path.join(outDir, "lighthouse.json"), JSON.stringify({ generatedAt: new Date().toISOString(), target: targetName, results }, null, 2))
console.log("\nLighthouse (simulated mid-range phone, median run by TBT)\n")
console.log(
  table(
    ["page", "runs", "FCP", "LCP", "TBT", "CLS", "JS bootup", "main thread", "bytes", "unused JS", "req"],
    results.map((r) => [r.signedOut ? `${r.label} (REDIRECTED TO LOGIN)` : r.label, r.runs, fmtMs(r.fcp), fmtMs(r.lcp), fmtMs(r.tbt), r.cls?.toFixed(3), fmtMs(r.bootup), fmtMs(r.mainThread), fmtKB(r.bytes), fmtKB(r.unusedJs), r.requests])
  )
)
console.log(`\n→ ${path.relative(process.cwd(), path.join(outDir, "lighthouse.json"))}`)
