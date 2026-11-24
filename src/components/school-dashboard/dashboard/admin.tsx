// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { type QuickLookData } from "./actions"
import { AdminDashboardClient } from "./admin-client"
import { loadDashboardHero } from "./hero-data"
import { adminReadinessOverview, type AdminReadinessOverview } from "./queries"

interface Props {
  user: {
    id: string
    email?: string | null
    role?: string
    schoolId?: string | null
    name?: string
  }
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function AdminDashboard({
  user,
  dictionary,
  locale = "en",
}: Props) {
  // Wrap entire component in try-catch for comprehensive error handling
  try {
    // Started before this dashboard's own data and awaited beside it —
    // see loadDashboardHero.
    const hero = loadDashboardHero(locale)
    // The Quick Look row is still hidden on this dashboard, so its fetch
    // (getQuickLookData) is not made here — restore it alongside the JSX in
    // `admin-client.tsx`. The Upcoming/Weather hero is back, so its fetch is.
    const quickLookData: QuickLookData | undefined = undefined
    const { weatherData, school } = await hero
    // Real class attendance, readiness and follow-up list. A failure here
    // must not take the dashboard down — the charts show their empty state.
    let readiness: AdminReadinessOverview | undefined
    const { schoolId } = await getTenantContext()
    if (schoolId) {
      try {
        readiness = await adminReadinessOverview(schoolId)
      } catch (err) {
        console.error("[AdminDashboard] readiness overview failed:", err)
      }
    }

    // Prepare data for client component
    const dashboardProps = {
      locale,
      subdomain: school?.domain || "",
      // Quick Look data (real-time from database)
      quickLookData,
      // Weather data (real-time from OpenWeatherMap)
      weatherData,
      readiness,
    }

    return (
      <div className="space-y-8">
        {/* Client-side dashboard sections with interactive features */}
        <AdminDashboardClient {...dashboardProps} />
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[AdminDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[AdminDashboard] Error message:", errorMessage)
    console.error("[AdminDashboard] Error stack:", errorStack)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Rendering Error</h3>
            <p className="text-muted-foreground mb-2">
              An error occurred while rendering the dashboard.
            </p>
            <pre className="bg-muted max-h-40 overflow-auto rounded p-2 text-xs">
              {errorMessage}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
