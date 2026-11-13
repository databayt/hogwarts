#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Capacity sanity check for one school (~60 people arriving within a minute).
// Plain Node ESM, no dependencies. Signs in over plain fetch (NextAuth v5
// credentials: /api/auth/csrf + /api/auth/callback/credentials), then fires
// stages of concurrent GETs while sampling /api/health once a second.
//
//   node scripts/load/capacity-check.mjs --help
//   node scripts/load/capacity-check.mjs --stages 3
//   node scripts/load/capacity-check.mjs --label before --out before.json

const HELP = `capacity-check.mjs - concurrent-request sanity check for one school

Usage: node scripts/load/capacity-check.mjs [options]

  --host <url>        Base URL (default https://demo.balqalam.com)
  --roles <list>      Roles to sign in as, comma list of student,teacher,admin,parent
                      (default student,teacher). Requests alternate between roles.
  --stages <list>     Concurrent requests PER PATH per stage (default 10,30,60; "--stages 5" ok)
  --paths <list>      Comma list (default /ar/dashboard,/ar/timetable,/ar/live)
  --slot <id>         Also hit /ar/live/join/<timetableId>
  --timeout <sec>     Per-request timeout (default 20)
  --pause <sec>       Wait between stages (default 10)
  --abort-p95 <ms>    Abort when a stage p95 exceeds this (default 3000)
  --label <text>      before | after (echoed into the summary)
  --out <file>        Write JSON summary to file
  --json              Print JSON summary to stdout
  --allow-host        Allow hosts whose first label is not "demo"
  --help              This text

Env: SMOKE_PASSWORD (default 1234). Aborts and exits 1 on any 5xx, any
unsuccessful sign-in, or p95 above --abort-p95. Read-only: GET requests plus
the credentials sign-in; writes nothing to the app.`

const ACCOUNTS = {
  student: "student@balqalam.com",
  teacher: "teacher@balqalam.com",
  admin: "admin@balqalam.com",
  parent: "parent@balqalam.com",
}

function parseArgs(argv) {
  const o = {
    host: "https://demo.balqalam.com",
    roles: "student,teacher",
    stages: "10,30,60",
    paths: "/ar/dashboard,/ar/timetable,/ar/live",
    slot: "",
    timeout: "20",
    pause: "10",
    "abort-p95": "3000",
    label: "",
    out: "",
    json: false,
    "allow-host": false,
    help: false,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("--")) throw new Error(`Unexpected argument: ${a}`)
    const k = a.slice(2)
    if (!(k in o)) throw new Error(`Unknown option: ${a}`)
    if (typeof o[k] === "boolean") o[k] = true
    else {
      const v = argv[++i]
      if (v === undefined) throw new Error(`Missing value for ${a}`)
      o[k] = v
    }
  }
  return o
}

const num = (v, name) => {
  const n = Number(v)
  if (!Number.isFinite(n) || n < 0)
    throw new Error(`Bad number for ${name}: ${v}`)
  return n
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function pct(sorted, p) {
  if (!sorted.length) return null
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1
  )
  return Math.round(sorted[Math.max(0, idx)])
}
const sortNum = (a) => [...a].sort((x, y) => x - y)

// ---- cookies -------------------------------------------------------------
function absorb(jar, res) {
  for (const sc of res.headers.getSetCookie?.() ?? []) {
    const [pair, ...attrs] = sc.split(";")
    const eq = pair.indexOf("=")
    const name = pair.slice(0, eq).trim()
    const value = pair.slice(eq + 1).trim()
    const expired = attrs.some((a) => /^\s*max-age=0\s*$/i.test(a))
    if (expired || value === "") jar.delete(name)
    else jar.set(name, value)
  }
}
const cookieHeader = (jar) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ")

async function signIn(base, role, password, timeoutMs) {
  const email = ACCOUNTS[role]
  if (!email) throw new Error(`Unknown role: ${role}`)
  const jar = new Map()
  const opt = () => ({ signal: AbortSignal.timeout(timeoutMs) })

  const csrfRes = await fetch(`${base}/api/auth/csrf`, {
    ...opt(),
    headers: { cookie: cookieHeader(jar) },
  })
  absorb(jar, csrfRes)
  const { csrfToken } = await csrfRes.json()
  if (!csrfToken) throw new Error(`${role}: no csrf token`)

  const body = new URLSearchParams({
    csrfToken,
    identifier: email,
    password,
    schoolId: "",
    callbackUrl: `${base}/ar/dashboard`,
    json: "true",
  })
  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    ...opt(),
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: cookieHeader(jar),
    },
    body,
  })
  absorb(jar, res)
  const hasSession = [...jar.keys()].some((k) => /session-token/.test(k))
  if (!hasSession) {
    const loc = res.headers.get("location") || ""
    throw new Error(
      `${role}: sign-in produced no session cookie (HTTP ${res.status} ${loc.slice(0, 120)})`
    )
  }
  return cookieHeader(jar)
}

// ---- requests ------------------------------------------------------------
async function hit(base, path, cookie, timeoutMs) {
  const t0 = performance.now()
  try {
    const res = await fetch(base + path, {
      redirect: "manual",
      headers: { cookie },
      signal: AbortSignal.timeout(timeoutMs),
    })
    await res.arrayBuffer() // include body download in the latency
    return { status: res.status, ms: performance.now() - t0 }
  } catch (e) {
    const name =
      e?.name === "TimeoutError" || e?.name === "AbortError"
        ? "timeout"
        : "error"
    return { status: name, ms: performance.now() - t0 }
  }
}

async function health(base) {
  try {
    const res = await fetch(`${base}/api/health`, {
      signal: AbortSignal.timeout(10000),
    })
    const j = await res.json()
    return {
      dbMs: j?.checks?.database?.responseTime ?? null,
      rssMB: j?.checks?.memory?.details?.rss ?? null,
    }
  } catch {
    return null
  }
}

const hist = (rows) => {
  const h = {}
  for (const r of rows) h[r.status] = (h[r.status] || 0) + 1
  return h
}
const fmtHist = (h) =>
  Object.entries(h)
    .map(([k, v]) => `${k}x${v}`)
    .join(" ")

function stat(arr) {
  const s = sortNum(arr)
  return {
    min: s.length ? Math.round(s[0]) : null,
    p50: pct(s, 50),
    max: s.length ? Math.round(s[s.length - 1]) : null,
  }
}

async function runStage(base, n, paths, cookies, timeoutMs) {
  const roles = Object.keys(cookies)
  const samples = []
  let sampling = true
  const sampler = (async () => {
    while (sampling) {
      const h = await health(base)
      if (h) samples.push(h)
      await sleep(1000)
    }
  })()

  const jobs = []
  for (const path of paths) {
    for (let i = 0; i < n; i++) {
      const role = roles[i % roles.length]
      jobs.push(
        hit(base, path, cookies[role], timeoutMs).then((r) => ({
          path,
          role,
          ...r,
        }))
      )
    }
  }
  const t0 = performance.now()
  const results = await Promise.all(jobs)
  const wallMs = Math.round(performance.now() - t0)
  sampling = false
  await sampler

  const perPath = paths.map((path) => {
    const rows = results.filter((r) => r.path === path)
    const lat = sortNum(rows.map((r) => r.ms))
    return {
      path,
      count: rows.length,
      status: hist(rows),
      p50: pct(lat, 50),
      p95: pct(lat, 95),
      max: lat.length ? Math.round(lat[lat.length - 1]) : null,
    }
  })
  const dbs = samples.map((s) => s.dbMs).filter((v) => v != null)
  const rss = samples.map((s) => s.rssMB).filter((v) => v != null)
  const all = sortNum(results.map((r) => r.ms))
  return {
    concurrentPerPath: n,
    totalRequests: results.length,
    wallMs,
    paths: perPath,
    overallP95: pct(all, 95),
    has5xx: results.some(
      (r) => typeof r.status === "number" && r.status >= 500
    ),
    failures: results.filter((r) => typeof r.status !== "number").length,
    health: { samples: samples.length, dbMs: stat(dbs), rssMB: stat(rss) },
  }
}

function printStage(s) {
  console.log(
    `\nStage ${s.concurrentPerPath} per path (${s.totalRequests} requests, wall ${s.wallMs} ms)`
  )
  const rows = s.paths.map((p) => [
    p.path,
    String(p.count),
    fmtHist(p.status),
    p.p50,
    p.p95,
    p.max,
  ])
  const head = ["path", "count", "status", "p50", "p95", "max"]
  const w = head.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => String(r[i]).length))
  )
  const line = (r) => r.map((c, i) => String(c).padEnd(w[i])).join("  ")
  console.log(line(head))
  for (const r of rows) console.log(line(r))
  const d = s.health.dbMs
  console.log(
    `health: ${s.health.samples} samples, db ms min/p50/max ${d.min}/${d.p50}/${d.max}, rss MB min/max ${s.health.rssMB.min}/${s.health.rssMB.max}`
  )
}

// ---- main ----------------------------------------------------------------
async function main() {
  const o = parseArgs(process.argv.slice(2))
  if (o.help) return console.log(HELP)

  const base = o.host.replace(/\/+$/, "")
  const url = new URL(base)
  const firstLabel = url.hostname.split(".")[0]
  if (firstLabel !== "demo" && !o["allow-host"]) {
    throw new Error(
      `Refusing host "${url.hostname}": first label is not "demo" (use --allow-host to override)`
    )
  }
  const timeoutMs = num(o.timeout, "--timeout") * 1000
  const pauseMs = num(o.pause, "--pause") * 1000
  const abortP95 = num(o["abort-p95"], "--abort-p95")
  const stages = o.stages.split(",").map((s) => num(s.trim(), "--stages"))
  const roles = o.roles
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const paths = o.paths
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  if (o.slot) paths.push(`/ar/live/join/${o.slot}`)
  const password = process.env.SMOKE_PASSWORD || "1234"

  const cookies = {}
  for (const role of roles) {
    cookies[role] = await signIn(base, role, password, timeoutMs)
    console.error(`signed in: ${role}`)
  }

  const summary = {
    label: o.label || null,
    host: base,
    startedAt: new Date().toISOString(),
    roles,
    paths,
    abortP95,
    stages: [],
    aborted: null,
  }

  for (let i = 0; i < stages.length; i++) {
    if (i > 0) await sleep(pauseMs)
    const s = await runStage(base, stages[i], paths, cookies, timeoutMs)
    summary.stages.push(s)
    printStage(s)
    if (s.has5xx || s.overallP95 > abortP95) {
      summary.aborted = s.has5xx
        ? `5xx at stage ${stages[i]}`
        : `p95 ${s.overallP95} ms > ${abortP95} ms at stage ${stages[i]}`
      console.log(`\nABORT: ${summary.aborted}`)
      break
    }
  }

  if (o.out) {
    const fs = await import("node:fs/promises")
    await fs.writeFile(o.out, JSON.stringify(summary, null, 2) + "\n")
    console.error(`summary written to ${o.out}`)
  }
  if (o.json) console.log(JSON.stringify(summary, null, 2))
  if (summary.aborted) process.exitCode = 1
}

main().catch((e) => {
  console.error(`capacity-check: ${e.message}`)
  process.exit(1)
})
