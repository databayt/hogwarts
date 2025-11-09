import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, FileText } from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { getTeacherDashboardData } from "../actions";
import { QuickActions } from "../quick-actions";
import { getQuickActionsByRole } from "../quick-actions-config";
import { getTenantContext } from "@/lib/tenant-context";

interface TeacherDashboardProps {
  user: {
    id: string;
    email?: string | null;
    role?: string;
    schoolId?: string | null;
  };
  dictionary?: Dictionary["school"];
  locale?: string;
}

export async function TeacherDashboard({
  user,
  dictionary,
  locale = "en",
}: TeacherDashboardProps) {
  // Fetch real data from server action with error handling
  let data;
  try {
    data = await getTeacherDashboardData();
  } catch (error) {
    console.error('[TeacherDashboard] Error fetching lab data:', error);
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="mb-4">Unable to Load Dashboard</h3>
          <p className="text-muted-foreground">
            There was an error loading the dashboard data. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext();

  // Get school subdomain for URL construction with error handling
  let school = null;
  try {
    if (schoolId) {
      const { db } = await import("@/lib/db");
      school = await db.school.findUnique({ where: { id: schoolId }, select: { domain: true } });
    }
  } catch (error) {
    console.error('[TeacherDashboard] Error fetching school domain:', error);
  }

  // Get lab dictionary
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
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.todaysClasses}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.todaysClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.classesScheduled}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.pendingGrading}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.assignmentsToGrade}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.attendanceDue}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.attendanceDue}</div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.needAttendance}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.totalStudents}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.acrossAllClasses}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={getQuickActionsByRole("TEACHER", dictionary, school?.domain)}
        locale={locale}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.todaysClasses}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todaysClasses.length > 0 ? (
              data.todaysClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dashDict.labels.room} {cls.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge>{cls.time}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {cls.students} {dashDict.labels.students}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noClasses}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.pendingAssignments}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingAssignments.length > 0 ? (
              data.pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.className}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      {assignment.submissionsCount} {dashDict.labels.submissions}
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
                {dashDict.labels.noPending}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Class Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.classPerformance}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.classPerformance.length > 0 ? (
              data.classPerformance.map((cls, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{cls.className}</p>
                    <p className="text-sm text-muted-foreground">
                      {dashDict.labels.average}: {cls.average}%
                    </p>
                  </div>
                  <Badge variant="outline">{cls.average.toFixed(1)}%</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noPerformanceData}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.upcomingDeadlines}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingDeadlines.length > 0 ? (
              data.upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{deadline.task}</p>
                    <p className="text-sm text-muted-foreground">
                      {dashDict.labels.due}:{" "}
                      {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{deadline.type}</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {dashDict.labels.noDeadlines}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
