// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getStudentDashboardData } from "./actions"
import { loadDashboardHero } from "./hero-data"
import { StudentDashboardClient } from "./student-client"
import type { StudentDashboardData } from "./types"

interface StudentDashboardProps {
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

export async function StudentDashboard({
  user,
  dictionary,
  locale = "en",
}: StudentDashboardProps) {
  const errors = dictionary?.studentDashboard?.errors

  // Wrap entire component in try-catch for comprehensive error handling
  try {
    // Started before this dashboard's own data and awaited beside it —
    // see loadDashboardHero.
    const hero = loadDashboardHero(locale)
    // Fetch real data from server actions with error handling
    let data: StudentDashboardData
    try {
      // The Quick Look row is still hidden on the student dashboard, so
      // `getQuickLookData` is not called here — restore it alongside the JSX
      // in student-client. The Upcoming/Weather hero is back, so its fetch is.
      data = await getStudentDashboardData()
    } catch (error) {
      console.error("[StudentDashboard] Error fetching data:", error)
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
        <StudentDashboardClient
          locale={locale}
          subdomain={school?.domain || ""}
          data={data}
          weatherData={weatherData}
        />
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[StudentDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    console.error(
      "[StudentDashboard] Error stack:",
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
