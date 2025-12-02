import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  FileText,
  Bell,
  ChevronRight,
  Target,
  Trophy,
} from "lucide-react"
import { format, isToday, isTomorrow, differenceInDays } from "date-fns"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getStudentDashboardData } from "../actions"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { StudentDashboardStats } from "@/components/platform/shared/stats"
import {
  WelcomeBanner,
  MetricCard,
  ActivityRings,
  ScheduleItem,
  ProgressCard,
  AnnouncementCard,
  EmptyState,
} from "../widgets"
import { PerformanceGauge, ComparisonLineChart } from "../widgets/dashboard-charts"
import Link from "next/link"

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
  // Fetch real data from server action with error handling
  let data
  try {
    data = await getStudentDashboardData()
  } catch (error) {
    console.error("[StudentDashboard] Error fetching data:", error)
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
  const { schoolId } = await getTenantContext()

  // Get school subdomain for URL construction with error handling
  let school = null
  try {
    if (schoolId) {
      const { db } = await import("@/lib/db")
      school = await db.school.findUnique({
        where: { id: schoolId },
        select: { domain: true, name: true },
      })
    }
  } catch (error) {
    console.error("[StudentDashboard] Error fetching school domain:", error)
  }

  // Get dictionary with fallback
  const dashDict = dictionary?.studentDashboard || {
    stats: {
      attendance: "Attendance",
      upcomingAssignments: "Upcoming Assignments",
      averageGrade: "Average Grade",
      announcements: "Announcements",
    },
    sections: {
      upcomingAssignments: "Upcoming Assignments",
      recentGrades: "Recent Grades",
      announcements: "School Announcements",
      todaySchedule: "Today's Schedule",
    },
    labels: {
      daysPresent: "days present",
      dueThisWeek: "Due this week",
      noAssignments: "No upcoming assignments",
      noGrades: "No recent grades",
      noClasses: "No classes scheduled for today",
      noAnnouncements: "No announcements",
      due: "Due",
      room: "Room",
      pending: "Pending",
    },
  }

  const averageGrade =
    data.recentGrades.length > 0
      ? data.recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
        data.recentGrades.length
      : 0

  // Activity rings for student progress
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
      value: Math.max(0, 100 - (data.upcomingAssignments.length * 20)),
      color: "#8b5cf6",
      current: data.upcomingAssignments.length,
      target: 5,
      unit: "due",
    },
  ]

  // Mock grade trend data
  const gradeTrendData = [
    { period: "Sep", current: 75, previous: 70 },
    { period: "Oct", current: 78, previous: 72 },
    { period: "Nov", current: 82, previous: 75 },
    { period: "Dec", current: averageGrade || 85, previous: 78 },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner
        userName={user.name || user.email?.split("@")[0]}
        role="Student"
        subtitle={
          data.upcomingAssignments.length > 0
            ? `You have ${data.upcomingAssignments.length} assignments due soon`
            : "You're all caught up!"
        }
      />

      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Attendance"
          value={`${data.attendanceSummary.percentage.toFixed(0)}%`}
          description={`${data.attendanceSummary.presentDays}/${data.attendanceSummary.totalDays} days`}
          icon={Calendar}
          iconColor={data.attendanceSummary.percentage >= 85 ? "text-green-500" : "text-amber-500"}
          href={`/${locale}/s/${school?.domain}/attendance`}
        />
        <MetricCard
          title="Average Grade"
          value={averageGrade > 0 ? `${averageGrade.toFixed(0)}%` : "N/A"}
          icon={GraduationCap}
          iconColor={averageGrade >= 80 ? "text-green-500" : averageGrade >= 60 ? "text-blue-500" : "text-amber-500"}
          href={`/${locale}/s/${school?.domain}/grades`}
        />
        <MetricCard
          title="Assignments Due"
          value={data.upcomingAssignments.length}
          icon={FileText}
          iconColor={data.upcomingAssignments.length > 3 ? "text-destructive" : "text-purple-500"}
          href={`/${locale}/s/${school?.domain}/assignments`}
        />
        <MetricCard
          title="Classes Today"
          value={data.todaysTimetable.length}
          icon={BookOpen}
          iconColor="text-blue-500"
          href={`/${locale}/s/${school?.domain}/timetable`}
        />
      </div>

      {/* Attendance Progress Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium">Attendance Goal</span>
            </div>
            <Badge variant={data.attendanceSummary.percentage >= 90 ? "default" : "secondary"}>
              {data.attendanceSummary.percentage >= 90 ? "On Track" : "Keep Going!"}
            </Badge>
          </div>
          <Progress value={data.attendanceSummary.percentage} className="h-3" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{data.attendanceSummary.presentDays} {dashDict.labels.daysPresent}</span>
            <span>Target: 90%</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("STUDENT", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {dashDict.sections.todaySchedule}
            </CardTitle>
            <Badge variant="outline">{format(new Date(), "EEEE, MMM d")}</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.todaysTimetable.length > 0 ? (
              data.todaysTimetable.map((entry, index) => (
                <ScheduleItem
                  key={entry.id}
                  time={format(new Date(entry.startTime), "HH:mm")}
                  title={entry.subject}
                  subtitle={`${dashDict.labels.room} ${entry.room} • ${entry.teacher}`}
                  badge={index === 0 ? "Now" : undefined}
                  badgeVariant={index === 0 ? "default" : "secondary"}
                  isActive={index === 0}
                />
              ))
            ) : (
              <EmptyState
                icon={Calendar}
                title={dashDict.labels.noClasses}
                description="Enjoy your day off!"
              />
            )}
          </CardContent>
        </Card>

        {/* Activity Rings */}
        <ActivityRings activities={activityData} title="My Progress" />
      </div>

      {/* Secondary Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Gauge */}
        <PerformanceGauge
          value={Math.round(averageGrade)}
          label="Average"
          description="Current academic performance"
          color={averageGrade >= 80 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"}
        />

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {dashDict.sections.upcomingAssignments}
            </CardTitle>
            <Link
              href={`/${locale}/s/${school?.domain}/assignments`}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" />
            </Link>
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
                    <Badge
                      variant={
                        isOverdue || assignment.status === "NOT_SUBMITTED"
                          ? "destructive"
                          : isDueToday
                            ? "default"
                            : isDueTomorrow
                              ? "secondary"
                              : "outline"
                      }
                    >
                      {isOverdue
                        ? "Overdue"
                        : isDueToday
                          ? "Due Today"
                          : isDueTomorrow
                            ? "Tomorrow"
                            : `${daysUntil} days`}
                    </Badge>
                  </div>
                )
              })
            ) : (
              <EmptyState
                icon={FileText}
                title={dashDict.labels.noAssignments}
                description="You're all caught up!"
              />
            )}
          </CardContent>
        </Card>

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
                icon={Trophy}
                title={dashDict.labels.noGrades}
                description="Grades will appear here after assessments"
              />
            )}
          </CardContent>
        </Card>

        {/* School Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {dashDict.sections.announcements}
            </CardTitle>
            <Badge variant="secondary">{data.announcements.length} new</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length > 0 ? (
              data.announcements.slice(0, 3).map((announcement, index) => (
                <AnnouncementCard
                  key={announcement.id}
                  title={announcement.title}
                  content={announcement.body || "Click to view full announcement"}
                  date={announcement.createdAt}
                  priority={index === 0 ? "high" : "normal"}
                />
              ))
            ) : (
              <EmptyState
                icon={Bell}
                title={dashDict.labels.noAnnouncements}
                description="New announcements will appear here"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Trend Chart */}
      <ComparisonLineChart
        data={gradeTrendData}
        title="Grade Trend"
        description="Your performance compared to last term"
        currentLabel="This Term"
        previousLabel="Last Term"
      />

      {/* Academic Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academic Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-primary">
                {data.attendanceSummary.percentage.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Attendance</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {averageGrade > 0 ? averageGrade.toFixed(0) : "N/A"}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Average Grade</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {data.recentGrades.length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Assessments</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.upcomingAssignments.filter(a => a.status !== "NOT_SUBMITTED").length}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Submitted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <ProgressCard
          title="Attendance Goal"
          current={data.attendanceSummary.presentDays}
          total={data.attendanceSummary.totalDays}
          unit="days"
          icon={Calendar}
          showPercentage
        />
        <ProgressCard
          title="Assignments Completed"
          current={data.upcomingAssignments.filter(a => a.status !== "NOT_SUBMITTED").length}
          total={data.upcomingAssignments.length || 1}
          unit="tasks"
          icon={FileText}
          showPercentage
        />
        <ProgressCard
          title="Term Progress"
          current={12}
          total={16}
          unit="weeks"
          icon={Clock}
          showPercentage
        />
      </div>
    </div>
  )
}
