import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getPrincipalDashboardData, getQuickLookData } from "./actions"
import { ActivityRings } from "./activity-rings"
import { ChartSection } from "./chart-section"
import { ComparisonLineChart } from "./comparison-chart"
import { EmptyState } from "./empty-state"
import { InvoiceHistorySection } from "./invoice-history-section"
import { MetricCard } from "./metric-card"
import { PerformanceGauge } from "./performance-gauge"
import { ProgressCard } from "./progress-card"
import { QuickActions } from "./quick-actions"
import { getQuickActionsByRole } from "./quick-actions-config"
import { QuickLookSection } from "./quick-look-section"
import { ResourceUsageSection } from "./resource-usage-section"
import { SectionHeading } from "./section-heading"
import { Upcoming } from "./upcoming"
import { Weather } from "./weather"
import { getWeatherData } from "./weather-actions"
import { WeeklyActivityChart } from "./weekly-chart"

interface PrincipalDashboardProps {
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

export async function PrincipalDashboard({
  user,
  dictionary,
  locale = "en",
}: PrincipalDashboardProps) {
  // Wrap entire component in try-catch for comprehensive error handling (like AdminDashboard)
  try {
    // Fetch Quick Look and Weather data
    let quickLookData
    let weatherData
    try {
      const [qlData, weather] = await Promise.all([
        getQuickLookData(),
        getWeatherData(),
      ])
      quickLookData = qlData
      weatherData = weather
    } catch (error) {
      console.error("[PrincipalDashboard] Error fetching data:", error)
    }

    // Get tenant context for subdomain with error handling
    let schoolId: string | null = null
    try {
      const tenantContext = await getTenantContext()
      schoolId = tenantContext.schoolId
    } catch (error) {
      console.error("[PrincipalDashboard] Error getting tenant context:", error)
    }

    // Get school info for URL construction and display
    let school: { domain: string | null; name: string | null } | null = null
    try {
      if (schoolId) {
        const { db } = await import("@/lib/db")
        const id = schoolId
        school = await db.school.findUnique({
          where: { id },
          select: { domain: true, name: true },
        })
      }
    } catch (error) {
      console.error("[PrincipalDashboard] Error fetching school domain:", error)
    }

    // Fetch real data from database with error handling
    let totalStudents = 0
    let totalTeachers = 0
    let totalClasses = 0
    let recentAnnouncements: {
      id: string
      titleEn: string | null
      createdAt: Date
    }[] = []

    try {
      if (user.schoolId) {
        const { db } = await import("@/lib/db")
        const [students, teachers, classes, announcements] = await Promise.all([
          db.student.count({ where: { schoolId: user.schoolId } }),
          db.teacher.count({ where: { schoolId: user.schoolId } }),
          db.class.count({ where: { schoolId: user.schoolId } }),
          db.announcement.findMany({
            where: { schoolId: user.schoolId, published: true },
            take: 5,
            orderBy: { createdAt: "desc" },
            select: { id: true, titleEn: true, createdAt: true },
          }),
        ])
        totalStudents = students
        totalTeachers = teachers
        totalClasses = classes
        recentAnnouncements = announcements
      }
    } catch (error) {
      console.error("[PrincipalDashboard] Error fetching school data:", error)
    }

    // Fetch principal dashboard data from centralized server action
    let principalData
    try {
      principalData = await getPrincipalDashboardData()
    } catch (error) {
      console.error(
        "[PrincipalDashboard] Error fetching principal data:",
        error
      )
    }

    // Destructure with defaults for error handling
    const {
      performanceScorecard: mockPerformanceScorecard = {
        overall: 0,
        academic: 0,
        attendance: 0,
        discipline: 0,
        parentSatisfaction: 0,
      },
      criticalAlerts: mockCriticalAlerts = [],
      todaysPriorities: mockTodaysPriorities = [],
      academicTrends: mockAcademicTrends = [],
      disciplinarySummary: mockDisciplinarySummary = {
        totalIncidents: 0,
        resolved: 0,
        pending: 0,
        topIssues: [],
      },
      staffEvaluations: mockStaffEvaluations = [],
      budgetStatus: mockBudgetStatus = {
        allocated: 0,
        spent: 0,
        remaining: 0,
        utilization: 0,
        projections: "On track",
      },
      parentFeedback: mockParentFeedback = {
        overall: 0,
        satisfaction: 0,
        communication: 0,
        academicQuality: 0,
        facilities: 0,
      },
      goalProgress: mockGoalProgress = [],
      boardMeetings: mockBoardMeetings = [],
    } = principalData || {}

    const weeklyAttendance = [
      { day: "Mon", value: 94 },
      { day: "Tue", value: 92 },
      { day: "Wed", value: 93 },
      { day: "Thu", value: 91 },
      { day: "Fri", value: 88 },
    ]

    const gradeComparison = [
      { period: "Sep", current: 78, previous: 75 },
      { period: "Oct", current: 80, previous: 76 },
      { period: "Nov", current: 79, previous: 77 },
      { period: "Dec", current: 82, previous: 78 },
      { period: "Jan", current: 81, previous: 79 },
      { period: "Feb", current: 84, previous: 80 },
    ]

    // Activity rings for school performance
    const performanceRings = [
      {
        label: "Academic",
        value: mockPerformanceScorecard.academic,
        color: "#22c55e",
        current: mockPerformanceScorecard.academic,
        target: 100,
        unit: "score",
      },
      {
        label: "Attendance",
        value: mockPerformanceScorecard.attendance,
        color: "#3b82f6",
        current: mockPerformanceScorecard.attendance,
        target: 100,
        unit: "rate",
      },
      {
        label: "Satisfaction",
        value: mockPerformanceScorecard.parentSatisfaction,
        color: "#8b5cf6",
        current: mockPerformanceScorecard.parentSatisfaction,
        target: 100,
        unit: "score",
      },
    ]

    const studentTeacherRatio =
      totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0

    return (
      <div className="space-y-6">
        {/* ============ TOP HERO SECTION (Unified Order) ============ */}
        {/* Section 1: Upcoming + Weather */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-8">
          <Upcoming
            role="PRINCIPAL"
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
              "PRINCIPAL",
              school?.domain ?? undefined
            )}
            locale={locale}
          />
        </section>

        {/* Section 4: Resource Usage */}
        <ResourceUsageSection role="PRINCIPAL" />

        {/* Section 5: Invoice History (Budget Invoices) */}
        <InvoiceHistorySection role="PRINCIPAL" />

        {/* Section 6: Analytics Charts */}
        <ChartSection role="PRINCIPAL" />

        {/* ============ PRINCIPAL-SPECIFIC SECTIONS ============ */}
        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            title="Total Students"
            value={totalStudents}
            iconName="Users"
            iconColor="text-blue-500"
            change={5.2}
            changeType="positive"
            href={`/${locale}/s/${school?.domain}/students`}
          />
          <MetricCard
            title="Total Teachers"
            value={totalTeachers}
            iconName="GraduationCap"
            iconColor="text-purple-500"
            href={`/${locale}/s/${school?.domain}/teachers`}
          />
          <MetricCard
            title="Active Classes"
            value={totalClasses}
            iconName="BookOpen"
            iconColor="text-emerald-500"
            href={`/${locale}/s/${school?.domain}/subjects`}
          />
          <MetricCard
            title="Student:Teacher"
            value={`${studentTeacherRatio}:1`}
            iconName="BarChart3"
            iconColor="text-amber-500"
          />
        </div>

        {/* Critical Alerts */}
        {mockCriticalAlerts.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-base">
                Critical Alerts
                <Badge variant="destructive">{mockCriticalAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockCriticalAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="bg-background hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-muted-foreground text-sm">
                      {alert.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        alert.severity === "high" ? "destructive" : "secondary"
                      }
                    >
                      {alert.severity}
                    </Badge>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {alert.action}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Grade Comparison Chart */}
          <div className="lg:col-span-2">
            <ComparisonLineChart
              data={gradeComparison}
              title="Academic Performance Trend"
              description="Current vs Previous Year"
              currentLabel="This Year"
              previousLabel="Last Year"
            />
          </div>

          {/* Performance Rings */}
          <ActivityRings
            activities={performanceRings}
            title="School Performance"
          />
        </div>

        {/* Secondary Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Weekly Attendance */}
          <WeeklyActivityChart
            data={weeklyAttendance}
            title="Weekly Attendance"
            label="Rate %"
            color="hsl(var(--chart-1))"
          />

          {/* Overall Performance Gauge */}
          <PerformanceGauge
            value={Math.round(mockPerformanceScorecard.overall)}
            label="School Score"
            description="Overall performance index"
            maxValue={100}
            color="hsl(142, 76%, 36%)"
          />
        </div>

        {/* Priorities and Academic Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Today's Priorities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Today&apos;s Priorities
              </CardTitle>
              <Badge variant="outline">{format(new Date(), "EEEE")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTodaysPriorities.length > 0 ? (
                mockTodaysPriorities.map((item, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{item.priority}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.time}
                      </p>
                    </div>
                    <Badge
                      variant={
                        item.status === "scheduled" ? "default" : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Calendar"
                  title="No priorities for today"
                  description="Schedule looks clear"
                />
              )}
            </CardContent>
          </Card>

          {/* Academic Trends */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Subject Performance</CardTitle>
              <Link
                href={`/${locale}/s/${school?.domain}/grades`}
                className="text-primary flex items-center gap-1 text-sm hover:underline"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAcademicTrends.length > 0 ? (
                mockAcademicTrends.map((subject, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{subject.subject}</p>
                      <p className="text-muted-foreground text-sm">
                        Current Avg: {subject.currentAvg}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {subject.trend === "up" && (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      )}
                      {subject.trend === "down" && (
                        <TrendingDown className="text-destructive h-4 w-4" />
                      )}
                      <Badge
                        variant={
                          subject.trend === "up"
                            ? "default"
                            : subject.trend === "down"
                              ? "destructive"
                              : "secondary"
                        }
                        className={
                          subject.trend === "up"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                            : ""
                        }
                      >
                        {subject.improvement}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="BarChart3"
                  title="No data available"
                  description="Academic trends will appear here"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff and Discipline Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Disciplinary Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discipline Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-2xl font-bold">
                    {mockDisciplinarySummary.totalIncidents}
                  </p>
                  <p className="text-muted-foreground text-xs">Total</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {mockDisciplinarySummary.resolved}
                  </p>
                  <p className="text-muted-foreground text-xs">Resolved</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {mockDisciplinarySummary.pending}
                  </p>
                  <p className="text-muted-foreground text-xs">Pending</p>
                </div>
              </div>
              <div className="border-t pt-2">
                <p className="text-muted-foreground mb-2 text-sm">Top Issues</p>
                <div className="flex flex-wrap gap-2">
                  {mockDisciplinarySummary.topIssues.map((issue, index) => (
                    <Badge key={index} variant="outline">
                      {issue}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Evaluations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Staff Evaluations</CardTitle>
              <Badge variant="secondary">
                {mockStaffEvaluations.length} due
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockStaffEvaluations.length > 0 ? (
                mockStaffEvaluations.map((evaluation, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{evaluation.teacher}</p>
                      <p className="text-muted-foreground text-sm">
                        {evaluation.department}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          evaluation.status === "in-progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {evaluation.status}
                      </Badge>
                      <p className="text-muted-foreground mt-1 text-xs">
                        Due: {format(new Date(evaluation.dueDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Users"
                  title="No evaluations due"
                  description="All evaluations completed"
                />
              )}
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Allocated</span>
                  <span className="font-medium">
                    ${(mockBudgetStatus.allocated / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    ${(mockBudgetStatus.spent / 1000000).toFixed(2)}M
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    ${(mockBudgetStatus.remaining / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Utilization
                  </span>
                  <span className="text-sm font-medium">
                    {mockBudgetStatus.utilization}%
                  </span>
                </div>
                <Progress
                  value={mockBudgetStatus.utilization}
                  className="h-2"
                />
                <p className="text-muted-foreground mt-2 text-center text-xs">
                  Status: {mockBudgetStatus.projections}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Parent Satisfaction Survey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: "Overall", value: mockParentFeedback.overall },
                {
                  label: "Satisfaction",
                  value: mockParentFeedback.satisfaction,
                },
                {
                  label: "Communication",
                  value: mockParentFeedback.communication,
                },
                {
                  label: "Academics",
                  value: mockParentFeedback.academicQuality,
                },
                { label: "Facilities", value: mockParentFeedback.facilities },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-muted/30 rounded-lg p-3 text-center"
                >
                  <p
                    className={`text-2xl font-bold ${item.value >= 85 ? "text-emerald-600 dark:text-emerald-400" : item.value >= 75 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}
                  >
                    {item.value}%
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals and Meetings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Goal Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strategic Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockGoalProgress.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{goal.goal}</p>
                    <Badge
                      variant={
                        goal.progress >= 90
                          ? "default"
                          : goal.progress >= 70
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {goal.progress}%
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex justify-between text-sm">
                    <span>Target: {goal.target}</span>
                    <span>Current: {goal.current}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Board Meetings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Upcoming Board Meetings
              </CardTitle>
              <Badge variant="outline">
                {mockBoardMeetings.length} scheduled
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBoardMeetings.length > 0 ? (
                mockBoardMeetings.map((meeting, index) => (
                  <div
                    key={index}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{meeting.topic}</p>
                      <p className="text-muted-foreground text-sm">
                        {format(new Date(meeting.date), "EEEE, MMM d")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          meeting.status === "confirmed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {meeting.status}
                      </Badge>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {meeting.attendees} attendees
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  iconName="Calendar"
                  title="No meetings scheduled"
                  description="Board meetings will appear here"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <ProgressCard
            title="Academic Year"
            current={7}
            total={12}
            unit="months"
            iconName="Calendar"
            showPercentage
          />
          <ProgressCard
            title="Budget Utilization"
            current={mockBudgetStatus.spent}
            total={mockBudgetStatus.allocated}
            unit="utilized"
            iconName="DollarSign"
            showPercentage
          />
          <ProgressCard
            title="Evaluations Complete"
            current={totalTeachers - mockStaffEvaluations.length}
            total={totalTeachers || 1}
            unit="staff"
            iconName="CheckCircle"
            showPercentage
          />
        </div>
      </div>
    )
  } catch (renderError) {
    // Catch any rendering errors and log them
    console.error("[PrincipalDashboard] Rendering error:", renderError)
    const errorMessage =
      renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack =
      renderError instanceof Error ? renderError.stack : undefined
    console.error("[PrincipalDashboard] Error message:", errorMessage)
    console.error("[PrincipalDashboard] Error stack:", errorStack)
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
