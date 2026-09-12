// Service worker — offline shell, static-asset cache, push.
//
// v3 (2026-09-12) replaces two silent failures in v2:
//   1. The precache listed `/` and `/offline`. Both are 307s to the locale
//      prefix, so `cache.addAll` stored responses with `redirected: true`,
//      which the browser refuses to serve for a navigation. The offline
//      fallback therefore never worked. Only public, locale-explicit, 200
//      URLs are precached now.
//   2. Every navigation and every `/api/` GET was `cache.put` into a cache
//      keyed by URL alone. On a shared school device the previous user's
//      dashboard could come back from cache. HTML and API are network-only
//      now; the only navigation fallback is the offline page.
// v2 fixed v1's `/manifest.json` (does not exist → install failed on every
// device). Bump the cache name on every change so `activate` evicts the old
// behaviour.
//
// Rule: kun `.claude/rules/next-16/sw-no-authenticated-cache.md`.
const STATIC_CACHE_NAME = "hogwarts-static-v3"
const STATIC_CACHE_CAP = 150

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

const STATIC_RE = /\.(js|css|jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)$/

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
          const urls = new Set()
          for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) {
            urls.add(m[1])
          }
          await Promise.allSettled([...urls].map((u) => cache.add(u)))
        } catch (err) {
          console.warn("[Service Worker] offline page assets not precached", path, err)
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
        Promise.all(names.filter((n) => n !== STATIC_CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => trimStaticCache())
  )
  self.clients.claim()
})

// Keep the static cache bounded: hashed chunks accumulate across deploys and
// teachers' phones do not have room for every build ever shipped. Precached
// entries are protected; the oldest runtime entries go first.
async function trimStaticCache() {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const keys = await cache.keys()
  const protectedPaths = new Set(PRECACHE)
  const runtime = keys.filter((req) => !protectedPaths.has(new URL(req.url).pathname))
  const excess = runtime.length - STATIC_CACHE_CAP
  if (excess <= 0) return
  await Promise.all(runtime.slice(0, excess).map((req) => cache.delete(req)))
}

function offlinePageFor(pathname) {
  return pathname === "/en" || pathname.startsWith("/en/") ? OFFLINE_PAGES.en : OFFLINE_PAGES.ar
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.protocol === "chrome-extension:") return

  // Cross-origin (S3 media chunks, CDN) and Range requests go straight to the
  // network: partial responses must never be cached as whole ones.
  if (url.origin !== self.location.origin || request.headers.has("range")) return

  // API: network-only. The outbox reads IndexedDB, not the cache; a cached
  // signed-media ticket is an expired URL and a cached sync response is a lie
  // about what landed.
  if (url.pathname.startsWith("/api/")) return

  // Static assets: cache-first. Hashed under /_next/static, so a hit is
  // always the right bytes.
  if (url.pathname.startsWith("/_next/static/") || STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone()
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return response
        })
      })
    )
    return
  }

  // Navigations: network, and the locale's offline page when the network is
  // gone. Never cached — the response belongs to whoever is signed in.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(offlinePageFor(url.pathname)).then(
          (page) =>
            page ||
            new Response("Offline", { status: 503, statusText: "Service Unavailable" })
        )
      )
    )
  }
  // Everything else (RSC payloads, data requests) falls through to the network.
})

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
  if (event.data && event.data.type === "drain-outbox") {
    event.waitUntil(wakePagesToDrain())
  }
})

async function wakePagesToDrain() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
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
  event.waitUntil(self.registration.showNotification(data.title || "balqalam", options))
})

// A tap lands on the notification's deep link — on the tenant origin and in
// its locale — reusing an open window when there is one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((c) => c.url.startsWith(self.location.origin))
      if (open) {
        return open.focus().then((c) => (c && "navigate" in c ? c.navigate(target) : c))
      }
      return self.clients.openWindow(target)
    })
  )
})
