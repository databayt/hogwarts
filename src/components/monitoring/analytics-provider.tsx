"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import posthog from "posthog-js"

// Module scope, not an effect: init must run once, before any capture, and
// this file is already a client module mounted in the root layout. UTM params
// (utm_source/medium/campaign — what kun's social pipeline stamps on every
// outbound link) are captured automatically on each $pageview, so social
// attribution starts the moment NEXT_PUBLIC_POSTHOG_KEY exists in the env.
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_POSTHOG_KEY &&
  !posthog.__loaded
) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://eu.i.posthog.com",
    // history-change pageviews — App Router SPA navigations count too.
    defaults: "2025-05-24",
  })
  // use-form.tsx carries guarded window.posthog.capture calls (form_step_view,
  // form_step_complete, …) that have waited for exactly this bridge.
  ;(window as unknown as { posthog?: typeof posthog }).posthog = posthog
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
