import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { ChevronRight, Calendar, FileText, GraduationCap, Clock } from "lucide-react"
import { format, isToday, isTomorrow } from "date-fns"
import { getTeacherDashboardData, getQuickLookData } from "./actions"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { TeacherDashboardStats } from "@/components/platform/shared/stats"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ScheduleItem } from "./schedule-item"
import { ProgressCard } from "./progress-card"
import { EmptyState } from "./empty-state"
import { WeeklyActivityChart } from "./weekly-chart"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { InvoiceHistorySection } from "./invoice-history-section"
import { ChartSection } from "./chart-section"
import { SectionHeading } from "./section-heading"
import Link from "next/link"

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

export async function TeacherDashboard({ user, dictionary, locale = "en" }: TeacherDashboardProps) {
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // Fetch real data from server action with error handling
    let data
    let quickLookData
    try {
      const [teacherData, qlData] = await Promise.all([
        getTeacherDashboardData(),
        getQuickLookData(),
      ])
      data = teacherData
      quickLookData = qlData
    } catch (error) {
      console.error("[TeacherDashboard] Error fetching data:", error)
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
      console.error("[TeacherDashboard] Error getting tenant context:", error)
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
      console.error("[TeacherDashboard] Error fetching school domain:", error)
    }

    // Get dictionary with fallback
    const dashDict = dictionary?.teacherDashboard || {
      stats: {
        todaysClasses: "Today's Classes",
        pendingGrading: "Pending Grading",
        attendanceDue: "Attendance Due",
        totalStudents: "Total Students",
      },
      quickActions: {
        title: "Quick Actions",
        takeAttendance: "Take Attendance",
        enterGrades: "Enter Grades",
        createAssignment: "Create Assignment",
        messageParents: "Message Parents",
      },
      sections: {
        todaysClasses: "Today's Classes",
        pendingAssignments: "Pending Assignments",
        classPerformance: "Class Performance Summary",
        upcomingDeadlines: "Upcoming Deadlines",
      },
      labels: {
        classesScheduled: "Classes scheduled",
        assignmentsToGrade: "Assignments to grade",
        needAttendance: "Classes need attendance",
        acrossAllClasses: "Across all classes",
        room: "Room",
        students: "students",
        submissions: "submissions",
        due: "Due",
        noPending: "No pending assignments",
        noClasses: "No classes scheduled for today",
        noDeadlines: "No upcoming deadlines",
        average: "Average",
        noPerformanceData: "No performance data available",
      },
    }

    // Activity rings for teaching metrics
    const activityData = [
      {
        label: "Classes",
        value: Math.min(100, (data.todaysClasses.length / 8) * 100),
        color: "#3b82f6",
        current: data.todaysClasses.length,
        target: 8,
        unit: "today",
      },
      {
        label: "Grading",
        value: Math.max(0, 100 - data.pendingGrading * 10),
        color: data.pendingGrading > 5 ? "#ef4444" : "#22c55e",
        current: data.pendingGrading,
        target: 0,
        unit: "pending",
      },
      {
        label: "Students",
        value: 100,
        color: "#8b5cf6",
        current: data.totalStudents,
        target: data.totalStudents,
        unit: "total",
      },
    ]

    // Weekly classes data
    const weeklyClasses = [
      { day: "Mon", value: 5 },
      { day: "Tue", value: 6 },
      { day: "Wed", value: data.todaysClasses.length || 4 },
      { day: "Thu", value: 6 },
      { day: "Fri", value: 3 },
    ]

    return (
      <div className="space-y-6">
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
          <Upcoming role="TEACHER" locale={locale} subdomain={school?.domain || ""} />
          <Weather />
        </div>

        {/* Section 2: Quick Look (no title) */}
        <QuickLookSection locale={locale} subdomain={school?.domain || ""} data={quickLookData} />

        {/* Section 3: Quick Actions (4 focused actions) */}
        <section>
          <SectionHeading title="Quick Actions" />
          <QuickActions
            actions={getQuickActionsByRole("TEACHER", school?.domain ?? undefined)}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="TEACHER" />

        {/* Section 5: Invoice History (Expense Claims) */}
        <InvoiceHistorySection role="TEACHER" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="TEACHER" />

        {/* ============ TEACHER-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Today's Classes"
            value={data.todaysClasses.length}
            iconName="BookOpen"
            iconColor="text-blue-500"
            href={`/${locale}/s/${school?.domain}/subjects`}
          />
          <MetricCard
            title="Total Students"
            value={data.totalStudents}
            iconName="Users"
            iconColor="text-purple-500"
            href={`/${locale}/s/${school?.domain}/students`}
          />
          <MetricCard
            title="Pending Grading"
            value={data.pendingGrading}
            iconName="FileText"
            iconColor={data.pendingGrading > 5 ? "text-destructive" : "text-orange-500"}
            href={`/${locale}/s/${school?.domain}/assignments`}
          />
          <MetricCard
            title="Attendance Due"
            value={data.attendanceDue}
            iconName="CheckCircle"
            iconColor={data.attendanceDue > 0 ? "text-amber-500" : "text-green-500"}
            href={`/${locale}/s/${school?.domain}/attendance`}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's Schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {dashDict.sections.todaysClasses}
              </CardTitle>
              <Badge variant="outline">{format(new Date(), "EEEE, MMM d")}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.todaysClasses.length > 0 ? (
                data.todaysClasses.map((cls, index) => (
                  <ScheduleItem
                    key={cls.id}
                    time={cls.time}
                    title={cls.name}
                    subtitle={`${dashDict.labels.room} ${cls.room} • ${cls.students} ${dashDict.labels.students}`}
                    badge={index === 0 ? "Next" : undefined}
                    badgeVariant={index === 0 ? "default" : "secondary"}
                    isActive={index === 0}
                  />
                ))
              ) : (
                <EmptyState iconName="Calendar" title={dashDict.labels.noClasses} description="Enjoy your day off!" />
              )}
            </CardContent>
          </Card>

          {/* Activity Rings */}
          <ActivityRings activities={activityData} title="Teaching Progress" />
        </div>

        {/* Secondary Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Classes Chart */}
          <WeeklyActivityChart data={weeklyClasses} title="Classes This Week" label="Classes" color="hsl(var(--chart-1))" />

          {/* Pending Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {dashDict.sections.pendingAssignments}
              </CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/assignments`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pendingAssignments.length > 0 ? (
                data.pendingAssignments.slice(0, 4).map((assignment) => {
                  const dueDate = new Date(assignment.dueDate)
                  const isOverdue = dueDate < new Date()
                  const isDueToday = isToday(dueDate)
                  const isDueTomorrow = isTomorrow(dueDate)

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.className} • {assignment.submissionsCount} {dashDict.labels.submissions}
                        </p>
                      </div>
                      <Badge
                        variant={
                          isOverdue ? "destructive" : isDueToday ? "default" : isDueTomorrow ? "secondary" : "outline"
                        }
                      >
                        {isOverdue
                          ? "Overdue"
                          : isDueToday
                            ? "Due Today"
                            : isDueTomorrow
                              ? "Tomorrow"
                              : format(dueDate, "MMM d")}
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  iconName="FileText"
                  title={dashDict.labels.noPending}
                  description="All assignments have been graded"
                />
              )}
            </CardContent>
          </Card>

          {/* Class Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                {dashDict.sections.classPerformance}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.classPerformance.length > 0 ? (
                data.classPerformance.slice(0, 4).map((cls, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{cls.className}</p>
                      <p className="text-sm text-muted-foreground">
                        {dashDict.labels.average}: {cls.average.toFixed(1)}%
                      </p>
                    </div>
                    <Badge
                      variant={cls.average >= 80 ? "default" : cls.average >= 60 ? "secondary" : "destructive"}
                      className={
                        cls.average >= 80
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : ""
                      }
                    >
                      {cls.average >= 80 ? "Excellent" : cls.average >= 60 ? "Good" : "Needs Attention"}
                    </Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="GraduationCap"
                  title={dashDict.labels.noPerformanceData}
                  description="Performance data will appear after assessments"
                />
              )}
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {dashDict.sections.upcomingDeadlines}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingDeadlines.length > 0 ? (
                data.upcomingDeadlines.slice(0, 4).map((deadline) => {
                  const dueDate = new Date(deadline.dueDate)
                  const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                  return (
                    <div
                      key={deadline.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{deadline.task}</p>
                        <p className="text-sm text-muted-foreground">
                          {dashDict.labels.due}: {format(dueDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant={daysLeft <= 2 ? "destructive" : daysLeft <= 7 ? "secondary" : "outline"}>
                        {daysLeft <= 0 ? "Today" : daysLeft === 1 ? "1 day" : `${daysLeft} days`}
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <EmptyState
                  iconName="Clock"
                  title={dashDict.labels.noDeadlines}
                  description="No upcoming deadlines to worry about"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Teaching Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Teaching Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-primary">{data.todaysClasses.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Classes Today</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.totalStudents}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Students</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {data.pendingAssignments.length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Assignments</p>
              </div>
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.classPerformance.length > 0
                    ? `${(data.classPerformance.reduce((sum, c) => sum + c.average, 0) / data.classPerformance.length).toFixed(0)}%`
                    : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Avg Performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Grading Progress"
            current={Math.max(0, data.pendingAssignments.length - data.pendingGrading)}
            total={Math.max(data.pendingAssignments.length, 1)}
            unit="graded"
            iconName="CheckCircle"
            showPercentage
          />
          <ProgressCard
            title="Attendance Taken"
            current={data.todaysClasses.length - data.attendanceDue}
            total={Math.max(data.todaysClasses.length, 1)}
            unit="classes"
            iconName="Calendar"
            showPercentage
          />
          <ProgressCard title="Term Progress" current={12} total={16} unit="weeks" iconName="Clock" showPercentage />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[TeacherDashboard] Rendering error:", renderError)
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[TeacherDashboard] Error message:", errorMessage)
    console.error("[TeacherDashboard] Error stack:", errorStack)
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
