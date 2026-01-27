"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  DollarSign,
  FileText,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { AnthropicIcons } from "@/components/icons"

// ============================================================================
// TYPES
// ============================================================================

export type UserRole =
  | "ADMIN"
  | "DEVELOPER"
  | "PRINCIPAL"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT"
  | "STAFF"

// Student upcoming data
export interface StudentUpcomingData {
  assignments: {
    id: string
    title: string
    subject: string
    dueDate: string
    isOverdue: boolean
    status: "not_submitted" | "submitted" | "graded"
  }[]
  nextClass?: {
    subject: string
    time: string
    room: string
  }
}

// Teacher upcoming data
export interface TeacherUpcomingData {
  nextClass?: {
    subject: string
    time: string
    room: string
    students: number
  }
  pendingGrading: number
  attendanceDue: number
  classesToday: number
}

// Parent/Guardian upcoming data
export interface ParentUpcomingData {
  children: {
    id: string
    name: string
    pendingAssignments: number
    overdueAssignments: number
  }[]
  upcomingEvents: {
    title: string
    date: string
  }[]
}

// Staff upcoming data
export interface StaffUpcomingData {
  urgentTasks: {
    id: string
    title: string
    priority: "high" | "medium" | "low"
  }[]
  pendingRequests: number
  todaysTasks: number
}

// Accountant upcoming data
export interface AccountantUpcomingData {
  pendingPayments: {
    count: number
    totalAmount: number
  }
  overdueInvoices: {
    count: number
    totalAmount: number
  }
  todayCollections: number
}

// Principal upcoming data
export interface PrincipalUpcomingData {
  criticalAlerts: {
    type: string
    message: string
    severity: "high" | "medium" | "low"
  }[]
  todayMeetings: number
  pendingApprovals: number
}

// Admin upcoming data
export interface AdminUpcomingData {
  systemAlerts: {
    type: string
    message: string
    severity: "high" | "medium" | "low"
  }[]
  pendingApprovals: number
  activeIssues: number
}

// Union type for all role data
export type UpcomingData =
  | StudentUpcomingData
  | TeacherUpcomingData
  | ParentUpcomingData
  | StaffUpcomingData
  | AccountantUpcomingData
  | PrincipalUpcomingData
  | AdminUpcomingData

export interface UpcomingProps {
  role: UserRole
  data?: UpcomingData
  locale: string
  subdomain: string
  className?: string
}

// ============================================================================
// DEFAULT MOCK DATA BY ROLE
// ============================================================================

const defaultStudentData: StudentUpcomingData = {
  assignments: [
    {
      id: "1",
      title: "Math Homework",
      subject: "Mathematics",
      dueDate: "Tomorrow",
      isOverdue: false,
      status: "not_submitted",
    },
    {
      id: "2",
      title: "Science Report",
      subject: "Physics",
      dueDate: "Yesterday",
      isOverdue: true,
      status: "not_submitted",
    },
  ],
  nextClass: { subject: "Mathematics", time: "09:00 AM", room: "Room 101" },
}

const defaultTeacherData: TeacherUpcomingData = {
  nextClass: {
    subject: "Mathematics",
    time: "09:00 AM",
    room: "Room 101",
    students: 32,
  },
  pendingGrading: 15,
  attendanceDue: 3,
  classesToday: 4,
}

const defaultParentData: ParentUpcomingData = {
  children: [
    { id: "1", name: "Ahmed", pendingAssignments: 3, overdueAssignments: 1 },
    { id: "2", name: "Sara", pendingAssignments: 2, overdueAssignments: 0 },
  ],
  upcomingEvents: [{ title: "Parent-Teacher Meeting", date: "Next Monday" }],
}

const defaultStaffData: StaffUpcomingData = {
  urgentTasks: [
    { id: "1", title: "Prepare assembly hall", priority: "high" },
    { id: "2", title: "Submit inventory report", priority: "medium" },
  ],
  pendingRequests: 5,
  todaysTasks: 8,
}

const defaultAccountantData: AccountantUpcomingData = {
  pendingPayments: { count: 12, totalAmount: 45000 },
  overdueInvoices: { count: 4, totalAmount: 15000 },
  todayCollections: 8500,
}

const defaultPrincipalData: PrincipalUpcomingData = {
  criticalAlerts: [
    {
      type: "attendance",
      message: "Grade 8 attendance below 85%",
      severity: "medium",
    },
  ],
  todayMeetings: 3,
  pendingApprovals: 7,
}

const defaultAdminData: AdminUpcomingData = {
  systemAlerts: [
    { type: "storage", message: "Storage usage at 85%", severity: "medium" },
  ],
  pendingApprovals: 5,
  activeIssues: 2,
}

function getDefaultData(role: UserRole): UpcomingData {
  switch (role) {
    case "STUDENT":
      return defaultStudentData
    case "TEACHER":
      return defaultTeacherData
    case "GUARDIAN":
      return defaultParentData
    case "STAFF":
      return defaultStaffData
    case "ACCOUNTANT":
      return defaultAccountantData
    case "PRINCIPAL":
      return defaultPrincipalData
    case "ADMIN":
    case "DEVELOPER":
    default:
      return defaultAdminData
  }
}

// ============================================================================
// ROLE-SPECIFIC CARD CONTENT
// ============================================================================

function StudentCard({
  data,
  locale,
  subdomain,
}: {
  data: StudentUpcomingData
  locale: string
  subdomain: string
}) {
  const overdueCount = data.assignments.filter((a) => a.isOverdue).length
  const pendingCount = data.assignments.filter(
    (a) => a.status === "not_submitted" && !a.isOverdue
  ).length

  return {
    title: "Assignments",
    subtitle:
      overdueCount > 0 ? `${overdueCount} overdue` : `${pendingCount} pending`,
    icon: FileText,
    badge:
      overdueCount > 0
        ? { label: "Overdue", variant: "destructive" as const }
        : undefined,
    details: [
      { label: "Pending", value: `${pendingCount}`, icon: Clock },
      {
        label: "Overdue",
        value: `${overdueCount}`,
        icon: AlertTriangle,
        highlight: overdueCount > 0,
      },
      ...(data.nextClass
        ? [
            { label: "Next Class", value: data.nextClass.subject },
            { label: "Time", value: data.nextClass.time },
          ]
        : []),
    ],
    linkHref: `/${locale}/s/${subdomain}/assignments`,
    linkLabel: "View Assignments",
  }
}

function TeacherCard({
  data,
  locale,
  subdomain,
}: {
  data: TeacherUpcomingData
  locale: string
  subdomain: string
}) {
  return {
    title: "Today's Overview",
    subtitle: data.nextClass
      ? `Next: ${data.nextClass.subject}`
      : "No classes today",
    icon: BookOpen,
    badge:
      data.attendanceDue > 0
        ? {
            label: `${data.attendanceDue} attendance due`,
            variant: "secondary" as const,
          }
        : undefined,
    details: [
      { label: "Classes Today", value: `${data.classesToday}` },
      ...(data.nextClass
        ? [
            { label: "Room", value: data.nextClass.room },
            { label: "Students", value: `${data.nextClass.students}` },
          ]
        : []),
      {
        label: "Pending Grading",
        value: `${data.pendingGrading}`,
        highlight: data.pendingGrading > 10,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/timetable`,
    linkLabel: "View Timetable",
  }
}

function ParentCard({
  data,
  locale,
  subdomain,
}: {
  data: ParentUpcomingData
  locale: string
  subdomain: string
}) {
  const totalOverdue = data.children.reduce(
    (sum, c) => sum + c.overdueAssignments,
    0
  )
  const totalPending = data.children.reduce(
    (sum, c) => sum + c.pendingAssignments,
    0
  )

  return {
    title: "Children Overview",
    subtitle: `${data.children.length} child${data.children.length > 1 ? "ren" : ""} enrolled`,
    icon: Users,
    badge:
      totalOverdue > 0
        ? { label: `${totalOverdue} overdue`, variant: "destructive" as const }
        : undefined,
    details: data.children.map((child) => ({
      label: child.name,
      value:
        child.overdueAssignments > 0
          ? `${child.overdueAssignments} overdue`
          : `${child.pendingAssignments} pending`,
      highlight: child.overdueAssignments > 0,
    })),
    linkHref: `/${locale}/s/${subdomain}/children`,
    linkLabel: "View Children",
  }
}

function StaffCard({
  data,
  locale,
  subdomain,
}: {
  data: StaffUpcomingData
  locale: string
  subdomain: string
}) {
  const highPriorityCount = data.urgentTasks.filter(
    (t) => t.priority === "high"
  ).length

  return {
    title: "Today's Tasks",
    subtitle: `${data.todaysTasks} tasks to complete`,
    icon: ClipboardList,
    badge:
      highPriorityCount > 0
        ? {
            label: `${highPriorityCount} urgent`,
            variant: "destructive" as const,
          }
        : undefined,
    details: [
      { label: "Total Tasks", value: `${data.todaysTasks}` },
      {
        label: "Urgent",
        value: `${highPriorityCount}`,
        highlight: highPriorityCount > 0,
      },
      { label: "Pending Requests", value: `${data.pendingRequests}` },
    ],
    linkHref: `/${locale}/s/${subdomain}/tasks`,
    linkLabel: "View Tasks",
  }
}

function AccountantCard({
  data,
  locale,
  subdomain,
}: {
  data: AccountantUpcomingData
  locale: string
  subdomain: string
}) {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`

  return {
    title: "Financial Status",
    subtitle: `${data.overdueInvoices.count} overdue invoices`,
    icon: DollarSign,
    badge:
      data.overdueInvoices.count > 0
        ? { label: "Action Required", variant: "destructive" as const }
        : undefined,
    details: [
      { label: "Pending Payments", value: `${data.pendingPayments.count}` },
      {
        label: "Overdue Amount",
        value: formatCurrency(data.overdueInvoices.totalAmount),
        highlight: true,
      },
      {
        label: "Today's Collections",
        value: formatCurrency(data.todayCollections),
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/finance/invoice`,
    linkLabel: "View Invoices",
  }
}

function PrincipalCard({
  data,
  locale,
  subdomain,
}: {
  data: PrincipalUpcomingData
  locale: string
  subdomain: string
}) {
  const highAlerts = data.criticalAlerts.filter(
    (a) => a.severity === "high"
  ).length

  return {
    title: "Today's Priorities",
    subtitle: `${data.todayMeetings} meetings scheduled`,
    icon: Calendar,
    badge:
      highAlerts > 0
        ? { label: `${highAlerts} critical`, variant: "destructive" as const }
        : undefined,
    details: [
      { label: "Meetings Today", value: `${data.todayMeetings}` },
      { label: "Pending Approvals", value: `${data.pendingApprovals}` },
      {
        label: "Alerts",
        value: `${data.criticalAlerts.length}`,
        highlight: highAlerts > 0,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/reports`,
    linkLabel: "View Dashboard",
  }
}

function AdminCard({
  data,
  locale,
  subdomain,
}: {
  data: AdminUpcomingData
  locale: string
  subdomain: string
}) {
  const highAlerts = data.systemAlerts.filter(
    (a) => a.severity === "high"
  ).length

  return {
    title: "System Status",
    subtitle: `${data.activeIssues} active issues`,
    icon: Bell,
    badge:
      highAlerts > 0
        ? { label: `${highAlerts} critical`, variant: "destructive" as const }
        : undefined,
    details: [
      { label: "Pending Approvals", value: `${data.pendingApprovals}` },
      {
        label: "Active Issues",
        value: `${data.activeIssues}`,
        highlight: data.activeIssues > 0,
      },
      { label: "System Alerts", value: `${data.systemAlerts.length}` },
    ],
    linkHref: `/${locale}/s/${subdomain}/school`,
    linkLabel: "View School Panel",
  }
}

function getRoleCardConfig(
  role: UserRole,
  data: UpcomingData,
  locale: string,
  subdomain: string
) {
  switch (role) {
    case "STUDENT":
      return StudentCard({
        data: data as StudentUpcomingData,
        locale,
        subdomain,
      })
    case "TEACHER":
      return TeacherCard({
        data: data as TeacherUpcomingData,
        locale,
        subdomain,
      })
    case "GUARDIAN":
      return ParentCard({ data: data as ParentUpcomingData, locale, subdomain })
    case "STAFF":
      return StaffCard({ data: data as StaffUpcomingData, locale, subdomain })
    case "ACCOUNTANT":
      return AccountantCard({
        data: data as AccountantUpcomingData,
        locale,
        subdomain,
      })
    case "PRINCIPAL":
      return PrincipalCard({
        data: data as PrincipalUpcomingData,
        locale,
        subdomain,
      })
    case "ADMIN":
    case "DEVELOPER":
    default:
      return AdminCard({ data: data as AdminUpcomingData, locale, subdomain })
  }
}

// ============================================================================
// MAIN UPCOMING COMPONENT WITH FLIP CARD
// ============================================================================

/**
 * Role-specific upcoming card component with 3D flip animation.
 * Shows the most critical upcoming items based on user role.
 *
 * @example
 * <Upcoming
 *   role="STUDENT"
 *   data={studentUpcomingData}
 *   locale="en"
 *   subdomain="school-name"
 * />
 */
export function Upcoming({
  role,
  data,
  locale,
  subdomain,
  className,
}: UpcomingProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  // Use provided data or fallback to defaults
  const effectiveData = data || getDefaultData(role)
  const cardConfig = getRoleCardConfig(role, effectiveData, locale, subdomain)
  const Icon = cardConfig.icon

  return (
    <div
      className={cn(
        "group relative h-[320px] w-full max-w-[280px] [perspective:2000px] lg:max-w-[320px]",
        className
      )}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full",
          "[transform-style:preserve-3d]",
          "transition-all duration-700",
          isFlipped
            ? "[transform:rotateY(180deg)]"
            : "[transform:rotateY(0deg)]"
        )}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(0deg)] [backface-visibility:hidden]",
            "overflow-hidden rounded-2xl",
            "bg-card",
            "border",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="from-muted/50 to-background relative h-full overflow-hidden bg-gradient-to-b">
            {/* Pulsing circles animation like exam card */}
            <div className="absolute inset-0 flex items-start justify-center pt-24">
              <div className="relative flex h-[100px] w-[200px] items-center justify-center">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute h-[50px] w-[50px]",
                      "rounded-[140px]",
                      "animate-pulse",
                      "opacity-20",
                      "bg-primary/30"
                    )}
                    style={{
                      animationDelay: `${i * 0.3}s`,
                      transform: `scale(${1 + i * 0.2})`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="absolute right-0 bottom-0 left-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="text-foreground text-lg leading-snug font-semibold tracking-tighter transition-all duration-500 ease-out group-hover:translate-y-[-4px]">
                  {cardConfig.title}
                </h3>
                <p className="text-muted-foreground line-clamp-2 text-sm tracking-tight transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px]">
                  {cardConfig.subtitle}
                </p>
              </div>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                    "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent"
                  )}
                />
                {cardConfig.badge ? (
                  <Badge
                    variant={cardConfig.badge.variant}
                    className="relative z-10 text-xs"
                  >
                    {cardConfig.badge.label}
                  </Badge>
                ) : (
                  <AnthropicIcons.Redo className="text-primary relative z-10 h-4 w-4 transition-transform duration-300 group-hover/icon:scale-110 group-hover/icon:-rotate-12" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[transform:rotateY(180deg)] [backface-visibility:hidden]",
            "flex flex-col rounded-2xl border p-6",
            "from-muted/50 to-background bg-gradient-to-b",
            "shadow-sm",
            "transition-all duration-700",
            "group-hover:shadow-lg",
            !isFlipped ? "opacity-0" : "opacity-100"
          )}
        >
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h3 className="text-foreground text-lg leading-snug font-semibold tracking-tight transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {cardConfig.title}
              </h3>
              <p className="text-muted-foreground line-clamp-2 text-sm tracking-tight transition-all duration-500 ease-out group-hover:translate-y-[-2px]">
                {cardConfig.subtitle}
              </p>
            </div>

            <div className="space-y-2">
              {cardConfig.details.slice(0, 4).map((detail, index) => (
                <div
                  key={detail.label}
                  className="flex items-center justify-between text-sm transition-all duration-500"
                  style={{
                    transform: isFlipped
                      ? "translateX(0)"
                      : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 100 + 200}ms`,
                  }}
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span
                    className={cn(
                      "text-foreground font-medium",
                      detail.highlight && "text-destructive"
                    )}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <Link
              href={cardConfig.linkHref}
              className={cn(
                "group/start relative",
                "flex items-center justify-between",
                "-m-3 rounded-xl p-3",
                "transition-all duration-300",
                "bg-muted/50",
                "hover:bg-primary/10",
                "hover:scale-[1.02]"
              )}
            >
              <span className="text-foreground group-hover/start:text-primary text-sm font-medium transition-colors duration-300">
                {cardConfig.linkLabel}
              </span>
              <div className="group/icon relative">
                <div
                  className={cn(
                    "absolute inset-[-6px] rounded-lg transition-all duration-300",
                    "from-primary/20 via-primary/10 bg-gradient-to-br to-transparent",
                    "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100"
                  )}
                />
                <ArrowRight className="text-primary relative z-10 h-4 w-4 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIMPLE UPCOMING CARD (No flip animation)
// ============================================================================

/**
 * Simplified upcoming card without flip animation.
 * Useful for mobile or when flip animation is not needed.
 */
export function SimpleUpcoming({
  role,
  data,
  locale,
  subdomain,
  className,
}: UpcomingProps) {
  const effectiveData = data || getDefaultData(role)
  const cardConfig = getRoleCardConfig(role, effectiveData, locale, subdomain)
  const Icon = cardConfig.icon

  return (
    <div className={cn("bg-card rounded-2xl border p-5 shadow-sm", className)}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{cardConfig.title}</h3>
            <p className="text-muted-foreground text-sm">
              {cardConfig.subtitle}
            </p>
          </div>
        </div>
        {cardConfig.badge && (
          <Badge variant={cardConfig.badge.variant} className="text-xs">
            {cardConfig.badge.label}
          </Badge>
        )}
      </div>

      <div className="mb-4 space-y-2">
        {cardConfig.details.slice(0, 4).map((detail) => (
          <div
            key={detail.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{detail.label}</span>
            <span
              className={cn(
                "font-medium",
                detail.highlight && "text-destructive"
              )}
            >
              {detail.value}
            </span>
          </div>
        ))}
      </div>

      <Link
        href={cardConfig.linkHref}
        className="bg-muted/50 hover:bg-primary/10 flex items-center justify-between rounded-lg p-2 transition-colors"
      >
        <span className="text-sm font-medium">{cardConfig.linkLabel}</span>
        <ArrowRight className="text-primary h-4 w-4" />
      </Link>
    </div>
  )
}
