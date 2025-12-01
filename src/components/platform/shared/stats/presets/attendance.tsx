"use client"

import * as React from "react"
import { Users, UserCheck, UserX, Clock, ShieldCheck, Stethoscope } from "lucide-react"
import { TrendingStats } from "../trending-stats"
import { ProgressStats, ProgressStatStacked } from "../progress-stats"
import type { TrendingStatItem, AttendanceStatsData, StatsDictionary } from "../types"

interface AttendanceStatsProps {
  /** Attendance data */
  data: AttendanceStatsData
  /** Show as percentage or counts */
  showPercentages?: boolean
  /** Dictionary for i18n */
  dictionary?: StatsDictionary
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * AttendanceStats - Pre-configured stats for attendance display
 *
 * @example
 * ```tsx
 * <AttendanceStats
 *   data={{
 *     total: 30,
 *     present: 28,
 *     absent: 1,
 *     late: 1,
 *   }}
 * />
 * ```
 */
export function AttendanceStats({
  data,
  showPercentages = false,
  dictionary,
  loading = false,
  className,
}: AttendanceStatsProps) {
  const labels = dictionary?.labels || {}
  const rate = data.rate ?? (data.total > 0 ? (data.present / data.total) * 100 : 0)

  const formatValue = (count: number) => {
    if (showPercentages && data.total > 0) {
      return `${((count / data.total) * 100).toFixed(1)}%`
    }
    return count
  }

  const items: TrendingStatItem[] = [
    {
      label: labels.total || "Total",
      value: data.total,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: labels.present || "Present",
      value: formatValue(data.present),
      icon: <UserCheck className="h-4 w-4" />,
      variant: "success",
    },
    {
      label: labels.absent || "Absent",
      value: formatValue(data.absent),
      icon: <UserX className="h-4 w-4" />,
      variant: data.absent > 0 ? "danger" : "default",
    },
    ...(data.late !== undefined
      ? [{
          label: labels.late || "Late",
          value: formatValue(data.late),
          icon: <Clock className="h-4 w-4" />,
          variant: data.late > 0 ? "warning" as const : "default" as const,
        }]
      : []),
    ...(data.excused !== undefined
      ? [{
          label: labels.excused || "Excused",
          value: formatValue(data.excused),
          icon: <ShieldCheck className="h-4 w-4" />,
        }]
      : []),
  ]

  return (
    <TrendingStats
      items={items}
      variant="cards"
      loading={loading}
      className={className}
      grid={{
        mobile: 2,
        tablet: 3,
        desktop: items.length > 4 ? 4 : items.length as 2 | 3 | 4,
      }}
    />
  )
}

interface AttendanceBreakdownProps {
  /** Present count */
  present: number
  /** Absent count */
  absent: number
  /** Late count */
  late?: number
  /** Excused count */
  excused?: number
  /** Sick count */
  sick?: number
  /** Total count */
  total: number
  /** Title */
  title?: string
  /** Dictionary for i18n */
  dictionary?: {
    present?: string
    absent?: string
    late?: string
    excused?: string
    sick?: string
    attendanceBreakdown?: string
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * AttendanceBreakdown - Stacked progress view of attendance breakdown
 */
export function AttendanceBreakdown({
  present,
  absent,
  late = 0,
  excused = 0,
  sick = 0,
  total,
  title,
  dictionary,
  className,
}: AttendanceBreakdownProps) {
  const items = [
    {
      label: dictionary?.present || "Present",
      value: present,
      color: "bg-emerald-500",
    },
    {
      label: dictionary?.absent || "Absent",
      value: absent,
      color: "bg-destructive",
    },
    ...(late > 0
      ? [{
          label: dictionary?.late || "Late",
          value: late,
          color: "bg-amber-500",
        }]
      : []),
    ...(excused > 0
      ? [{
          label: dictionary?.excused || "Excused",
          value: excused,
          color: "bg-blue-500",
        }]
      : []),
    ...(sick > 0
      ? [{
          label: dictionary?.sick || "Sick",
          value: sick,
          color: "bg-purple-500",
        }]
      : []),
  ]

  return (
    <ProgressStatStacked
      items={items}
      total={total}
      title={title || dictionary?.attendanceBreakdown || "Attendance Breakdown"}
      className={className}
    />
  )
}

interface AttendanceRateProps {
  /** Current attendance rate */
  rate: number
  /** Target rate */
  target?: number
  /** Previous period rate for comparison */
  previousRate?: number
  /** Title */
  title?: string
  /** Dictionary for i18n */
  dictionary?: {
    attendanceRate?: string
    target?: string
    vsLastPeriod?: string
  }
  /** Additional CSS classes */
  className?: string
}

/**
 * AttendanceRate - Progress stat for attendance rate
 */
export function AttendanceRate({
  rate,
  target = 90,
  previousRate,
  title,
  dictionary,
  className,
}: AttendanceRateProps) {
  const change = previousRate !== undefined ? rate - previousRate : undefined

  return (
    <ProgressStats
      title={title || dictionary?.attendanceRate || "Attendance Rate"}
      items={[
        {
          label: dictionary?.target || "Target",
          value: `${rate.toFixed(1)}%`,
          limit: `${target}%`,
          percentage: rate,
          variant: rate >= target ? "success" : rate >= target - 10 ? "warning" : "danger",
          status: change !== undefined
            ? `${change >= 0 ? "+" : ""}${change.toFixed(1)}% ${dictionary?.vsLastPeriod || "vs last period"}`
            : undefined,
        },
      ]}
      grid={{ mobile: 1, tablet: 1, desktop: 1 }}
      className={className}
    />
  )
}

interface ClassAttendanceComparisonProps {
  /** Classes to compare */
  classes: Array<{
    name: string
    rate: number
  }>
  /** Target rate */
  target?: number
  /** Title */
  title?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * ClassAttendanceComparison - Compare attendance across classes
 */
export function ClassAttendanceComparison({
  classes,
  target = 90,
  title = "Class Attendance",
  className,
}: ClassAttendanceComparisonProps) {
  const items = classes.map(cls => ({
    label: cls.name,
    value: `${cls.rate.toFixed(1)}%`,
    percentage: cls.rate,
    variant: cls.rate >= target ? "success" as const : cls.rate >= target - 10 ? "warning" as const : "danger" as const,
  }))

  return (
    <ProgressStats
      title={title}
      items={items}
      grid={{ mobile: 1, tablet: 2, desktop: 3 }}
      className={className}
    />
  )
}
