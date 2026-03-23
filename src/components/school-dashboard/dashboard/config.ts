// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ElementType } from "react"
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  FolderOpen,
  GraduationCap,
  MessageSquare,
  Settings,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react"

import type { QuickActionItem } from "./types"

// ============================================================================
// ICON MAPPING
// ============================================================================

/**
 * Icon mapping for string-based icon names
 * Used to pass icons from Server Components to Client Components
 */
export const iconMap: Record<string, ElementType> = {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Bell,
  Users,
  BookOpen,
  GraduationCap,
  DollarSign,
  Settings,
  ClipboardList,
  FileText,
  Award,
  CalendarDays,
  MessageSquare,
  UserPlus,
  BarChart3,
  FolderOpen,
  CheckCircle,
  Trophy,
}

/**
 * Get icon component from string name
 */
export function getIcon(name?: string): ElementType | undefined {
  if (!name) return undefined
  return iconMap[name]
}

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

export const DASHBOARD_ROLES = [
  "ADMIN",
  "DEVELOPER",
  "PRINCIPAL",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
] as const

export type DashboardRole = (typeof DASHBOARD_ROLES)[number]

// ============================================================================
// QUICK ACTIONS BY ROLE
// ============================================================================

/**
 * Get quick actions based on user role
 * Each role has specific actions tailored to their responsibilities
 */
export function getQuickActionsByRole(
  role: string,
  subdomain?: string
): QuickActionItem[] {
  const baseUrl = ""

  switch (role.toUpperCase()) {
    case "ADMIN":
      return [
        {
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
          description: "View analytics",
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/approvals`,
          description: "Pending reviews",
        },
        {
          iconName: "Bell",
          label: "Announce",
          href: `${baseUrl}/announcements/create`,
          description: "Send notification",
        },
        {
          iconName: "Users",
          label: "Users",
          href: `${baseUrl}/users`,
          description: "Manage accounts",
        },
        {
          iconName: "Settings",
          label: "Settings",
          href: `${baseUrl}/settings`,
          description: "Configure system",
        },
        {
          iconName: "BarChart3",
          label: "Analytics",
          href: `${baseUrl}/analytics`,
          description: "View insights",
        },
      ]

    case "PRINCIPAL":
      return [
        {
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
          description: "View reports",
        },
        {
          iconName: "Users",
          label: "Staff",
          href: `${baseUrl}/staff`,
          description: "Manage staff",
        },
        {
          iconName: "Bell",
          label: "Announce",
          href: `${baseUrl}/announcements`,
          description: "School news",
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/approvals`,
          description: "Pending items",
        },
        {
          iconName: "BarChart3",
          label: "Performance",
          href: `${baseUrl}/performance`,
          description: "Track metrics",
        },
        {
          iconName: "Calendar",
          label: "Events",
          href: `${baseUrl}/events`,
          description: "School calendar",
        },
      ]

    case "TEACHER":
      return [
        {
          iconName: "Users",
          label: "Attendance",
          href: `${baseUrl}/attendance/mark`,
          description: "Mark today",
        },
        {
          iconName: "FileText",
          label: "Grades",
          href: `${baseUrl}/grades/enter`,
          description: "Enter scores",
        },
        {
          iconName: "BookOpen",
          label: "Assignments",
          href: `${baseUrl}/assignments/create`,
          description: "Create new",
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
          description: "Inbox",
        },
        {
          iconName: "Calendar",
          label: "Timetable",
          href: `${baseUrl}/timetable`,
          description: "View schedule",
        },
        {
          iconName: "ClipboardList",
          label: "Subjects",
          href: `${baseUrl}/subjects`,
          description: "View subjects",
        },
      ]

    case "STUDENT":
      return [
        {
          iconName: "FileText",
          label: "Assignments",
          href: `${baseUrl}/assignments`,
          description: "View tasks",
        },
        {
          iconName: "Award",
          label: "Grades",
          href: `${baseUrl}/grades`,
          description: "My scores",
        },
        {
          iconName: "CalendarDays",
          label: "Timetable",
          href: `${baseUrl}/timetable`,
          description: "Class schedule",
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
          description: "Inbox",
        },
        {
          iconName: "BookOpen",
          label: "Library",
          href: `${baseUrl}/library`,
          description: "Resources",
        },
        {
          iconName: "Clock",
          label: "Attendance",
          href: `${baseUrl}/attendance`,
          description: "My record",
        },
      ]

    case "GUARDIAN":
      return [
        {
          iconName: "Users",
          label: "Children",
          href: `${baseUrl}/children`,
          description: "View profiles",
        },
        {
          iconName: "Award",
          label: "Grades",
          href: `${baseUrl}/grades`,
          description: "View scores",
        },
        {
          iconName: "Calendar",
          label: "Attendance",
          href: `${baseUrl}/attendance`,
          description: "Track record",
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
          description: "Contact school",
        },
        {
          iconName: "DollarSign",
          label: "Fees",
          href: `${baseUrl}/finance/fees`,
          description: "View payments",
        },
        {
          iconName: "Bell",
          label: "Announce",
          href: `${baseUrl}/announcements`,
          description: "School news",
        },
      ]

    case "ACCOUNTANT":
      return [
        {
          iconName: "DollarSign",
          label: "Invoices",
          href: `${baseUrl}/finance/invoice`,
          description: "Manage bills",
        },
        {
          iconName: "FileText",
          label: "Receipts",
          href: `${baseUrl}/finance/receipt`,
          description: "View receipts",
        },
        {
          iconName: "BarChart3",
          label: "Reports",
          href: `${baseUrl}/finance/reports`,
          description: "Financial data",
        },
        {
          iconName: "Users",
          label: "Fees",
          href: `${baseUrl}/finance/fees`,
          description: "Fee structure",
        },
        {
          iconName: "CheckCircle",
          label: "Approvals",
          href: `${baseUrl}/finance/approvals`,
          description: "Pending items",
        },
        {
          iconName: "FolderOpen",
          label: "Budget",
          href: `${baseUrl}/finance/budget`,
          description: "Budget tracking",
        },
      ]

    case "STAFF":
      return [
        {
          iconName: "ClipboardList",
          label: "Tasks",
          href: `${baseUrl}/tasks`,
          description: "My tasks",
        },
        {
          iconName: "Calendar",
          label: "Schedule",
          href: `${baseUrl}/schedule`,
          description: "My calendar",
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
          description: "Inbox",
        },
        {
          iconName: "Bell",
          label: "Announce",
          href: `${baseUrl}/announcements`,
          description: "School news",
        },
        {
          iconName: "FileText",
          label: "Reports",
          href: `${baseUrl}/reports`,
          description: "View reports",
        },
        {
          iconName: "Users",
          label: "Directory",
          href: `${baseUrl}/directory`,
          description: "Staff list",
        },
      ]

    default:
      return [
        {
          iconName: "Bell",
          label: "Announce",
          href: `${baseUrl}/announcements`,
          description: "View news",
        },
        {
          iconName: "MessageSquare",
          label: "Messages",
          href: `${baseUrl}/messages`,
          description: "Inbox",
        },
        {
          iconName: "Settings",
          label: "Settings",
          href: `${baseUrl}/settings`,
          description: "Preferences",
        },
      ]
  }
}

// ============================================================================
// CHART CONFIGURATION
// ============================================================================

export const attendanceChartConfig = {
  present: {
    label: "Present",
    color: "hsl(var(--chart-1))",
  },
  absent: {
    label: "Absent",
    color: "hsl(var(--chart-2))",
  },
  late: {
    label: "Late",
    color: "hsl(var(--chart-3))",
  },
}

export const gradeChartConfig = {
  count: { label: "Students" },
  A: { label: "A", color: "hsl(142, 76%, 36%)" },
  B: { label: "B", color: "hsl(199, 89%, 48%)" },
  C: { label: "C", color: "hsl(48, 96%, 53%)" },
  D: { label: "D", color: "hsl(25, 95%, 53%)" },
  F: { label: "F", color: "hsl(0, 84%, 60%)" },
}

export const revenueChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
}

export const gaugeConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export const ACTIVITY_RING_COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  orange: "#f59e0b",
  red: "#ef4444",
}

export const PRIORITY_COLORS = {
  high: "destructive",
  normal: "secondary",
  low: "outline",
} as const

export const STATUS_COLORS = {
  completed: "default",
  "in-progress": "secondary",
  pending: "outline",
} as const

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_DASHBOARD_CONFIG = {
  metricsColumns: 4,
  quickActionsColumns: 4,
  activityRingsCount: 3,
  recentActivitiesCount: 10,
  announcementsCount: 5,
}

// --- Dictionary-based factory functions ---

type DashDict = Record<string, any> | undefined

/** Get localized quick actions by role from dictionary */
export function getLocalizedQuickActions(
  role: string,
  d?: DashDict,
  subdomain?: string
): QuickActionItem[] {
  const actions = getQuickActionsByRole(role, subdomain)
  const qa = d?.quickActions as
    | Record<string, { label?: string; description?: string }>
    | undefined
  if (!qa) return actions
  return actions.map((a) => ({
    ...a,
    label: qa[a.iconName]?.label ?? a.label,
    description: qa[a.iconName]?.description ?? a.description,
  }))
}

/** Get localized attendance chart config */
export function getAttendanceChartConfig(d?: DashDict) {
  const ac = d?.charts?.attendance as Record<string, string> | undefined
  return {
    present: {
      ...attendanceChartConfig.present,
      label: ac?.present ?? "Present",
    },
    absent: { ...attendanceChartConfig.absent, label: ac?.absent ?? "Absent" },
    late: { ...attendanceChartConfig.late, label: ac?.late ?? "Late" },
  }
}

/** Get localized grade chart config */
export function getGradeChartConfig(d?: DashDict) {
  const gc = d?.charts?.grades as Record<string, string> | undefined
  return {
    count: { label: gc?.students ?? "Students" },
    A: { ...gradeChartConfig.A, label: gc?.A ?? "A" },
    B: { ...gradeChartConfig.B, label: gc?.B ?? "B" },
    C: { ...gradeChartConfig.C, label: gc?.C ?? "C" },
    D: { ...gradeChartConfig.D, label: gc?.D ?? "D" },
    F: { ...gradeChartConfig.F, label: gc?.F ?? "F" },
  }
}

/** Get localized revenue chart config */
export function getRevenueChartConfig(d?: DashDict) {
  const rc = d?.charts?.revenue as Record<string, string> | undefined
  return {
    revenue: { ...revenueChartConfig.revenue, label: rc?.revenue ?? "Revenue" },
    expenses: {
      ...revenueChartConfig.expenses,
      label: rc?.expenses ?? "Expenses",
    },
  }
}
