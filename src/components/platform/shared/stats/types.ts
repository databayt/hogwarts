import type { ReactNode } from "react"

/**
 * Trend direction for stat items
 */
export type TrendDirection = "up" | "down" | "neutral"

/**
 * Visual variant for stat items
 */
export type StatVariant = "default" | "primary" | "success" | "warning" | "danger" | "muted"

/**
 * Size variant for stat components
 */
export type StatSize = "sm" | "md" | "lg" | "xl"

/**
 * Trend data for a stat item
 */
export interface TrendData {
  value: number
  direction: TrendDirection
}

/**
 * Base stat item with trending support (blocks stats-01/04 pattern)
 */
export interface TrendingStatItem {
  /** Display label */
  label: string
  /** Current value (can be formatted string or number) */
  value: string | number
  /** Change percentage (e.g., 12.5 for +12.5%) */
  change?: number
  /** Whether change is positive or negative */
  changeType?: "positive" | "negative"
  /** Optional icon element */
  icon?: ReactNode
  /** Visual variant */
  variant?: StatVariant
}

/**
 * Progress stat item (blocks stats-09 pattern)
 */
export interface ProgressStatItem {
  /** Display label */
  label: string
  /** Current value */
  value: number | string
  /** Maximum/limit value */
  limit?: number | string
  /** Progress percentage (0-100) */
  percentage: number
  /** Progress bar color variant */
  variant?: StatVariant
  /** Optional status message */
  status?: string
  /** Optional warning message */
  warning?: string
}

/**
 * Usage stat item with breakdown (blocks stats-11 pattern)
 */
export interface UsageStatItem {
  /** Display label */
  label: string
  /** Current value */
  value: string | number
  /** Limit value */
  limit: string | number
  /** Progress percentage */
  percentage: number
  /** Progress bar color class */
  progressColor?: string
  /** Status message */
  status?: string
  /** Warning message */
  warning?: string
  /** Breakdown details */
  details?: Array<{
    label: string
    value: string | number
    color: string
  }>
  /** Action button config */
  action?: {
    label: string
    icon?: ReactNode
    onClick?: () => void
  }
}

/**
 * Grid configuration for stat layouts
 */
export interface StatGridConfig {
  /** Number of columns on mobile */
  mobile?: 1 | 2
  /** Number of columns on tablet */
  tablet?: 1 | 2 | 3
  /** Number of columns on desktop */
  desktop?: 1 | 2 | 3 | 4 | 5
}

/**
 * Props for education dashboard stats preset
 */
export interface EducationDashboardStatsData {
  /** Total number of students */
  totalStudents?: number
  /** Student count change percentage */
  studentsChange?: number
  /** Attendance rate (0-100) */
  attendance?: number
  /** Attendance change percentage */
  attendanceChange?: number
  /** Average grade (0-100) */
  averageGrade?: number
  /** Grade change percentage */
  gradeChange?: number
  /** Number of pending items (assignments, grading, etc.) */
  pendingItems?: number
  /** Pending items label */
  pendingLabel?: string
  /** Custom additional stats */
  custom?: TrendingStatItem[]
}

/**
 * Props for finance dashboard stats preset
 */
export interface FinanceStatsData {
  /** Total revenue */
  totalRevenue?: number
  /** Revenue change percentage */
  revenueChange?: number
  /** Outstanding amount */
  outstanding?: number
  /** Outstanding change percentage */
  outstandingChange?: number
  /** Collection rate (0-100) */
  collectionRate?: number
  /** Collection rate change */
  collectionChange?: number
  /** Currency symbol */
  currency?: string
  /** Custom additional stats */
  custom?: TrendingStatItem[]
}

/**
 * Props for attendance stats preset
 */
export interface AttendanceStatsData {
  /** Total count */
  total: number
  /** Present count */
  present: number
  /** Absent count */
  absent: number
  /** Late count */
  late?: number
  /** Excused count */
  excused?: number
  /** Attendance rate (calculated if not provided) */
  rate?: number
}

/**
 * Props for admission stats preset
 */
export interface AdmissionStatsData {
  /** Total applications */
  totalApplications: number
  /** Submitted applications */
  submitted: number
  /** Under review */
  underReview: number
  /** Selected candidates */
  selected: number
  /** Waitlisted candidates */
  waitlisted: number
  /** Rejected candidates */
  rejected: number
  /** Admitted students */
  admitted: number
  /** Total seats available */
  totalSeats?: number
  /** Seats filled */
  seatsFilled?: number
}

/**
 * Dictionary type for stat labels (i18n support)
 */
export interface StatsDictionary {
  /** Common stat labels */
  labels?: {
    totalStudents?: string
    attendance?: string
    averageGrade?: string
    pendingGrading?: string
    totalRevenue?: string
    outstanding?: string
    collectionRate?: string
    present?: string
    absent?: string
    late?: string
    excused?: string
    total?: string
    change?: string
    vsLastPeriod?: string
  }
  /** Formatting */
  format?: {
    currency?: string
    percentage?: string
    decimal?: string
  }
}
