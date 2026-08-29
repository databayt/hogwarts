// Service Worker for offline support and performance optimization
//
// v2: the v1 precache listed `/manifest.json`, which does not exist (Next
// serves the app manifest at `/manifest.webmanifest`). `cache.addAll`
// rejects on any 404, so v1's install failed on every device and no
// offline behaviour ever activated in production. The version bump evicts
// whatever v1 left behind.
const STATIC_CACHE_NAME = "hogwarts-static-v2"
const DYNAMIC_CACHE_NAME = "hogwarts-dynamic-v2"

// Static resources to cache
const STATIC_ASSETS = ["/", "/offline", "/manifest.webmanifest", "/favicon.ico"]

// Never cached, never served from cache: the offline sync outbox and the
// signed-media tickets. A cached ticket is an expired URL; a cached sync
// response is a lie about what landed.
const NEVER_CACHE = ["/api/offline/", "/api/lumos/video/", "/api/lumos/file/"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      console.log("[Service Worker] Caching static assets")
      await cache.addAll(STATIC_ASSETS)
      // The offline page is a React tree: its HTML is useless without the
      // script chunks it references, and those are only cached once fetched.
      // Pull them now so the offline library renders on a device that has
      // never opened /offline while online.
      try {
        const html = await (await cache.match("/offline")).text()
        const urls = new Set()
        for (const m of html.matchAll(
          /(?:src|href)="(\/_next\/static\/[^"]+)"/g
        )) {
          urls.add(m[1])
        }
        await Promise.allSettled([...urls].map((u) => cache.add(u)))
      } catch (err) {
        console.warn("[Service Worker] offline page assets not precached", err)
      }
    })
  )

  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            )
          })
          .map((cacheName) => {
            console.log("[Service Worker] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )

  self.clients.claim()
})

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip Chrome extensions
  if (url.protocol === "chrome-extension:") {
    return
  }

  // Cross-origin (S3 media chunks, CDN) and Range requests go straight to the
  // network: partial responses must never be cached as whole ones.
  if (url.origin !== self.location.origin || request.headers.has("range")) {
    return
  }

  if (NEVER_CACHE.some((prefix) => url.pathname.startsWith(prefix))) {
    return
  }

  // API calls - Network First strategy
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only a good answer is worth keeping; a cached 401 would keep a
          // signed-out state alive across a sign-in.
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }

          return response
        })
        .catch(() => {
          return caches.match(request)
        })
    )
    return
  }

  // Static assets - Cache First strategy
  if (
    url.pathname.match(
      /\.(js|css|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$/
    )
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response
          }

          const responseClone = response.clone()

          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
      })
    )
    return
  }

  // HTML pages - Network First with offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseClone = response.clone()

        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone)
        })

        return response
      })
      .catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline")
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
      })
  )
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
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
  for (const client of clients) {
    client.postMessage({ type: "drain-outbox" })
  }
}

// Push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      timestamp: Date.now(),
    },
  }

  event.waitUntil(
    self.registration.showNotification("Hogwarts School", options)
  )
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  event.waitUntil(clients.openWindow("/"))
})
