// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The per-role dashboard sections — resource usage and invoice history.
 *
 * NOT a "use server" module on purpose: the web actions (`actions.ts`, session)
 * and the mobile route (`api/mobile/dashboard/sections`, bearer token) both read
 * these, and a "use server" export would be a client-callable endpoint trusting
 * the schoolId/userId it is handed. Callers authenticate FIRST and pass the
 * tenant in; nothing here resolves a session.
 *
 * The web's `getResourceUsageByRole` / `getInvoicesByRole` are thin wrappers
 * over `loadResourceUsage` / `loadInvoices` — the Prisma lives here once, so the
 * Android dashboard and the web phone dashboard cannot drift apart.
 */

import { startOfYear } from "date-fns"

import { db } from "@/lib/db"

/** A row of the web's `DetailedUsageTable`. */
export interface ResourceUsageRow {
  /**
   * Stable identifier — the key under `school.dashboard.resourceNames` in the
   * dictionaries. The client localizes by this and falls back to `name`.
   */
  key: string
  /** The server's English label; the localization fallback. */
  name: string
  used: number
  limit: number
  unit: string
}

/** A row of the web's `InvoiceHistory`, before formatting. */
export interface InvoiceRow {
  id: string
  /** The invoice / expense date, unformatted. */
  date: Date
  description: string
  amount: number
  /** ISO-4217. The web prints these with a `$`, so they are USD. */
  currency: string
  status: "paid" | "open" | "void"
}

/** Who the sections are resolved for. Authenticated by the caller. */
export interface DashboardViewer {
  schoolId: string
  userId: string | undefined
}

/**
 * The roles that render these sections on the web. PRINCIPAL is not a Prisma
 * `UserRole` — it is a web-only dashboard variant (`principal.tsx`) — but it is
 * kept because the role switches below name it.
 */
export const DASHBOARD_SECTION_ROLES = [
  "STUDENT",
  "TEACHER",
  "GUARDIAN",
  "STAFF",
  "ACCOUNTANT",
  "PRINCIPAL",
  "ADMIN",
  "DEVELOPER",
] as const

export type DashboardSectionRole = (typeof DASHBOARD_SECTION_ROLES)[number]

/**
 * The role, uppercased, when it is one that renders these sections — else null.
 *
 * The switches below fall through to the ADMIN branch, which for invoices is
 * the WHOLE school's billing. On the web that default is unreachable (no USER
 * dashboard mounts these sections); over a bearer token it would be reachable,
 * so the route checks here first and renders nothing, exactly as the web does.
 */
export function asDashboardSectionRole(
  role: string | null | undefined
): DashboardSectionRole | null {
  const upper = (role ?? "").toUpperCase()
  return (DASHBOARD_SECTION_ROLES as readonly string[]).includes(upper)
    ? (upper as DashboardSectionRole)
    : null
}

/**
 * The percentage the usage table prints in its last column — `Math.round` of
 * used/limit, unclamped (the bar clamps its width; the label does not).
 */
export function resourcePercent(row: Pick<ResourceUsageRow, "used" | "limit">) {
  return Math.round(row.limit > 0 ? (row.used / row.limit) * 100 : 0)
}

// ============================================================================
// RESOURCE USAGE
// ============================================================================

/** Role-specific usage metrics. Empty when the role has no rows. */
export async function loadResourceUsage(
  role: string,
  viewer: DashboardViewer
): Promise<ResourceUsageRow[]> {
  const { schoolId, userId } = viewer
  if (!schoolId) return []

  switch (role.toUpperCase()) {
    case "STUDENT":
      return studentResourceUsage(userId, schoolId)
    case "TEACHER":
      return teacherResourceUsage(userId, schoolId)
    case "GUARDIAN":
      return guardianResourceUsage(userId, schoolId)
    case "STAFF":
      return staffResourceUsage()
    case "ACCOUNTANT":
      return accountantResourceUsage(schoolId)
    case "PRINCIPAL":
      return principalResourceUsage(schoolId)
    case "DEVELOPER":
      return developerResourceUsage()
    case "ADMIN":
    default:
      return adminResourceUsage(schoolId)
  }
}

async function studentResourceUsage(
  userId: string | undefined,
  schoolId: string
): Promise<ResourceUsageRow[]> {
  if (!userId) return []

  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) return []

  // Fetch real data in parallel
  const [completedAssignments, totalAssignments, examResults, nextExam] =
    await Promise.all([
      db.assignmentSubmission.count({
        where: {
          studentId: student.id,
          schoolId,
          status: { in: ["SUBMITTED", "GRADED"] },
        },
      }),
      db.schoolAssignment.count({
        where: { schoolId, status: { in: ["PUBLISHED", "IN_PROGRESS"] } },
      }),
      // Use ExamResult for grades instead of non-existent grade model
      db.examResult.findMany({
        where: { studentId: student.id, schoolId },
        select: { percentage: true },
      }),
      db.schoolExam.findFirst({
        where: { schoolId, examDate: { gte: new Date() } },
        orderBy: { examDate: "asc" },
        select: { examDate: true },
      }),
    ])

  // Calculate GPA from exam results (simple average converted to 4.0 scale)
  let gpa = 0
  if (examResults.length > 0) {
    const avgPercentage =
      examResults.reduce(
        (sum: number, r: { percentage: number }) => sum + r.percentage,
        0
      ) / examResults.length
    gpa = (avgPercentage / 100) * 4 // Convert to 4.0 scale
  }

  // Calculate days until next exam
  const daysUntilExam = nextExam
    ? Math.ceil(
        (nextExam.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : 60

  return [
    {
      key: "assignmentProgress",
      name: "Assignment Progress",
      used: completedAssignments,
      limit: totalAssignments || 20,
      unit: "completed",
    },
    // "Attendance Rate" stood here. Attendance is hidden across the student
    // dashboard, so the row is gone and the counts behind it are no longer
    // read — see `student-client.tsx` for the rest of the same removal.
    {
      key: "currentGpa",
      name: "Current GPA",
      used: Math.round(gpa * 10) / 10,
      limit: 4,
      unit: "",
    },
    {
      key: "daysUntilExams",
      name: "Days Until Exams",
      used: Math.max(0, daysUntilExam),
      limit: 60,
      unit: "days",
    },
  ]
}

async function teacherResourceUsage(
  userId: string | undefined,
  schoolId: string
): Promise<ResourceUsageRow[]> {
  if (!userId) return []

  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return []

  // Get current week dates
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  // Get teacher's classes
  const teacherClasses = await db.class.findMany({
    where: { teacherId: teacher.id, schoolId },
    select: { id: true },
  })
  const classIds = teacherClasses.map((c) => c.id)

  const [ungradedWork, studentCount, attendanceMarked] = await Promise.all([
    // Ungraded submissions
    db.assignmentSubmission.count({
      where: {
        schoolId,
        status: "SUBMITTED",
        assignment: { class: { teacherId: teacher.id } },
      },
    }),
    // Total students in teacher's classes
    db.studentClass.count({
      where: { class: { teacherId: teacher.id, schoolId } },
    }),
    // Attendance records marked this week for teacher's classes
    db.attendance.count({
      where: {
        schoolId,
        classId: { in: classIds },
        date: { gte: weekStart, lt: weekEnd },
      },
    }),
  ])

  // Estimate attendance completion
  const expectedAttendance = studentCount * 5 // Approximate: 5 school days
  const attendancePercentage =
    expectedAttendance > 0
      ? Math.round((attendanceMarked / expectedAttendance) * 100)
      : 100

  return [
    {
      key: "lessonsThisWeek",
      name: "Lessons This Week",
      used: 0,
      limit: 24,
      unit: "lessons",
    },
    {
      key: "ungradedWork",
      name: "Ungraded Work",
      used: ungradedWork,
      limit: 50,
      unit: "submissions",
    },
    {
      key: "classCoverage",
      name: "Class Coverage",
      used: studentCount,
      limit: 180,
      unit: "students",
    },
    {
      key: "attendanceMarked",
      name: "Attendance Marked",
      used: Math.min(attendancePercentage, 100),
      limit: 100,
      unit: "%",
    },
  ]
}

async function guardianResourceUsage(
  userId: string | undefined,
  schoolId: string
): Promise<ResourceUsageRow[]> {
  if (!userId) return []

  // Get all children's IDs.
  // NOTE: `guardianId` is a Guardian row id, not a User id — this reads the
  // caller's user id into it, so a guardian sees the empty-children branch.
  // Kept as-is deliberately: the web does this and the app must mirror the web.
  const children = await db.studentGuardian.findMany({
    where: { guardianId: userId, schoolId },
    select: { studentId: true },
  })

  const childIds = children.map((c) => c.studentId)
  const childCount = childIds.length

  if (childCount === 0) {
    return [
      {
        key: "childrenEnrolled",
        name: "Children Enrolled",
        used: 0,
        limit: 5,
        unit: "children",
      },
      {
        key: "avgAttendance",
        name: "Avg Attendance",
        used: 0,
        limit: 100,
        unit: "%",
      },
      {
        key: "assignmentsDue",
        name: "Assignments Due",
        used: 0,
        limit: 15,
        unit: "tasks",
      },
      {
        key: "upcomingEvents",
        name: "Upcoming Events",
        used: 0,
        limit: 10,
        unit: "events",
      },
    ]
  }

  // Fetch real data in parallel
  const [totalAttendance, presentDays, pendingAssignments, upcomingEvents] =
    await Promise.all([
      // Total attendance records for all children
      db.attendance.count({
        where: { studentId: { in: childIds }, schoolId },
      }),
      // Present days for all children
      db.attendance.count({
        where: { studentId: { in: childIds }, schoolId, status: "PRESENT" },
      }),
      // Pending assignments for all children (not yet submitted)
      db.schoolAssignment.count({
        where: {
          schoolId,
          status: { in: ["PUBLISHED", "IN_PROGRESS"] },
          dueDate: { gte: new Date() },
          submissions: { none: { studentId: { in: childIds } } },
        },
      }),
      // Upcoming school events (next 30 days)
      db.event.count({
        where: {
          schoolId,
          eventDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

  const avgAttendance =
    totalAttendance > 0
      ? Math.round((presentDays / totalAttendance) * 100)
      : 100

  return [
    {
      key: "childrenEnrolled",
      name: "Children Enrolled",
      used: childCount,
      limit: 5,
      unit: "children",
    },
    {
      key: "avgAttendance",
      name: "Avg Attendance",
      used: avgAttendance,
      limit: 100,
      unit: "%",
    },
    {
      key: "assignmentsDue",
      name: "Assignments Due",
      used: pendingAssignments,
      limit: 15,
      unit: "tasks",
    },
    {
      key: "upcomingEvents",
      name: "Upcoming Events",
      used: upcomingEvents,
      limit: 10,
      unit: "events",
    },
  ]
}

async function staffResourceUsage(): Promise<ResourceUsageRow[]> {
  // Staff metrics — tasks/requests/efficiency are placeholders on the web too
  // (there is no task or request model yet); only the work-day counts are real.
  const today = new Date()

  return [
    {
      key: "tasksAssigned",
      name: "Tasks Assigned",
      used: 12,
      limit: 20,
      unit: "tasks",
    },
    {
      key: "requestsPending",
      name: "Requests Pending",
      used: 5,
      limit: 15,
      unit: "requests",
    },
    {
      key: "daysThisMonth",
      name: "Days This Month",
      used: getWorkDaysSoFar(today),
      limit: getWorkDaysInMonth(today),
      unit: "days",
    },
    {
      key: "efficiencyScore",
      name: "Efficiency Score",
      used: 88,
      limit: 100,
      unit: "%",
    },
  ]
}

/** Work days in the month (excluding weekends). */
function getWorkDaysInMonth(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  let workDays = 0
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month, day)
    if (d.getDay() !== 0 && d.getDay() !== 6) workDays++
  }
  return workDays
}

/** Work days so far this month. */
function getWorkDaysSoFar(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const today = date.getDate()
  let workDays = 0
  for (let day = 1; day <= today; day++) {
    const d = new Date(year, month, day)
    if (d.getDay() !== 0 && d.getDay() !== 6) workDays++
  }
  return workDays
}

async function accountantResourceUsage(
  schoolId: string
): Promise<ResourceUsageRow[]> {
  // Get current month dates
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [feeMetrics, pendingInvoices, monthlyRevenue, overdueAmount] =
    await Promise.all([
      loadFeeCollectionMetrics(schoolId),
      // Count of pending invoices
      db.userInvoice.count({
        where: { schoolId, status: { not: "PAID" } },
      }),
      // This month's revenue (paid invoices)
      db.userInvoice.aggregate({
        where: {
          schoolId,
          status: "PAID",
          invoice_date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { total: true },
      }),
      // Overdue amount (unpaid and past due date)
      db.userInvoice.aggregate({
        where: {
          schoolId,
          status: { not: "PAID" },
          due_date: { lt: today },
        },
        _sum: { total: true },
      }),
    ])

  const revenue = Number(monthlyRevenue._sum.total) || 0
  const overdue = Number(overdueAmount._sum.total) || 0

  return [
    {
      key: "collectionRate",
      name: "Collection Rate",
      used: Math.round(feeMetrics.collectionRate),
      limit: 100,
      unit: "%",
    },
    {
      key: "pendingInvoices",
      name: "Pending Invoices",
      used: pendingInvoices,
      limit: 200,
      unit: "invoices",
    },
    {
      key: "monthlyRevenue",
      name: "Monthly Revenue",
      used: Math.round(revenue),
      limit: 120000,
      unit: "SAR",
    },
    {
      key: "overdueAmount",
      name: "Overdue Amount",
      used: Math.round(overdue),
      limit: 50000,
      unit: "SAR",
    },
  ]
}

async function principalResourceUsage(
  schoolId: string
): Promise<ResourceUsageRow[]> {
  // Get today's date for attendance
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [studentCount, teacherCount, todayAttendance, totalStudentsToday] =
    await Promise.all([
      db.student.count({ where: { schoolId } }),
      // Count teachers (Staff model doesn't exist)
      db.teacher.count({ where: { schoolId } }),
      // Today's attendance (present students)
      db.attendance.count({
        where: {
          schoolId,
          date: { gte: today, lt: tomorrow },
          status: "PRESENT",
        },
      }),
      // Total students expected today
      db.attendance.count({
        where: {
          schoolId,
          date: { gte: today, lt: tomorrow },
        },
      }),
    ])

  const attendanceToday =
    totalStudentsToday > 0
      ? Math.round((todayAttendance / totalStudentsToday) * 100)
      : 0

  return [
    {
      key: "enrollment",
      name: "Enrollment",
      used: studentCount,
      limit: 1000,
      unit: "students",
    },
    {
      key: "staffCount",
      name: "Staff Count",
      used: teacherCount,
      limit: 60,
      unit: "teachers",
    },
    {
      key: "attendanceToday",
      name: "Attendance Today",
      used: attendanceToday,
      limit: 100,
      unit: "%",
    },
    // Placeholder — there is no budget model yet.
    { key: "budgetUsed", name: "Budget Used", used: 78, limit: 100, unit: "%" },
  ]
}

async function adminResourceUsage(
  schoolId: string
): Promise<ResourceUsageRow[]> {
  const userCount = await db.user.count({ where: { schoolId } })

  // Active sessions estimated as ~12% of total users — there is no sessions
  // table to count.
  const activeSessions = Math.round(userCount * 0.12)

  return [
    {
      key: "activeUsers",
      name: "Active Users",
      used: userCount,
      limit: 2000,
      unit: "users",
    },
    // Placeholder — no storage accounting yet.
    {
      key: "storageUsed",
      name: "Storage Used",
      used: 45,
      limit: 100,
      unit: "GB",
    },
    {
      key: "activeSessions",
      name: "Active Sessions",
      used: activeSessions,
      limit: 500,
      unit: "sessions",
    },
    // Placeholder — no health probe wired in.
    {
      key: "systemHealth",
      name: "System Health",
      used: 98,
      limit: 100,
      unit: "%",
    },
  ]
}

async function developerResourceUsage(): Promise<ResourceUsageRow[]> {
  // Platform-wide metrics for developers — deliberately NOT school-scoped.
  const [totalSchools, totalUsers] = await Promise.all([
    db.school.count(),
    db.user.count(),
  ])

  return [
    {
      key: "schoolsActive",
      name: "Schools Active",
      used: totalSchools,
      limit: 100,
      unit: "schools",
    },
    {
      key: "platformUsers",
      name: "Platform Users",
      used: totalUsers,
      limit: 50000,
      unit: "users",
    },
    // Placeholders — no platform telemetry wired in.
    {
      key: "databaseSize",
      name: "Database Size",
      used: 120,
      limit: 500,
      unit: "GB",
    },
    {
      key: "systemUptime",
      name: "System Uptime",
      used: 99.9,
      limit: 100,
      unit: "%",
    },
  ]
}

// ============================================================================
// INVOICES
// ============================================================================

/** Role-specific invoice / expense history, newest first, at most 10. */
export async function loadInvoices(
  role: string,
  viewer: DashboardViewer
): Promise<InvoiceRow[]> {
  const { schoolId, userId } = viewer
  if (!schoolId) return []

  switch (role.toUpperCase()) {
    case "STUDENT":
      return userInvoices(userId ? [userId] : [], schoolId)
    case "TEACHER":
    case "STAFF":
      return expenseClaims(userId, schoolId) // Expense claims
    case "GUARDIAN":
      return guardianInvoices(userId, schoolId)
    case "ACCOUNTANT":
    case "PRINCIPAL":
    case "ADMIN":
    case "DEVELOPER":
    default:
      return schoolInvoices(schoolId)
  }
}

/** The web prints every amount with a `$`. */
const INVOICE_CURRENCY = "USD"

function invoiceStatus(status: string): InvoiceRow["status"] {
  return status.toLowerCase() as InvoiceRow["status"]
}

async function userInvoices(
  userIds: string[],
  schoolId: string
): Promise<InvoiceRow[]> {
  if (userIds.length === 0) return []

  const invoices = await db.userInvoice.findMany({
    where: { userId: { in: userIds }, schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoice_no: true,
      invoice_date: true,
      total: true,
      status: true,
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    date: inv.invoice_date,
    amount: Number(inv.total),
    currency: INVOICE_CURRENCY,
    status: invoiceStatus(inv.status),
    description: `Invoice #${inv.invoice_no}`,
  }))
}

async function guardianInvoices(
  userId: string | undefined,
  schoolId: string
): Promise<InvoiceRow[]> {
  if (!userId) return []

  // Get all children's student user ids.
  // NOTE: same `guardianId` / user-id mismatch as `guardianResourceUsage` —
  // mirrored from the web on purpose rather than silently corrected here.
  const children = await db.studentGuardian.findMany({
    where: { guardianId: userId, schoolId },
    include: { student: { select: { userId: true } } },
  })

  const childUserIds = children
    .map((c) => c.student.userId)
    .filter((id): id is string => id !== null)

  return userInvoices(childUserIds, schoolId)
}

async function expenseClaims(
  userId: string | undefined,
  schoolId: string
): Promise<InvoiceRow[]> {
  // Teachers and staff see their expense claims / reimbursements.
  if (!userId) return []

  const expenses = await db.expense.findMany({
    where: { schoolId, submittedBy: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      expenseNumber: true,
      expenseDate: true,
      amount: true,
      status: true,
      description: true,
    },
  })

  return expenses.map((exp) => ({
    id: exp.id,
    date: exp.expenseDate,
    amount: Number(exp.amount),
    currency: INVOICE_CURRENCY,
    status: (exp.status === "PAID"
      ? "paid"
      : exp.status === "APPROVED"
        ? "open"
        : "void") as InvoiceRow["status"],
    description: exp.description.slice(0, 50),
  }))
}

async function schoolInvoices(schoolId: string): Promise<InvoiceRow[]> {
  const invoices = await db.userInvoice.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoice_no: true,
      invoice_date: true,
      total: true,
      status: true,
    },
  })

  return invoices.map((inv) => ({
    id: inv.id,
    date: inv.invoice_date,
    amount: Number(inv.total),
    currency: INVOICE_CURRENCY,
    status: invoiceStatus(inv.status),
    description: `Invoice #${inv.invoice_no}`,
  }))
}

// ============================================================================
// FEE COLLECTION
// ============================================================================

/**
 * Fee-collection totals for one school. The body of the web's
 * `getFeeCollectionMetrics`, tenant passed in rather than resolved.
 */
export async function loadFeeCollectionMetrics(schoolId: string) {
  const now = new Date()
  const yearStart = startOfYear(now)

  try {
    // Query real fee assignment and payment data
    const [
      totalFeeAssignments,
      ,
      pendingAssignments,
      overdueAssignments,
      totalPayments,
      yearToDatePayments,
    ] = await Promise.all([
      // Total fee assignments with amounts
      db.feeAssignment.aggregate({
        where: { schoolId },
        _sum: { finalAmount: true },
        _count: true,
      }),
      // Paid assignments
      db.feeAssignment.aggregate({
        where: { schoolId, status: "PAID" },
        _sum: { finalAmount: true },
        _count: true,
      }),
      // Pending assignments
      db.feeAssignment.aggregate({
        where: { schoolId, status: "PENDING" },
        _sum: { finalAmount: true },
        _count: true,
      }),
      // Overdue assignments
      db.feeAssignment.aggregate({
        where: { schoolId, status: "OVERDUE" },
        _sum: { finalAmount: true },
        _count: true,
      }),
      // Total successful payments
      db.payment.aggregate({
        where: { schoolId, status: "SUCCESS" },
        _sum: { amount: true },
        _count: true,
      }),
      // Year-to-date payments
      db.payment.aggregate({
        where: {
          schoolId,
          status: "SUCCESS",
          paymentDate: { gte: yearStart },
        },
        _sum: { amount: true },
      }),
    ])

    const totalExpected = Number(totalFeeAssignments._sum.finalAmount || 0)
    const collected = Number(totalPayments._sum.amount || 0)
    const pending = Number(pendingAssignments._sum.finalAmount || 0)
    const overdue = Number(overdueAssignments._sum.finalAmount || 0)
    const yearToDate = Number(yearToDatePayments._sum.amount || 0)

    // Calculate collection rate (avoid division by zero)
    const collectionRate =
      totalExpected > 0 ? (collected / totalExpected) * 100 : 0
    const defaulterCount = overdueAssignments._count || 0

    return {
      totalExpected,
      collected,
      pending,
      overdue,
      collectionRate,
      defaulters: defaulterCount,
      monthlyTarget: totalExpected / 12, // Approximate monthly target
      yearToDate,
    }
  } catch (error) {
    console.error("[loadFeeCollectionMetrics] Error fetching real data:", error)
    // Fallback to mock data if tables don't exist or are empty
    const totalStudents = await db.student.count({ where: { schoolId } })
    const monthlyFeePerStudent = 5000
    const expectedMonthlyRevenue = totalStudents * monthlyFeePerStudent
    const collectionRate = 85

    return {
      totalExpected: expectedMonthlyRevenue,
      collected: expectedMonthlyRevenue * 0.85,
      pending: expectedMonthlyRevenue * 0.15,
      overdue: expectedMonthlyRevenue * 0.05,
      collectionRate,
      defaulters: Math.floor(totalStudents * 0.15),
      monthlyTarget: expectedMonthlyRevenue,
      yearToDate: expectedMonthlyRevenue * 0.85 * (now.getMonth() + 1),
    }
  }
}
