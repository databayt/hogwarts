import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getQuickLookData, type QuickLookData } from "./actions"
import { AdminDashboardClient } from "./admin-client"
import { getWeatherData, type WeatherData } from "./weather-actions"

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
    // Fetch real data from server actions with error handling
    let quickLookData: QuickLookData | undefined
    let weatherData: WeatherData | null = null
    try {
      // Fetch quick look and weather data in parallel
      const [qlData, weather] = await Promise.all([
        getQuickLookData(),
        getWeatherData(),
      ])
      quickLookData = qlData
      weatherData = weather
    } catch (error) {
      console.error("[AdminDashboard] Error fetching data:", error)
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4">Unable to Load Dashboard</h3>
              <p className="text-muted-foreground">
                There was an error loading the dashboard data. Please try
                refreshing the page.
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
      console.error("[AdminDashboard] Error getting tenant context:", error)
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
      console.error("[AdminDashboard] Error fetching school domain:", error)
    }

    // Prepare data for client component
    const dashboardProps = {
      locale,
      subdomain: school?.domain || "",
      // Quick Look data (real-time from database)
      quickLookData,
      // Weather data (real-time from OpenWeatherMap)
      weatherData,
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
