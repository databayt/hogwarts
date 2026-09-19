"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useReportWebVitals } from "next/web-vitals"

/**
 * Real-user performance: what teachers' and parents' own phones measure.
 *
 * Core Web Vitals (TTFB, FCP, LCP, INP, CLS) come from Next's
 * `useReportWebVitals`; two app metrics are added here —
 *   NAV  click on a link → first paint of the new route (client navigation)
 *   SRV  the server's own `Server-Timing: total` for a full page load
 *
 * Everything is batched into one `sendBeacon` to /api/rum, which the
 * Cloudflare Worker answers itself (cf/worker.js → Analytics Engine): no
 * container CPU, no database write. Locally the route handler drops it.
 *
 * Privacy: the beacon carries a route PATTERN, never a URL — ids and share
 * tokens are replaced before anything leaves the page — plus coarse device
 * facts. No user id, no names, no query string. Role and country are read by
 * the Worker from the request, not sent by the page.
 *
 * Kept tiny on purpose: this file is in every route's initial JavaScript.
 */

type Sample = { n: string; v: number; r?: string; t?: string }

const ENDPOINT = "/api/rum"
const LOCALE_RE = /^\/(ar|en)(?=\/|$)/
// cuid / uuid / numeric ids, and the long random tokens of share links. The
// digit lookahead keeps a long real segment ("new-verification") a segment.
const ID_RE =
  /^(?:(?=[a-z]*\d)[a-z0-9]{20,}|[0-9a-f]{8}-[0-9a-f-]{27}|\d+|(?=[A-Za-z_-]*\d)[A-Za-z0-9_-]{24,})$/

let queue: Sample[] = []
let timer: ReturnType<typeof setTimeout> | null = null

/** `/ar/students/cm1abc…/grades?x=1` → `/students/[id]/grades` */
export function routePattern(pathname: string): string {
  const path = pathname.replace(LOCALE_RE, "") || "/"
  return path
    .split("/")
    .map((seg) => (ID_RE.test(seg) ? "[id]" : seg))
    .join("/")
    .slice(0, 96)
}

function deviceClass(): string {
  const w = window.innerWidth
  return w < 640 ? "phone" : w < 1024 ? "tablet" : "desktop"
}

function flush(): void {
  if (timer) clearTimeout(timer)
  timer = null
  if (queue.length === 0) return
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
    deviceMemory?: number
  }
  const body = JSON.stringify({
    route: routePattern(location.pathname),
    locale: LOCALE_RE.exec(location.pathname)?.[1] ?? "",
    device: deviceClass(),
    net: nav.connection?.effectiveType ?? "",
    mem: nav.deviceMemory ?? 0,
    cpu: navigator.hardwareConcurrency ?? 0,
    sw: navigator.serviceWorker?.controller ? 1 : 0,
    samples: queue.splice(0, 12),
  })
  queue = []
  try {
    if (!navigator.sendBeacon?.(ENDPOINT, body))
      void fetch(ENDPOINT, { method: "POST", body, keepalive: true })
  } catch {
    // Measuring must never break the page.
  }
}

function record(sample: Sample): void {
  if (!Number.isFinite(sample.v)) return
  queue.push(sample)
  // LCP, CLS and INP settle late; one beacon a few seconds in carries the
  // early ones, and `visibilitychange` below carries the rest.
  timer ??= setTimeout(flush, 5000)
}

// Module scope: `useReportWebVitals` replays every metric to a NEW callback
// reference, so the reference must never change between renders.
const onVital: Parameters<typeof useReportWebVitals>[0] = (metric) => {
  record({
    n: metric.name,
    v: metric.value,
    r: metric.rating,
    t: metric.navigationType,
  })
}

let clickAt = 0

export function WebVitals(): null {
  useReportWebVitals(onVital)
  const pathname = usePathname()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if ((e.target as Element | null)?.closest?.("a[href]"))
        clickAt = e.timeStamp
    }
    const onHide = () => {
      if (document.visibilityState === "hidden") flush()
    }
    addEventListener("click", onClick, { capture: true, passive: true })
    addEventListener("visibilitychange", onHide)
    addEventListener("pagehide", flush)

    const entry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined
    const total = entry?.serverTiming?.find((s) => s.name === "total")
    if (total) record({ n: "SRV", v: total.duration })

    return () => {
      removeEventListener("click", onClick, { capture: true })
      removeEventListener("visibilitychange", onHide)
      removeEventListener("pagehide", flush)
    }
  }, [])

  // A client-side navigation: the pathname changed after a link click.
  useEffect(() => {
    if (!clickAt) return
    const started = clickAt
    clickAt = 0
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const elapsed = performance.now() - started
        if (elapsed > 0 && elapsed < 60_000) record({ n: "NAV", v: elapsed })
      })
    )
  }, [pathname])

  return null
}
