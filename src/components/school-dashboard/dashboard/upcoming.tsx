"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import { useDictionary } from "@/components/internationalization/use-dictionary"

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
  dict,
}: {
  data: StudentUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const overdueCount = data.assignments.filter((a) => a.isOverdue).length
  const pendingCount = data.assignments.filter(
    (a) => a.status === "not_submitted" && !a.isOverdue
  ).length

  return {
    title: dict?.assignments || "Assignments",
    subtitle:
      overdueCount > 0
        ? `${overdueCount} ${dict?.overdue || "overdue"}`
        : `${pendingCount} ${dict?.pending || "pending"}`,
    icon: FileText,
    badge:
      overdueCount > 0
        ? { label: dict?.overdue || "Overdue", variant: "destructive" as const }
        : undefined,
    details: [
      {
        label: dict?.pending || "Pending",
        value: `${pendingCount}`,
        icon: Clock,
      },
      {
        label: dict?.overdue || "Overdue",
        value: `${overdueCount}`,
        icon: AlertTriangle,
        highlight: overdueCount > 0,
      },
      ...(data.nextClass
        ? [
            {
              label: dict?.nextClass || "Next Class",
              value: data.nextClass.subject,
            },
            { label: dict?.time || "Time", value: data.nextClass.time },
          ]
        : []),
    ],
    linkHref: `/${locale}/s/${subdomain}/assignments`,
    linkLabel: dict?.viewAssignments || "View Assignments",
  }
}

function TeacherCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: TeacherUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  return {
    title: dict?.todaysOverview || "Today's Overview",
    subtitle: data.nextClass
      ? `${dict?.next || "Next"}: ${data.nextClass.subject}`
      : dict?.noClassesToday || "No classes today",
    icon: BookOpen,
    badge:
      data.attendanceDue > 0
        ? {
            label: `${data.attendanceDue} ${dict?.attendanceDue || "attendance due"}`,
            variant: "secondary" as const,
          }
        : undefined,
    details: [
      {
        label: dict?.classesToday || "Classes Today",
        value: `${data.classesToday}`,
      },
      ...(data.nextClass
        ? [
            { label: dict?.room || "Room", value: data.nextClass.room },
            {
              label: dict?.students || "Students",
              value: `${data.nextClass.students}`,
            },
          ]
        : []),
      {
        label: dict?.pendingGrading || "Pending Grading",
        value: `${data.pendingGrading}`,
        highlight: data.pendingGrading > 10,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/timetable`,
    linkLabel: dict?.viewTimetable || "View Timetable",
  }
}

function ParentCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: ParentUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const totalOverdue = data.children.reduce(
    (sum, c) => sum + c.overdueAssignments,
    0
  )

  return {
    title: dict?.childrenOverview || "Children Overview",
    subtitle: `${data.children.length} ${dict?.childrenEnrolled || "children enrolled"}`,
    icon: Users,
    badge:
      totalOverdue > 0
        ? {
            label: `${totalOverdue} ${dict?.overdue || "overdue"}`,
            variant: "destructive" as const,
          }
        : undefined,
    details: data.children.map((child) => ({
      label: child.name,
      value:
        child.overdueAssignments > 0
          ? `${child.overdueAssignments} ${dict?.overdue || "overdue"}`
          : `${child.pendingAssignments} ${dict?.pending || "pending"}`,
      highlight: child.overdueAssignments > 0,
    })),
    linkHref: `/${locale}/s/${subdomain}/children`,
    linkLabel: dict?.viewChildren || "View Children",
  }
}

function StaffCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: StaffUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const highPriorityCount = data.urgentTasks.filter(
    (t) => t.priority === "high"
  ).length

  return {
    title: dict?.todaysTasks || "Today's Tasks",
    subtitle: `${data.todaysTasks} ${dict?.tasksToComplete || "tasks to complete"}`,
    icon: ClipboardList,
    badge:
      highPriorityCount > 0
        ? {
            label: `${highPriorityCount} ${dict?.urgent || "urgent"}`,
            variant: "destructive" as const,
          }
        : undefined,
    details: [
      {
        label: dict?.totalTasks || "Total Tasks",
        value: `${data.todaysTasks}`,
      },
      {
        label: dict?.urgent || "Urgent",
        value: `${highPriorityCount}`,
        highlight: highPriorityCount > 0,
      },
      {
        label: dict?.pendingRequests || "Pending Requests",
        value: `${data.pendingRequests}`,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/tasks`,
    linkLabel: dict?.viewTasks || "View Tasks",
  }
}

function AccountantCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: AccountantUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`

  return {
    title: dict?.financialStatus || "Financial Status",
    subtitle: `${data.overdueInvoices.count} ${dict?.overdueInvoices || "overdue invoices"}`,
    icon: DollarSign,
    badge:
      data.overdueInvoices.count > 0
        ? {
            label: dict?.actionRequired || "Action Required",
            variant: "destructive" as const,
          }
        : undefined,
    details: [
      {
        label: dict?.pendingPayments || "Pending Payments",
        value: `${data.pendingPayments.count}`,
      },
      {
        label: dict?.overdueAmount || "Overdue Amount",
        value: formatCurrency(data.overdueInvoices.totalAmount),
        highlight: true,
      },
      {
        label: dict?.todaysCollections || "Today's Collections",
        value: formatCurrency(data.todayCollections),
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/finance/invoice`,
    linkLabel: dict?.viewInvoices || "View Invoices",
  }
}

function PrincipalCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: PrincipalUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const highAlerts = data.criticalAlerts.filter(
    (a) => a.severity === "high"
  ).length

  return {
    title: dict?.todaysPriorities || "Today's Priorities",
    subtitle: `${data.todayMeetings} ${dict?.meetingsScheduled || "meetings scheduled"}`,
    icon: Calendar,
    badge:
      highAlerts > 0
        ? {
            label: `${highAlerts} ${dict?.critical || "critical"}`,
            variant: "destructive" as const,
          }
        : undefined,
    details: [
      {
        label: dict?.meetingsToday || "Meetings Today",
        value: `${data.todayMeetings}`,
      },
      {
        label: dict?.pendingApprovals || "Pending Approvals",
        value: `${data.pendingApprovals}`,
      },
      {
        label: dict?.alerts || "Alerts",
        value: `${data.criticalAlerts.length}`,
        highlight: highAlerts > 0,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/reports`,
    linkLabel: dict?.viewDashboard || "View Dashboard",
  }
}

function AdminCard({
  data,
  locale,
  subdomain,
  dict,
}: {
  data: AdminUpcomingData
  locale: string
  subdomain: string
  dict?: Record<string, string>
}) {
  const highAlerts = data.systemAlerts.filter(
    (a) => a.severity === "high"
  ).length

  return {
    title: dict?.systemStatus || "System Status",
    subtitle: `${data.activeIssues} ${dict?.activeIssues || "active issues"}`,
    icon: Bell,
    badge:
      highAlerts > 0
        ? {
            label: `${highAlerts} ${dict?.critical || "critical"}`,
            variant: "destructive" as const,
          }
        : undefined,
    details: [
      {
        label: dict?.pendingApprovals || "Pending Approvals",
        value: `${data.pendingApprovals}`,
      },
      {
        label: dict?.activeIssues || "Active Issues",
        value: `${data.activeIssues}`,
        highlight: data.activeIssues > 0,
      },
      {
        label: dict?.systemAlerts || "System Alerts",
        value: `${data.systemAlerts.length}`,
      },
    ],
    linkHref: `/${locale}/s/${subdomain}/school`,
    linkLabel: dict?.viewSchoolPanel || "View School Panel",
  }
}

function getRoleCardConfig(
  role: UserRole,
  data: UpcomingData,
  locale: string,
  subdomain: string,
  dict?: Record<string, string>
) {
  switch (role) {
    case "STUDENT":
      return StudentCard({
        data: data as StudentUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "TEACHER":
      return TeacherCard({
        data: data as TeacherUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "GUARDIAN":
      return ParentCard({
        data: data as ParentUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "STAFF":
      return StaffCard({
        data: data as StaffUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "ACCOUNTANT":
      return AccountantCard({
        data: data as AccountantUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "PRINCIPAL":
      return PrincipalCard({
        data: data as PrincipalUpcomingData,
        locale,
        subdomain,
        dict,
      })
    case "ADMIN":
    case "DEVELOPER":
    default:
      return AdminCard({
        data: data as AdminUpcomingData,
        locale,
        subdomain,
        dict,
      })
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
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.upcoming as
    | Record<string, string>
    | undefined

  // Use provided data or fallback to defaults
  const effectiveData = data || getDefaultData(role)
  const cardConfig = getRoleCardConfig(
    role,
    effectiveData,
    locale,
    subdomain,
    dict
  )
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

          <div className="absolute start-0 end-0 bottom-0 p-5">
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
                <ArrowRight className="text-primary relative z-10 h-4 w-4 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110 rtl:rotate-180 rtl:group-hover/start:-translate-x-0.5" />
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
  const { dictionary } = useDictionary()
  const simpleDict = dictionary?.school?.dashboard?.upcoming as
    | Record<string, string>
    | undefined
  const effectiveData = data || getDefaultData(role)
  const cardConfig = getRoleCardConfig(
    role,
    effectiveData,
    locale,
    subdomain,
    simpleDict
  )
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
        <ArrowRight className="text-primary h-4 w-4 rtl:rotate-180" />
      </Link>
    </div>
  )
}
