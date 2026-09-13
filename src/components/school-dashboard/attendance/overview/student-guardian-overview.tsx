"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  XCircle,
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
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { getParentAttendanceSummary } from "@/components/school-dashboard/attendance/actions/dashboard"
import { getStudentOwnAttendance } from "@/components/school-dashboard/attendance/actions/records"
import {
  ListRow,
  ListRows,
  SectionHeader,
  StatPanel,
} from "@/components/school-dashboard/shared"

interface Props {
  locale: Locale
  subdomain: string
}

type ChildSummary = {
  studentId: string
  studentName: string
  className: string
  stats: {
    totalDays: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  }
  recentAbsences: Array<{
    date: string
    status: string
    className: string
  }>
}

type StudentRecord = {
  id: string
  date: Date | string
  status: string
  classId: string | null
  className: string | null
  notes: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export function StudentGuardianOverview({ locale, subdomain }: Props) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.attendance as Dict | undefined
  // The feature namespace carries the localized status names ("PRESENT" →
  // "حاضر") the records used to print raw.
  const fa = (dictionary as Dict | undefined)?.attendance as Dict | undefined
  const [isPending, startTransition] = useTransition()

  // Guardian state
  const [children, setChildren] = useState<ChildSummary[] | null>(null)

  // Student state
  const [studentRecords, setStudentRecords] = useState<StudentRecord[] | null>(
    null
  )
  const [studentStats, setStudentStats] = useState<{
    totalDays: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  } | null>(null)

  const [isGuardian, setIsGuardian] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const basePath = `/${locale}/attendance`

  useEffect(() => {
    startTransition(async () => {
      // Try guardian first
      const guardianResult = await getParentAttendanceSummary()
      if (guardianResult.success && guardianResult.data?.children.length) {
        setIsGuardian(true)
        setChildren(guardianResult.data.children)
        return
      }

      // Try student
      const studentResult = await getStudentOwnAttendance()
      if (studentResult.success && studentResult.data) {
        setIsGuardian(false)
        setStudentRecords(studentResult.data.records)
        setStudentStats(studentResult.data.stats)
        return
      }

      setError(
        (!studentResult.success ? studentResult.error : undefined) ||
          (!guardianResult.success ? guardianResult.error : undefined) ||
          "Unable to load data"
      )
    })
  }, [])

  if (isPending || isGuardian === null) {
    if (error) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <AlertCircle className="text-muted-foreground h-12 w-12" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      )
    }
    return <OverviewSkeleton />
  }

  if (isGuardian && children) {
    return (
      <GuardianOverview
        children={children}
        basePath={basePath}
        d={d}
        fa={fa}
        locale={locale}
      />
    )
  }

  if (!isGuardian && studentStats) {
    return (
      <StudentOverview
        stats={studentStats}
        records={studentRecords ?? []}
        basePath={basePath}
        d={d}
        fa={fa}
        locale={locale}
      />
    )
  }

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <AlertCircle className="text-muted-foreground h-12 w-12" />
      <p className="text-muted-foreground">
        {error || "No attendance data available"}
      </p>
    </div>
  )
}

// --- Shared helpers ---
type Stats = {
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

/** The status's own name in the reader's language, never the enum. */
function statusName(fa: Dict | undefined, status: string): string {
  return (fa?.status?.[status] as string | undefined) ?? status
}

function statusVariant(status: string) {
  return status === "PRESENT"
    ? ("default" as const)
    : status === "ABSENT"
      ? ("destructive" as const)
      : ("secondary" as const)
}

function useDateFormat(locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

/**
 * One student's figures as the phone's grey panel: the rate across the top
 * with its bar and "out of N days", then present · absent · late · excused.
 */
function PhoneStats({
  stats,
  d,
  fa,
}: {
  stats: Stats
  d: Dict | undefined
  fa: Dict | undefined
}) {
  const outOf = (d?.stats?.outOfDays as string | undefined)?.replace(
    "{total}",
    String(stats.totalDays)
  )
  return (
    <StatPanel
      items={[
        {
          key: "rate",
          label: d?.stats?.attendanceRate || "Attendance Rate",
          value: `${stats.attendanceRate}%`,
          hint: outOf,
          wide: true,
          extra: (
            <Progress
              value={stats.attendanceRate}
              className="bg-background h-1.5"
            />
          ),
        },
        {
          key: "present",
          label: d?.present || "Present",
          value: stats.present,
          tone: "positive",
        },
        {
          key: "absent",
          label: d?.absent || "Absent",
          value: stats.absent,
          tone: stats.absent > 0 ? "negative" : "default",
        },
        {
          key: "late",
          label: d?.late || "Late",
          value: stats.late,
          tone: stats.late > 0 ? "warning" : "default",
        },
        {
          key: "excused",
          label: fa?.stats?.excused || d?.excused || "Excused",
          value: stats.excused,
        },
      ]}
    />
  )
}

// --- Guardian Overview ---
function GuardianOverview({
  children,
  basePath,
  d,
  fa,
  locale,
}: {
  children: ChildSummary[]
  basePath: string
  d: Dict | undefined
  fa: Dict | undefined
  locale: Locale
}) {
  const dateFormat = useDateFormat(locale)
  const avgRate =
    children.length > 0
      ? `${Math.round(children.reduce((sum, c) => sum + c.stats.attendanceRate, 0) / children.length)}%`
      : "—"
  const totalAbsent = children.reduce((sum, c) => sum + c.stats.absent, 0)
  const totalLate = children.reduce((sum, c) => sum + c.stats.late, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2>
          {d?.dashboards?.guardian?.title || "Your Children's Attendance"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {d?.dashboards?.guardian?.description ||
            "Monitor and track attendance records"}
        </p>
      </div>

      {/* Phone: the family's figures as one panel, then each child as a
          section — their panel and the absences worth a parent's attention.
          Records and excuses are already the tabs above, so no link row. */}
      <div className="space-y-8 md:hidden">
        {children.length > 1 ? (
          <StatPanel
            items={[
              {
                key: "children",
                label: fa?.stats?.children || d?.childrenOverview || "Children",
                value: children.length,
              },
              {
                key: "rate",
                label: d?.stats?.attendanceRate || "Avg. Rate",
                value: avgRate,
              },
              {
                key: "absent",
                label: d?.absent || "Absent",
                value: totalAbsent,
                tone: totalAbsent > 0 ? "negative" : "default",
              },
              {
                key: "late",
                label: d?.late || "Late",
                value: totalLate,
                tone: totalLate > 0 ? "warning" : "default",
              },
            ]}
          />
        ) : null}

        {children.map((child) => (
          <section key={child.studentId}>
            <SectionHeader
              title={child.studentName}
              description={child.className}
            />
            <PhoneStats stats={child.stats} d={d} fa={fa} />
            {child.recentAbsences.length > 0 && (
              <div className="mt-6">
                <h3 className="text-muted-foreground mb-1 text-xs font-medium">
                  {fa?.stats?.recentAbsences || d?.absent}
                </h3>
                <ListRows divided>
                  {child.recentAbsences.slice(0, 3).map((absence, i) => (
                    <ListRow
                      key={i}
                      title={dateFormat.format(new Date(absence.date))}
                      description={absence.className}
                      trailing={
                        <Badge variant={statusVariant(absence.status)}>
                          {statusName(fa, absence.status)}
                        </Badge>
                      }
                    />
                  ))}
                </ListRows>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.childrenOverview || "Children"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{children.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.attendanceRate || "Avg. Rate"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.absent || "Total Absences"}
            </CardTitle>
            <XCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAbsent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.late || "Total Late"}
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLate}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-child cards */}
      <div className="hidden gap-4 sm:grid-cols-2 md:grid">
        {children.map((child) => (
          <Card key={child.studentId}>
            <CardHeader>
              <CardTitle className="text-lg">{child.studentName}</CardTitle>
              <CardDescription>{child.className}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  {d?.stats?.attendanceRate || "Attendance Rate"}
                </span>
                <span className="font-semibold">
                  {child.stats.attendanceRate}%
                </span>
              </div>
              <Progress value={child.stats.attendanceRate} className="h-2" />

              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div>
                  <div className="font-semibold text-green-600">
                    {child.stats.present}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {d?.present || "Present"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-red-600">
                    {child.stats.absent}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {d?.absent || "Absent"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-amber-600">
                    {child.stats.late}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {d?.late || "Late"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">
                    {child.stats.excused}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {d?.excused || "Excused"}
                  </div>
                </div>
              </div>

              {child.recentAbsences.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {fa?.stats?.recentAbsences || d?.absent}
                  </p>
                  {child.recentAbsences.slice(0, 3).map((absence, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {dateFormat.format(new Date(absence.date))}
                      </span>
                      <Badge variant={statusVariant(absence.status)}>
                        {statusName(fa, absence.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links */}
      <div className="hidden gap-3 md:flex">
        <Button asChild variant="outline">
          <Link href={`${basePath}/records`}>
            <Calendar className="me-2 h-4 w-4" />
            {d?.records || "View Records"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`${basePath}/excuses`}>
            <AlertCircle className="me-2 h-4 w-4" />
            {d?.excuses || "Excuses"}
          </Link>
        </Button>
      </div>
    </div>
  )
}

// --- Student Overview ---
function StudentOverview({
  stats,
  records,
  basePath,
  d,
  fa,
  locale,
}: {
  stats: Stats
  records: StudentRecord[]
  basePath: string
  d: Dict | undefined
  fa: Dict | undefined
  locale: Locale
}) {
  const dateFormat = useDateFormat(locale)
  const outOf = (d?.stats?.outOfDays as string | undefined)?.replace(
    "{total}",
    String(stats.totalDays)
  )

  return (
    <div className="space-y-6">
      <div>
        <h2>{d?.dashboards?.student?.title || "Your Attendance Portal"}</h2>
        <p className="text-muted-foreground text-sm">
          {d?.dashboards?.student?.description ||
            "Check in and view your attendance records"}
        </p>
      </div>

      {/* Phone: one grey panel for the five figures, then the records as rows.
          Records and excuses are already the tabs above, so no link row. */}
      <div className="space-y-8 md:hidden">
        <PhoneStats stats={stats} d={d} fa={fa} />

        <section>
          <SectionHeader
            title={d?.recentActivity || "Recent Activity"}
            href={`${basePath}/records`}
            linkLabel={d?.allRecords || "All Records"}
          />
          {records.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {d?.noRecentRecords || "No recent attendance records"}
            </p>
          ) : (
            <ListRows divided>
              {records.slice(0, 10).map((record) => (
                <ListRow
                  key={record.id}
                  title={dateFormat.format(new Date(record.date))}
                  description={record.className ?? undefined}
                  trailing={
                    <Badge variant={statusVariant(record.status)}>
                      {statusName(fa, record.status)}
                    </Badge>
                  }
                />
              ))}
            </ListRows>
          )}
        </section>
      </div>

      {/* Stat Cards */}
      <div className="hidden gap-4 sm:grid-cols-2 md:grid lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.attendanceRate || "Attendance Rate"}
            </CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <Progress value={stats.attendanceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.present || "Present"}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            {outOf ? (
              <p className="text-muted-foreground text-xs">{outOf}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.absent || "Absent"}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.late || "Late"}
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.excused || "Excused"}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.excused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle>{d?.recentActivity || "Recent Activity"}</CardTitle>
          <CardDescription>
            {d?.recentActivityDescription || "Latest attendance records"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              {d?.noRecentRecords || "No recent attendance records"}
            </p>
          ) : (
            <div className="space-y-3">
              {records.slice(0, 10).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {dateFormat.format(new Date(record.date))}
                    </p>
                    {record.className && (
                      <p className="text-muted-foreground text-xs">
                        {record.className}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariant(record.status)}>
                    {statusName(fa, record.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="hidden gap-3 md:flex">
        <Button asChild variant="outline">
          <Link href={`${basePath}/records`}>
            <Calendar className="me-2 h-4 w-4" />
            {d?.allRecords || "All Records"}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`${basePath}/excuses`}>
            <AlertCircle className="me-2 h-4 w-4" />
            {d?.excuses || "Excuses"}
          </Link>
        </Button>
      </div>
    </div>
  )
}

// --- Skeleton ---
function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
