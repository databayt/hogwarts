import type { Dictionary } from "@/components/internationalization/dictionaries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, Bell, ClipboardList, ChevronRight } from "lucide-react"
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
import { getDashboardSummary } from "./actions"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import {
  WelcomeBanner,
  MetricCard,
  ActivityRings,
  ProgressCard,
  AnnouncementCard,
  EmptyState,
} from "../widgets"
import {
  AttendanceTrendChart,
  PerformanceGauge,
  WeeklyActivityChart,
} from "../widgets/dashboard-charts"
import Link from "next/link"

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
    try {
      dashboardData = await getDashboardSummary()
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
    attendance = { attendanceRate: 0, present: 0, absent: 0, late: 0, total: 0 },
    staff = { total: 0, departments: 0, presenceRate: 0 },
    academicPerformance = { averageGPA: null, passRate: null, totalExams: 0, totalAssignments: 0, topPerformers: null },
    announcements = { total: 0, published: 0, unpublished: 0, recentCount: 0 },
    classes = { total: 0, active: 0, studentTeacherRatio: 0 },
    activities = [],
  } = dashboardData || {}

  // Dictionary
  const d = dictionary?.dashboard

  // Activity rings data for key metrics
  const activityData = [
    {
      label: "Attendance",
      value: attendance.attendanceRate || 0,
      color: "#22c55e",
      current: attendance.present || 0,
      target: attendance.total || 100,
      unit: "present",
    },
    {
      label: "Classes",
      value: Math.min(100, (classes.active / Math.max(classes.total, 1)) * 100),
      color: "#3b82f6",
      current: classes.active,
      target: classes.total || 1,
      unit: "active",
    },
    {
      label: "Staff",
      value: staff.presenceRate || 85,
      color: "#f59e0b",
      current: staff.total,
      target: staff.total,
      unit: "staff",
    },
  ]

  // Weekly attendance data for chart
  const weeklyAttendance = [
    { day: "Mon", value: 92 },
    { day: "Tue", value: 95 },
    { day: "Wed", value: 88 },
    { day: "Thu", value: 94 },
    { day: "Fri", value: 91 },
  ]

  // Mock financial data
  const financialData = {
    totalRevenue: 1250000,
    expenses: 980000,
    profit: 270000,
    collectionRate: 78.4,
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user.name || user.email?.split("@")[0]}
        role="Administrator"
        subtitle={`Managing ${school?.name || "your school"}`}
      />

      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Students"
          value={enrollment.total.toLocaleString()}
          change={enrollment.newThisMonth > 0 ? enrollment.newThisMonth : undefined}
          changeType="positive"
          description="new this month"
          iconName="Users"
          iconColor="text-blue-500"
          href={`/${locale}/s/${school?.domain}/students`}
        />
        <MetricCard
          title="Attendance Today"
          value={`${attendance.attendanceRate}%`}
          change={2.3}
          changeType="positive"
          description="vs last week"
          iconName="Calendar"
          iconColor="text-green-500"
          href={`/${locale}/s/${school?.domain}/attendance`}
        />
        <MetricCard
          title="Active Classes"
          value={classes.total}
          iconName="BookOpen"
          iconColor="text-purple-500"
          href={`/${locale}/s/${school?.domain}/subjects`}
        />
        <MetricCard
          title="Total Staff"
          value={staff.total}
          description={`${staff.departments} departments`}
          iconName="Users"
          iconColor="text-orange-500"
          href={`/${locale}/s/${school?.domain}/teachers`}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("ADMIN", dictionary, school?.domain ?? undefined)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Rings + Performance Gauge */}
        <div className="space-y-6">
          <ActivityRings activities={activityData} title="School Performance" />
          <PerformanceGauge
            value={Math.round((academicPerformance.passRate || 85))}
            label="Pass Rate"
            description="Current academic term"
            color="hsl(var(--chart-1))"
          />
        </div>

        {/* Weekly Attendance Chart */}
        <WeeklyActivityChart
          data={weeklyAttendance}
          title="Weekly Attendance"
          label="Attendance %"
          color="hsl(var(--chart-1))"
          className="lg:col-span-2"
        />
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Financial Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Summary
            </CardTitle>
            <Link
              href={`/${locale}/s/${school?.domain}/finance`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View details <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Revenue</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${(financialData.totalRevenue / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expenses</span>
              <span className="font-semibold text-destructive">
                ${(financialData.expenses / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Net Profit</span>
              <span className="font-bold text-primary">
                ${(financialData.profit / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Fee Collection Rate</span>
                <span className="text-sm font-medium">{financialData.collectionRate}%</span>
              </div>
              <Progress value={financialData.collectionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Academic Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {academicPerformance.averageGPA || "3.2"}
                </p>
                <p className="text-xs text-muted-foreground">Average GPA</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {academicPerformance.passRate || 85}%
                </p>
                <p className="text-xs text-muted-foreground">Pass Rate</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Exams</span>
                <span className="font-medium">{academicPerformance.totalExams || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Assignments</span>
                <span className="font-medium">{academicPerformance.totalAssignments || 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Top Performers</span>
                <span className="font-medium">{academicPerformance.topPerformers || "N/A"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Recent Announcements
            </CardTitle>
            <Badge variant="secondary">{announcements.recentCount} new</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.filter(a => a.type === "announcement").length > 0 ? (
              activities
                .filter((a) => a.type === "announcement")
                .slice(0, 3)
                .map((activity, index) => (
                  <AnnouncementCard
                    key={index}
                    title={activity.action.replace("New announcement: ", "")}
                    content="Click to view full announcement details"
                    date={activity.timestamp}
                    priority={index === 0 ? "high" : "normal"}
                  />
                ))
            ) : (
              <EmptyState
                iconName="Bell"
                title="No recent announcements"
                description="New announcements will appear here"
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activities.length > 0 ? (
              activities.slice(0, 4).map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">by {activity.user}</span>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {safeFormatDistanceToNow(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                iconName="ClipboardList"
                title="No recent activities"
                description="Activities will appear here as they happen"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">{classes.studentTeacherRatio}:1</p>
              <p className="text-sm text-muted-foreground mt-1">Student-Teacher Ratio</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enrollment.active} students / {staff.total} teachers
              </p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {(academicPerformance.totalExams || 0) + (academicPerformance.totalAssignments || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Assessments</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {academicPerformance.totalExams} exams, {academicPerformance.totalAssignments} assignments
              </p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {announcements.published}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Published Announcements</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {announcements.unpublished} drafts pending
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-3">
        <ProgressCard
          title="Storage Used"
          current={3.2}
          total={10}
          unit="GB"
          iconName="Settings"
          showPercentage
        />
        <ProgressCard
          title="Monthly API Calls"
          current={45000}
          total={100000}
          unit="calls"
          iconName="TrendingUp"
          showPercentage
        />
        <ProgressCard
          title="Active Sessions"
          current={127}
          total={500}
          unit="users"
          iconName="Users"
          showPercentage
        />
      </div>
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
            <p className="text-muted-foreground mb-2">
              An error occurred while rendering the dashboard.
            </p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {errorMessage}
            </pre>
          </CardContent>
        </Card>
      </div>
    )
  }
}
