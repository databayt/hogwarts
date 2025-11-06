import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Award,
  FileText,
  MessageSquare,
} from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { getStudentDashboardData } from "../actions";
import { QuickActions } from "../quick-actions";
import { getQuickActionsByRole } from "../quick-actions-config";
import { getTenantContext } from "@/lib/tenant-context";

interface StudentDashboardProps {
  user: {
    id: string;
    email?: string | null;
    role?: string;
    schoolId?: string | null;
  };
  dictionary?: Dictionary["school"];
  locale?: string;
}

export async function StudentDashboard({
  user,
  dictionary,
  locale = "en",
}: StudentDashboardProps) {
  // Fetch real data from server action
  const data = await getStudentDashboardData();

  // Get tenant context for subdomain
  const { schoolId } = await getTenantContext();

  // Get school subdomain for URL construction
  const school = schoolId ? await (async () => {
    const { db } = await import("@/lib/db");
    return db.school.findUnique({ where: { id: schoolId }, select: { domain: true } });
  })() : null;

  // Get dashboard dictionary
  const dashDict = dictionary?.studentDashboard || {
    stats: {
      attendance: "Attendance",
      assignments: "Upcoming Assignments",
      averageGrade: "Average Grade",
      announcements: "Announcements",
    },
    quickActions: {
      title: "Quick Actions",
      submitAssignment: "Submit Assignment",
      checkGrades: "Check Grades",
      viewTimetable: "View Timetable",
      messages: "Messages",
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
      grade: "Grade",
      basedOnRecentExams: "Based on recent exams",
      unreadMessages: "Unread messages",
      pending: "Pending",
    },
  };

  const averageGrade =
    data.recentGrades.length > 0
      ? data.recentGrades.reduce((sum, g) => sum + g.percentage, 0) /
        data.recentGrades.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.attendance}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.attendanceSummary.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.attendanceSummary.presentDays}/{data.attendanceSummary.totalDays}{" "}
              {dashDict.labels.daysPresent}
            </p>
            <Progress value={data.attendanceSummary.percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.assignments}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingAssignments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.dueThisWeek}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.averageGrade}
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {dashDict.labels.basedOnRecentExams}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashDict.stats.announcements}
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.announcements.length}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.unreadMessages}</p>
          </CardContent>
        </Card>
      </div>

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
                      {assignment.status === "NOT_SUBMITTED" ? dashDict.labels.pending : assignment.status}
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
                      {grade.percentage.toFixed(1)}% {grade.grade ? `• ${grade.grade}` : ""}
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
  );
}
