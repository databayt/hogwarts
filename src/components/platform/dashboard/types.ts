import type { ElementType } from "react"

// ============================================================================
// WIDGET TYPES
// ============================================================================

export interface ActivityRingData {
  label: string
  value: number
  color: string
  current: number
  target: number
  unit: string
}

export interface ActivityRingsProps {
  activities: ActivityRingData[]
  title?: string
  className?: string
}

export interface WelcomeBannerProps {
  userName?: string
  role?: string
  greeting?: string
  subtitle?: string
  className?: string
}

export interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeType?: "positive" | "negative" | "neutral"
  icon?: ElementType
  iconName?: string
  iconColor?: string
  description?: string
  href?: string
  className?: string
}

export type MetricCardVariant = "default" | "compact" | "detailed" | "mini"

export interface ScheduleItemProps {
  time: string
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  isActive?: boolean
  className?: string
}

export interface AnnouncementCardProps {
  title: string
  content: string
  date: string | Date
  author?: string
  priority?: "high" | "normal" | "low"
  href?: string
  className?: string
}

export interface ProgressCardProps {
  title: string
  current: number
  total: number
  unit?: string
  icon?: ElementType
  iconName?: string
  color?: string
  showPercentage?: boolean
  className?: string
}

export interface QuickActionItem {
  label: string
  icon?: ElementType
  iconName?: string
  href: string
  color?: string
  description?: string
}

export type QuickActionVariant = "grid" | "list" | "compact" | "icon-only"

export interface QuickActionsGridProps {
  actions: QuickActionItem[]
  title?: string
  columns?: 2 | 3 | 4
  variant?: QuickActionVariant
  className?: string
}

export interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export interface EmptyStateProps {
  icon?: ElementType
  iconName?: string
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

// ============================================================================
// CHART TYPES
// ============================================================================

export interface AttendanceTrendData {
  date: string
  present: number
  absent: number
  late?: number
}

export interface AttendanceTrendChartProps {
  data: AttendanceTrendData[]
  title?: string
  description?: string
  trend?: number
  className?: string
}

export interface GradeDistributionData {
  grade: string
  count: number
  fill: string
}

export interface GradeDistributionChartProps {
  data: GradeDistributionData[]
  title?: string
  totalStudents?: number
  className?: string
}

export interface RevenueData {
  month: string
  revenue: number
  expenses: number
}

export interface RevenueChartProps {
  data: RevenueData[]
  title?: string
  description?: string
  currency?: string
  className?: string
}

export interface PerformanceGaugeProps {
  value: number
  label: string
  description?: string
  maxValue?: number
  color?: string
  className?: string
}

export interface WeeklyActivityData {
  day: string
  value: number
}

export interface WeeklyActivityChartProps {
  data: WeeklyActivityData[]
  title?: string
  label?: string
  color?: string
  className?: string
}

export interface ComparisonData {
  period: string
  current: number
  previous: number
}

export interface ComparisonLineChartProps {
  data: ComparisonData[]
  title?: string
  description?: string
  currentLabel?: string
  previousLabel?: string
  className?: string
}

// ============================================================================
// DASHBOARD DATA TYPES
// ============================================================================

export interface EnrollmentMetrics {
  total: number
  newThisMonth: number
  active: number
  inactive: number
  graduated: number
  transferIn: number
  transferOut: number
}

export interface AttendanceMetrics {
  attendanceRate: number
  present: number
  absent: number
  late: number
  total: number
}

export interface StaffMetrics {
  total: number
  departments: number
  presenceRate: number
}

export interface AcademicPerformanceMetrics {
  averageGPA: number | null
  passRate: number | null
  improvement: number | null
  topPerformers: number | null
  totalExams: number
  totalAssignments: number
}

export interface AnnouncementsMetrics {
  total: number
  published: number
  unpublished: number
  recentCount: number
}

export interface ClassesMetrics {
  total: number
  active: number
  studentTeacherRatio: number
}

export interface ActivityItem {
  type: "enrollment" | "announcement" | "exam" | "assignment"
  action: string
  timestamp: Date | null
  user: string
}

export interface DashboardSummary {
  enrollment: EnrollmentMetrics
  attendance: AttendanceMetrics
  staff: StaffMetrics
  academicPerformance: AcademicPerformanceMetrics
  announcements: AnnouncementsMetrics
  classes: ClassesMetrics
  activities: ActivityItem[]
}

// ============================================================================
// ROLE-SPECIFIC DASHBOARD TYPES
// ============================================================================

export interface TeacherDashboardData {
  todaysClasses: {
    id: string
    name: string
    time: string
    room: string
    students: number
  }[]
  pendingGrading: number
  attendanceDue: number
  totalStudents: number
  pendingAssignments: {
    id: string
    title: string
    className: string
    dueDate: string
    submissionsCount: number
  }[]
  classPerformance: {
    className: string
    average: number
  }[]
  upcomingDeadlines: {
    id: string
    task: string
    dueDate: string
    type: "exam"
  }[]
}

export interface StudentDashboardData {
  todaysTimetable: {
    id: string
    subject: string
    className: string
    teacher: string
    room: string
    startTime: string
    endTime: string
  }[]
  upcomingAssignments: {
    id: string
    title: string
    subject: string
    className: string
    dueDate: string
    status: string
    totalPoints: number | null
  }[]
  recentGrades: {
    id: string
    examTitle: string
    subject: string
    marksObtained: number
    totalMarks: number
    percentage: number
    grade: string | null
  }[]
  announcements: {
    id: string
    title: string
    body: string
    createdAt: string
  }[]
  attendanceSummary: {
    totalDays: number
    presentDays: number
    percentage: number
  }
}

export interface ParentDashboardData {
  children: {
    id: string
    studentId: string | null
    name: string
  }[]
  recentGrades: {
    id: string
    examTitle: string
    subject: string
    marksObtained: number
    totalMarks: number
    percentage: number
    grade: string | null
  }[]
  upcomingAssignments: {
    id: string
    title: string
    subject: string
    className: string
    dueDate: string
    status: string
    score: number | null
  }[]
  attendanceSummary: {
    totalDays: number
    presentDays: number
    percentage: number
  }
  announcements: {
    id: string
    title: string
    body: string
    createdAt: string
  }[]
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface ExtendedUser {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
  name?: string
}

export interface DashboardProps {
  user: ExtendedUser
  dictionary?: Record<string, unknown>
  locale?: string
}
