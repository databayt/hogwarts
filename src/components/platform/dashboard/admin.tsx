import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Card, CardContent } from "@/components/ui/card"
import { formatDistanceToNow, isValid } from "date-fns"

// Safe date formatting helper
function safeFormatDistanceToNow(date: Date | string | null | undefined): string {
  if (!date) return "recently"
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date
    if (!isValid(dateObj)) return "recently"
    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch {
    return "recently"
  }
}

import { getDashboardSummary, getQuickLookData, type QuickLookData } from "./actions"
import { getTenantContext } from "@/lib/tenant-context"
import { AdminDashboardClient } from "./admin-client"

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

export async function AdminDashboard({ user, dictionary, locale = "en" }: Props) {
  // Wrap entire component in try-catch for comprehensive error handling
  try {
    // Fetch real data from server actions with error handling
    let dashboardData
    let quickLookData: QuickLookData | undefined
    try {
      // Fetch dashboard summary and quick look data in parallel
      const [summaryData, qlData] = await Promise.all([
        getDashboardSummary(),
        getQuickLookData(),
      ])
      dashboardData = summaryData
      quickLookData = qlData
    } catch (error) {
      console.error("[AdminDashboard] Error fetching data:", error)
      return (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="mb-4">Unable to Load Dashboard</h3>
              <p className="text-muted-foreground">
                There was an error loading the dashboard data. Please try refreshing the page.
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
    let school: { domain: string | null; name: string | null } | null = null
    try {
      if (schoolId) {
        const { db } = await import("@/lib/db")
        const id = schoolId // TypeScript narrowing helper
        school = await db.school.findUnique({
          where: { id },
          select: { domain: true, name: true },
        })
      }
    } catch (error) {
      console.error("[AdminDashboard] Error fetching school domain:", error)
    }

    // Destructure real data with safe defaults
    const {
      enrollment = { total: 0, newThisMonth: 0, active: 0 },
      staff = { total: 0, departments: 0, presenceRate: 0 },
      announcements = { total: 0, published: 0, unpublished: 0, recentCount: 0 },
      classes = { total: 0, active: 0, studentTeacherRatio: 0 },
      activities = [],
    } = dashboardData || {}

    // Financial data
    const financialData = {
      totalRevenue: 1250000,
      expenses: 980000,
      profit: 270000,
      collectionRate: 78.4,
    }

    // Prepare data for client component
    const dashboardProps = {
      locale,
      subdomain: school?.domain || "",
      userName: user.name || user.email?.split("@")[0] || "Admin",
      schoolName: school?.name || "Your School",
      // Quick Look data (real-time from database)
      quickLookData,
      // Section 2: Financial data
      financeStats: [
        { label: "Revenue", value: `$${(financialData.totalRevenue / 1000).toFixed(0)}K` },
        {
          label: "Collected",
          value: `$${((financialData.totalRevenue * financialData.collectionRate) / 100000).toFixed(0)}K`,
        },
        {
          label: "Pending",
          value: `$${((financialData.totalRevenue * (100 - financialData.collectionRate)) / 200000).toFixed(0)}K`,
        },
        {
          label: "Overdue",
          value: `$${((financialData.totalRevenue * (100 - financialData.collectionRate)) / 400000).toFixed(0)}K`,
        },
      ],
      // Section 4: Recent Activity data
      recentActivities: activities.slice(0, 4).map((activity) => ({
        action: activity.action,
        user: activity.user,
        time: safeFormatDistanceToNow(activity.timestamp),
        type: activity.type,
      })),
      todaySummary: [
        { label: "New Enrollments", value: enrollment.newThisMonth.toString() },
        {
          label: "Fees Collected",
          value: `$${((financialData.totalRevenue * financialData.collectionRate) / 100000).toFixed(0)}K`,
        },
        { label: "Announcements", value: announcements.recentCount.toString() },
        { label: "Active Classes", value: classes.active.toString() },
      ],
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
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[AdminDashboard] Error message:", errorMessage)
    console.error("[AdminDashboard] Error stack:", errorStack)
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4">Dashboard Rendering Error</h3>
            <p className="text-muted-foreground mb-2">An error occurred while rendering the dashboard.</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">{errorMessage}</pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
