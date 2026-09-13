// Service worker — offline shell, static-asset cache, saved pages, push.
//
// v6 (2026-09-13): the dashboard is explorable offline.
//   Every screen a signed-in user opens — the HTML of a full load and the
//   RSC payload of a client-side navigation — is saved under a cache named
//   by the user's session key, and served back when the network is gone or
//   answers too slowly. The key is the `x-session-key` header src/proxy.ts
//   puts on every response (a truncated hash of the user id and AUTH_SECRET):
//   a response carrying a different key, or none, drops every saved page of
//   the previous person, so a shared school device can never replay another
//   account's screens. That is what makes caching signed-in pages safe, and
//   it is why nothing here ever reads a page from a cache that is not the
//   current key's. Pages the user has not opened are saved on request from
//   the dashboard (`warm-pages`), so the whole sidebar works at a bus stop.
// v5/v4: cache-name bumps for the offline page's asset harvest.
// v3 (2026-09-12) replaced two silent failures in v2:
//   1. The precache listed `/` and `/offline`. Both are 307s to the locale
//      prefix, so `cache.addAll` stored responses with `redirected: true`,
//      which the browser refuses to serve for a navigation. The offline
//      fallback therefore never worked. Only public, locale-explicit, 200
//      URLs are precached now.
//   2. Every navigation and every `/api/` GET was `cache.put` into a cache
//      keyed by URL alone — the previous user's dashboard could come back on
//      a shared device. `/api/` stays network-only for good; pages are cached
//      again since v6, but only in the current session's namespace.
// v2 fixed v1's `/manifest.json` (does not exist → install failed on every
// device). Bump VERSION on every change so `activate` evicts the old
// behaviour.
//
// Rule: kun `.claude/rules/next-16/sw-no-authenticated-cache.md`.
const VERSION = "v6"
const STATIC_CACHE_NAME = `hogwarts-static-${VERSION}`
const META_CACHE_NAME = `hogwarts-meta-${VERSION}`
const PAGES_CACHE_PREFIX = `hogwarts-pages-${VERSION}-` // + session key: HTML
const FLIGHT_CACHE_PREFIX = `hogwarts-flight-${VERSION}-` // + session key: RSC payloads
const STATIC_CACHE_CAP = 400 // a cold dashboard is ~70 chunks + fonts + css
const PAGES_CACHE_CAP = 80
// A saved copy is shown when the network has not answered by then. A page
// with no saved copy waits for the network however long it takes.
const SLOW_NETWORK_MS = 4000
const WARM_GAP_MS = 1500
const WARM_TTL_MS = 24 * 60 * 60 * 1000
const SESSION_HEADER = "x-session-key"
const SESSION_META = "/__sw/session"

// Public, locale-explicit, answer 200 without a session. `/offline` is in the
// proxy's publicRoutes; the tenant rewrite is a rewrite, not a redirect.
const OFFLINE_PAGES = { ar: "/ar/offline", en: "/en/offline" }
const PRECACHE = [
  OFFLINE_PAGES.ar,
  OFFLINE_PAGES.en,
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-96.png",
]

const STATIC_RE =
  /\.(js|css|jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)$/
const ASSET_IN_HTML_RE = /(?:src|href)="(\/_next\/static\/[^"]+)"/g

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE)
      // The offline page is a React tree: its HTML is useless without the
      // script chunks it references, and those are only cached once fetched.
      // Pull them now so the offline library renders on a device that has
      // never opened /offline while online.
      for (const path of Object.values(OFFLINE_PAGES)) {
        try {
          const res = await cache.match(path)
          const html = res ? await res.text() : ""
          await harvestStaticAssets(html, cache)
        } catch (err) {
          console.warn(
            "[Service Worker] offline page assets not precached",
            path,
            err
          )
        }
      }
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (n) =>
                n !== STATIC_CACHE_NAME &&
                n !== META_CACHE_NAME &&
                !n.startsWith(PAGES_CACHE_PREFIX) &&
                !n.startsWith(FLIGHT_CACHE_PREFIX)
            )
            .map((n) => caches.delete(n))
        )
      )
      .then(() => caches.open(STATIC_CACHE_NAME))
      .then((cache) => trimCache(cache, STATIC_CACHE_CAP, new Set(PRECACHE)))
  )
  self.clients.claim()
})

// ---------------------------------------------------------------------------
// Caches

// Keep a cache bounded: hashed chunks accumulate across deploys and teachers'
// phones do not have room for every build ever shipped. Protected entries
// stay; the oldest of the rest go first.
async function trimCache(cache, cap, protectedPaths = new Set()) {
  const keys = await cache.keys()
  const runtime = keys.filter(
    (req) => !protectedPaths.has(new URL(req.url).pathname)
  )
  const excess = runtime.length - cap
  if (excess <= 0) return
  await Promise.all(runtime.slice(0, excess).map((req) => cache.delete(req)))
}

// Pull the build chunks a page's HTML references into the static cache, so
// the saved page renders (and hydrates) on a device that never loaded them.
async function harvestStaticAssets(html, cache) {
  const urls = new Set()
  for (const m of html.matchAll(ASSET_IN_HTML_RE)) urls.add(m[1])
  const missing = []
  for (const u of urls) {
    if (!(await cache.match(u))) missing.push(u)
  }
  await Promise.allSettled(missing.map((u) => cache.add(u)))
}

// ---------------------------------------------------------------------------
// Session namespace

let sessionKeyMemo // undefined until read from the meta cache

async function readSessionKey() {
  if (sessionKeyMemo !== undefined) return sessionKeyMemo
  const meta = await caches.open(META_CACHE_NAME)
  const hit = await meta.match(SESSION_META)
  sessionKeyMemo = hit ? (await hit.text()) || null : null
  return sessionKeyMemo
}

// A response from the proxy tells us who is signed in. A change of key —
// including to none — is a change of person: every other namespace goes.
async function adoptSessionKey(key) {
  const current = await readSessionKey()
  if (current === key) return
  sessionKeyMemo = key
  const meta = await caches.open(META_CACHE_NAME)
  if (key) await meta.put(SESSION_META, new Response(key))
  else await meta.delete(SESSION_META)
  const names = await caches.keys()
  await Promise.all(
    names
      .filter(
        (n) =>
          (n.startsWith(PAGES_CACHE_PREFIX) &&
            n !== PAGES_CACHE_PREFIX + key) ||
          (n.startsWith(FLIGHT_CACHE_PREFIX) && n !== FLIGHT_CACHE_PREFIX + key)
      )
      .map((n) => caches.delete(n))
  )
}

function observeSession(response) {
  // Only what the proxy produced: same-origin, not opaque, a real answer.
  if (!response || response.type !== "basic" || !response.ok)
    return Promise.resolve()
  return adoptSessionKey(response.headers.get(SESSION_HEADER) || null)
}

// ---------------------------------------------------------------------------
// Requests

function offlinePageFor(pathname) {
  return pathname === "/en" || pathname.startsWith("/en/")
    ? OFFLINE_PAGES.en
    : OFFLINE_PAGES.ar
}

function isHtml(response) {
  return (response.headers.get("content-type") || "").includes("text/html")
}

function isFlight(response) {
  return (response.headers.get("content-type") || "").includes(
    "text/x-component"
  )
}

// A client-side navigation's data request — not a prefetch, which Next
// answers with the loading boundary only.
function isRscNavigation(request) {
  return (
    request.headers.get("rsc") === "1" &&
    !request.headers.has("next-router-prefetch") &&
    !request.headers.has("next-router-segment-prefetch")
  )
}

function pageKey(href) {
  const u = new URL(href)
  u.hash = ""
  return u.href
}

// `_rsc` is a hash of the request headers (router state, prefetch flags) and
// changes between visits to the same page; the payload is keyed without it.
function flightKey(href) {
  const u = new URL(href)
  u.hash = ""
  u.searchParams.delete("_rsc")
  return u.href
}

// Static assets: cache-first. Hashed under /_next/static, so a hit is always
// the right bytes; the image optimiser keys its output by URL.
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response && response.status === 200 && response.type === "basic") {
    cache
      .put(request, response.clone())
      .then(() => trimCache(cache, STATIC_CACHE_CAP, new Set(PRECACHE)))
      .catch(() => {})
  }
  return response
}

const SLOW = Symbol("slow")
const FAILED = Symbol("failed")

// Pages served from a saved copy in the last minute, by page key — the page
// asks (`stale-check`) once it has loaded, since a navigation has no client to
// message while the response is being chosen.
const staleServed = new Map()

function noteStale(event, request, key) {
  if (request.mode === "navigate") {
    staleServed.set(key, Date.now())
    return
  }
  if (!event.clientId) return
  event.waitUntil(
    self.clients.get(event.clientId).then((client) => {
      if (client)
        client.postMessage({ type: "sw-stale", url: request.url, stale: true })
    })
  )
}

// Network first. A page the user has already opened (or that was warmed) is
// on the device: when the network fails, or has not answered within
// SLOW_NETWORK_MS, that saved copy is shown and the fetch keeps running in
// the background to refresh it. A page with no saved copy waits for the
// network and, when that fails, the caller falls back (offline page / 503).
async function pageFirst(event, request, { cachePrefix, key, expect }) {
  const sessionKey = await readSessionKey()
  const saved = sessionKey
    ? await caches
        .open(cachePrefix + sessionKey)
        .then((c) => c.match(key, { ignoreVary: true }))
    : undefined

  const network = fetch(request).then(async (response) => {
    if (response.type === "basic" && response.ok) {
      await observeSession(response)
      if (!response.redirected && expect(response)) {
        const current = await readSessionKey()
        // Only the current person's pages, and only when the proxy confirmed
        // this very response is theirs.
        if (current && response.headers.get(SESSION_HEADER) === current) {
          const cache = await caches.open(cachePrefix + current)
          await cache.put(key, response.clone())
          event.waitUntil(trimCache(cache, PAGES_CACHE_CAP))
        }
      }
    }
    return response
  })

  if (!saved) return network

  let timer
  const slow = new Promise((resolve) => {
    timer = setTimeout(() => resolve(SLOW), SLOW_NETWORK_MS)
  })
  const outcome = await Promise.race([
    network.then(
      (r) => r,
      () => FAILED
    ),
    slow,
  ])
  clearTimeout(timer)
  if (outcome === SLOW || outcome === FAILED) {
    event.waitUntil(network.catch(() => {}))
    noteStale(event, request, key)
    return saved
  }
  return outcome
}

// No network and nothing saved for exactly this URL: the same page under a
// different query is still that page; otherwise the locale's offline page.
async function offlineNavigation(url) {
  const key = await readSessionKey()
  if (key) {
    const cache = await caches.open(PAGES_CACHE_PREFIX + key)
    const loose = await cache.match(pageKey(url.href), {
      ignoreSearch: true,
      ignoreVary: true,
    })
    if (loose) return loose
  }
  const page = await caches.match(offlinePageFor(url.pathname))
  return (
    page ||
    new Response("Offline", { status: 503, statusText: "Service Unavailable" })
  )
}

// A failed data request must be a RESPONSE, not an error: the router treats a
// non-RSC answer as "do a full navigation", which lands in the handler above
// and gets the saved page or the offline page. An exception would leave the
// router waiting.
function offlineFlight() {
  return new Response("", {
    status: 503,
    statusText: "Offline",
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  })
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.protocol === "chrome-extension:") return

  // Cross-origin (S3 media chunks, CDN) and Range requests go straight to the
  // network: partial responses must never be cached as whole ones.
  if (url.origin !== self.location.origin || request.headers.has("range"))
    return

  // API: network-only. The outbox reads IndexedDB, not the cache; a cached
  // signed-media ticket is an expired URL and a cached sync response is a lie
  // about what landed.
  if (url.pathname.startsWith("/api/")) return
  if (url.pathname === "/service-worker.js") return

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/_next/image" ||
    STATIC_RE.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      pageFirst(event, request, {
        cachePrefix: PAGES_CACHE_PREFIX,
        key: pageKey(request.url),
        expect: isHtml,
      }).catch(() => offlineNavigation(url))
    )
    return
  }

  if (isRscNavigation(request)) {
    event.respondWith(
      pageFirst(event, request, {
        cachePrefix: FLIGHT_CACHE_PREFIX,
        key: flightKey(request.url),
        expect: isFlight,
      }).catch(() => offlineFlight())
    )
  }
  // Everything else (prefetches, data requests) falls through to the network.
})

// ---------------------------------------------------------------------------
// Warming: the sidebar's pages for this person, saved ahead of the first
// disconnection. Sent by src/components/offline/warmup.tsx from the installed
// app, on a good connection, once the dashboard is idle. Once a day per key;
// pages already saved this session are skipped; a page whose response
// belongs to someone else (the session changed under us) stops the run.
async function warmPages(urls) {
  const key = await readSessionKey()
  if (!key) return
  const meta = await caches.open(META_CACHE_NAME)
  const stampKey = `/__sw/warmed/${key}`
  const stamp = await meta.match(stampKey)
  if (stamp && Date.now() - Number(await stamp.text()) < WARM_TTL_MS) return
  await meta.put(stampKey, new Response(String(Date.now())))

  const pages = await caches.open(PAGES_CACHE_PREFIX + key)
  const statics = await caches.open(STATIC_CACHE_NAME)
  for (const href of urls) {
    let u
    try {
      u = new URL(href, self.location.origin)
    } catch {
      continue
    }
    if (u.origin !== self.location.origin) continue
    if (await pages.match(u.href, { ignoreVary: true })) continue
    try {
      const response = await fetch(u.href, {
        credentials: "same-origin",
        headers: { accept: "text/html" },
        priority: "low",
      })
      if (response.headers.get(SESSION_HEADER) !== key) break
      if (
        response.ok &&
        response.type === "basic" &&
        !response.redirected &&
        isHtml(response)
      ) {
        const html = await response.clone().text()
        await pages.put(u.href, response)
        await harvestStaticAssets(html, statics)
      }
    } catch {
      // Offline or aborted: the stamp stands, tomorrow's run picks it up.
    }
    await new Promise((r) => setTimeout(r, WARM_GAP_MS))
  }
  await trimCache(pages, PAGES_CACHE_CAP)
}

// ---------------------------------------------------------------------------
// Background sync: the outbox lives in the page's IndexedDB module
// (src/lib/offline/outbox.ts), which holds the session cookie context the
// sync route needs. The worker's job is only to WAKE a page — it cannot
// drain on its own without duplicating that module here.
self.addEventListener("sync", (event) => {
  if (event.tag === "drain-outbox") {
    event.waitUntil(wakePagesToDrain())
  }
})

self.addEventListener("message", (event) => {
  const data = event.data || {}
  switch (data.type) {
    case "drain-outbox":
      event.waitUntil(wakePagesToDrain())
      break
    case "warm-pages":
      if (Array.isArray(data.urls))
        event.waitUntil(
          warmPages(data.urls.filter((u) => typeof u === "string"))
        )
      break
    case "stale-check": {
      if (typeof data.url !== "string" || !event.source) break
      let key
      try {
        key = pageKey(data.url)
      } catch {
        break
      }
      const at = staleServed.get(key)
      staleServed.delete(key)
      event.source.postMessage({
        type: "sw-stale",
        url: data.url,
        stale: !!at && Date.now() - at < 60_000,
      })
      break
    }
    default:
      break
  }
})

async function wakePagesToDrain() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
  for (const client of clients) {
    client.postMessage({ type: "drain-outbox" })
  }
}

// Push: the payload is JSON from src/lib/notifications/push-web.ts —
// { title, body, url, tag, icon? }. A plain-text payload still shows.
self.addEventListener("push", (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data = { body: event.data.text() }
    }
  }
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-96.png",
    tag: data.tag || undefined,
    dir: data.dir || "auto",
    lang: data.lang || undefined,
    vibrate: [100, 50, 100],
    data: { url: data.url || "/", timestamp: Date.now() },
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "balqalam", options)
  )
})

// A tap lands on the notification's deep link — on the tenant origin and in
// its locale — reusing an open window when there is one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(
    event.notification.data?.url || "/",
    self.location.origin
  ).href
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const open = clients.find((c) => c.url.startsWith(self.location.origin))
        if (open) {
          return open
            .focus()
            .then((c) => (c && "navigate" in c ? c.navigate(target) : c))
        }
        return self.clients.openWindow(target)
      })
  )
})
