import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock } from "lucide-react"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getStudentDashboardData } from "../actions"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { StudentDashboardStats } from "@/components/platform/shared/stats"

interface StudentDashboardProps {
  user: {
    id: string
    email?: string | null
    role?: string
    schoolId?: string | null
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
        select: { domain: true },
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

  return (
    <div className="space-y-6">
      {/* Stats Section - Using new reusable component */}
      <StudentDashboardStats
        attendance={data.attendanceSummary.percentage}
        upcomingAssignments={data.upcomingAssignments.length}
        averageGrade={averageGrade}
        dictionary={dashDict.stats}
      />

      {/* Attendance Progress Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{dashDict.stats.attendance}</span>
            <span className="text-sm text-muted-foreground">
              {data.attendanceSummary.presentDays}/{data.attendanceSummary.totalDays}{" "}
              {dashDict.labels.daysPresent}
            </span>
          </div>
          <Progress value={data.attendanceSummary.percentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("STUDENT", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.todaySchedule}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todaysTimetable.length > 0 ? (
              data.todaysTimetable.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{entry.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {dashDict.labels.room} {entry.room} • {entry.teacher}
                      </p>
                    </div>
                  </div>
                  <Badge>
                    {new Date(entry.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noClasses}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.upcomingAssignments}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingAssignments.length > 0 ? (
              data.upcomingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.subject} • {assignment.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        assignment.status === "NOT_SUBMITTED"
                          ? "destructive"
                          : "default"
                      }
                    >
                      {assignment.status === "NOT_SUBMITTED"
                        ? dashDict.labels.pending
                        : assignment.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dashDict.labels.due}:{" "}
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noAssignments}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.recentGrades}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentGrades.length > 0 ? (
              data.recentGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{grade.examTitle}</p>
                    <p className="text-sm text-muted-foreground">{grade.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {grade.marksObtained}/{grade.totalMarks}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {grade.percentage.toFixed(1)}%{" "}
                      {grade.grade ? `• ${grade.grade}` : ""}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noGrades}
              </p>
            )}
          </CardContent>
        </Card>

        {/* School Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.announcements}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length > 0 ? (
              data.announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 border rounded-lg">
                  <div className="mb-1">
                    <p className="font-medium">{announcement.title}</p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.body}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noAnnouncements}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
