"use client"

import * as React from "react"
import { Users, BookOpen, GraduationCap, Calendar, FileText, Clock, Bell, Award, TrendingUp, CircleCheck, TriangleAlert, Settings } from "lucide-react"
import { TrendingStats } from "../trending-stats"
import type { TrendingStatItem, EducationDashboardStatsData, StatsDictionary } from "../types"

interface EducationDashboardStatsProps {
  /** Stats data */
  data: EducationDashboardStatsData
  /** Dictionary for i18n */
  dictionary?: StatsDictionary
  /** Loading state */
  loading?: boolean
  /** Click handler for stat items */
  onItemClick?: (item: TrendingStatItem, index: number) => void
  /** Additional CSS classes */
  className?: string
}

/**
 * EducationDashboardStats - Pre-configured stats for education dashboards
 * Displays: Total Students, Attendance, Average Grade, Pending Items
 *
 * @example
 * ```tsx
 * <EducationDashboardStats
 *   data={{
 *     totalStudents: 4812,
 *     studentsChange: 12,
 *     attendance: 94.5,
 *     attendanceChange: 2.1,
 *     averageGrade: 78,
 *     pendingItems: 23,
 *     pendingLabel: "Pending Grading"
 *   }}
 *   dictionary={dictionary?.stats}
 * />
 * ```
 */
export function EducationDashboardStats({
  data,
  dictionary,
  loading = false,
  onItemClick,
  className,
}: EducationDashboardStatsProps) {
  const labels = dictionary?.labels || {}

  const items: TrendingStatItem[] = [
    ...(data.totalStudents !== undefined
      ? [{
          label: labels.totalStudents || "Total Students",
          value: data.totalStudents,
          change: data.studentsChange,
          changeType: (data.studentsChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
          icon: <Users className="h-4 w-4" />,
        }]
      : []),
    ...(data.attendance !== undefined
      ? [{
          label: labels.attendance || "Attendance Rate",
          value: `${data.attendance}%`,
          change: data.attendanceChange,
          changeType: (data.attendanceChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
          icon: <Calendar className="h-4 w-4" />,
        }]
      : []),
    ...(data.averageGrade !== undefined
      ? [{
          label: labels.averageGrade || "Average Grade",
          value: `${data.averageGrade}%`,
          change: data.gradeChange,
          changeType: (data.gradeChange ?? 0) >= 0 ? "positive" as const : "negative" as const,
          icon: <GraduationCap className="h-4 w-4" />,
        }]
      : []),
    ...(data.pendingItems !== undefined
      ? [{
          label: data.pendingLabel || labels.pendingGrading || "Pending Items",
          value: data.pendingItems,
          icon: <FileText className="h-4 w-4" />,
        }]
      : []),
    ...(data.custom || []),
  ]

  return (
    <TrendingStats
      items={items}
      variant="badges"
      loading={loading}
      dictionary={dictionary}
      onItemClick={onItemClick}
      className={className}
    />
  )
}

interface TeacherDashboardStatsProps {
  /** Today's classes count */
  todaysClasses: number
  /** Pending grading count */
  pendingGrading: number
  /** Classes needing attendance */
  attendanceDue: number
  /** Total students across classes */
  totalStudents: number
  /** Dictionary for i18n */
  dictionary?: {
    todaysClasses?: string
    pendingGrading?: string
    attendanceDue?: string
    totalStudents?: string
    classesScheduled?: string
    assignmentsToGrade?: string
    needAttendance?: string
    acrossAllClasses?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * TeacherDashboardStats - Pre-configured stats for teacher dashboard
 *
 * @example
 * ```tsx
 * <TeacherDashboardStats
 *   todaysClasses={5}
 *   pendingGrading={23}
 *   attendanceDue={2}
 *   totalStudents={120}
 *   dictionary={dictionary?.teacherDashboard?.stats}
 * />
 * ```
 */
export function TeacherDashboardStats({
  todaysClasses,
  pendingGrading,
  attendanceDue,
  totalStudents,
  dictionary,
  loading = false,
  className,
}: TeacherDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.todaysClasses || "Today's Classes",
      value: todaysClasses,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: dictionary?.pendingGrading || "Pending Grading",
      value: pendingGrading,
      icon: <FileText className="h-4 w-4" />,
      variant: pendingGrading > 10 ? "warning" : "default",
    },
    {
      label: dictionary?.attendanceDue || "Attendance Due",
      value: attendanceDue,
      icon: <Clock className="h-4 w-4" />,
      variant: attendanceDue > 0 ? "warning" : "default",
    },
    {
      label: dictionary?.totalStudents || "Total Students",
      value: totalStudents,
      icon: <Users className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}

interface StudentDashboardStatsProps {
  /** Attendance percentage */
  attendance: number
  /** Attendance change from last period */
  attendanceChange?: number
  /** Number of upcoming assignments */
  upcomingAssignments: number
  /** Average grade */
  averageGrade: number
  /** Grade change from last period */
  gradeChange?: number
  /** Days until next exam */
  daysUntilExam?: number
  /** Dictionary for i18n */
  dictionary?: {
    attendance?: string
    upcomingAssignments?: string
    averageGrade?: string
    daysUntilExam?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * StudentDashboardStats - Pre-configured stats for student dashboard
 */
export function StudentDashboardStats({
  attendance,
  attendanceChange,
  upcomingAssignments,
  averageGrade,
  gradeChange,
  daysUntilExam,
  dictionary,
  loading = false,
  className,
}: StudentDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.attendance || "Attendance",
      value: `${attendance}%`,
      change: attendanceChange,
      changeType: (attendanceChange ?? 0) >= 0 ? "positive" : "negative",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: dictionary?.upcomingAssignments || "Upcoming Assignments",
      value: upcomingAssignments,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: dictionary?.averageGrade || "Average Grade",
      value: `${averageGrade}%`,
      change: gradeChange,
      changeType: (gradeChange ?? 0) >= 0 ? "positive" : "negative",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    ...(daysUntilExam !== undefined
      ? [{
          label: dictionary?.daysUntilExam || "Days Until Exam",
          value: daysUntilExam,
          icon: <BookOpen className="h-4 w-4" />,
          variant: daysUntilExam <= 7 ? "warning" as const : "default" as const,
        }]
      : []),
  ]

  return (
    <TrendingStats
      items={items}
      variant="badges"
      loading={loading}
      className={className}
    />
  )
}

interface ParentDashboardStatsProps {
  /** Number of children */
  childrenCount: number
  /** Attendance percentage */
  attendance: number
  /** Number of upcoming assignments */
  upcomingAssignments: number
  /** Number of announcements */
  announcements: number
  /** Dictionary for i18n */
  dictionary?: {
    children?: string
    attendance?: string
    assignments?: string
    announcements?: string
    enrolledStudents?: string
    daysPresent?: string
    upcoming?: string
    newMessages?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * ParentDashboardStats - Pre-configured stats for parent/guardian dashboard
 */
export function ParentDashboardStats({
  childrenCount,
  attendance,
  upcomingAssignments,
  announcements,
  dictionary,
  loading = false,
  className,
}: ParentDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.children || "Children",
      value: childrenCount,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: dictionary?.attendance || "Attendance",
      value: `${attendance.toFixed(1)}%`,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: dictionary?.assignments || "Assignments",
      value: upcomingAssignments,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: dictionary?.announcements || "Announcements",
      value: announcements,
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}

interface PrincipalDashboardStatsProps {
  /** Overall performance score */
  overallScore: number
  /** Academic performance score */
  academicScore: number
  /** Attendance percentage */
  attendance: number
  /** Discipline score */
  disciplineScore: number
  /** Parent satisfaction percentage */
  parentSatisfaction: number
  /** Dictionary for i18n */
  dictionary?: {
    overallScore?: string
    academic?: string
    attendance?: string
    discipline?: string
    parentSatisfaction?: string
    performanceScore?: string
    academicPerformance?: string
    studentAttendance?: string
    disciplineScore?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * PrincipalDashboardStats - Pre-configured stats for principal dashboard (5 scorecards)
 */
export function PrincipalDashboardStats({
  overallScore,
  academicScore,
  attendance,
  disciplineScore,
  parentSatisfaction,
  dictionary,
  loading = false,
  className,
}: PrincipalDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.overallScore || "Overall Score",
      value: overallScore,
      icon: <Award className="h-4 w-4" />,
    },
    {
      label: dictionary?.academic || "Academic",
      value: academicScore,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: dictionary?.attendance || "Attendance",
      value: `${attendance}%`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: dictionary?.discipline || "Discipline",
      value: disciplineScore,
      icon: <CircleCheck className="h-4 w-4" />,
    },
    {
      label: dictionary?.parentSatisfaction || "Parent Satisfaction",
      value: `${parentSatisfaction}%`,
      icon: <Award className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
      grid={{ mobile: 2, tablet: 3, desktop: 5 }}
    />
  )
}

interface AdminDashboardStatsProps {
  /** Total enrollment */
  totalEnrollment: number
  /** New students this month */
  newThisMonth?: number
  /** Attendance rate */
  attendanceRate: number
  /** Present/absent counts */
  present?: number
  absent?: number
  /** Active classes count */
  activeClasses: number
  /** Announcements count */
  announcementsCount?: number
  /** Total staff */
  totalStaff: number
  /** Departments count */
  departments?: number
  /** Dictionary for i18n */
  dictionary?: {
    totalEnrollment?: string
    attendanceRate?: string
    activeClasses?: string
    totalStaff?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * AdminDashboardStats - Pre-configured stats for admin dashboard
 */
export function AdminDashboardStats({
  totalEnrollment,
  newThisMonth,
  attendanceRate,
  present,
  absent,
  activeClasses,
  announcementsCount,
  totalStaff,
  departments,
  dictionary,
  loading = false,
  className,
}: AdminDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.totalEnrollment || "Total Enrollment",
      value: totalEnrollment,
      change: newThisMonth,
      changeType: "positive",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: dictionary?.attendanceRate || "Attendance Rate",
      value: `${attendanceRate}%`,
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: dictionary?.activeClasses || "Active Classes",
      value: activeClasses,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: dictionary?.totalStaff || "Total Staff",
      value: totalStaff,
      icon: <Users className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}

interface StaffDashboardStatsProps {
  /** Today's tasks count */
  todaysTasks: number
  /** Pending requests count */
  pendingRequests: number
  /** System alerts count */
  systemAlerts: number
  /** Total tasks in system */
  totalTasks: number
  /** Dictionary for i18n */
  dictionary?: {
    todaysTasks?: string
    pendingRequests?: string
    systemAlerts?: string
    totalTasks?: string
    tasksScheduled?: string
    awaitingAction?: string
    activeAlerts?: string
    inSystem?: string
  }
  /** Loading state */
  loading?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * StaffDashboardStats - Pre-configured stats for staff dashboard
 */
export function StaffDashboardStats({
  todaysTasks,
  pendingRequests,
  systemAlerts,
  totalTasks,
  dictionary,
  loading = false,
  className,
}: StaffDashboardStatsProps) {
  const items: TrendingStatItem[] = [
    {
      label: dictionary?.todaysTasks || "Today's Tasks",
      value: todaysTasks,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: dictionary?.pendingRequests || "Pending Requests",
      value: pendingRequests,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: dictionary?.systemAlerts || "System Alerts",
      value: systemAlerts,
      icon: <TriangleAlert className="h-4 w-4" />,
    },
    {
      label: dictionary?.totalTasks || "Total Tasks",
      value: totalTasks,
      icon: <Settings className="h-4 w-4" />,
    },
  ]

  return (
    <TrendingStats
      items={items}
      variant="default"
      loading={loading}
      className={className}
    />
  )
}
