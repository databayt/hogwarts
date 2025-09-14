import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Clock, BookOpen, Award, AlertCircle, MessageSquare, FileText, CalendarDays } from "lucide-react";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface StudentDashboardProps {
  user: any;
  dictionary?: Dictionary['school'];
}

export async function StudentDashboard({ user, dictionary }: StudentDashboardProps) {
  // Fetch real data from database
  const student = await db.student.findFirst({
    where: { userId: user.id, schoolId: user.schoolId },
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
          assignment: {
            dueDate: {
              gte: new Date()
            }
          }
        },
        take: 5
      }
    }
  });

  // Calculate attendance percentage
  const totalDays = student?.attendances.length || 0;
  const presentDays = student?.attendances.filter(a => a.status === "PRESENT").length || 0;
  const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  // Get dashboard dictionary with fallbacks
  const dashDict = {
    stats: {
      gpa: "Current GPA",
      attendance: "Attendance",
      assignments: "Upcoming Assignments",
      balance: "Fee Balance"
    },
    quickActions: {
      title: "Quick Actions",
      submitAssignment: "Submit Assignment",
      checkGrades: "Check Grades",
      viewTimetable: "View Timetable",
      messages: "Messages"
    },
    sections: {
      upcomingAssignments: "Upcoming Assignments",
      recentGrades: "Recent Grades",
      upcomingExams: "Upcoming Exams",
      libraryBooks: "Library Books",
      announcements: "School Announcements",
      todaySchedule: "Today's Schedule"
    },
    labels: {
      outOf: "Out of 4.0 scale",
      daysPresent: "days present",
      dueThisWeek: "Due this week",
      outstanding: "Outstanding amount",
      noAssignments: "No upcoming assignments",
      noGrades: "No recent grades",
      due: "Due",
      overdue: "Overdue",
      dueSoon: "Due Soon",
      room: "Room",
      lab: "Lab"
    }
  };

  // Mock data for unimplemented features
  const mockGPA = 3.8;
  const mockUpcomingExams = [
    { subject: "Mathematics", date: "2024-01-15", type: "Midterm" },
    { subject: "Science", date: "2024-01-20", type: "Quiz" },
    { subject: "History", date: "2024-01-25", type: "Final" }
  ];

  const mockLibraryBooks = [
    { title: "The Great Gatsby", dueDate: "2024-01-10", overdue: true },
    { title: "To Kill a Mockingbird", dueDate: "2024-01-20", overdue: false }
  ];

  const mockFeeBalance = 150.00;
  const mockAnnouncements = [
    { title: "School Assembly Tomorrow", date: "2024-01-08" },
    { title: "Sports Day Registration", date: "2024-01-07" }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.gpa}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGPA}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.outOf}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.attendance}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{presentDays}/{totalDays} {dashDict.labels.daysPresent}</p>
            <Progress value={attendancePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.assignments}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{student?.submissions.length || 0}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.dueThisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dashDict.stats.balance}</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockFeeBalance}</div>
            <p className="text-xs text-muted-foreground">{dashDict.labels.outstanding}</p>
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
              <FileText className="mr-2 h-4 w-4" />
              {dashDict.quickActions.submitAssignment}
            </Button>
            <Button variant="outline" size="sm">
              <Award className="mr-2 h-4 w-4" />
              {dashDict.quickActions.checkGrades}
            </Button>
            <Button variant="outline" size="sm">
              <CalendarDays className="mr-2 h-4 w-4" />
              {dashDict.quickActions.viewTimetable}
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              {dashDict.quickActions.messages}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.upcomingAssignments}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student?.submissions.length ? (
              student.submissions.map((submission: any) => (
                <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{submission.assignment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {dashDict.labels.due}: {new Date(submission.assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={submission.status === "SUBMITTED" ? "default" : "secondary"}>
                    {submission.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">{dashDict.labels.noAssignments}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.recentGrades}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {student?.submissions.filter((s: any) => s.score)?.slice(0, 3).map((submission: any) => (
              <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{submission.assignment.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.assignment.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{submission.score}/{submission.assignment.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">
                    {((submission.score / submission.assignment.totalPoints) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">{dashDict.labels.noGrades}</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.upcomingExams}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockUpcomingExams.map((exam, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{exam.subject}</p>
                  <p className="text-sm text-muted-foreground">{exam.type}</p>
                </div>
                <Badge variant="outline">
                  {new Date(exam.date).toLocaleDateString()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Library Books */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.libraryBooks}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockLibraryBooks.map((book, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{book.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {dashDict.labels.due}: {new Date(book.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={book.overdue ? "destructive" : "default"}>
                  {book.overdue ? dashDict.labels.overdue : dashDict.labels.dueSoon}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* School Announcements */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.announcements}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAnnouncements.map((announcement, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <p className="font-medium">{announcement.title}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(announcement.date).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>{dashDict.sections.todaySchedule}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mathematics</p>
                    <p className="text-sm text-muted-foreground">{dashDict.labels.room} 101</p>
                  </div>
                </div>
                <Badge>9:00 AM</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Science</p>
                    <p className="text-sm text-muted-foreground">{dashDict.labels.lab} 2</p>
                  </div>
                </div>
                <Badge>10:30 AM</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
