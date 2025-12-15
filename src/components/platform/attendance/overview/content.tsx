"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  PlayCircle,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"

import {
  getFollowUpStudents,
  getTeacherClassesToday,
  getTodaysDashboard,
  quickMarkAllPresent,
} from "../actions"

interface AttendanceOverviewContentProps {
  locale: Locale
  subdomain: string
}

// Type definitions for state
interface DashboardData {
  today: { date: string; dayName: string }
  stats: {
    totalStudents: number
    markedToday: number
    present: number
    absent: number
    late: number
    attendanceRate: number
  }
  unmarkedClasses: Array<{ id: string; name: string; studentCount: number }>
  followUpNeeded: Array<{
    studentId: string
    studentName: string
    className: string
    issue: string
    details: string
    priority: string
  }>
  recentActivity: Array<{
    id: string
    studentName: string
    className: string
    status: string
    time: string
  }>
}

interface ClassData {
  classes: Array<{
    id: string
    name: string
    studentCount: number
    isMarked: boolean
    markedCount: number
  }>
}

interface FollowUpData {
  students: Array<{
    studentId: string
    studentName: string
    className: string
    issue: string
    severity: "critical" | "warning" | "info"
    details: string
    actionUrl?: string
  }>
  summary: { critical: number; warning: number; info: number }
}

export function AttendanceOverviewContent({
  locale,
  subdomain,
}: AttendanceOverviewContentProps) {
  const [isPending, startTransition] = useTransition()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [classes, setClasses] = useState<ClassData | null>(null)
  const [followUp, setFollowUp] = useState<FollowUpData | null>(null)
  const [markingClass, setMarkingClass] = useState<string | null>(null)

  const basePath = `/${locale}/s/${subdomain}/attendance`

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    startTransition(async () => {
      const [dashResult, classResult, followResult] = await Promise.all([
        getTodaysDashboard(),
        getTeacherClassesToday(),
        getFollowUpStudents({ limit: 5 }),
      ])

      if (dashResult.success && dashResult.data)
        setDashboard(dashResult.data as DashboardData)
      if (classResult.success && classResult.data)
        setClasses(classResult.data as ClassData)
      if (followResult.success && followResult.data)
        setFollowUp(followResult.data as FollowUpData)
    })
  }

  async function handleQuickMark(classId: string) {
    setMarkingClass(classId)
    const result = await quickMarkAllPresent({ classId })
    if (result.success) {
      await loadData() // Refresh data
    }
    setMarkingClass(null)
  }

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* Today's Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground h-5 w-5" />
            <span className="text-muted-foreground">
              {dashboard?.today.dayName || "Today"},{" "}
              {dashboard?.today.date || new Date().toISOString().split("T")[0]}
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Attendance Overview
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {currentTime}
          </Badge>
          <Button asChild>
            <Link href={`${basePath}/manual`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Mark Attendance
            </Link>
          </Button>
        </div>
      </div>

      {/* Today's Stats - Compact */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Present</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {dashboard?.stats.present || 0}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Absent</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboard?.stats.absent || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Late</p>
                <p className="text-2xl font-bold text-amber-600">
                  {dashboard?.stats.late || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Rate</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboard?.stats.attendanceRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today's Progress</span>
            <span className="font-medium">
              {dashboard?.stats.markedToday || 0} /{" "}
              {dashboard?.stats.totalStudents || 0} students marked
            </span>
          </div>
          <Progress
            value={
              dashboard?.stats.totalStudents
                ? (dashboard.stats.markedToday /
                    dashboard.stats.totalStudents) *
                  100
                : 0
            }
            className="h-2"
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classes Today - Quick Mark */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Classes Today</CardTitle>
              <Badge variant="secondary">
                {classes?.classes.length || 0} classes
              </Badge>
            </div>
            <CardDescription>
              Click "Mark All Present" then adjust exceptions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isPending ? (
              <div className="text-muted-foreground py-8 text-center">
                Loading...
              </div>
            ) : classes?.classes.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                No classes assigned
              </div>
            ) : (
              classes?.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        cls.isMarked
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-muted"
                      }`}
                    >
                      <Users
                        className={`h-5 w-5 ${cls.isMarked ? "text-emerald-600" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {cls.studentCount} students
                        {cls.isMarked && ` • ${cls.markedCount} marked`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cls.isMarked ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Done
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleQuickMark(cls.id)}
                        disabled={markingClass === cls.id}
                      >
                        {markingClass === cls.id ? (
                          "Marking..."
                        ) : (
                          <>
                            <Zap className="mr-1 h-3 w-3" />
                            All Present
                          </>
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`${basePath}/manual?classId=${cls.id}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Follow-Up Needed - Actionable Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Needs Attention</CardTitle>
              {followUp &&
                (followUp.summary.critical > 0 ||
                  followUp.summary.warning > 0) && (
                  <div className="flex gap-1">
                    {followUp.summary.critical > 0 && (
                      <Badge variant="destructive">
                        {followUp.summary.critical} critical
                      </Badge>
                    )}
                    {followUp.summary.warning > 0 && (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                      >
                        {followUp.summary.warning} warning
                      </Badge>
                    )}
                  </div>
                )}
            </div>
            <CardDescription>
              Students requiring follow-up action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isPending ? (
              <div className="text-muted-foreground py-8 text-center">
                Loading...
              </div>
            ) : !followUp?.students.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500" />
                <p className="text-muted-foreground">
                  All students are on track!
                </p>
              </div>
            ) : (
              followUp.students.map((student, idx) => (
                <div
                  key={`${student.studentId}-${idx}`}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    student.severity === "critical"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                      : student.severity === "warning"
                        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                        : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        student.severity === "critical"
                          ? "bg-red-100 dark:bg-red-900/50"
                          : student.severity === "warning"
                            ? "bg-amber-100 dark:bg-amber-900/50"
                            : "bg-muted"
                      }`}
                    >
                      <AlertTriangle
                        className={`h-5 w-5 ${
                          student.severity === "critical"
                            ? "text-red-600"
                            : student.severity === "warning"
                              ? "text-amber-600"
                              : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-muted-foreground text-xs">
                        {student.className} • {student.details}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      href={student.actionUrl || `${basePath}/early-warning`}
                    >
                      View
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            )}
            {followUp && followUp.students.length > 0 && (
              <Button variant="outline" className="mt-2 w-full" asChild>
                <Link href={`${basePath}/analysis`}>View All Alerts</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unmarked Classes Alert */}
      {dashboard?.unmarkedClasses && dashboard.unmarkedClasses.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base text-amber-800 dark:text-amber-200">
                {dashboard.unmarkedClasses.length} Classes Not Marked Today
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboard.unmarkedClasses.slice(0, 6).map((cls) => (
                <Button
                  key={cls.id}
                  variant="outline"
                  size="sm"
                  asChild
                  className="dark:bg-background bg-white"
                >
                  <Link href={`${basePath}/manual?classId=${cls.id}`}>
                    {cls.name}
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({cls.studentCount})
                    </span>
                  </Link>
                </Button>
              ))}
              {dashboard.unmarkedClasses.length > 6 && (
                <Badge
                  variant="outline"
                  className="dark:bg-background bg-white"
                >
                  +{dashboard.unmarkedClasses.length - 6} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {dashboard?.recentActivity && dashboard.recentActivity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest attendance records today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboard.recentActivity.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b py-2 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        record.status === "PRESENT"
                          ? "bg-emerald-500"
                          : record.status === "ABSENT"
                            ? "bg-red-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <span className="font-medium">{record.studentName}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-sm">
                      {record.className}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        record.status === "PRESENT"
                          ? "default"
                          : record.status === "ABSENT"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {record.status}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {record.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Button
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`${basePath}/qr-code`}>
            <span className="text-lg">📱</span>
            <span className="text-xs">QR Code</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`${basePath}/bulk`}>
            <span className="text-lg">📋</span>
            <span className="text-xs">Bulk Upload</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`${basePath}/reports`}>
            <span className="text-lg">📊</span>
            <span className="text-xs">Reports</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto flex-col gap-1 py-3"
          asChild
        >
          <Link href={`${basePath}/config`}>
            <span className="text-lg">⚙️</span>
            <span className="text-xs">Settings</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
