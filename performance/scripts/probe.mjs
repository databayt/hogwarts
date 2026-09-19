// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Network-level probe: where a request's time goes before a browser is
 * involved. One keep-alive connection per host, so DNS/TCP/TLS are paid once
 * and every sample after the first is pure request → first byte.
 *
 *   edge      a hashed static file served from Cloudflare's cache  → vantage ↔ edge
 *   origin    the cheapest dynamic answer the container can give   → + edge ↔ container
 *   database  /api/health's own SELECT 1 timing                    → container ↔ Neon
 *   payload   public HTML: bytes on the wire, and how much of the document
 *             is RSC flight data (the serialized props of client components)
 *
 *   node performance/scripts/probe.mjs --target prod --samples 20
 */
import fs from "node:fs"
import http from "node:http"
import https from "node:https"
import path from "node:path"
import zlib from "node:zlib"

import {
  arg,
  ensureDir,
  fmtKB,
  fmtMs,
  labRoot,
  median,
  percentile,
  readJson,
  table,
} from "./lib.mjs"

const lab = readJson(path.join(labRoot, "config/lab.json"))
const targetName = arg("target", "prod")
const target = lab.targets[targetName]
const samples = Number(arg("samples", "20"))
const locale = arg("locale", lab.locale)
const outDir = ensureDir(
  path.resolve(arg("out") || path.join(labRoot, "reports/latest"))
)

const agents = new Map()
function agentFor(u) {
  const key = u.protocol + u.host
  if (!agents.has(key)) {
    const mod = u.protocol === "https:" ? https : http
    agents.set(key, new mod.Agent({ keepAlive: true, maxSockets: 1 }))
  }
  return agents.get(key)
}

/** One GET. `wait` = request written → first response byte, on a warm socket. */
function get(href, { headers = {}, body = false } = {}) {
  const u = new URL(href)
  const mod = u.protocol === "https:" ? https : http
  return new Promise((resolve, reject) => {
    const started = performance.now()
    const req = mod.get(
      u,
      {
        agent: agentFor(u),
        headers: { "accept-encoding": "br, gzip", "user-agent": "hogwarts-perf-probe/1", ...headers },
      },
      (res) => {
        const firstByte = performance.now()
        const chunks = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => {
          const raw = Buffer.concat(chunks)
          let text = null
          if (body) {
            const enc = res.headers["content-encoding"]
            const decoded =
              enc === "br" ? zlib.brotliDecompressSync(raw)
              : enc === "gzip" ? zlib.gunzipSync(raw)
              : raw
            text = decoded.toString("utf8")
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            reusedSocket: req.reusedSocket,
            wait: firstByte - started,
            total: performance.now() - started,
            wire: raw.length,
            text,
          })
        })
      }
    )
    req.on("error", reject)
    req.setTimeout(60_000, () => req.destroy(new Error("timeout")))
  })
}

async function sample(name, href, n, opts) {
  const waits = []
  let last
  for (let i = 0; i < n + 1; i++) {
    try {
      last = await get(href, opts)
      if (last.reusedSocket) waits.push(last.wait) // the first request pays the handshake
    } catch (e) {
      console.warn(`${name}: ${e.message}`)
    }
  }
  return {
    name,
    url: href,
    samples: waits.length,
    status: last?.status ?? null,
    min: waits.length ? Math.min(...waits) : null,
    p50: median(waits),
    p95: percentile(waits, 0.95),
    max: waits.length ? Math.max(...waits) : null,
    edgeCache: last?.headers["x-edge-cache"] ?? null,
    encoding: last?.headers["content-encoding"] ?? null,
  }
}

const out = { generatedAt: new Date().toISOString(), target: targetName, samples }

// ---- vantage ----------------------------------------------------------------
if (target.marketingOrigin.startsWith("https://")) {
  const trace = await get(`${target.marketingOrigin}/cdn-cgi/trace`, { body: true }).catch(() => null)
  const pick = (k) => new RegExp(`^${k}=(.*)$`, "m").exec(trace?.text ?? "")?.[1] ?? null
  out.vantage = { colo: pick("colo"), country: pick("loc") }
}

// ---- payload: the public first screens ----------------------------------------
out.payloads = []
let staticChunk = null
for (const r of lab.publicRoutes) {
  const origin = r.origin === "tenant" ? target.tenantOrigin : target.marketingOrigin
  const href = `${origin}/${locale}${r.path === "/" ? "" : r.path}`
  const res = await get(href, { body: true }).catch(() => null)
  if (!res?.text) continue
  const html = res.text
  const flight = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)]
  const flightBytes = flight.reduce((n, m) => n + Buffer.byteLength(m[1]), 0)
  staticChunk ??= /src="(\/_next\/static\/chunks\/[^"]+\.js)"/.exec(html)?.[1] ?? null
  out.payloads.push({
    url: href,
    status: res.status,
    encoding: res.headers["content-encoding"] ?? "identity",
    wireBytes: res.wire,
    htmlBytes: Buffer.byteLength(html),
    flightBytes,
    flightShare: flightBytes / Buffer.byteLength(html),
    largestFlightChunk: flight.reduce((n, m) => Math.max(n, Buffer.byteLength(m[1])), 0),
    scripts: (html.match(/<script[^>]+src=/g) ?? []).length,
    stylesheets: (html.match(/rel="stylesheet"/g) ?? []).length,
    cacheControl: res.headers["cache-control"] ?? null,
  })
}

// ---- latency tiers -------------------------------------------------------------
out.latency = []
if (staticChunk)
  out.latency.push(await sample("edge (cached static chunk)", target.tenantOrigin + staticChunk, samples))
out.latency.push(
  // A path that matches no route: the container answers it without a database
  // query, so it is the floor of anything dynamic.
  await sample("origin (container, no database)", `${target.tenantOrigin}/__perf-probe-${Date.now()}.txt`, samples),
  await sample("origin + tenant lookup (manifest)", `${target.tenantOrigin}/manifest.webmanifest`, samples),
  await sample("public page (login HTML)", `${target.tenantOrigin}/${locale}/login`, Math.min(samples, 10))
)

// ---- database round trip, as the container itself measures it --------------------
const db = []
const bridge = []
for (let i = 0; i < samples; i++) {
  const res = await get(target.healthUrl, { body: true }).catch(() => null)
  try {
    const json = JSON.parse(res.text)
    if (typeof json.checks?.database?.responseTime === "number") db.push(json.checks.database.responseTime)
    if (typeof json.checks?.whatsappBridge?.responseTime === "number") bridge.push(json.checks.whatsappBridge.responseTime)
  } catch {}
}
out.database = {
  what: "SELECT 1 over the container's warm Prisma pool (one round trip)",
  samples: db.length,
  min: db.length ? Math.min(...db) : null,
  p50: median(db),
  p95: percentile(db, 0.95),
  p99: percentile(db, 0.99),
  max: db.length ? Math.max(...db) : null,
}
if (bridge.length) out.database.bridgeP50 = median(bridge)

for (const a of agents.values()) a.destroy()
fs.writeFileSync(path.join(outDir, "probe.json"), JSON.stringify(out, null, 2))

// ---- console ---------------------------------------------------------------------
console.log(`\nNetwork probe — ${targetName}${out.vantage ? ` · measured from ${out.vantage.country} via Cloudflare ${out.vantage.colo}` : ""}\n`)
console.log(
  table(
    ["tier", "n", "min", "p50", "p95", "max", "edge", "enc"],
    out.latency.map((l) => [l.name, l.samples, fmtMs(l.min), fmtMs(l.p50), fmtMs(l.p95), fmtMs(l.max), l.edgeCache ?? "—", l.encoding ?? "—"])
  )
)
console.log(`\nDatabase round trip (container → Neon): min ${fmtMs(out.database.min)} · p50 ${fmtMs(out.database.p50)} · p95 ${fmtMs(out.database.p95)} · p99 ${fmtMs(out.database.p99)}  (n=${out.database.samples})`)
console.log("\nPublic payloads")
console.log(
  table(
    ["url", "wire", "HTML", "flight data", "share", "scripts", "enc"],
    out.payloads.map((p) => [p.url, fmtKB(p.wireBytes), fmtKB(p.htmlBytes), fmtKB(p.flightBytes), `${Math.round(p.flightShare * 100)}%`, p.scripts, p.encoding])
  )
)
console.log(`\n→ ${path.relative(process.cwd(), path.join(outDir, "probe.json"))}`)
