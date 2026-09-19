// The Worker in front of the hogwarts container. One always-on instance; every
// request is forwarded as-is (Host header included — src/proxy.ts and cookie
// scoping read it). Cron triggers (wrangler.jsonc) call the app's /api/cron/*
// routes inside the container with the CRON_SECRET bearer, on the schedules in
// cf/crons.json — the same table Vercel ran, minus the 7 jobs that stay on
// GitHub Actions so nothing runs twice.
//
// Static assets are served from Cloudflare's edge cache (2026-09-13). A
// container fetch is not a CDN fetch: nothing about it went through the
// cache, so every hashed chunk, font and optimised image round-tripped to the
// one container — ~0.5 s per file from Europe, more from Khartoum, 70 files
// on a cold dashboard. The paths below are content-addressed or explicitly
// frozen by next.config headers; the Worker stores them under the apex host so
// every tenant shares one copy, and only when the origin itself says
// `public` with a real max-age (so the service worker, icons served
// `max-age=0` and anything carrying a session are never frozen).
import { Container, getContainer } from "@cloudflare/containers"

import crons from "./crons.json"

export class HogwartsContainer extends Container {
  defaultPort = 3000
  // A cold boot of this app is tens of seconds; keep the instance warm.
  sleepAfter = "24h"

  constructor(ctx, env) {
    super(ctx, env)
    // Every string binding (Worker secrets + vars) becomes container env.
    // Applied at container start only — rotating a secret needs a restart.
    this.envVars = Object.fromEntries(
      Object.entries(env).filter(([, v]) => typeof v === "string")
    )
  }
}

const EDGE_CACHEABLE = [
  /^\/_next\/static\//, // build-hashed js/css/media — immutable for a year
  /^\/_next\/image$/, // the image optimiser's output — 30 days, must-revalidate
  /^\/fonts\//, // self-hosted woff2 — immutable (next.config headers)
  /^\/(icon-\d+|apple-touch-icon)\.png$/, // PWA icons — a day (next.config headers)
  /^\/favicon\.ico$/,
]

// Shared across tenants: the same build serves every host.
const CACHE_HOST = "https://balqalam.com"

// The image optimiser picks the format from the client's Accept header, and
// Workers' Cache API ignores Vary at match time, so the format is part of the
// key — or a browser without avif would be handed another browser's avif.
// Next's rule, run against real headers: `image/avif` listed → avif, else
// `image/webp` listed → webp, else the original (a bare `image/*` is not
// enough).
function edgeCacheKey(url, request) {
  let extra = ""
  if (url.pathname === "/_next/image") {
    const accept = request.headers.get("accept") || ""
    const fmt = accept.includes("image/avif")
      ? "avif"
      : accept.includes("image/webp")
        ? "webp"
        : "orig"
    extra = (url.search ? "&" : "?") + "__fmt=" + fmt
  }
  return new Request(CACHE_HOST + url.pathname + url.search + extra, {
    method: "GET",
  })
}

// The container is asked for the raw bytes, so the edge stores exactly one
// representation and never a gzip body whose header could part from it.
// Nothing ships raw: Cloudflare compresses JS, CSS, RSC payloads and fonts
// for each visitor on the way out (gzip, or brotli on this Pro zone), and the
// half-vCPU container no longer spends CPU gzipping files the edge keeps.
function identityRequest(request) {
  const headers = new Headers(request.headers)
  headers.set("accept-encoding", "identity")
  return new Request(request, { headers })
}

// `x-edge-cache: hit | miss | bypass` — what the edge did, so a deploy can
// be checked with two curls instead of guessing from cf-cache-status.
function stamped(response, state) {
  const out = new Response(response.body, response)
  out.headers.set("x-edge-cache", state)
  return out
}

// Only what the origin explicitly allows the public to keep.
function freezable(response) {
  if (!response.ok) return false
  if (response.headers.has("set-cookie")) return false
  if (response.headers.has("content-encoding")) return false
  const cc = response.headers.get("cache-control") || ""
  if (!/\bpublic\b/.test(cc)) return false
  if (/no-store|no-cache|private/.test(cc)) return false
  const maxAge = /max-age=(\d+)/.exec(cc)
  return !!maxAge && Number(maxAge[1]) > 0
}

// ---- Real-user metrics (src/components/monitoring/web-vitals.tsx) -----------
// The page's beacon is answered HERE and written to Workers Analytics Engine:
// it never reaches the half-vCPU container and never touches Neon. One data
// point per metric; the tenant is the index so a small school's samples are
// not sampled away behind a large one's. Nothing identifying is stored — the
// page sends a route PATTERN and coarse device facts, and what is added here
// (role cookie, Cloudflare's country/colo) is no finer than that.
// Without the RUM binding (local, or a deploy that dropped it) this is a no-op.
const RUM_PATH = "/api/rum"
const RUM_METRICS = new Set(["TTFB", "FCP", "LCP", "INP", "CLS", "FID", "NAV", "SRV"])
const RUM_ROLES = new Set([
  "DEVELOPER", "ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF", "USER",
])
const clip = (v, n = 64) => (typeof v === "string" ? v.slice(0, n) : "")

function tenantOf(hostname) {
  const m = /^([a-z0-9-]+)\.(?:balqalam\.com|databayt\.org)$/.exec(hostname)
  return m && m[1] !== "www" && m[1] !== "ed" ? m[1] : "_main"
}

async function collectRum(request, env) {
  const accepted = new Response(null, { status: 204, headers: { "cache-control": "no-store" } })
  if (!env.RUM) return accepted
  try {
    const raw = await request.text()
    if (raw.length > 4096) return accepted
    const body = JSON.parse(raw)
    if (!body || !Array.isArray(body.samples)) return accepted
    const url = new URL(request.url)
    const role = /(?:^|;\s*)authjs\.role=([A-Z]+)/.exec(request.headers.get("cookie") || "")?.[1]
    const cf = request.cf || {}
    for (const s of body.samples.slice(0, 12)) {
      if (!s || !RUM_METRICS.has(s.n) || !Number.isFinite(s.v) || s.v < 0 || s.v > 600000) continue
      env.RUM.writeDataPoint({
        indexes: [tenantOf(url.hostname)],
        blobs: [
          s.n, // blob1  metric
          clip(body.route, 96), // blob2  route pattern
          RUM_ROLES.has(role) ? role : "anon", // blob3  role
          clip(body.locale, 2), // blob4  locale
          clip(body.device, 8), // blob5  phone | tablet | desktop
          clip(body.net, 8), // blob6  effective connection type
          clip(s.t, 24), // blob7  navigation type
          clip(s.r, 20), // blob8  good | needs-improvement | poor
          clip(cf.country, 2), // blob9  country
          clip(cf.colo, 4), // blob10 Cloudflare location that served them
          body.sw ? "sw" : "no-sw", // blob11 service worker in control
        ],
        doubles: [s.v, Number(body.mem) || 0, Number(body.cpu) || 0],
      })
    }
  } catch {
    // A malformed beacon is dropped; measuring never fails a request.
  }
  return accepted
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (request.method === "POST" && url.pathname === RUM_PATH) return collectRum(request, env)
    const cacheable =
      request.method === "GET" &&
      EDGE_CACHEABLE.some((re) => re.test(url.pathname))
    if (!cacheable) return getContainer(env.HOGWARTS, "main").fetch(request)

    const cache = caches.default
    const key = edgeCacheKey(url, request)
    const hit = await cache.match(key)
    if (hit) return stamped(hit, "hit")

    const response = await getContainer(env.HOGWARTS, "main").fetch(
      identityRequest(request)
    )
    if (freezable(response)) {
      ctx.waitUntil(cache.put(key, response.clone()))
      return stamped(response, "miss")
    }
    return stamped(response, "bypass")
  },

  async scheduled(controller, env, ctx) {
    const paths = crons.schedules[controller.cron] ?? []
    if (paths.length === 0) {
      console.log("cron: no routes for", controller.cron)
      return
    }
    const container = getContainer(env.HOGWARTS, "main")
    const run = async (path) => {
      const started = Date.now()
      try {
        const res = await container.fetch(
          new Request("https://balqalam.com" + path, {
            method: "GET",
            headers: {
              authorization: "Bearer " + env.CRON_SECRET,
              "user-agent": "cloudflare-cron/1",
              host: "balqalam.com",
            },
          })
        )
        console.log(
          JSON.stringify({
            cron: controller.cron,
            path,
            status: res.status,
            ms: Date.now() - started,
          })
        )
      } catch (e) {
        console.error(
          JSON.stringify({
            cron: controller.cron,
            path,
            error: String(e),
            ms: Date.now() - started,
          })
        )
      }
    }
    ctx.waitUntil(Promise.all(paths.map(run)))
  },
}
