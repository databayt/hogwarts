"use client"

import { useSidebar } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BookOpen,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  FileText,
  TrendingUp,
  Award
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TeacherDashboardProps {
  data: Record<string, unknown>
}

// Classes being taught
const CLASSES = [
  { name: "Advanced Calculus", grade: "Grade 12", students: 32, time: "9:00 AM", room: "Room 201", color: "bg-chart-1" },
  { name: "Algebra II", grade: "Grade 10", students: 28, time: "11:00 AM", room: "Room 203", color: "bg-chart-2" },
  { name: "Statistics", grade: "Grade 11", students: 25, time: "2:00 PM", room: "Room 205", color: "bg-chart-3" },
]

// Pending grading tasks
const GRADING_TASKS = [
  { title: "Calculus Quiz - Chapter 7", class: "Grade 12", submitted: 28, graded: 15, due: "Dec 22" },
  { title: "Mechanics Lab Report", class: "Grade 11", submitted: 18, graded: 8, due: "Dec 20" },
  { title: "Algebra Homework Set 5", class: "Grade 10", submitted: 26, graded: 26, due: "Dec 15" },
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
      <div className={cn(
        "grid gap-4",
        useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 md:grid-cols-4"
      )}>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="size-4 text-blue-500" />
              Total Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-blue-500">127</span>
            <p className="text-xs text-muted-foreground mt-1">Across 6 classes</p>
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
            <p className="text-xs text-muted-foreground mt-1">Assignments to grade</p>
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
            <p className="text-xs text-muted-foreground mt-1">All classes combined</p>
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
            <p className="text-xs text-muted-foreground mt-1">Next at 9:00 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className={cn(
        "grid gap-6",
        useMobileLayout ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
      )}>
        {/* Today's Schedule */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Today's Classes
            </CardTitle>
            <CardDescription>Your teaching schedule for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CLASSES.map((cls, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("size-10 rounded-lg flex items-center justify-center text-white", cls.color)}>
                    <BookOpen className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{cls.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.grade} • {cls.room}</p>
                  </div>
                </div>
                <div className="text-end">
                  <Badge variant="secondary" className="mb-1">{cls.time}</Badge>
                  <p className="text-xs text-muted-foreground">{cls.students} students</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Grading Queue */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
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
                  className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="size-4 text-orange-500" />
                      )}
                      <span className="font-medium text-sm">{task.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Due: {task.due}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={progress} className="flex-1 h-1.5" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {task.graded}/{task.submitted}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{task.class}</p>
                </div>
              )
            })}
            <button className="w-full text-sm text-primary hover:underline py-2">
              View all assignments
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Students */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Top Performing Students
          </CardTitle>
          <CardDescription>Students showing excellent progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            useMobileLayout ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"
          )}>
            {TOP_STUDENTS.map((student, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <Avatar className="size-12 border-2 border-amber-500/30">
                  <AvatarFallback className="bg-amber-500/10 text-amber-500 font-semibold">
                    {student.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.class}</p>
                </div>
                <div className="text-end">
                  <Badge className="bg-amber-500 text-white mb-1">{student.grade}</Badge>
                  <p className="text-xs text-emerald-500">{student.improvement}</p>
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
          <div className={cn(
            "grid gap-3",
            useMobileLayout ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 md:grid-cols-3"
          )}>
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
                  "p-4 rounded-lg border border-border",
                  item.day === "Total" ? "bg-primary/5 border-primary/30" : "bg-card"
                )}
              >
                <p className={cn(
                  "font-medium text-sm",
                  item.day === "Total" && "text-primary"
                )}>{item.day}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={cn(
                    "text-2xl font-bold",
                    item.day === "Total" ? "text-primary" : "text-foreground"
                  )}>{item.classes}</span>
                  <span className="text-xs text-muted-foreground">classes</span>
                </div>
                <p className="text-xs text-muted-foreground">{item.hours} teaching hours</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
