"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getFollowUpStudents, getTodaysDashboard } from "../actions"

interface AttendanceOverviewContentProps {
  locale: Locale
  subdomain: string
}

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
  const { dictionary } = useDictionary()
  const [isPending, startTransition] = useTransition()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [followUp, setFollowUp] = useState<FollowUpData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const basePath = `/${locale}/attendance`
  const d = dictionary?.school?.attendance

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoadError(null)
    startTransition(async () => {
      const [dashResult, followResult] = await Promise.all([
        getTodaysDashboard().catch(() => ({
          success: false as const,
          error: "Failed",
        })),
        getFollowUpStudents({ limit: 5 }).catch(() => ({
          success: false as const,
          error: "Failed",
        })),
      ])

      if (dashResult.success && dashResult.data)
        setDashboard(dashResult.data as DashboardData)
      if (followResult.success && followResult.data)
        setFollowUp(followResult.data as FollowUpData)

      if (!dashResult.success && !followResult.success) {
        const errorMsg =
          ("error" in dashResult && dashResult.error) ||
          ("error" in followResult && followResult.error)
        setLoadError(
          errorMsg
            ? String(errorMsg)
            : "Unable to load attendance data. Please try again."
        )
      }
    })
  }

  const stats = dashboard?.stats
  const markingProgress = stats?.totalStudents
    ? Math.round((stats.markedToday / stats.totalStudents) * 100)
    : 0
  const unmarkedClasses = dashboard?.unmarkedClasses || []

  return (
    <div className="space-y-6">
      {/* Error State */}
      {loadError && !dashboard && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">
                {loadError}
              </p>
              <p className="text-muted-foreground text-sm">
                Check that students are enrolled in classes and the school has
                an active term configured.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadData()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="relative overflow-hidden">
          <div className="absolute end-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-emerald-500/10 rtl:-translate-x-4" />
          <CardContent className="p-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {d?.present || "Present"}
            </div>
            <p className="mt-1 text-2xl font-bold">{stats?.present || 0}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute end-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-red-500/10 rtl:-translate-x-4" />
          <CardContent className="p-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {d?.absent || "Absent"}
            </div>
            <p className="mt-1 text-2xl font-bold">{stats?.absent || 0}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute end-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-amber-500/10 rtl:-translate-x-4" />
          <CardContent className="p-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              {d?.late || "Late"}
            </div>
            <p className="mt-1 text-2xl font-bold">{stats?.late || 0}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="bg-primary/10 absolute end-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full rtl:-translate-x-4" />
          <CardContent className="p-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              {d?.attendanceRate || "Rate"}
            </div>
            <p className="mt-1 text-2xl font-bold">
              {stats?.attendanceRate || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Marking Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {d?.stats?.overallRate || "Today's Progress"}
            </span>
            <span className="font-medium">
              {stats?.markedToday || 0} / {stats?.totalStudents || 0}
            </span>
          </div>
          <Progress value={markingProgress} className="mt-2 h-2" />
        </CardContent>
      </Card>

      {/* Unmarked Classes — only shows if there are unmarked classes */}
      {unmarkedClasses.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                {unmarkedClasses.length}{" "}
                {d?.classesNotMarked || "classes not marked today"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {unmarkedClasses.slice(0, 8).map((cls) => (
                <Button
                  key={cls.id}
                  variant="outline"
                  size="sm"
                  asChild
                  className="dark:bg-background bg-white"
                >
                  <Link href={`${basePath}/manual?classId=${cls.id}`}>
                    {cls.name}
                    <span className="text-muted-foreground ms-1 text-xs">
                      ({cls.studentCount})
                    </span>
                  </Link>
                </Button>
              ))}
              {unmarkedClasses.length > 8 && (
                <Badge
                  variant="outline"
                  className="dark:bg-background bg-white"
                >
                  +{unmarkedClasses.length - 8} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Needs Attention — only shows if there are alerts */}
      {followUp && followUp.students.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium">
            {d?.needsAttentionTitle || "Needs Attention"}
            {(followUp.summary.critical > 0 ||
              followUp.summary.warning > 0) && (
              <span className="ms-2 inline-flex gap-1">
                {followUp.summary.critical > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {followUp.summary.critical} critical
                  </Badge>
                )}
                {followUp.summary.warning > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-xs text-amber-600"
                  >
                    {followUp.summary.warning} warning
                  </Badge>
                )}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {followUp.students.slice(0, 5).map((student, idx) => (
              <div
                key={`${student.studentId}-${idx}`}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  student.severity === "critical"
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                    : student.severity === "warning"
                      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                      : "bg-muted/30"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {student.studentName}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {student.className} — {student.details}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={student.actionUrl || `${basePath}/analytics`}>
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
