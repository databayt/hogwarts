import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, CreditCard, MessageSquare, FileText, Calendar, AlertTriangle, Bell, Car } from "lucide-react";

interface ParentDashboardProps {
  user: any;
}

export async function ParentDashboard({ user }: ParentDashboardProps) {
  // Fetch real data from database
  const guardian = await db.guardian.findFirst({
    where: { userId: user.id, schoolId: user.schoolId },
    include: {
      studentGuardians: {
        include: {
          student: {
            include: {
              attendances: {
                where: {
                  date: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                  }
                },
                take: 30
              },
              submissions: {
                include: {
                  assignment: true
                },
                where: {
                  score: { not: null }
                },
                take: 5
              }
            }
          }
        }
      }
    }
  });

  // Calculate children overview data
  const children = guardian?.studentGuardians.map(sg => {
    const student = sg.student;
    const totalDays = student.attendances.length;
    const presentDays = student.attendances.filter(a => a.status === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    
    const recentGrades = student.submissions.filter(s => s.score);
    const averageGrade = recentGrades.length > 0 
      ? recentGrades.reduce((sum, s) => sum + Number(s.score || 0), 0) / recentGrades.length 
      : 0;

    return {
      id: student.id,
      name: `${student.givenName} ${student.surname}`,
      attendance: attendancePercentage,
      averageGrade: averageGrade,
      recentActivity: student.submissions.length > 0 ? "New grade posted" : "No recent activity"
    };
  }) || [];

  // Mock data for unimplemented features
  const mockUpcomingEvents = [
    { title: "Parent-Teacher Conference", date: "2024-01-15", time: "3:00 PM" },
    { title: "School Assembly", date: "2024-01-20", time: "9:00 AM" },
    { title: "Sports Day", date: "2024-01-25", time: "2:00 PM" }
  ];

  const mockFeeStatus = {
    total: 1200.00,
    paid: 850.00,
    outstanding: 350.00,
    dueDate: "2024-01-31"
  };

  const mockBehaviorReports = [
    { child: "Emma Johnson", issue: "Excellent participation in class", type: "positive", date: "2024-01-05" },
    { child: "Emma Johnson", issue: "Late to class", type: "warning", date: "2024-01-03" }
  ];

  const mockSchoolAnnouncements = [
    { title: "Winter Break Schedule", date: "2024-01-08", priority: "high" },
    { title: "New Library Resources", date: "2024-01-07", priority: "medium" }
  ];

  const mockTransportationUpdates = [
    { route: "Route A", status: "On time", estimatedArrival: "8:15 AM" },
    { route: "Route B", status: "5 min delay", estimatedArrival: "8:20 AM" }
  ];

  const mockAlerts = [
    { type: "attendance", message: "Emma has missed 3 days this month", severity: "medium" },
    { type: "fees", message: "Payment due in 5 days", severity: "high" },
    { type: "conference", message: "PTA meeting request pending", severity: "low" }
  ];

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
            <div className="text-2xl font-bold">{children.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockFeeStatus.outstanding}</div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUpcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
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
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Fees
            </Button>
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
            {children.map((child) => (
              <div key={child.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{child.name}</h4>
                  <Badge variant="outline">{child.recentActivity}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={child.attendance} className="flex-1" />
                      <span className="text-sm font-medium">{child.attendance.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Grade</p>
                    <p className="text-lg font-bold">{child.averageGrade.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fee Status */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Fees</span>
              <span className="font-medium">${mockFeeStatus.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="font-medium text-green-600">${mockFeeStatus.paid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Outstanding</span>
              <span className="font-medium text-red-600">${mockFeeStatus.outstanding}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Due Date</span>
                <Badge variant="outline">{new Date(mockFeeStatus.dueDate).toLocaleDateString()}</Badge>
              </div>
            </div>
            <Progress 
              value={(mockFeeStatus.paid / mockFeeStatus.total) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.time}</p>
                </div>
                <Badge variant="outline">
                  {new Date(event.date).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {children.flatMap(child => 
              guardian?.studentGuardians
                .find(sg => sg.student.id === child.id)
                ?.student.submissions
                .filter(s => s.score)
                .slice(0, 2)
                .map(submission => ({
                  childName: child.name,
                  assignment: submission.assignment.title,
                  score: submission.score,
                  total: submission.assignment.totalPoints
                })) || []
            ).slice(0, 4).map((grade, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{grade.assignment}</p>
                  <p className="text-sm text-muted-foreground">{grade.childName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{Number(grade.score)}/{Number(grade.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    {((Number(grade.score) / Number(grade.total)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">No recent grades</p>
            )}
          </CardContent>
        </Card>

        {/* Behavior Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Behavior Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockBehaviorReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{report.child}</p>
                  <p className="text-sm text-muted-foreground">{report.issue}</p>
                </div>
                <div className="text-right">
                  <Badge variant={report.type === "positive" ? "default" : "secondary"}>
                    {report.type}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(report.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* School Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>School Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSchoolAnnouncements.map((announcement, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={announcement.priority === "high" ? "destructive" : "default"}>
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="font-medium">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(announcement.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Transportation Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Transportation Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {mockTransportationUpdates.map((update, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">{update.route}</p>
                  <p className="text-sm text-muted-foreground">
                    {update.status} • Arrives {update.estimatedArrival}
                  </p>
                </div>
                <Badge variant={update.status.includes("delay") ? "destructive" : "default"}>
                  {update.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alert Section */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAlerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <AlertTriangle className={`h-5 w-5 ${
                  alert.severity === "high" ? "text-red-500" : 
                  alert.severity === "medium" ? "text-yellow-500" : "text-blue-500"
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{alert.message}</p>
                  <p className="text-sm text-muted-foreground capitalize">{alert.type}</p>
                </div>
                <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
