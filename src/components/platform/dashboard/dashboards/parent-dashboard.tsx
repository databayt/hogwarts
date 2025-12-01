import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getParentDashboardData } from "../actions"
import { QuickActions } from "../quick-actions"
import { getQuickActionsByRole } from "../quick-actions-config"
import { getTenantContext } from "@/lib/tenant-context"
import { ParentDashboardStats } from "@/components/platform/shared/stats"

interface ParentDashboardProps {
  user: {
    id: string
    email?: string | null
    role?: string
    schoolId?: string | null
  }
  dictionary?: Dictionary["school"]
  locale?: string
}

export async function ParentDashboard({
  user,
  dictionary,
  locale = "en",
}: ParentDashboardProps) {
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

  return (
    <div className="space-y-6">
      {/* Stats Section - Using new reusable component */}
      <ParentDashboardStats
        childrenCount={data.children.length}
        attendance={data.attendanceSummary.percentage}
        upcomingAssignments={data.upcomingAssignments.length}
        announcements={data.announcements.length}
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
        actions={getQuickActionsByRole("GUARDIAN", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Children Overview Cards */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.childrenOverview}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.children.length > 0 ? (
              data.children.map((child) => (
                <div key={child.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">{child.name}</p>
                    <Badge variant="outline">{child.studentId}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{dashDict.labels.attendance}</p>
                      <div className="flex items-center space-x-2">
                        <Progress
                          value={data.attendanceSummary.percentage}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium">
                          {data.attendanceSummary.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {dashDict.labels.recentGrades}
                      </p>
                      <p className="text-lg font-bold">{data.recentGrades.length}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noChildren}
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
                          : assignment.status === "SUBMITTED"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {assignment.status === "NOT_SUBMITTED"
                        ? dashDict.labels.pending
                        : assignment.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {dashDict.labels.due}: {new Date(assignment.dueDate).toLocaleDateString()}
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
