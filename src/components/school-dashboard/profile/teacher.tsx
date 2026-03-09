"use client"

import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSidebar } from "@/components/ui/sidebar"

interface TeacherDashboardProps {
  data: Record<string, unknown>
}

// Classes being taught
const CLASSES = [
  {
    name: "Advanced Calculus",
    grade: "Grade 12",
    students: 32,
    time: "9:00 AM",
    room: "Room 201",
    color: "bg-chart-1",
  },
  {
    name: "Algebra II",
    grade: "Grade 10",
    students: 28,
    time: "11:00 AM",
    room: "Room 203",
    color: "bg-chart-2",
  },
  {
    name: "Statistics",
    grade: "Grade 11",
    students: 25,
    time: "2:00 PM",
    room: "Room 205",
    color: "bg-chart-3",
  },
]

// Pending grading tasks
const GRADING_TASKS = [
  {
    title: "Calculus Quiz - Chapter 7",
    class: "Grade 12",
    submitted: 28,
    graded: 15,
    due: "Dec 22",
  },
  {
    title: "Mechanics Lab Report",
    class: "Grade 11",
    submitted: 18,
    graded: 8,
    due: "Dec 20",
  },
  {
    title: "Algebra Homework Set 5",
    class: "Grade 10",
    submitted: 26,
    graded: 26,
    due: "Dec 15",
  },
]

// Student performance overview
const TOP_STUDENTS = [
  { name: "Ahmed Hassan", class: "Grade 12", grade: "A+", improvement: "+5%" },
  { name: "Sara Ali", class: "Grade 10", grade: "A", improvement: "+3%" },
  { name: "Omar Khalid", class: "Grade 11", grade: "A-", improvement: "+7%" },
]

export default function TeacherDashboard({ data }: TeacherDashboardProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div
        className={cn(
          "grid gap-4",
          useMobileLayout
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1 md:grid-cols-4"
        )}
      >
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Total Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-blue-500">127</span>
            <p className="text-muted-foreground mt-1 text-xs">
              Across 6 classes
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="size-4 text-orange-500" />
              Pending Grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-orange-500">23</span>
            <p className="text-muted-foreground mt-1 text-xs">
              Assignments to grade
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-500" />
              Class Average
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-emerald-500">B+</span>
            <p className="text-muted-foreground mt-1 text-xs">
              All classes combined
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="size-4 text-purple-500" />
              Classes Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-purple-500">3</span>
            <p className="text-muted-foreground mt-1 text-xs">
              Next at 9:00 AM
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div
        className={cn(
          "grid gap-6",
          useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}
      >
        {/* Today's Schedule */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="text-primary size-5" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CLASSES.map((cls, idx) => (
              <div
                key={idx}
                className="border-border bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg text-white",
                      cls.color
                    )}
                  >
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cls.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {cls.grade} • {cls.room}
                    </p>
                  </div>
                </div>
                <div className="text-end">
                  <Badge variant="secondary" className="mb-1">
                    {cls.time}
                  </Badge>
                  <p className="text-muted-foreground text-xs">
                    {cls.students} students
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Grading Queue */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-5 text-orange-500" />
              Grading Queue
            </CardTitle>
            <CardDescription>Assignments waiting for review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {GRADING_TASKS.map((task, idx) => {
              const progress = Math.round((task.graded / task.submitted) * 100)
              const isComplete = task.graded === task.submitted

              return (
                <div
                  key={idx}
                  className="border-border bg-card hover:bg-muted/50 rounded-lg border p-3 transition-colors"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Due: {task.due}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-1.5 flex-1" />
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {task.graded}/{task.submitted}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {task.class}
                  </p>
                </div>
              )
            })}
            <button className="text-primary w-full py-2 text-sm hover:underline">
              View all assignments
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Students */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-5 text-amber-500" />
            Top Performing Students
          </CardTitle>
          <CardDescription>Students showing excellent progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "grid gap-4",
              useMobileLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
            )}
          >
            {TOP_STUDENTS.map((student, idx) => (
              <div
                key={idx}
                className="border-border bg-card hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-4 transition-colors"
              >
                <Avatar className="size-12 border-2 border-amber-500/30">
                  <AvatarFallback className="bg-amber-500/10 font-semibold text-amber-500">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {student.class}
                  </p>
                </div>
                <div className="text-end">
                  <Badge className="mb-1 bg-amber-500 text-white">
                    {student.grade}
                  </Badge>
                  <p className="text-xs text-emerald-500">
                    {student.improvement}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teaching Load Summary */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Weekly Teaching Load</CardTitle>
          <CardDescription>Your class distribution this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "grid gap-3",
              useMobileLayout
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-2 md:grid-cols-3"
            )}
          >
            {[
              { day: "Monday", classes: 4, hours: 4 },
              { day: "Tuesday", classes: 3, hours: 3 },
              { day: "Wednesday", classes: 5, hours: 5 },
              { day: "Thursday", classes: 4, hours: 4 },
              { day: "Friday", classes: 2, hours: 2 },
              { day: "Total", classes: 18, hours: 18 },
            ].map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "border-border rounded-lg border p-4",
                  item.day === "Total"
                    ? "bg-primary/5 border-primary/30"
                    : "bg-card"
                )}
              >
                <p
                  className={cn(
                    "text-sm font-medium",
                    item.day === "Total" && "text-primary"
                  )}
                >
                  {item.day}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      item.day === "Total" ? "text-primary" : "text-foreground"
                    )}
                  >
                    {item.classes}
                  </span>
                  <span className="text-muted-foreground text-xs">classes</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {item.hours} teaching hours
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
