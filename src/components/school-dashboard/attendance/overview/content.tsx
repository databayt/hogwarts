"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  CalendarOff,
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
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getFollowUpStudents, getTodaysDashboard } from "../actions"
import { ActionCard } from "../atom/action-card"
import { RecentTable } from "../atom/recent-table"
import { ClockCard } from "../quick/clock-card"
import type { AttendanceMethod, AttendanceStatus } from "../shared/types"

interface AttendanceOverviewContentProps {
  locale: Locale
  subdomain: string
  role?: string
}

interface DashboardData {
  today: { date: string; dayName: string; isSchoolDay: boolean }
  stats: {
    totalStudents: number
    markedToday: number
    present: number
    absent: number
    late: number
    attendanceRate: number
    classesTotal: number
    classesMarked: number
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
    method: string
    date: string
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
    count?: number
    date?: string
    actionUrl?: string
  }>
  summary: { critical: number; warning: number; info: number }
}

export function AttendanceOverviewContent({
  locale,
  subdomain,
  role,
}: AttendanceOverviewContentProps) {
  const { dictionary } = useDictionary()
  const [isPending, startTransition] = useTransition()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [followUp, setFollowUp] = useState<FollowUpData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const basePath = `/${locale}/attendance`
  const d = dictionary?.school?.attendance
  const ov = (dictionary?.school?.attendance as any)?.overviewExtras as
    | Record<string, any>
    | undefined
  const isAdmin = role === "ADMIN" || role === "DEVELOPER"

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            : ov?.unableToLoad ||
                "Unable to load attendance data. Please try again."
        )
      }
    })
  }

  const stats = dashboard?.stats
  const classesTotal = stats?.classesTotal ?? 0
  const classesMarked = stats?.classesMarked ?? 0
  const markingProgress = classesTotal
    ? Math.round((classesMarked / classesTotal) * 100)
    : 0
  const unmarkedClasses = dashboard?.unmarkedClasses || []
  const isSchoolDay = dashboard?.today?.isSchoolDay ?? true

  const dateFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  // Localized follow-up line: prefer the structured fields + dictionary
  // template; fall back to the server's preformatted English string.
  function followUpDetails(student: FollowUpData["students"][number]) {
    if (student.issue === "consecutive_absence" && student.count != null) {
      const template = ov?.absentConsecutiveDays as string | undefined
      if (template) return template.replace("{count}", String(student.count))
    }
    if (student.issue === "unexcused_pending" && student.date) {
      const template = ov?.excusePendingSince as string | undefined
      if (template) {
        const formatted = dateFormatter.format(new Date(student.date))
        const [before, after] = template.split("{date}")
        return (
          <>
            {before}
            <bdi>{formatted}</bdi>
            {after}
          </>
        )
      }
    }
    return student.details
  }

  const statusLabels: Partial<Record<AttendanceStatus, string>> = {
    PRESENT: d?.present,
    ABSENT: d?.absent,
    LATE: d?.late,
    EXCUSED: d?.excused,
    SICK: (d as any)?.sick,
    HOLIDAY: d?.holiday,
  }

  const quickLinks: Array<{
    key: string
    href: string
    label?: string
    iconName: string
    adminOnly?: boolean
  }> = [
    {
      key: "recent",
      href: `${basePath}/recent`,
      label: (d as any)?.recentActivity,
      iconName: "Activity",
    },
    {
      key: "bulkUpload",
      href: `${basePath}/bulk-upload`,
      label: ov?.bulkUpload,
      iconName: "Upload",
    },
    {
      key: "barcode",
      href: `${basePath}/barcode`,
      label: (d as any)?.navBarcode,
      iconName: "ScanLine",
    },
    {
      key: "hallPass",
      href: `${basePath}/hall-pass`,
      label: ov?.hallPass,
      iconName: "DoorOpen",
    },
    {
      key: "mtssTiers",
      href: `${basePath}/interventions/tiers`,
      label: ov?.mtssTiers,
      iconName: "Layers",
    },
    {
      key: "gamification",
      href: `${basePath}/gamification`,
      label: ov?.gamification,
      iconName: "Trophy",
    },
    {
      key: "aiInsights",
      href: `${basePath}/ai`,
      label: ov?.aiInsights,
      iconName: "Sparkles",
    },
    {
      key: "kiosk",
      href: `${basePath}/kiosk`,
      label: ov?.kiosk,
      iconName: "MonitorCheck",
      adminOnly: true,
    },
    {
      key: "letters",
      href: `${basePath}/letters`,
      label: ov?.letters,
      iconName: "Mail",
      adminOnly: true,
    },
  ]

  const showSkeleton = isPending && !dashboard

  return (
    <div className="space-y-6">
      {/* Self-service check-in/out — renders only for users with a
          teacher/staff identity (timesheet integration) */}
      <ClockCard locale={locale} dictionary={(d as any)?.quick?.clock} />

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
                {ov?.checkStudentsEnrolled ||
                  "Check that students are enrolled in classes and that attendance has been taken."}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadData()}>
              {ov?.retry || "Retry"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            {
              key: "present",
              icon: CheckCircle2,
              label: d?.present || "Present",
              value: stats?.present ?? 0,
              accent: "bg-emerald-500/10",
            },
            {
              key: "absent",
              icon: AlertCircle,
              label: d?.absent || "Absent",
              value: stats?.absent ?? 0,
              accent: "bg-red-500/10",
            },
            {
              key: "late",
              icon: Clock,
              label: d?.late || "Late",
              value: stats?.late ?? 0,
              accent: "bg-amber-500/10",
            },
            {
              key: "rate",
              icon: TrendingUp,
              label: d?.attendanceRate || "Rate",
              value: `${stats?.attendanceRate ?? 0}%`,
              accent: "bg-primary/10",
            },
          ] as const
        ).map((card) => (
          <Card key={card.key} className="relative overflow-hidden">
            <div
              className={cn(
                "absolute end-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full rtl:-translate-x-4",
                card.accent
              )}
            />
            <CardContent className="p-4">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                <card.icon className="h-3.5 w-3.5" />
                {card.label}
              </div>
              {showSkeleton ? (
                <Skeleton className="mt-2 h-7 w-14" />
              ) : (
                <p className="mt-1 text-2xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No school today — neutral note instead of alarming zeros */}
      {!showSkeleton && dashboard && !isSchoolDay && (
        <Card className="bg-muted/40">
          <CardContent className="flex items-center gap-3 p-4">
            <CalendarOff className="text-muted-foreground h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {ov?.noSchoolToday || "No school today"}
              </p>
              <p className="text-muted-foreground text-xs">
                {ov?.noSchoolTodayDesc ||
                  "Today is not a school day, so attendance is not expected."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Marking Progress — classes marked / total classes */}
      {(showSkeleton || isSchoolDay) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {ov?.classesProgress || "Classes marked today"}
              </span>
              {showSkeleton ? (
                <Skeleton className="h-5 w-16" />
              ) : (
                <span className="font-medium">
                  {classesMarked} / {classesTotal}
                </span>
              )}
            </div>
            <Progress value={markingProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>
      )}

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
                  {(ov?.moreCount || "+{count} more").replace(
                    "{count}",
                    String(unmarkedClasses.length - 8)
                  )}
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
                    {(ov?.criticalCount || "{count} critical").replace(
                      "{count}",
                      String(followUp.summary.critical)
                    )}
                  </Badge>
                )}
                {followUp.summary.warning > 0 && (
                  <Badge
                    variant="outline"
                    className="border-amber-500 text-xs text-amber-600"
                  >
                    {(ov?.warningCount || "{count} warning").replace(
                      "{count}",
                      String(followUp.summary.warning)
                    )}
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
                    {student.className} — {followUpDetails(student)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href={
                      student.actionUrl
                        ? `/${locale}${student.actionUrl}`
                        : `${basePath}/analytics`
                    }
                  >
                    <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity — today's latest marks */}
      {dashboard && dashboard.recentActivity.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {(d as any)?.recentActivity || "Recent Activity"}
              </h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`${basePath}/recent`}>
                  {ov?.viewAll || "View all"}
                  <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
                </Link>
              </Button>
            </div>
            <RecentTable
              data={dashboard.recentActivity.map((r) => ({
                id: r.id,
                studentName: r.studentName,
                className: r.className,
                status: r.status as AttendanceStatus,
                method: r.method as AttendanceMethod,
                date: r.date,
              }))}
              limit={5}
              dictionary={{
                status: statusLabels as Record<string, string>,
                method: ov?.methodLabels,
                columns: {
                  student: (d as any)?.columns?.student,
                  class: (d as any)?.columns?.class,
                  status: (d as any)?.columns?.status,
                  time: (d as any)?.columns?.time,
                  method: (d as any)?.columns?.method,
                },
                noRecords: (d as any)?.noRecentRecords,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Quick access — functional sub-features not in the tab bar */}
      <div>
        <h3 className="mb-3 text-sm font-medium">
          {ov?.quickAccess || "Quick access"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks
            .filter((l) => !l.adminOnly || isAdmin)
            .map((link) => (
              <ActionCard
                key={link.key}
                title={link.label || link.key}
                href={link.href}
                iconName={link.iconName}
              />
            ))}
        </div>
      </div>
    </div>
  )
}
