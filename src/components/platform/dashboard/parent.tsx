import Link from "next/link"
import { differenceInDays, isToday, isTomorrow } from "date-fns"
import {
  Bell,
  Calendar,
  ChevronRight,
  FileText,
  Trophy,
  Users,
} from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { ParentDashboardStats } from "@/components/platform/shared/stats"

import { getParentDashboardData, getQuickLookData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { AnnouncementCard } from "./announcement-card"
import { ChartSection } from "./chart-section"
import { ComparisonLineChart } from "./comparison-chart"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { getWeatherData } from "./weather-actions"

interface ParentDashboardProps {
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

export async function ParentDashboard({
  user,
  dictionary,
  locale = "en",
}: ParentDashboardProps) {
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // Fetch real data from server action with error handling
    let data
    let quickLookData
    let weatherData
    try {
      const [parentData, qlData, weather] = await Promise.all([
        getParentDashboardData(),
        getQuickLookData(),
        getWeatherData(),
      ])
      data = parentData
      quickLookData = qlData
      weatherData = weather
    } catch (error) {
      console.error("[ParentDashboard] Error fetching data:", error)
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

    // Get tenant context for subdomain
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error("[ParentDashboard] Error getting tenant context:", error)
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
      console.error("[ParentDashboard] Error fetching school domain:", error)
    }

    // Get dictionary with fallback
    const dashDict = dictionary?.parentDashboard || {
      stats: {
        children: "Children",
        attendance: "Attendance",
        assignments: "Assignments",
        announcements: "Announcements",
      },
      sections: {
        childrenOverview: "Children Overview",
        recentGrades: "Recent Grades",
        upcomingAssignments: "Upcoming Assignments",
        announcements: "School Announcements",
        attendanceSummary: "Attendance Summary",
      },
      labels: {
        enrolledStudents: "Enrolled students",
        daysPresent: "days present",
        upcoming: "Upcoming",
        newMessages: "New messages",
        noChildren: "No children found",
        noGrades: "No recent grades",
        noAssignments: "No upcoming assignments",
        noAnnouncements: "No announcements",
        due: "Due",
        pending: "Pending",
        attendance: "Attendance",
        recentGrades: "Recent Grades",
        presentDays: "Present Days",
      },
    }

    // Calculate average grade
    const averageGrade =
      data.recentGrades.length > 0
        ? data.recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
          data.recentGrades.length
        : 0

    // Activity rings for children's progress
    const activityData = [
      {
        label: "Attendance",
        value: data.attendanceSummary.percentage,
        color: data.attendanceSummary.percentage >= 85 ? "#22c55e" : "#f59e0b",
        current: data.attendanceSummary.presentDays,
        target: data.attendanceSummary.totalDays,
        unit: "days",
      },
      {
        label: "Grades",
        value: averageGrade,
        color:
          averageGrade >= 80
            ? "#22c55e"
            : averageGrade >= 60
              ? "#3b82f6"
              : "#ef4444",
        current: Math.round(averageGrade),
        target: 100,
        unit: "%",
      },
      {
        label: "Tasks",
        value: Math.max(
          0,
          100 -
            data.upcomingAssignments.filter((a) => a.status === "NOT_SUBMITTED")
              .length *
              20
        ),
        color: "#8b5cf6",
        current: data.upcomingAssignments.filter(
          (a) => a.status !== "NOT_SUBMITTED"
        ).length,
        target: data.upcomingAssignments.length || 1,
        unit: "done",
      },
    ]

    // Mock grade trend data
    const gradeTrendData = [
      { period: "Sep", current: 75, previous: 70 },
      { period: "Oct", current: 78, previous: 72 },
      { period: "Nov", current: 82, previous: 75 },
      { period: "Dec", current: averageGrade || 85, previous: 78 },
    ]

    // Count pending assignments
    const pendingAssignments = data.upcomingAssignments.filter(
      (a) => a.status === "NOT_SUBMITTED"
    ).length

    return (
      <div className="space-y-6">
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
          <Upcoming
            role="GUARDIAN"
            locale={locale}
            subdomain={school?.domain || ""}
          />
          <Weather
            current={weatherData?.current}
            forecast={weatherData?.forecast}
            location={weatherData?.location}
          />
        </div>

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection
          locale={locale}
          subdomain={school?.domain || ""}
          data={quickLookData}
        />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <section>
          <SectionHeading title="Quick Actions" />
          <QuickActions
            actions={getQuickActionsByRole(
              "GUARDIAN",
              school?.domain ?? undefined
            )}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="GUARDIAN" />

        {/* Section 5: Invoice History (Children's Fees) */}
        <InvoiceHistorySection role="GUARDIAN" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="GUARDIAN" />

        {/* ============ PARENT-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Children"
            value={data.children.length}
            iconName="Users"
            iconColor="text-blue-500"
          />
          <MetricCard
            title="Attendance"
            value={`${data.attendanceSummary.percentage.toFixed(0)}%`}
            description={`${data.attendanceSummary.presentDays}/${data.attendanceSummary.totalDays} days`}
            iconName="Calendar"
            iconColor={
              data.attendanceSummary.percentage >= 85
                ? "text-green-500"
                : "text-amber-500"
            }
            href={`/${locale}/s/${school?.domain}/attendance`}
          />
          <MetricCard
            title="Pending Tasks"
            value={pendingAssignments}
            iconName="FileText"
            iconColor={
              pendingAssignments > 3 ? "text-destructive" : "text-purple-500"
            }
            href={`/${locale}/s/${school?.domain}/assignments`}
          />
          <MetricCard
            title="Announcements"
            value={data.announcements.length}
            iconName="Bell"
            iconColor="text-orange-500"
            href={`/${locale}/s/${school?.domain}/announcements`}
          />
        </div>

        {/* Attendance Progress Card */}
        <Card className="from-primary/5 bg-gradient-to-r via-transparent to-transparent">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-primary h-4 w-4" />
                <span className="font-medium">Overall Attendance</span>
              </div>
              <Badge
                variant={
                  data.attendanceSummary.percentage >= 90
                    ? "default"
                    : "secondary"
                }
              >
                {data.attendanceSummary.percentage >= 90
                  ? "Excellent"
                  : "Keep Going!"}
              </Badge>
            </div>
            <Progress
              value={data.attendanceSummary.percentage}
              className="h-3"
            />
            <div className="text-muted-foreground mt-2 flex justify-between text-sm">
              <span>
                {data.attendanceSummary.presentDays}{" "}
                {dashDict.labels.daysPresent}
              </span>
              <span>Target: 90%</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Children Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                {dashDict.sections.childrenOverview}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.children.length > 0 ? (
                data.children.map((child) => (
                  <div
                    key={child.id}
                    className="hover:bg-muted/50 rounded-lg border p-4 transition-colors"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{child.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {child.studentId}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {averageGrade >= 80
                          ? "Excellent"
                          : averageGrade >= 60
                            ? "Good"
                            : "Needs Attention"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Attendance
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress
                            value={data.attendanceSummary.percentage}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-medium">
                            {data.attendanceSummary.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Avg Grade
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {averageGrade > 0
                            ? `${averageGrade.toFixed(0)}%`
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs tracking-wide uppercase">
                          Tasks Due
                        </p>
                        <p className="mt-1 text-lg font-bold">
                          {pendingAssignments}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Users"
                  title={dashDict.labels.noChildren}
                  description="Your children will appear here once enrolled"
                />
              )}
            </CardContent>
          </Card>

          {/* Activity Rings */}
          <ActivityRings activities={activityData} title="Child Progress" />
        </div>

        {/* Secondary Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Grades */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4" />
                {dashDict.sections.recentGrades}
              </CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/grades`}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentGrades.length > 0 ? (
                data.recentGrades.slice(0, 4).map((grade) => (
                  <div
                    key={grade.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{grade.examTitle}</p>
                      <p className="text-muted-foreground text-sm">
                        {grade.subject}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {grade.marksObtained}/{grade.totalMarks}
                      </p>
                      <Badge
                        variant={
                          grade.percentage >= 80
                            ? "default"
                            : grade.percentage >= 60
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          grade.percentage >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {grade.percentage.toFixed(0)}%
                        {grade.grade ? ` • ${grade.grade}` : ""}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Trophy"
                  title={dashDict.labels.noGrades}
                  description="Grades will appear here after assessments"
                />
              )}
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                {dashDict.sections.upcomingAssignments}
              </CardTitle>
              <Badge
                variant={pendingAssignments > 0 ? "destructive" : "secondary"}
              >
                {pendingAssignments} pending
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingAssignments.length > 0 ? (
                data.upcomingAssignments.slice(0, 4).map((assignment) => {
                  const dueDate = new Date(assignment.dueDate)
                  const isDueToday = isToday(dueDate)
                  const isDueTomorrow = isTomorrow(dueDate)
                  const daysUntil = differenceInDays(dueDate, new Date())
                  const isOverdue = daysUntil < 0

                  return (
                    <div
                      key={assignment.id}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {assignment.title}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {assignment.subject} • {assignment.className}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            assignment.status === "NOT_SUBMITTED" || isOverdue
                              ? "destructive"
                              : assignment.status === "SUBMITTED"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {assignment.status === "NOT_SUBMITTED"
                            ? dashDict.labels.pending
                            : assignment.status}
                        </Badge>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {isOverdue
                            ? "Overdue"
                            : isDueToday
                              ? "Due Today"
                              : isDueTomorrow
                                ? "Tomorrow"
                                : `${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  iconName="FileText"
                  title={dashDict.labels.noAssignments}
                  description="All caught up!"
                />
              )}
            </CardContent>
          </Card>

          {/* School Announcements */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4" />
                {dashDict.sections.announcements}
              </CardTitle>
              <Badge variant="secondary">{data.announcements.length} new</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {data.announcements.length > 0 ? (
                  data.announcements
                    .slice(0, 4)
                    .map((announcement, index) => (
                      <AnnouncementCard
                        key={announcement.id}
                        title={announcement.title}
                        content={
                          announcement.body || "Click to view full announcement"
                        }
                        date={announcement.createdAt}
                        priority={index === 0 ? "high" : "normal"}
                      />
                    ))
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState
                      iconName="Bell"
                      title={dashDict.labels.noAnnouncements}
                      description="New announcements will appear here"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade Trend Chart */}
        <ComparisonLineChart
          data={gradeTrendData}
          title="Academic Progress"
          description="Your child's performance compared to last term"
          currentLabel="This Term"
          previousLabel="Last Term"
        />

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Attendance Goal"
            current={data.attendanceSummary.presentDays}
            total={data.attendanceSummary.totalDays}
            unit="days"
            iconName="Calendar"
            showPercentage
          />
          <ProgressCard
            title="Assignments Completed"
            current={
              data.upcomingAssignments.filter(
                (a) => a.status !== "NOT_SUBMITTED"
              ).length
            }
            total={data.upcomingAssignments.length || 1}
            unit="tasks"
            iconName="FileText"
            showPercentage
          />
          <ProgressCard
            title="Term Progress"
            current={12}
            total={16}
            unit="weeks"
            iconName="Clock"
            showPercentage
          />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[ParentDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[ParentDashboard] Error message:", errorMessage)
    console.error("[ParentDashboard] Error stack:", errorStack)
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
