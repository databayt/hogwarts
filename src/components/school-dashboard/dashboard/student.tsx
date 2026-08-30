// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  getQuickLookData,
  getStudentDashboardData,
  type QuickLookData,
} from "./actions"
import { StudentDashboardClient } from "./student-client"
import type { StudentDashboardData } from "./types"
import { getWeatherData, type WeatherData } from "./weather-actions"

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
    // Fetch real data from server actions with error handling
    let data: StudentDashboardData
    let quickLookData: QuickLookData | undefined
    let weatherData: WeatherData | null = null
    try {
      // Fetch dashboard, quick look and weather data in parallel
      const [studentData, qlData, weather] = await Promise.all([
        getStudentDashboardData(),
        getQuickLookData(locale),
        getWeatherData("metric", locale),
      ])
      data = studentData
      quickLookData = qlData
      weatherData = weather
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

    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error("[StudentDashboard] Error getting tenant context:", error)
    }

    // Get school subdomain for URL construction with error handling
    let school: { domain: string | null } | null = null
    try {
      if (schoolId) {
        const { db } = await import("@/lib/db")
        const id = schoolId // TypeScript narrowing helper
        school = await db.school.findUnique({
          where: { id },
          select: { domain: true },
        })
      }
    } catch (error) {
      console.error("[StudentDashboard] Error fetching school domain:", error)
    }

    return (
      <div className="space-y-8">
        <StudentDashboardClient
          locale={locale}
          subdomain={school?.domain || ""}
          data={data}
          quickLookData={quickLookData}
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
