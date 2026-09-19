// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Field data: p75 of what real phones measured, from Workers Analytics Engine.
 *
 * The lab says what a page CAN do from one laptop; this says what teachers and
 * parents actually got. Judged against the same targets (config/budgets.json).
 *
 *   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… pnpm perf:rum
 *   pnpm perf:rum -- --days 7 --tenant kingfahd --device phone
 *
 * The token needs "Account Analytics: Read". Data points are written by
 * cf/worker.js (one per metric); columns:
 *   blob1 metric · blob2 route · blob3 role · blob4 locale · blob5 device ·
 *   blob6 connection · blob7 navigation type · blob8 rating · blob9 country ·
 *   blob10 colo · blob11 sw/no-sw · double1 value · index1 tenant
 *
 * Analytics Engine samples at high volume: every aggregate is weighted by
 * `_sample_interval`, and quantiles use quantileExactWeighted (the function
 * the SQL reference documents — there is no plain `quantile`).
 */
import fs from "node:fs"
import path from "node:path"

import { arg, ensureDir, labRoot, mdTable, readJson, table } from "./lib.mjs"

const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_API_TOKEN
if (!account || !token) {
  console.error("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN (Account Analytics: Read).")
  process.exit(2)
}
const days = Number(arg("days", "7"))
const dataset = arg("dataset", "hogwarts_rum")
const minSamples = Number(arg("min-samples", "20"))
const outDir = ensureDir(path.resolve(arg("out") || path.join(labRoot, "reports/latest")))
const budgets = readJson(path.join(labRoot, "config/budgets.json")).lab.mobile

// Filters are interpolated into SQL, so they are restricted to a safe alphabet.
const safe = (v) => (v && /^[A-Za-z0-9_\-/[\]]+$/.test(v) ? v : null)
const where = [`timestamp > NOW() - INTERVAL '${days}' DAY`]
for (const [flag, column] of [["tenant", "index1"], ["device", "blob5"], ["role", "blob3"], ["country", "blob9"], ["route", "blob2"]]) {
  const v = safe(arg(flag))
  if (v) where.push(`${column} = '${v}'`)
}

async function sql(query) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/analytics_engine/sql`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: query,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Analytics Engine ${res.status}: ${text.slice(0, 400)}`)
  return JSON.parse(text).data ?? []
}

const rows = await sql(`
  SELECT
    blob1 AS metric,
    blob2 AS route,
    blob5 AS device,
    sum(_sample_interval) AS samples,
    quantileExactWeighted(0.5)(double1, _sample_interval) AS p50,
    quantileExactWeighted(0.75)(double1, _sample_interval) AS p75,
    quantileExactWeighted(0.95)(double1, _sample_interval) AS p95
  FROM ${dataset}
  WHERE ${where.join(" AND ")}
  GROUP BY metric, route, device
  ORDER BY samples DESC
  LIMIT 2000
`)

const budgetFor = { LCP: budgets.lcpMs, TTFB: budgets.ttfbMs, FCP: budgets.fcpMs, CLS: budgets.cls, INP: { target: 150, warn: 200, fail: 500 }, NAV: { target: 500, warn: 1000, fail: 2500 } }
const verdict = (metric, p75) => {
  const b = budgetFor[metric]
  if (!b || p75 == null) return "—"
  return p75 > b.fail ? "FAIL" : p75 > b.warn ? "WARN" : p75 > b.target ? "ok" : "PASS"
}
const fmt = (metric, v) => (v == null ? "—" : metric === "CLS" ? Number(v).toFixed(3) : `${Math.round(v)} ms`)

const kept = rows.filter((r) => Number(r.samples) >= minSamples)
const report = {
  generatedAt: new Date().toISOString(),
  days,
  filters: where.slice(1),
  rows: kept.map((r) => ({ ...r, samples: Number(r.samples), verdict: verdict(r.metric, Number(r.p75)) })),
  dropped: rows.length - kept.length,
}
fs.writeFileSync(path.join(outDir, "rum.json"), JSON.stringify(report, null, 2))

const head = ["metric", "route", "device", "samples", "p50", "p75", "p95", "p75 verdict"]
const body = report.rows.map((r) => [r.metric, r.route, r.device, r.samples, fmt(r.metric, r.p50), fmt(r.metric, r.p75), fmt(r.metric, r.p95), r.verdict])
console.log(`\nField data — last ${days} day(s)${report.filters.length ? ` · ${report.filters.join(" · ")}` : ""}\n`)
console.log(body.length ? table(head, body) : `No group has ${minSamples}+ samples yet.`)
if (report.dropped) console.log(`\n${report.dropped} group(s) under ${minSamples} samples left out — a p75 of five page views is noise.`)
fs.writeFileSync(path.join(outDir, "RUM.md"), `# Field data — last ${days} day(s)\n\n${body.length ? mdTable(head, body) : "No data yet."}\n`)
console.log(`\n→ ${path.relative(process.cwd(), path.join(outDir, "rum.json"))}`)
