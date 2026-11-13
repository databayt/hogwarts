#!/usr/bin/env node
// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One line that says whether a school can be taught on right now.
 *
 *   node scripts/ops/watch.mjs --once                      # one check, exit 1 on a failure
 *   node scripts/ops/watch.mjs --school alabidae --every 300   # a line every five minutes
 *
 * Four read-only probes, the same four a person would try first:
 *   health  GET  <apex>/api/health            the app, its database, and (when the build
 *                                             has it) the video server the app dials
 *   login   GET  <school>/ar/login            the page a student opens
 *   sfu     GET  <sfu>/                       the video server's own answer
 *   hook    POST <apex>/api/webhooks/livekit  unsigned: 401 proves the function boots
 *
 * It prints `OK` or `FAIL` with the reason and nothing else, so a monitor can
 * alert on the word. It writes nothing anywhere and needs no secret.
 */

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? fallback : (args[i + 1] ?? fallback)
}
if (args.includes("--help")) {
  console.log(
    "usage: watch.mjs [--school alabidae] [--apex https://balqalam.com] [--sfu https://live.balqalam.com] [--every 300 | --once] [--slow 5000]"
  )
  process.exit(0)
}

const school = flag("school", "alabidae")
const apex = flag("apex", "https://balqalam.com").replace(/\/$/, "")
const sfu = flag("sfu", "https://live.balqalam.com").replace(/\/$/, "")
const every = Number(flag("every", "300"))
const slowMs = Number(flag("slow", "5000"))
const once = args.includes("--once")
const schoolBase = apex.replace("://", `://${school}.`)

async function probe(url, init = {}) {
  const started = Date.now()
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
      ...init,
    })
    const text = await res.text().catch(() => "")
    return { status: res.status, ms: Date.now() - started, text }
  } catch (error) {
    return {
      status: 0,
      ms: Date.now() - started,
      text: "",
      error:
        error?.name === "TimeoutError"
          ? "timeout"
          : String(error?.cause?.code ?? error?.message ?? error),
    }
  }
}

async function check() {
  const [health, login, video, hook] = await Promise.all([
    probe(`${apex}/api/health`),
    probe(`${schoolBase}/ar/login`),
    probe(`${sfu}/`),
    probe(`${apex}/api/webhooks/livekit`, { method: "POST" }),
  ])

  const problems = []
  const parts = []

  let body = null
  try {
    body = JSON.parse(health.text)
  } catch {
    body = null
  }
  if (health.status !== 200 || !body) {
    problems.push(`health ${health.status || health.error}`)
    parts.push(`health=${health.status || health.error}`)
  } else {
    const checks = body.checks ?? {}
    const db = checks.database ?? {}
    const lk = checks.livekit
    if (body.status === "unhealthy") problems.push("health unhealthy")
    if (db.status !== "pass") problems.push(`database ${db.status}`)
    if (lk && lk.status !== "pass") {
      problems.push(
        `video server (as the app sees it) ${lk.status}: ${lk.error ?? ""}`.trim()
      )
    }
    parts.push(
      `health=${body.status}`,
      `db=${db.responseTime ?? "?"}ms`,
      lk
        ? `livekit=${lk.status}${lk.details?.host ? `@${lk.details.host}` : ""}${lk.details?.rooms !== undefined ? ` rooms=${lk.details.rooms}` : ""}`
        : "livekit=n/a",
      `up=${body.uptime}s`
    )
  }

  if (login.status !== 200)
    problems.push(`login page ${login.status || login.error}`)
  else if (login.ms > slowMs) problems.push(`login page slow ${login.ms}ms`)
  parts.push(`login=${login.status || login.error}/${login.ms}ms`)

  if (video.status !== 200)
    problems.push(`video server ${video.status || video.error}`)
  parts.push(`sfu=${video.status || video.error}`)

  if (hook.status !== 401)
    problems.push(`webhook answered ${hook.status || hook.error}, expected 401`)
  parts.push(`hook=${hook.status || hook.error}`)

  const stamp = new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Khartoum",
  })
  const ok = problems.length === 0
  console.log(
    `${stamp} ${ok ? "OK  " : "FAIL"} ${school} ${parts.join(" ")}${ok ? "" : ` :: ${problems.join("; ")}`}`
  )
  return ok
}

if (once) {
  process.exit((await check()) ? 0 : 1)
} else {
  for (;;) {
    await check()
    await new Promise((resolve) => setTimeout(resolve, every * 1000))
  }
}
