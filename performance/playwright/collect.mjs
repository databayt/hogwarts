// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * In-page and CDP collectors shared by every flow.
 *
 * Two sources, deliberately separate:
 *   - the page itself (PerformanceObserver) → what the user perceives:
 *     TTFB, FCP, LCP, CLS, long tasks / TBT, interaction latency
 *   - the DevTools protocol → what crossed the wire: bytes and requests by
 *     type, cache and service-worker hits, RSC payloads, prefetches
 */

/** Runs in the page before any of its scripts (context.addInitScript). */
export function pageProbe() {
  const p = (window.__perf = {
    fcp: null,
    lcp: null,
    lcpAt: 0,
    lcpElement: null,
    lcpUrl: null,
    clsWindows: [],
    longTasks: [],
    interactions: [],
  })
  const observe = (type, cb, extra = {}) => {
    try {
      new PerformanceObserver((list) => list.getEntries().forEach(cb)).observe(
        { type, buffered: true, ...extra }
      )
    } catch {}
  }
  observe("paint", (e) => {
    if (e.name === "first-contentful-paint") p.fcp = e.startTime
  })
  observe("largest-contentful-paint", (e) => {
    p.lcp = e.startTime
    p.lcpAt = performance.now()
    p.lcpUrl = e.url || null
    const el = e.element
    p.lcpElement = el
      ? `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${
          typeof el.className === "string" && el.className
            ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
            : ""
        }`
      : null
  })
  // CLS = the worst session window (≤5 s long, gaps <1 s), per web.dev.
  observe("layout-shift", (e) => {
    if (e.hadRecentInput) return
    const w = p.clsWindows[p.clsWindows.length - 1]
    if (w && e.startTime - w.last < 1000 && e.startTime - w.first < 5000) {
      w.value += e.value
      w.last = e.startTime
    } else {
      p.clsWindows.push({ first: e.startTime, last: e.startTime, value: e.value })
    }
  })
  observe("longtask", (e) => p.longTasks.push([e.startTime, e.duration]))
  observe(
    "event",
    (e) => {
      if (!e.interactionId) return
      p.interactions.push({
        type: e.name,
        start: e.startTime,
        duration: e.duration,
        inputDelay: e.processingStart - e.startTime,
        processing: e.processingEnd - e.processingStart,
      })
    },
    { durationThreshold: 16 }
  )

  // Soft navigations. The click's own timestamp is t0, so input delay counts.
  const nav = (window.__nav = { armed: false })
  window.__armNav = () => {
    Object.assign(nav, {
      armed: true,
      t0: null,
      fromPath: location.pathname,
      firstMutation: null,
      firstFrame: null,
      urlChanged: null,
      lastMutation: null,
    })
  }
  addEventListener(
    "click",
    (e) => {
      if (nav.armed && nav.t0 == null) nav.t0 = e.timeStamp
    },
    true
  )
  const startObserving = () => {
    new MutationObserver(() => {
      if (!nav.armed || nav.t0 == null) return
      const now = performance.now()
      if (nav.firstMutation == null) {
        nav.firstMutation = now
        requestAnimationFrame(() =>
          requestAnimationFrame(() => (nav.firstFrame = performance.now()))
        )
      }
      nav.lastMutation = now
      if (nav.urlChanged == null && location.pathname !== nav.fromPath)
        nav.urlChanged = now
    }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
  if (document.documentElement) startObserving()
  else addEventListener("DOMContentLoaded", startObserving)
}

/** Read the page probe once the load has settled. */
export async function readPageMetrics(page) {
  return page.evaluate(() => {
    const p = window.__perf
    const nav = performance.getEntriesByType("navigation")[0]
    const fcp = p.fcp ?? 0
    const tbt = p.longTasks
      .filter(([start]) => start >= fcp)
      .reduce((n, [, d]) => n + Math.max(0, d - 50), 0)
    const lastTaskEnd = p.longTasks.reduce((n, [s, d]) => Math.max(n, s + d), 0)
    const skeletons = document.querySelectorAll(
      '[data-slot="skeleton"], .animate-pulse'
    ).length
    return {
      ttfb: nav ? nav.responseStart - nav.startTime : null,
      serverWait: nav ? nav.responseStart - nav.requestStart : null,
      fcp: p.fcp,
      lcp: p.lcp,
      lcpElement: p.lcpElement,
      lcpUrl: p.lcpUrl,
      cls: p.clsWindows.reduce((n, w) => Math.max(n, w.value), 0),
      tbt,
      longTasks: p.longTasks.length,
      longestTask: p.longTasks.reduce((n, [, d]) => Math.max(n, d), 0),
      mainThreadQuiet: lastTaskEnd || null,
      domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
      load: nav ? nav.loadEventEnd : null,
      htmlTransfer: nav ? nav.transferSize : null,
      htmlDecoded: nav ? nav.decodedBodySize : null,
      serverTiming: nav
        ? nav.serverTiming.map((s) => ({
            name: s.name,
            dur: s.duration,
            desc: s.description,
          }))
        : [],
      domNodes: document.getElementsByTagName("*").length,
      skeletonsLeft: skeletons,
      // UTF-8 bytes, not string length: Arabic is one UTF-16 unit but two
      // bytes, and the probe and the wire both count bytes.
      flightBytes: Array.from(document.scripts)
        .filter((s) => !s.src && s.textContent.includes("__next_f"))
        .reduce((n, s) => n + new TextEncoder().encode(s.textContent).length, 0),
    }
  })
}

/** Wait for `load`, then until LCP has stopped moving (or the cap). */
export async function settle(page, { lcpQuietMs, capMs }) {
  await page.waitForLoadState("load", { timeout: capMs }).catch(() => {})
  const started = Date.now()
  while (Date.now() - started < capMs) {
    const quietFor = await page
      .evaluate(() =>
        window.__perf?.lcpAt ? performance.now() - window.__perf.lcpAt : 0
      )
      .catch(() => 0)
    if (quietFor >= lcpQuietMs) return
    await page.waitForTimeout(250)
  }
}

/** Wire-level accounting over a CDP session. `mark()` starts a fresh window. */
export function createNetworkLedger(cdp) {
  let requests = new Map()
  const onRequest = (e) => {
    requests.set(e.requestId, {
      url: e.request.url,
      method: e.request.method,
      type: e.type,
      prefetch:
        "next-router-prefetch" in e.request.headers ||
        "Next-Router-Prefetch" in e.request.headers ||
        "next-router-segment-prefetch" in e.request.headers,
      rsc: /[?&]_rsc=/.test(e.request.url) || "rsc" in e.request.headers,
      action: "next-action" in e.request.headers,
      transfer: 0,
      done: false,
    })
  }
  const onResponse = (e) => {
    const r = requests.get(e.requestId)
    if (!r) return
    const h = Object.fromEntries(
      Object.entries(e.response.headers).map(([k, v]) => [k.toLowerCase(), v])
    )
    Object.assign(r, {
      status: e.response.status,
      type: e.type || r.type,
      fromDiskCache: !!e.response.fromDiskCache,
      fromServiceWorker: !!e.response.fromServiceWorker,
      protocol: e.response.protocol,
      encoding: h["content-encoding"] || null,
      edgeCache: h["x-edge-cache"] || null,
      cfCache: h["cf-cache-status"] || null,
      serverTiming: h["server-timing"] || null,
      timing: e.response.timing
        ? {
            // ms from request sent to first byte — excludes DNS/TCP/TLS
            wait: e.response.timing.receiveHeadersEnd - e.response.timing.sendEnd,
          }
        : null,
    })
  }
  const onFinished = (e) => {
    const r = requests.get(e.requestId)
    if (!r) return
    r.transfer = e.encodedDataLength
    r.done = true
  }
  cdp.on("Network.requestWillBeSent", onRequest)
  cdp.on("Network.responseReceived", onResponse)
  cdp.on("Network.loadingFinished", onFinished)

  const bucket = (r) => {
    if (r.action) return "serverAction"
    if (r.rsc) return r.prefetch ? "rscPrefetch" : "rsc"
    switch (r.type) {
      case "Document":
        return "document"
      case "Script":
        return "script"
      case "Stylesheet":
        return "stylesheet"
      case "Font":
        return "font"
      case "Image":
        return "image"
      case "Fetch":
      case "XHR":
        return "api"
      default:
        return "other"
    }
  }

  return {
    mark() {
      requests = new Map()
    },
    summary(origin) {
      const all = [...requests.values()].filter((r) => !r.url.startsWith("data:"))
      const by = {}
      for (const r of all) {
        const b = (by[bucket(r)] ??= { requests: 0, transfer: 0 })
        b.requests++
        b.transfer += r.transfer
      }
      const network = all.filter((r) => !r.fromDiskCache && !r.fromServiceWorker)
      const sameOrigin = all.filter((r) => r.url.startsWith(origin))
      const statics = sameOrigin.filter((r) => r.url.includes("/_next/static/"))
      return {
        requests: all.length,
        transfer: all.reduce((n, r) => n + r.transfer, 0),
        networkRequests: network.length,
        fromDiskCache: all.filter((r) => r.fromDiskCache).length,
        fromServiceWorker: all.filter((r) => r.fromServiceWorker).length,
        thirdPartyRequests: all.length - sameOrigin.length,
        byType: by,
        edgeCache: {
          hit: statics.filter((r) => r.edgeCache === "hit").length,
          miss: statics.filter((r) => r.edgeCache === "miss").length,
          bypass: statics.filter((r) => r.edgeCache === "bypass").length,
        },
        failed: all.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.url}`),
        largest: [...all]
          .sort((a, b) => b.transfer - a.transfer)
          .slice(0, 8)
          .map((r) => ({
            url: r.url.replace(origin, ""),
            type: bucket(r),
            transfer: r.transfer,
            encoding: r.encoding,
          })),
        dynamicWaits: sameOrigin
          .filter((r) => r.timing && ["document", "rsc", "serverAction"].includes(bucket(r)))
          .map((r) => ({
            url: r.url.replace(origin, "").slice(0, 80),
            type: bucket(r),
            wait: Math.round(r.timing.wait),
            transfer: r.transfer,
          })),
      }
    },
  }
}
