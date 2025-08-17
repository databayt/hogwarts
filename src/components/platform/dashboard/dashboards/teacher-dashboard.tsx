import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, Users, FileText, MessageSquare, AlertTriangle, BookOpen, CheckCircle } from "lucide-react";

interface TeacherDashboardProps {
  user: any;
}

export async function TeacherDashboard({ user }: TeacherDashboardProps) {
  // Fetch real data from database
  const teacher = await db.teacher.findFirst({
    where: { userId: user.id, schoolId: user.schoolId },
    include: {
      classes: {
        include: {
          _count: {
            select: {
              studentClasses: true
            }
          }
        }
      }
    }
  });

  // Fetch assignments that need grading
  const pendingAssignments = await db.assignment.findMany({
    where: {
      schoolId: user.schoolId,
      status: "PUBLISHED"
    },
    include: {
      class: true,
      submissions: {
        where: {
          status: "SUBMITTED"
        }
      }
    },
    take: 5
  });

  // Fetch today's classes (mock data for now)
  const todaysClasses = [
    { name: "Mathematics 101", time: "9:00 AM", room: "Room 101", students: 25 },
    { name: "Advanced Algebra", time: "10:30 AM", room: "Room 102", students: 18 },
    { name: "Calculus", time: "2:00 PM", room: "Room 103", students: 22 }
  ];

  // Mock data for unimplemented features
  const mockPendingTasks = {
    grading: 12,
    attendance: 3,
    lessonPlans: 2
  };

  const mockUrgentNotifications = [
    { type: "Staff Meeting", message: "Emergency staff meeting at 3 PM", priority: "high" },
    { type: "Exam Schedule", message: "Final exam schedule due tomorrow", priority: "medium" }
  ];

  const mockClassPerformance = [
    { className: "Mathematics 101", average: 85.2, trend: "up" },
    { className: "Advanced Algebra", average: 78.9, trend: "down" },
    { className: "Calculus", average: 82.1, trend: "stable" }
  ];

  const mockUpcomingDeadlines = [
    { task: "Grade Midterm Papers", dueDate: "2024-01-12", priority: "high" },
    { task: "Submit Lesson Plans", dueDate: "2024-01-15", priority: "medium" },
    { task: "Parent Conference Prep", dueDate: "2024-01-18", priority: "low" }
  ];

  const mockStudentBehaviorAlerts = [
    { student: "John Smith", issue: "Late to class", severity: "medium" },
    { student: "Sarah Johnson", issue: "Missing homework", severity: "low" }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.length}</div>
            <p className="text-xs text-muted-foreground">Classes scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPendingTasks.grading}</div>
            <p className="text-xs text-muted-foreground">Assignments to grade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Due</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPendingTasks.attendance}</div>
            <p className="text-xs text-muted-foreground">Classes need attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teacher?.classes.reduce((sum: number, cls: any) => sum + cls._count.studentClasses, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
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
              <Users className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Enter Grades
            </Button>
            <Button variant="outline" size="sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Parents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysClasses.map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{cls.name}</p>
                  <p className="text-sm text-muted-foreground">Room {cls.room}</p>
                </div>
                <div className="text-right">
                  <Badge>{cls.time}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{cls.students} students</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.length ? (
              pendingAssignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.class.name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{assignment.submissions.length} submissions</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No pending assignments</p>
            )}
          </CardContent>
        </Card>

        {/* Class Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockClassPerformance.map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{cls.className}</p>
                  <p className="text-sm text-muted-foreground">
                    Average: {cls.average}%
                  </p>
                </div>
                <Badge variant={cls.trend === "up" ? "default" : cls.trend === "down" ? "destructive" : "secondary"}>
                  {cls.trend === "up" ? "↗" : cls.trend === "down" ? "↘" : "→"} {cls.trend}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingDeadlines.map((deadline, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{deadline.task}</p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(deadline.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={deadline.priority === "high" ? "destructive" : deadline.priority === "medium" ? "default" : "secondary"}>
                  {deadline.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Student Behavior Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Student Behavior Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockStudentBehaviorAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{alert.student}</p>
                  <p className="text-sm text-muted-foreground">{alert.issue}</p>
                </div>
                <Badge variant={alert.severity === "high" ? "destructive" : alert.severity === "medium" ? "default" : "secondary"}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Urgent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Urgent Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUrgentNotifications.map((notification, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    notification.priority === "high" ? "text-red-500" : "text-yellow-500"
                  }`} />
                  <Badge variant={notification.priority === "high" ? "destructive" : "default"}>
                    {notification.priority}
                  </Badge>
                </div>
                <p className="font-medium">{notification.type}</p>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>This Week's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, index) => (
              <div key={day} className="text-center">
                <h4 className="font-medium mb-2">{day}</h4>
                <div className="space-y-2">
                  {todaysClasses.slice(0, 2).map((cls, clsIndex) => (
                    <div key={clsIndex} className="p-2 bg-muted rounded text-xs">
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-muted-foreground">{cls.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
