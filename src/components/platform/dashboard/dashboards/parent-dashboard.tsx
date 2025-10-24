import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  CreditCard,
  MessageSquare,
  FileText,
  Calendar,
  Bell,
} from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { getParentDashboardData } from "../actions";

interface ParentDashboardProps {
  user: {
    id: string;
    email?: string | null;
    role?: string;
    schoolId?: string | null;
  };
  dictionary?: Dictionary["school"];
}

export async function ParentDashboard({
  user,
  dictionary,
}: ParentDashboardProps) {
  // Fetch real data from server action
  const data = await getParentDashboardData();

  // Get dashboard dictionary
  const dashDict = dictionary?.parentDashboard || {
    stats: {
      children: "Children",
      attendance: "Attendance",
      assignments: "Assignments",
      announcements: "Announcements",
    },
    quickActions: {
      title: "Quick Actions",
      messageTeacher: "Message Teacher",
      viewReportCard: "View Report Card",
      checkAttendance: "Check Attendance",
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
  };

  return (
    <div className="space-y-6">
      {/* Hero Section - Children Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.children}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.children.length}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.enrolledStudents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.attendance}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.attendanceSummary.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.attendanceSummary.presentDays}/{data.attendanceSummary.totalDays} {dashDict.labels.daysPresent}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.assignments}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingAssignments.length}
            </div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.upcoming}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.announcements}</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.announcements.length}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.newMessages}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{dashDict.quickActions.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              {dashDict.quickActions.messageTeacher}
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              {dashDict.quickActions.viewReportCard}
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              {dashDict.quickActions.checkAttendance}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                    <h4 className="font-semibold">{child.name}</h4>
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
                      <p className="text-lg font-bold">
                        {data.recentGrades.length}
                      </p>
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
                    <p className="text-sm text-muted-foreground">
                      {grade.subject}
                    </p>
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

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{dashDict.sections.attendanceSummary}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {dashDict.labels.presentDays}
                </span>
                <span className="font-medium">
                  {data.attendanceSummary.presentDays} /{" "}
                  {data.attendanceSummary.totalDays}
                </span>
              </div>
              <Progress value={data.attendanceSummary.percentage} />
            </div>
            <div className="ml-6">
              <div className="text-3xl font-bold">
                {data.attendanceSummary.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {dashDict.labels.attendance}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
