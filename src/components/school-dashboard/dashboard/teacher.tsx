// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getTeacherDashboardData } from "./actions"
import { loadDashboardHero } from "./hero-data"
import { TeacherDashboardClient } from "./teacher-client"
import type { TeacherDashboardData } from "./types"

interface TeacherDashboardProps {
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

export async function TeacherDashboard({
  user,
  dictionary,
  locale = "en",
}: TeacherDashboardProps) {
  const errors = dictionary?.teacherDashboard?.errors

  // Wrap entire component in try-catch for comprehensive error handling
  try {
    // Started before this dashboard's own data and awaited beside it —
    // see loadDashboardHero.
    const hero = loadDashboardHero(locale)
    // Fetch real data from server actions with error handling
    let data: TeacherDashboardData
    try {
      // The Quick Look row is still hidden on the teacher dashboard, so
      // `getQuickLookData` is not called here — restore it alongside the JSX
      // in teacher-client. The Upcoming/Weather hero is back, so its fetch is.
      data = await getTeacherDashboardData()
    } catch (error) {
      console.error("[TeacherDashboard] Error fetching data:", error)
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4">
                {errors?.unableToLoad || "Unable to Load Dashboard"}
              </h3>
              <p className="text-muted-foreground">
                {errors?.loadError ||
                  "There was an error loading the dashboard data. Please try refreshing the page."}
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const { weatherData, school } = await hero

    return (
      <div className="space-y-8">
        <TeacherDashboardClient
          locale={locale}
          subdomain={school?.domain || ""}
          data={data}
          weatherData={weatherData}
        />
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[TeacherDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    console.error(
      "[TeacherDashboard] Error stack:",
      (renderError as Error)?.stack
    )
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">
              {errors?.renderError || "Dashboard Rendering Error"}
            </h3>
            <p className="text-muted-foreground mb-2">
              {errors?.renderErrorMessage ||
                "An error occurred while rendering the dashboard."}
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
