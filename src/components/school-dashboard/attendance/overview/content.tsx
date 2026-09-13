"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CalendarOff,
  CheckCircle2,
  ChevronRight,
  Clock,
  DoorOpen,
  Layers,
  Mail,
  MonitorCheck,
  ScanLine,
  Sparkles,
  TrendingUp,
  Trophy,
  Upload,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  AppTileGrid,
  ListRow,
  ListRows,
  SectionHeader,
  StatPanel,
  type TileTint,
} from "@/components/school-dashboard/shared"

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

  // `icon` + `tint` draw the phone's app tiles; `iconName` stays for the
  // desktop ActionCard, which resolves names to avoid serializing components.
  const quickLinks: Array<{
    key: string
    href: string
    label?: string
    iconName: string
    icon: LucideIcon
    tint: TileTint
    adminOnly?: boolean
  }> = [
    {
      key: "recent",
      href: `${basePath}/recent`,
      label: (d as any)?.recentActivity,
      iconName: "Activity",
      icon: Activity,
      tint: "blue",
    },
    {
      key: "bulkUpload",
      href: `${basePath}/bulk-upload`,
      label: ov?.bulkUpload,
      iconName: "Upload",
      icon: Upload,
      tint: "teal",
    },
    {
      key: "barcode",
      href: `${basePath}/barcode`,
      label: (d as any)?.navBarcode,
      iconName: "ScanLine",
      icon: ScanLine,
      tint: "gray",
    },
    {
      key: "hallPass",
      href: `${basePath}/hall-pass`,
      label: ov?.hallPass,
      iconName: "DoorOpen",
      icon: DoorOpen,
      tint: "orange",
    },
    {
      key: "mtssTiers",
      href: `${basePath}/interventions/tiers`,
      label: ov?.mtssTiers,
      iconName: "Layers",
      icon: Layers,
      tint: "indigo",
    },
    {
      key: "gamification",
      href: `${basePath}/gamification`,
      label: ov?.gamification,
      iconName: "Trophy",
      icon: Trophy,
      tint: "yellow",
    },
    {
      key: "aiInsights",
      href: `${basePath}/ai`,
      label: ov?.aiInsights,
      iconName: "Sparkles",
      icon: Sparkles,
      tint: "purple",
    },
    {
      key: "kiosk",
      href: `${basePath}/kiosk`,
      label: ov?.kiosk,
      iconName: "MonitorCheck",
      icon: MonitorCheck,
      tint: "green",
      adminOnly: true,
    },
    {
      key: "letters",
      href: `${basePath}/letters`,
      label: ov?.letters,
      iconName: "Mail",
      icon: Mail,
      tint: "red",
      adminOnly: true,
    },
  ]
  const visibleQuickLinks = quickLinks.filter((l) => !l.adminOnly || isAdmin)

  const showSkeleton = isPending && !dashboard

  return (
    <div className="space-y-8 md:space-y-6">
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

      {/* Phone: today's figures and the marking bar as ONE grey panel, the
          dashboard analytics card's header — four tinted cards and a separate
          progress card were five surfaces for one question. */}
      <StatPanel
        className="md:hidden"
        items={[
          {
            key: "present",
            label: d?.present || "Present",
            value: showSkeleton ? "—" : (stats?.present ?? 0),
            tone: "positive",
          },
          {
            key: "absent",
            label: d?.absent || "Absent",
            value: showSkeleton ? "—" : (stats?.absent ?? 0),
            tone: (stats?.absent ?? 0) > 0 ? "negative" : "default",
          },
          {
            key: "late",
            label: d?.late || "Late",
            value: showSkeleton ? "—" : (stats?.late ?? 0),
            tone: (stats?.late ?? 0) > 0 ? "warning" : "default",
          },
          {
            key: "rate",
            label: d?.attendanceRate || "Rate",
            value: showSkeleton ? "—" : `${stats?.attendanceRate ?? 0}%`,
          },
        ]}
      >
        {(showSkeleton || isSchoolDay) && (
          <div className="border-t px-5 py-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                {ov?.classesProgress || "Classes marked today"}
              </span>
              <span className="font-semibold tabular-nums">
                {showSkeleton ? "—" : `${classesMarked} / ${classesTotal}`}
              </span>
            </div>
            <Progress
              value={markingProgress}
              className="bg-background mt-2 h-1.5"
            />
          </div>
        )}
      </StatPanel>

      {/* Stats Grid */}
      <div className="hidden grid-cols-2 gap-3 md:grid">
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
        <Card className="bg-muted/40 max-md:bg-muted max-md:border-0">
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

      {/* Today's Marking Progress — classes marked / total classes. On a
          phone it lives inside the stat panel above. */}
      {(showSkeleton || isSchoolDay) && (
        <Card className="hidden md:block">
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

      {/* Phone: the unmarked classes as a shelf of pills under a heading. The
          amber box wrapped 8 bordered buttons into a 400px wall; a single
          scrolling row keeps the count in view and every class one tap away. */}
      {unmarkedClasses.length > 0 && (
        <section className="md:hidden">
          <SectionHeader
            title={`${unmarkedClasses.length} ${d?.classesNotMarked || "classes not marked today"}`}
          />
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {unmarkedClasses.map((cls) => (
              <Link
                key={cls.id}
                href={`${basePath}/manual?classId=${cls.id}`}
                className="bg-muted hover:bg-muted/70 inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors"
              >
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                {cls.name}
                <span className="text-muted-foreground text-xs tabular-nums">
                  {cls.studentCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Unmarked Classes — only shows if there are unmarked classes */}
      {unmarkedClasses.length > 0 && (
        <Card className="hidden border-amber-200 bg-amber-50 md:block dark:border-amber-900 dark:bg-amber-950/20">
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

      {/* Phone: students who need attention as rows — severity is a dot, not a
          tinted box, so five alerts read as one list instead of five warnings. */}
      {followUp && followUp.students.length > 0 && (
        <section className="md:hidden">
          <SectionHeader
            title={d?.needsAttentionTitle || "Needs Attention"}
            action={
              followUp.summary.critical > 0 || followUp.summary.warning > 0 ? (
                <span className="inline-flex gap-1">
                  {followUp.summary.critical > 0 && (
                    <Badge variant="destructive">
                      {(ov?.criticalCount || "{count} critical").replace(
                        "{count}",
                        String(followUp.summary.critical)
                      )}
                    </Badge>
                  )}
                  {followUp.summary.warning > 0 && (
                    <Badge
                      variant="outline"
                      className="border-amber-500 text-amber-600"
                    >
                      {(ov?.warningCount || "{count} warning").replace(
                        "{count}",
                        String(followUp.summary.warning)
                      )}
                    </Badge>
                  )}
                </span>
              ) : undefined
            }
          />
          <ListRows divided>
            {followUp.students.slice(0, 5).map((student, idx) => (
              <ListRow
                key={`${student.studentId}-${idx}`}
                href={
                  student.actionUrl
                    ? `/${locale}${student.actionUrl}`
                    : `${basePath}/analytics`
                }
                leading={
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block size-2.5 rounded-full",
                      student.severity === "critical"
                        ? "bg-destructive"
                        : student.severity === "warning"
                          ? "bg-amber-500"
                          : "bg-muted-foreground/40"
                    )}
                  />
                }
                title={student.studentName}
                description={
                  <>
                    {student.className} — {followUpDetails(student)}
                  </>
                }
              />
            ))}
          </ListRows>
        </section>
      )}

      {/* Needs Attention — only shows if there are alerts */}
      {followUp && followUp.students.length > 0 && (
        <div className="hidden md:block">
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

      {/* Recent Activity — today's latest marks. The table stays; on a phone
          the card around it goes, and the heading takes the section's line. */}
      {dashboard && dashboard.recentActivity.length > 0 && (
        <Card className="max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none">
          <CardContent className="p-4 max-md:p-0">
            <SectionHeader
              className="md:hidden"
              title={(d as any)?.recentActivity || "Recent Activity"}
              href={`${basePath}/recent`}
              linkLabel={ov?.viewAll || "View all"}
            />
            <div className="mb-2 hidden items-center justify-between md:flex">
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

      {/* Phone: quick access as home-screen tiles — the dashboard's quick
          actions, continued. Nine full-width cards were ~1,900px of scroll. */}
      <section className="md:hidden">
        <SectionHeader title={ov?.quickAccess || "Quick access"} />
        <AppTileGrid
          items={visibleQuickLinks.map((link) => ({
            key: link.key,
            label: link.label || link.key,
            href: link.href,
            icon: link.icon,
            tint: link.tint,
          }))}
        />
      </section>

      {/* Quick access — functional sub-features not in the tab bar */}
      <div className="hidden md:block">
        <h3 className="mb-3 text-sm font-medium">
          {ov?.quickAccess || "Quick access"}
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleQuickLinks.map((link) => (
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
