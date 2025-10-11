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

  return (
    <div className="space-y-6">
      {/* Hero Section - Children Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Children</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.children.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.attendanceSummary.percentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.attendanceSummary.presentDays}/{data.attendanceSummary.totalDays} days
              present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.upcomingAssignments.length}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.announcements.length}</div>
            <p className="text-xs text-muted-foreground">New messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Teacher
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              View Report Card
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Check Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Children Overview Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Children Overview</CardTitle>
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
                      <p className="text-sm text-muted-foreground">Attendance</p>
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
                        Recent Grades
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
                No children found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
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
                No recent grades
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
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
                        ? "Pending"
                        : assignment.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming assignments
              </p>
            )}
          </CardContent>
        </Card>

        {/* School Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>School Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.announcements.length > 0 ? (
              data.announcements.map((announcement) => (
                <div key={announcement.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{announcement.title}</p>
                    <Badge
                      variant={
                        announcement.priority === "HIGH"
                          ? "destructive"
                          : announcement.priority === "MEDIUM"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No announcements
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Present Days
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
                Attendance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
