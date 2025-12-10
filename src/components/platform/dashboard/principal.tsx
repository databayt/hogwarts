import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { format } from "date-fns"
import { QuickActions } from "./quick-action"
import { getQuickActionsByRole } from "./quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { WelcomeBanner } from "./welcome-banner"
import { MetricCard } from "./metric-card"
import { ActivityRings } from "./activity-rings"
import { ProgressCard } from "./progress-card"
import { EmptyState } from "./empty-state"
import { PerformanceGauge } from "./performance-gauge"
import { WeeklyActivityChart } from "./weekly-chart"
import { ComparisonLineChart } from "./comparison-chart"
import Link from "next/link"
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react"

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
    let recentAnnouncements: { id: string; titleEn: string | null; createdAt: Date }[] = []

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

    // Mock data for demo (would be replaced with real queries)
    const mockPerformanceScorecard = {
      overall: 87.5,
      academic: 85,
      attendance: 92,
      discipline: 88,
      parentSatisfaction: 85,
    }

    const mockCriticalAlerts = [
      { type: "Low Attendance", message: "Grade 11 attendance below 85%", severity: "high", action: "Review required" },
      { type: "Budget Alert", message: "Q4 budget 90% utilized", severity: "medium", action: "Monitor spending" },
    ]

    const mockTodaysPriorities = [
      { priority: "Staff meeting at 9:00 AM", time: "9:00 AM", status: "scheduled" },
      { priority: "Parent committee review", time: "11:00 AM", status: "scheduled" },
      { priority: "Budget review with finance", time: "2:00 PM", status: "pending" },
      { priority: "Teacher evaluation due", time: "4:00 PM", status: "pending" },
    ]

    const mockAcademicTrends = [
      { subject: "Mathematics", currentAvg: 78, trend: "up", improvement: "+3%" },
      { subject: "Science", currentAvg: 82, trend: "up", improvement: "+5%" },
      { subject: "English", currentAvg: 75, trend: "down", improvement: "-2%" },
      { subject: "History", currentAvg: 80, trend: "stable", improvement: "+1%" },
    ]

    const mockDisciplinarySummary = {
      totalIncidents: 12,
      resolved: 9,
      pending: 3,
      topIssues: ["Tardiness", "Uniform", "Conduct"],
    }

    const mockStaffEvaluations = [
      { teacher: "Mr. Johnson", department: "Mathematics", status: "in-progress", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { teacher: "Ms. Williams", department: "Science", status: "pending", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
      { teacher: "Mr. Davis", department: "English", status: "pending", dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) },
    ]

    const mockBudgetStatus = {
      allocated: 1500000,
      spent: 1125000,
      remaining: 375000,
      utilization: 75,
      projections: "On Track",
    }

    const mockParentFeedback = {
      satisfaction: 85,
      communication: 82,
      academicQuality: 88,
      facilities: 78,
      overall: 83,
    }

    const mockGoalProgress = [
      { goal: "Improve Math Scores", target: "85%", current: "78%", progress: 92 },
      { goal: "Reduce Absenteeism", target: "95%", current: "92%", progress: 97 },
      { goal: "Staff Training Hours", target: "40 hrs", current: "32 hrs", progress: 80 },
    ]

    const mockBoardMeetings = [
      { topic: "Annual Budget Review", date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: "confirmed", attendees: 8 },
      { topic: "Academic Performance Report", date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), status: "pending", attendees: 12 },
    ]

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

    const studentTeacherRatio = totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <WelcomeBanner
          userName={user.name || user.email?.split("@")[0]}
          role="Principal"
          subtitle={`${school?.name || "School"} • Overall Score: ${mockPerformanceScorecard.overall}%`}
        />

        {/* Key Metrics Row */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                Critical Alerts
                <Badge variant="destructive">{mockCriticalAlerts.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockCriticalAlerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                      {alert.severity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <QuickActions
          actions={getQuickActionsByRole("PRINCIPAL", dictionary, school?.domain ?? undefined)}
          locale={locale}
        />

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
          <ActivityRings activities={performanceRings} title="School Performance" />
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
              <CardTitle className="text-base">Today&apos;s Priorities</CardTitle>
              <Badge variant="outline">{format(new Date(), "EEEE")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockTodaysPriorities.length > 0 ? (
                mockTodaysPriorities.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{item.priority}</p>
                      <p className="text-sm text-muted-foreground">{item.time}</p>
                    </div>
                    <Badge variant={item.status === "scheduled" ? "default" : "secondary"}>
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
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAcademicTrends.length > 0 ? (
                mockAcademicTrends.map((subject, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{subject.subject}</p>
                      <p className="text-sm text-muted-foreground">Current Avg: {subject.currentAvg}%</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {subject.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                      {subject.trend === "down" && <TrendingDown className="h-4 w-4 text-destructive" />}
                      <Badge
                        variant={subject.trend === "up" ? "default" : subject.trend === "down" ? "destructive" : "secondary"}
                        className={subject.trend === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}
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
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold">{mockDisciplinarySummary.totalIncidents}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mockDisciplinarySummary.resolved}</p>
                  <p className="text-xs text-muted-foreground">Resolved</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mockDisciplinarySummary.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">Top Issues</p>
                <div className="flex flex-wrap gap-2">
                  {mockDisciplinarySummary.topIssues.map((issue, index) => (
                    <Badge key={index} variant="outline">{issue}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Staff Evaluations */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Staff Evaluations</CardTitle>
              <Badge variant="secondary">{mockStaffEvaluations.length} due</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockStaffEvaluations.length > 0 ? (
                mockStaffEvaluations.map((evaluation, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{evaluation.teacher}</p>
                      <p className="text-sm text-muted-foreground">{evaluation.department}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={evaluation.status === "in-progress" ? "default" : "secondary"}>
                        {evaluation.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
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
                  <span className="font-medium">${(mockBudgetStatus.allocated / 1000000).toFixed(1)}M</span>
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
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Utilization</span>
                  <span className="text-sm font-medium">{mockBudgetStatus.utilization}%</span>
                </div>
                <Progress value={mockBudgetStatus.utilization} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Status: {mockBudgetStatus.projections}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parent Satisfaction Survey</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { label: "Overall", value: mockParentFeedback.overall },
                { label: "Satisfaction", value: mockParentFeedback.satisfaction },
                { label: "Communication", value: mockParentFeedback.communication },
                { label: "Academics", value: mockParentFeedback.academicQuality },
                { label: "Facilities", value: mockParentFeedback.facilities },
              ].map((item, index) => (
                <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className={`text-2xl font-bold ${item.value >= 85 ? "text-emerald-600 dark:text-emerald-400" : item.value >= 75 ? "text-amber-600 dark:text-amber-400" : "text-destructive"}`}>
                    {item.value}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
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
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{goal.goal}</p>
                    <Badge variant={goal.progress >= 90 ? "default" : goal.progress >= 70 ? "secondary" : "destructive"}>
                      {goal.progress}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
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
              <CardTitle className="text-base">Upcoming Board Meetings</CardTitle>
              <Badge variant="outline">{mockBoardMeetings.length} scheduled</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockBoardMeetings.length > 0 ? (
                mockBoardMeetings.map((meeting, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{meeting.topic}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meeting.date), "EEEE, MMM d")}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"}>
                        {meeting.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
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
    const errorMessage = renderError instanceof Error ? renderError.message : String(renderError)
    const errorStack = renderError instanceof Error ? renderError.stack : undefined
    console.error("[PrincipalDashboard] Error message:", errorMessage)
    console.error("[PrincipalDashboard] Error stack:", errorStack)
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
