import type { Dictionary } from "@/components/internationalization/dictionaries";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, Users, FileText, Calendar, CheckCircle, Award, BarChart3 } from "lucide-react";

interface PrincipalDashboardProps {
  user: any;
  dictionary?: Dictionary["school"];
}

export async function PrincipalDashboard({ user, dictionary }: PrincipalDashboardProps) {
  // Fetch real data from database
  const [students, teachers, announcements] = await Promise.all([
    db.student.count({ where: { schoolId: user.schoolId } }),
    db.teacher.count({ where: { schoolId: user.schoolId } }),
    db.announcement.count({ where: { schoolId: user.schoolId, published: true } })
  ]);

  // Mock data for unimplemented features
  const mockSchoolPerformanceScorecard = {
    academic: 85.2,
    attendance: 94.1,
    discipline: 78.5,
    parentSatisfaction: 91.3,
    overall: 87.3
  };

  const mockCriticalAlerts = [
    { type: "Low Attendance", message: "Grade 10 attendance below 85%", severity: "high", action: "Review with teachers" },
    { type: "Budget Alert", message: "Q4 budget utilization at 92%", severity: "medium", action: "Monitor spending" },
    { type: "Staff Shortage", message: "Math department needs 2 teachers", severity: "high", action: "Accelerate hiring" }
  ];

  const mockTodaysPriorities = [
    { priority: "Staff Meeting", time: "9:00 AM", status: "scheduled" },
    { priority: "Board Report Review", time: "2:00 PM", status: "pending" },
    { priority: "Parent Conference", time: "4:00 PM", status: "confirmed" }
  ];

  const mockAcademicPerformanceTrends = [
    { subject: "Mathematics", trend: "up", improvement: "+5.2%", currentAvg: 78.5 },
    { subject: "Science", trend: "stable", improvement: "+0.8%", currentAvg: 82.1 },
    { subject: "English", trend: "up", improvement: "+3.1%", currentAvg: 79.8 },
    { subject: "History", trend: "down", improvement: "-1.2%", currentAvg: 75.3 }
  ];

  const mockDisciplinarySummary = {
    totalIncidents: 23,
    resolved: 18,
    pending: 5,
    trend: "decreasing",
    topIssues: ["Late to class", "Missing homework", "Classroom disruption"]
  };

  const mockStaffEvaluationsDue = [
    { teacher: "Sarah Johnson", department: "Mathematics", dueDate: "2024-01-15", status: "pending" },
    { teacher: "Mike Brown", department: "Science", dueDate: "2024-01-20", status: "in-progress" },
    { teacher: "Lisa Davis", department: "English", dueDate: "2024-01-25", status: "pending" }
  ];

  const mockBudgetStatus = {
    allocated: 2500000,
    spent: 1875000,
    remaining: 625000,
    utilization: 75.0,
    projections: "On track"
  };

  const mockParentFeedback = {
    satisfaction: 91.3,
    communication: 88.7,
    academicQuality: 89.2,
    facilities: 85.8,
    overall: 88.8
  };

  const mockMonthlyHighlights = [
    { highlight: "Academic Excellence Award", description: "School ranked #1 in district", impact: "high" },
    { highlight: "New STEM Lab", description: "State-of-the-art facilities opened", impact: "high" },
    { highlight: "Community Outreach", description: "500+ hours of community service", impact: "medium" }
  ];

  const mockGoalProgress = [
    { goal: "Improve Math Scores", target: "85%", current: "78.5%", progress: 78.5 },
    { goal: "Reduce Absenteeism", target: "5%", current: "8.2%", progress: 61.0 },
    { goal: "Parent Engagement", target: "90%", current: "88.8%", progress: 98.7 }
  ];

  const mockUpcomingBoardMeetings = [
    { date: "2024-01-20", topic: "Q4 Financial Review", attendees: 8, status: "confirmed" },
    { date: "2024-02-15", topic: "Strategic Planning", attendees: 10, status: "tentative" },
    { date: "2024-03-10", topic: "Annual Budget Approval", attendees: 12, status: "confirmed" }
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section - School Performance Scorecard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolPerformanceScorecard.overall}</div>
            <p className="text-xs text-muted-foreground">Performance score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolPerformanceScorecard.academic}</div>
            <p className="text-xs text-muted-foreground">Academic performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolPerformanceScorecard.attendance}%</div>
            <p className="text-xs text-muted-foreground">Student attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discipline</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolPerformanceScorecard.discipline}</div>
            <p className="text-xs text-muted-foreground">Discipline score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parent Satisfaction</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockSchoolPerformanceScorecard.parentSatisfaction}%</div>
            <p className="text-xs text-muted-foreground">Parent satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Critical Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockCriticalAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={`h-5 w-5 ${
                    alert.severity === "high" ? "text-red-500" : "text-yellow-500"
                  }`} />
                  <div>
                    <p className="font-medium">{alert.type}</p>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                    {alert.severity}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{alert.action}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Review Reports
            </Button>
            <Button variant="outline" size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve Budgets
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              View Calendars
            </Button>
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Send Communications
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Today's Priorities */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Priorities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockTodaysPriorities.map((priority, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{priority.priority}</p>
                  <p className="text-sm text-muted-foreground">{priority.time}</p>
                </div>
                <Badge variant={priority.status === "confirmed" ? "default" : "secondary"}>
                  {priority.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Academic Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Performance Trends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockAcademicPerformanceTrends.map((subject, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{subject.subject}</p>
                  <p className="text-sm text-muted-foreground">Current: {subject.currentAvg}%</p>
                </div>
                <div className="text-right">
                  <Badge variant={subject.trend === "up" ? "default" : subject.trend === "down" ? "destructive" : "secondary"}>
                    {subject.trend === "up" ? "↗" : subject.trend === "down" ? "↘" : "→"} {subject.improvement}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Disciplinary Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Disciplinary Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{mockDisciplinarySummary.totalIncidents}</div>
                <p className="text-xs text-muted-foreground">Total Incidents</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{mockDisciplinarySummary.resolved}</div>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{mockDisciplinarySummary.pending}</div>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Top Issues:</p>
              <div className="space-y-1">
                {mockDisciplinarySummary.topIssues.map((issue, index) => (
                  <Badge key={index} variant="outline" className="mr-1">
                    {issue}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff Evaluations Due */}
        <Card>
          <CardHeader>
            <CardTitle>Staff Evaluations Due</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockStaffEvaluationsDue.map((evaluation, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{evaluation.teacher}</p>
                  <p className="text-sm text-muted-foreground">{evaluation.department}</p>
                </div>
                <div className="text-right">
                  <Badge variant={evaluation.status === "in-progress" ? "default" : "secondary"}>
                    {evaluation.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Due: {new Date(evaluation.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Budget Status */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Allocated</span>
              <span className="font-medium">${(mockBudgetStatus.allocated / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spent</span>
              <span className="font-medium text-red-600">${(mockBudgetStatus.spent / 1000000).toFixed(1)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining</span>
              <span className="font-medium text-green-600">${(mockBudgetStatus.remaining / 1000).toFixed(0)}K</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <span className="font-medium">{mockBudgetStatus.utilization}%</span>
              </div>
              <Progress value={mockBudgetStatus.utilization} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Status: {mockBudgetStatus.projections}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Parent Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(mockParentFeedback).filter(([key]) => key !== 'overall').map(([category, score]) => (
              <div key={category} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={score} className="w-20" />
                  <span className="text-sm font-medium">{score}%</span>
                </div>
              </div>
            ))}
            <div className="pt-2 border-t text-center">
              <div className="text-lg font-bold text-blue-600">{mockParentFeedback.overall}%</div>
              <p className="text-xs text-muted-foreground">Overall Satisfaction</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Highlights */}
            <div>
              <h4 className="font-medium mb-3">Monthly Highlights</h4>
              <div className="space-y-3">
                {mockMonthlyHighlights.map((highlight, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant={highlight.impact === "high" ? "default" : "secondary"}>
                        {highlight.impact}
                      </Badge>
                    </div>
                    <p className="font-medium">{highlight.highlight}</p>
                    <p className="text-sm text-muted-foreground">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal Progress */}
            <div>
              <h4 className="font-medium mb-3">Goal Progress</h4>
              <div className="space-y-3">
                {mockGoalProgress.map((goal, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <p className="font-medium mb-2">{goal.goal}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Target: {goal.target}</span>
                      <span className="text-sm font-medium">Current: {goal.current}</span>
                    </div>
                    <Progress value={goal.progress} className="mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Board Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Board Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockUpcomingBoardMeetings.map((meeting, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{meeting.topic}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(meeting.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={meeting.status === "confirmed" ? "default" : "secondary"}>
                    {meeting.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {meeting.attendees} attendees
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
