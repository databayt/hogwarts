"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  ;(window as any).posthog = posthog
}

export function AnalyticsProvider() {
  const pathname = usePathname()

  useEffect(() => {
    // Track page views using Vercel Analytics instead of monitoring service
    // The monitoring service is server-side only
    if (typeof window !== "undefined" && (window as any).va) {
      ;(window as any).va("event", {
        name: "page_view",
        category: "user_action",
        path: pathname,
      })
    }
  }, [pathname])

  return (
    <>
      <Analytics
        beforeSend={(event) => {
          // Add custom properties to analytics events
          if (typeof window !== "undefined") {
            const schoolId = (window as any).__SCHOOL_ID__
            if (schoolId) {
              return {
                ...event,
                schoolId,
              }
            }
          }
          return event
        }}
      />
      <SpeedInsights />
    </>
  )
}
