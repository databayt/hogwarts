"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

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
