"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { usePathname } from "next/navigation"
// PostHog is ~74 KB gzip and this module is in the initial JavaScript of
// every route, login included. A static import made every visitor download
// and parse it before the page could hydrate — even in production, where no
// NEXT_PUBLIC_POSTHOG_KEY was configured and the library never ran
// (measured 2026-09-19: on 490 of 493 routes). It is now fetched only when a
// key exists, and only once the browser is idle.
//
// UTM params (utm_source/medium/campaign — what kun's social pipeline stamps on
// every outbound link) are still captured on the first $pageview: init reads
// the landing URL, and idle fires within 3 s.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY

function startPostHog(): void {
  if (!POSTHOG_KEY) return
  void import("posthog-js").then(({ default: posthog }) => {
    if (posthog.__loaded) return
    posthog.init(POSTHOG_KEY, {
      api_host: "https://eu.i.posthog.com",
      // history-change pageviews — App Router SPA navigations count too.
      defaults: "2025-05-24",
    })
    // use-form.tsx carries guarded window.posthog.capture calls (form_step_view,
    // form_step_complete, …) that have waited for exactly this bridge.
    ;(window as unknown as { posthog?: typeof posthog }).posthog = posthog
  })
}

type WindowWithVa = Window & {
  va?: (event: string, payload: Record<string, unknown>) => void
}

/**
 * Vercel Analytics and Speed Insights used to mount here. The app left Vercel
 * for Cloudflare on 2026-09-07: their scripts (`/_vercel/insights/script.js`,
 * `/_vercel/speed-insights/script.js`) answer 404 on every page load, so all
 * they did was two failed requests and their bundle weight. PostHog is the
 * analytics that still reports.
 */
export function AnalyticsProvider() {
  const pathname = usePathname()

  useEffect(() => {
    if (!POSTHOG_KEY) return
    const idle = (
      window as Window & {
        requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      }
    ).requestIdleCallback
    if (idle) idle(startPostHog, { timeout: 3000 })
    else setTimeout(startPostHog, 2000)
  }, [])

  useEffect(() => {
    const va = (window as WindowWithVa).va
    if (va) {
      va("event", {
        name: "page_view",
        category: "user_action",
        path: pathname,
      })
    }
  }, [pathname])

  return null
}
