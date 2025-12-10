import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ChevronRight, Calendar, Users, Trophy, FileText, Bell } from "lucide-react"
import { isToday, isTomorrow, differenceInDays } from "date-fns"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getParentDashboardData } from "./actions"
import { QuickActions } from "./quick-action"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { ParentDashboardStats } from "@/components/platform/shared/stats"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ProgressCard } from "./progress-card"
import { AnnouncementCard } from "./announcement-card"
import { EmptyState } from "./empty-state"
import { ComparisonLineChart } from "./comparison-chart"
import { TopSection } from "./top-section"
import { QuickLookSection } from "./quick-look-section"
import Link from "next/link"

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

export async function ParentDashboard({ user, dictionary, locale = "en" }: ParentDashboardProps) {
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // Fetch real data from server action with error handling
    let data
    try {
      data = await getParentDashboardData()
    } catch (error) {
      console.error("[ParentDashboard] Error fetching data:", error)
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
        ? data.recentGrades.reduce((sum, g) => sum + g.percentage, 0) / data.recentGrades.length
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
        color: averageGrade >= 80 ? "#22c55e" : averageGrade >= 60 ? "#3b82f6" : "#ef4444",
        current: Math.round(averageGrade),
        target: 100,
        unit: "%",
      },
      {
        label: "Tasks",
        value: Math.max(0, 100 - data.upcomingAssignments.filter((a) => a.status === "NOT_SUBMITTED").length * 20),
        color: "#8b5cf6",
        current: data.upcomingAssignments.filter((a) => a.status !== "NOT_SUBMITTED").length,
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
    const pendingAssignments = data.upcomingAssignments.filter((a) => a.status === "NOT_SUBMITTED").length

    return (
      <div className="space-y-6">
        {/* Section 1: Upcoming Class + Weather (FIRST) */}
        <TopSection locale={locale} subdomain={school?.domain || ""} />

        {/* Section 2: Quick Look */}
        <QuickLookSection locale={locale} subdomain={school?.domain || ""} />

        {/* Key Metrics Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Children" value={data.children.length} iconName="Users" iconColor="text-blue-500" />
          <MetricCard
            title="Attendance"
            value={`${data.attendanceSummary.percentage.toFixed(0)}%`}
            description={`${data.attendanceSummary.presentDays}/${data.attendanceSummary.totalDays} days`}
            iconName="Calendar"
            iconColor={data.attendanceSummary.percentage >= 85 ? "text-green-500" : "text-amber-500"}
            href={`/${locale}/s/${school?.domain}/attendance`}
          />
          <MetricCard
            title="Pending Tasks"
            value={pendingAssignments}
            iconName="FileText"
            iconColor={pendingAssignments > 3 ? "text-destructive" : "text-purple-500"}
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
        <Card className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">Overall Attendance</span>
              </div>
              <Badge variant={data.attendanceSummary.percentage >= 90 ? "default" : "secondary"}>
                {data.attendanceSummary.percentage >= 90 ? "Excellent" : "Keep Going!"}
              </Badge>
            </div>
            <Progress value={data.attendanceSummary.percentage} className="h-3" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>
                {data.attendanceSummary.presentDays} {dashDict.labels.daysPresent}
              </span>
              <span>Target: 90%</span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <QuickActions
          actions={getQuickActionsByRole("GUARDIAN", dictionary, school?.domain ?? undefined)}
          locale={locale}
        />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Children Overview */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                {dashDict.sections.childrenOverview}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.children.length > 0 ? (
                data.children.map((child) => (
                  <div key={child.id} className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">{child.name}</p>
                        <p className="text-sm text-muted-foreground">{child.studentId}</p>
                      </div>
                      <Badge variant="outline">
                        {averageGrade >= 80 ? "Excellent" : averageGrade >= 60 ? "Good" : "Needs Attention"}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Attendance</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={data.attendanceSummary.percentage} className="flex-1 h-2" />
                          <span className="text-sm font-medium">{data.attendanceSummary.percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Grade</p>
                        <p className="text-lg font-bold mt-1">
                          {averageGrade > 0 ? `${averageGrade.toFixed(0)}%` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Tasks Due</p>
                        <p className="text-lg font-bold mt-1">{pendingAssignments}</p>
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
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                {dashDict.sections.recentGrades}
              </CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/grades`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentGrades.length > 0 ? (
                data.recentGrades.slice(0, 4).map((grade) => (
                  <div
                    key={grade.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{grade.examTitle}</p>
                      <p className="text-sm text-muted-foreground">{grade.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {grade.marksObtained}/{grade.totalMarks}
                      </p>
                      <Badge
                        variant={
                          grade.percentage >= 80 ? "default" : grade.percentage >= 60 ? "secondary" : "destructive"
                        }
                        className={
                          grade.percentage >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {grade.percentage.toFixed(0)}%{grade.grade ? ` • ${grade.grade}` : ""}
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
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {dashDict.sections.upcomingAssignments}
              </CardTitle>
              <Badge variant={pendingAssignments > 0 ? "destructive" : "secondary"}>{pendingAssignments} pending</Badge>
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
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
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
                          {assignment.status === "NOT_SUBMITTED" ? dashDict.labels.pending : assignment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
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
                <EmptyState iconName="FileText" title={dashDict.labels.noAssignments} description="All caught up!" />
              )}
            </CardContent>
          </Card>

          {/* School Announcements */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {dashDict.sections.announcements}
              </CardTitle>
              <Badge variant="secondary">{data.announcements.length} new</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {data.announcements.length > 0 ? (
                  data.announcements.slice(0, 4).map((announcement, index) => (
                    <AnnouncementCard
                      key={announcement.id}
                      title={announcement.title}
                      content={announcement.body || "Click to view full announcement"}
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
            current={data.upcomingAssignments.filter((a) => a.status !== "NOT_SUBMITTED").length}
            total={data.upcomingAssignments.length || 1}
            unit="tasks"
            iconName="FileText"
            showPercentage
          />
          <ProgressCard title="Term Progress" current={12} total={16} unit="weeks" iconName="Clock" showPercentage />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[ParentDashboard] Rendering error:", renderError)
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[ParentDashboard] Error message:", errorMessage)
    console.error("[ParentDashboard] Error stack:", errorStack)
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
