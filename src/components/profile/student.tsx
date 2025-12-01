"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Target,
  Flame,
  Star
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentDashboardProps {
  data: Record<string, unknown>
}

// Subject performance data
const SUBJECTS = [
  { name: "Mathematics", grade: "A", percentage: 95, trend: "up", color: "bg-chart-1" },
  { name: "Science", grade: "A-", percentage: 92, trend: "up", color: "bg-chart-2" },
  { name: "English", grade: "B+", percentage: 87, trend: "stable", color: "bg-chart-3" },
  { name: "History", grade: "A", percentage: 94, trend: "up", color: "bg-chart-4" },
  { name: "Computer Science", grade: "A+", percentage: 98, trend: "up", color: "bg-chart-5" },
  { name: "Physical Education", grade: "A", percentage: 96, trend: "stable", color: "bg-chart-1" },
]

// Upcoming assignments
const ASSIGNMENTS = [
  { title: "Math Quiz - Chapter 7", subject: "Mathematics", dueDate: "Dec 20", status: "pending", priority: "high" },
  { title: "Science Project Presentation", subject: "Science", dueDate: "Dec 18", status: "in_progress", priority: "urgent" },
  { title: "History Essay - Industrial Revolution", subject: "History", dueDate: "Dec 25", status: "pending", priority: "medium" },
  { title: "English Book Report", subject: "English", dueDate: "Dec 22", status: "completed", priority: "low" },
]

// Recent achievements
const ACHIEVEMENTS = [
  { title: "Perfect Score", description: "Achieved 100% on Math Quiz", icon: Star, date: "Dec 10" },
  { title: "5-Day Streak", description: "Attended classes 5 days in a row", icon: Flame, date: "Dec 8" },
  { title: "Top Performer", description: "Ranked #1 in Computer Science", icon: Trophy, date: "Dec 5" },
]

export default function StudentDashboard({ data }: StudentDashboardProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  const priorityColors = {
    urgent: "bg-destructive/10 text-destructive border-destructive/30",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/30",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
    low: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  }

  const statusIcons = {
    pending: <Clock className="size-4 text-muted-foreground" />,
    in_progress: <AlertCircle className="size-4 text-orange-500" />,
    completed: <CheckCircle2 className="size-4 text-emerald-500" />,
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className={cn(
        "grid gap-4",
        useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
      )}>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Current GPA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-500">3.8</span>
              <span className="text-sm text-muted-foreground">/ 4.0</span>
            </div>
            <Progress value={95} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">Top 5% of class</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="size-4 text-blue-500" />
              Attendance Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-500">95%</span>
            </div>
            <Progress value={95} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">This semester</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Target className="size-4 text-purple-500" />
              Assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-500">12</span>
              <span className="text-sm text-muted-foreground">/ 15 completed</span>
            </div>
            <Progress value={80} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">3 pending this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className={cn(
        "grid gap-6",
        useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Upcoming Assignments */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Upcoming Assignments
            </CardTitle>
            <CardDescription>Tasks due this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ASSIGNMENTS.filter(a => a.status !== "completed").slice(0, 4).map((assignment, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcons[assignment.status as keyof typeof statusIcons]}
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={cn("text-[10px]", priorityColors[assignment.priority as keyof typeof priorityColors])}>
                    {assignment.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{assignment.dueDate}</span>
                </div>
              </div>
            ))}
            <button className="w-full text-sm text-primary hover:underline py-2">
              View all assignments
            </button>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="size-5 text-amber-500" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ACHIEVEMENTS.map((achievement, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="size-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <achievement.icon className="size-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{achievement.date}</span>
              </div>
            ))}
            <button className="w-full text-sm text-primary hover:underline py-2">
              View all achievements
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Subject Performance</CardTitle>
          <CardDescription>Your grades across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-3",
            useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
          )}>
            {SUBJECTS.map((subject, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{subject.name}</span>
                  <Badge className={cn("text-white", subject.color)}>
                    {subject.grade}
                  </Badge>
                </div>
                <Progress value={subject.percentage} className="h-1.5 mb-1" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{subject.percentage}%</span>
                  <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                    <TrendingUp className="size-3" />
                    {subject.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
