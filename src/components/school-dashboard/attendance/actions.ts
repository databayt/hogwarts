/**
 * Attendance Server Actions Module
 *
 * RESPONSIBILITY: Core attendance management system with multi-method tracking (manual, QR, biometric)
 *
 * WHAT IT HANDLES:
 * - Marking attendance: Bulk (class-level), single student, QR code, manual override
 * - Notifications: Real-time absence alerts to guardians (in-app + email)
 * - Analytics: Attendance trends, at-risk students, method usage, class comparisons
 * - QR Sessions: Generate ephemeral QR codes for touch-free check-in
 * - Student Identifiers: Support multiple ID types (employee number, RFID, barcode, etc.)
 * - Bulk Import: CSV upload with validation and error recovery
 *
 * KEY ALGORITHMS:
 * 1. triggerAbsenceNotification(): Fire-and-forget pattern - failures don't block attendance saving
 * 2. getStudentsAtRisk(): Aggregates absence patterns over configurable periods to identify chronic absences
 * 3. QR Session: Generates 6-digit numeric codes (36^6 = 2.2B combinations) for 30-min windows
 * 4. Bulk upload: Transaction-based with individual student error tracking (atomic per student)
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - Every function validates schoolId via getTenantContext()
 * - QR sessions scoped to schoolId - prevents cross-school code reuse
 * - Student identifiers must belong to same school
 * - Bulk upload: Each row must reference students in same school
 * - Guardian notifications only sent to parents within school
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. triggerAbsenceNotification is async but not awaited - failures are logged, not thrown
 *    (Rationale: Attendance marking is more critical than notifications)
 * 2. QR codes expire after 30 minutes (hardcoded, consider making configurable)
 * 3. Late arrivals are counted as "attended" in metrics (include in attendance rate)
 * 4. "Students at risk" uses configurable threshold (default unknown - check validation.ts)
 * 5. Bulk upload creates records for valid rows even if later rows fail
 *    (Recommendation: Implement rollback or status per row)
 *
 * PERFORMANCE NOTES:
 * - markAttendance uses Promise.all for parallel student updates
 * - getStudentsAtRisk aggregates attendance over days/months - potentially expensive
 * - Consider caching at-risk students for 24 hours (stable data)
 * - QR code lookup is O(1) but scan processing includes async notification
 * - Bulk upload: O(n) with DB transaction overhead
 *
 * NOTIFICATION SYSTEM INTEGRATION:
 * - Creates notification records with channels: ['in_app', 'email']
 * - Includes Arabic content in metadata for RTL support
 * - Metadata embedded in notification for flexible templating downstream
 * - actorId tracks who marked the attendance (audit trail)
 *
 * FUTURE IMPROVEMENTS:
 * - Implement bulk upload transaction rollback (currently partial success possible)
 * - Add SMS notification channel (currently email + in-app only)
 * - Batch absence notifications (don't send 30 individual emails per class)
 * - Implement timezone-aware attendance windows (currently assumes UTC)
 * - Add biometric integration hooks (camera/fingerprint APIs)
 * - Cache at-risk student calculations with invalidation strategy
 * - Add attendance makeup policies (excused absences, medical certificates)
 */

"use server"

import { randomBytes } from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AttendanceMethod, AttendanceStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { isChannelAvailable, sendAttendanceSMS } from "@/lib/notifications/sms"
import { getTenantContext } from "@/lib/tenant-context"
import { markAttendanceSchema } from "@/components/school-dashboard/attendance/validation"

// ============================================================================
// EXCUSE MANAGEMENT (Phase 2.2 - Parent Excuse Submission)
// ============================================================================
import {
  attendanceFilterSchema,
  bulkUploadSchema,
  manualAttendanceSchema,
  qrCodeGenerationSchema,
  reviewExcuseSchema,
  studentIdentifierSchema,
  submitExcuseSchema,
} from "./shared/validation"
// ============================================================================
// INTERVENTION TRACKING ACTIONS
// ============================================================================

import type {
  InterventionStatus as InterventionStatusVal,
  InterventionType as InterventionTypeVal,
} from "./validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// ABSENCE NOTIFICATION HELPER
// ============================================================================

/**
 * Trigger absence notification to all guardians of a student
 * Sends in-app, email, and SMS notifications when a student is marked absent
 */
async function triggerAbsenceNotification(
  schoolId: string,
  studentId: string,
  classId: string,
  date: Date,
  markedBy?: string
): Promise<void> {
  try {
    // Get student info with guardians (including phone for SMS)
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        studentGuardians: {
          include: {
            guardian: {
              include: {
                phoneNumbers: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    })

    if (!student || student.studentGuardians.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[triggerAbsenceNotification] No guardians found for student",
          studentId
        )
      }
      return
    }

    // Get class and school info
    const [classInfo, schoolInfo] = await Promise.all([
      db.class.findFirst({
        where: { id: classId, schoolId },
        select: { name: true },
      }),
      db.school.findFirst({
        where: { id: schoolId },
        select: { name: true },
      }),
    ])

    const studentName = `${student.givenName} ${student.surname}`
    const className = classInfo?.name || "Unknown class"
    const schoolName = schoolInfo?.name || "School"
    const dateStrAr = date.toLocaleDateString("ar-SA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const dateShort = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    // Check if SMS channel is available
    const smsAvailable = isChannelAvailable("sms")

    // Create notifications for each guardian with a userId
    for (const sg of student.studentGuardians) {
      const guardian = sg.guardian

      if (!guardian.userId) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            "[triggerAbsenceNotification] Guardian has no userId",
            guardian.id
          )
        }
        continue
      }

      // Get primary phone number if available
      const primaryPhone = guardian.phoneNumbers?.[0]?.phoneNumber
      const hasSMS = smsAvailable && !!primaryPhone

      // Create in-app notification (and email via notification system)
      await db.notification.create({
        data: {
          schoolId,
          userId: guardian.userId,
          type: "attendance_alert",
          priority: "high",
          title: `تنبيه غياب: ${studentName}`,
          body: `تم تسجيل غياب ${studentName} من ${className} في ${dateStrAr}. إذا كان هذا غير متوقع، يرجى التواصل مع المدرسة.`,
          metadata: {
            studentId,
            studentName,
            classId,
            className,
            date: date.toISOString(),
            dateFormatted: dateStrAr,
            markedBy,
          },
          actorId: markedBy,
        },
      })

      // Send SMS if available and guardian has phone number
      if (hasSMS && primaryPhone) {
        // Fire-and-forget SMS (don't block on SMS delivery)
        sendAttendanceSMS(
          primaryPhone,
          {
            studentName,
            className,
            date: dateShort,
            status: "ABSENT",
            schoolName,
          },
          "en" // TODO: Get guardian's preferred language
        ).catch((err) => {
          console.error("[triggerAbsenceNotification] SMS send failed:", err)
        })
      }

      if (process.env.NODE_ENV === "development") {
        console.log(
          "[triggerAbsenceNotification] Notification created for guardian",
          guardian.id,
          "SMS:",
          hasSMS
        )
      }
    }
  } catch (error) {
    // Don't fail the attendance marking if notification fails
    console.error(
      "[triggerAbsenceNotification] Error sending notifications:",
      error
    )
  }
}

// ============================================================================
// CORE ATTENDANCE ACTIONS
// ============================================================================

/**
 * Mark attendance for multiple students in a class
 */
export async function markAttendance(
  input: z.infer<typeof markAttendanceSchema>
): Promise<ActionResponse<{ count: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    const parsed = markAttendanceSchema.parse(input)

    const statusMap: Record<"present" | "absent" | "late", AttendanceStatus> = {
      present: "PRESENT",
      absent: "ABSENT",
      late: "LATE",
    }

    const results = []
    const absentStudents: string[] = [] // Track students marked absent for notifications

    for (const rec of parsed.records) {
      // Find existing daily attendance (where periodId is null)
      const existing = await db.attendance.findFirst({
        where: {
          schoolId,
          studentId: rec.studentId,
          classId: parsed.classId,
          date: new Date(parsed.date),
          periodId: null,
        },
      })

      let result
      if (existing) {
        result = await db.attendance.update({
          where: { id: existing.id },
          data: {
            status: statusMap[rec.status],
            markedBy: session?.user?.id,
            markedAt: new Date(),
          },
        })
      } else {
        result = await db.attendance.create({
          data: {
            schoolId,
            studentId: rec.studentId,
            classId: parsed.classId,
            date: new Date(parsed.date),
            status: statusMap[rec.status],
            method: "MANUAL",
            markedBy: session?.user?.id,
            markedAt: new Date(),
            checkInTime: new Date(),
          },
        })
      }
      results.push(result)

      // Track absent students for notification
      if (rec.status === "absent") {
        absentStudents.push(rec.studentId)
      }
    }

    // Send absence notifications to guardians (non-blocking)
    const attendanceDate = new Date(parsed.date)
    Promise.all(
      absentStudents.map((studentId) =>
        triggerAbsenceNotification(
          schoolId,
          studentId,
          parsed.classId,
          attendanceDate,
          session?.user?.id
        )
      )
    ).catch((err) => console.error("[markAttendance] Notification error:", err))

    revalidatePath("/attendance")
    return { success: true, data: { count: results.length } }
  } catch (error) {
    console.error("[markAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mark attendance",
    }
  }
}

/**
 * Mark single attendance with full options
 */
export async function markSingleAttendance(input: {
  studentId: string
  classId: string
  date: string
  status: AttendanceStatus
  method: AttendanceMethod
  checkInTime?: string
  checkOutTime?: string
  location?: { lat: number; lon: number; accuracy?: number }
  notes?: string
  confidence?: number
  deviceId?: string
}): Promise<ActionResponse<{ attendance: unknown }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()

    // Find existing daily attendance (where periodId is null)
    const existing = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId: input.studentId,
        classId: input.classId,
        date: new Date(input.date),
        periodId: null,
      },
    })

    let result
    if (existing) {
      result = await db.attendance.update({
        where: { id: existing.id },
        data: {
          status: input.status,
          method: input.method,
          markedBy: session?.user?.id,
          markedAt: new Date(),
          checkOutTime: input.checkOutTime
            ? new Date(input.checkOutTime)
            : undefined,
          notes: input.notes,
        },
      })
    } else {
      result = await db.attendance.create({
        data: {
          schoolId,
          studentId: input.studentId,
          classId: input.classId,
          date: new Date(input.date),
          status: input.status,
          method: input.method,
          markedBy: session?.user?.id,
          markedAt: new Date(),
          checkInTime: input.checkInTime
            ? new Date(input.checkInTime)
            : new Date(),
          checkOutTime: input.checkOutTime
            ? new Date(input.checkOutTime)
            : undefined,
          location: input.location ? input.location : undefined,
          notes: input.notes,
          confidence: input.confidence,
          deviceId: input.deviceId,
        },
      })
    }

    // Send absence notification to guardians if student marked absent (non-blocking)
    if (input.status === "ABSENT") {
      triggerAbsenceNotification(
        schoolId,
        input.studentId,
        input.classId,
        new Date(input.date),
        session?.user?.id
      ).catch((err) =>
        console.error("[markSingleAttendance] Notification error:", err)
      )
    }

    revalidatePath("/attendance")
    return { success: true, data: { attendance: result } }
  } catch (error) {
    console.error("[markSingleAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark single attendance",
    }
  }
}

/**
 * Get attendance list for a class on a specific date
 */
export async function getAttendanceList(input: {
  classId: string
  date: string
}): Promise<
  ActionResponse<{
    rows: Array<{
      studentId: string
      name: string
      status: "present" | "absent" | "late"
      checkInTime?: Date
      method?: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = z
      .object({
        classId: z.string().min(1),
        date: z.string().min(1),
      })
      .parse(input)

    const [enrollments, marks] = await Promise.all([
      db.studentClass.findMany({
        where: { schoolId, classId: parsed.classId },
        include: {
          student: {
            select: {
              id: true,
              givenName: true,
              surname: true,
              userId: true,
            },
          },
        },
      }),
      db.attendance.findMany({
        where: {
          schoolId,
          classId: parsed.classId,
          date: new Date(parsed.date),
          deletedAt: null, // Exclude soft-deleted records
        },
      }),
    ])

    const statusByStudent: Record<
      string,
      { status: string; checkInTime?: Date; method?: string }
    > = {}
    marks.forEach((m) => {
      statusByStudent[m.studentId] = {
        status: String(m.status).toLowerCase(),
        checkInTime: m.checkInTime || undefined,
        method: m.method || undefined,
      }
    })

    const rows = enrollments.map((e) => ({
      studentId: e.studentId,
      name: [e.student?.givenName, e.student?.surname]
        .filter(Boolean)
        .join(" "),
      status:
        (statusByStudent[e.studentId]?.status as
          | "present"
          | "absent"
          | "late") || "present",
      checkInTime: statusByStudent[e.studentId]?.checkInTime,
      method: statusByStudent[e.studentId]?.method,
    }))

    return { success: true, data: { rows } }
  } catch (error) {
    console.error("[getAttendanceList] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get attendance list",
    }
  }
}

/**
 * Get classes for selection dropdown
 */
export async function getClassesForSelection(): Promise<
  ActionResponse<{
    classes: Array<{
      id: string
      name: string
      teacher: string | null
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const classes = await db.class.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        teacher: {
          select: { givenName: true, surname: true },
        },
      },
    })

    return {
      success: true,
      data: {
        classes: classes.map((c) => ({
          id: c.id,
          name: c.name,
          teacher: c.teacher
            ? `${c.teacher.givenName} ${c.teacher.surname}`
            : null,
        })),
      },
    }
  } catch (error) {
    console.error("[getClassesForSelection] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get classes for selection",
    }
  }
}

// ============================================================================
// ATTENDANCE ANALYTICS
// ============================================================================

/**
 * Get attendance statistics for a period
 */
export async function getAttendanceStats(input?: {
  classId?: string
  dateFrom?: string
  dateTo?: string
  studentId?: string
}): Promise<{
  total: number
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  holiday: number
  attendanceRate: number
  lastUpdated: string
}> {
  const { schoolId } = await getTenantContext()

  // Return default data if no school context (e.g., during SSR or unauthenticated)
  if (!schoolId) {
    return {
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0,
      holiday: 0,
      attendanceRate: 0,
      lastUpdated: new Date().toISOString(),
    }
  }

  const where: Prisma.AttendanceWhereInput = { schoolId, deletedAt: null }

  if (input?.classId) where.classId = input.classId
  if (input?.studentId) where.studentId = input.studentId
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const [total, present, absent, late, excused, sick] = await Promise.all([
    db.attendance.count({ where }),
    db.attendance.count({ where: { ...where, status: "PRESENT" } }),
    db.attendance.count({ where: { ...where, status: "ABSENT" } }),
    db.attendance.count({ where: { ...where, status: "LATE" } }),
    db.attendance.count({ where: { ...where, status: "EXCUSED" } }),
    db.attendance.count({ where: { ...where, status: "SICK" } }),
  ])

  const attendanceRate = total > 0 ? ((present + late) / total) * 100 : 0

  return {
    total,
    present,
    absent,
    late,
    excused,
    sick,
    holiday: 0,
    attendanceRate: Math.round(attendanceRate * 10) / 10,
    lastUpdated: new Date().toISOString(),
  }
}

/**
 * Get attendance trends over time
 */
export async function getAttendanceTrends(input: {
  dateFrom: string
  dateTo: string
  classId?: string
  groupBy?: "day" | "week" | "month"
}): Promise<
  ActionResponse<{
    trends: Array<{
      date: string
      present: number
      absent: number
      late: number
      total: number
      rate: number
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const where: Prisma.AttendanceWhereInput = {
      schoolId,
      deletedAt: null,
      date: {
        gte: new Date(input.dateFrom),
        lte: new Date(input.dateTo),
      },
    }

    if (input.classId) where.classId = input.classId

    const attendance = await db.attendance.findMany({
      where,
      select: {
        date: true,
        status: true,
      },
      orderBy: { date: "asc" },
    })

    // Group by date
    const byDate: Record<
      string,
      { present: number; absent: number; late: number; total: number }
    > = {}

    attendance.forEach((record) => {
      const dateKey = record.date.toISOString().split("T")[0]
      if (!byDate[dateKey]) {
        byDate[dateKey] = { present: 0, absent: 0, late: 0, total: 0 }
      }
      byDate[dateKey].total++
      if (record.status === "PRESENT") byDate[dateKey].present++
      else if (record.status === "ABSENT") byDate[dateKey].absent++
      else if (record.status === "LATE") byDate[dateKey].late++
    })

    const trends = Object.entries(byDate).map(([date, stats]) => ({
      date,
      ...stats,
      rate:
        stats.total > 0
          ? Math.round(((stats.present + stats.late) / stats.total) * 100)
          : 0,
    }))

    return { success: true, data: { trends } }
  } catch (error) {
    console.error("[getAttendanceTrends] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get attendance trends",
    }
  }
}

/**
 * Get method usage statistics
 */
export async function getMethodUsageStats(input?: {
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.AttendanceWhereInput = { schoolId, deletedAt: null }

  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const methodCounts = await db.attendance.groupBy({
    by: ["method"],
    where,
    _count: { method: true },
  })

  const total = methodCounts.reduce((sum, m) => sum + m._count.method, 0)

  const stats = methodCounts.map((m) => ({
    method: m.method,
    count: m._count.method,
    percentage: total > 0 ? Math.round((m._count.method / total) * 100) : 0,
  }))

  return { stats, total }
}

/**
 * Get day-wise attendance patterns
 */
export async function getDayWisePatterns(input?: {
  dateFrom?: string
  dateTo?: string
  classId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.AttendanceWhereInput = { schoolId, deletedAt: null }

  if (input?.classId) where.classId = input.classId
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const attendance = await db.attendance.findMany({
    where,
    select: { date: true, status: true },
  })

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]
  const byDay: Record<
    number,
    { present: number; absent: number; late: number; total: number }
  > = {}

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    byDay[i] = { present: 0, absent: 0, late: 0, total: 0 }
  }

  attendance.forEach((record) => {
    const day = record.date.getDay()
    byDay[day].total++
    if (record.status === "PRESENT") byDay[day].present++
    else if (record.status === "ABSENT") byDay[day].absent++
    else if (record.status === "LATE") byDay[day].late++
  })

  const patterns = Object.entries(byDay).map(([day, stats]) => ({
    day: dayNames[parseInt(day)],
    dayIndex: parseInt(day),
    ...stats,
    rate:
      stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0,
  }))

  return { patterns }
}

/**
 * Get calendar view data for a specific month
 * Returns daily attendance stats and weekly summaries
 */
export async function getCalendarData(input: {
  year: number
  month: number // 0-indexed (0 = January)
  classId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  // Calculate date range for the month
  const startDate = new Date(input.year, input.month, 1)
  const endDate = new Date(input.year, input.month + 1, 0) // Last day of month

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    deletedAt: null,
    date: {
      gte: startDate,
      lte: endDate,
    },
  }

  if (input.classId) {
    where.classId = input.classId
  }

  // Fetch all attendance records for the month
  const attendance = await db.attendance.findMany({
    where,
    select: {
      date: true,
      status: true,
    },
  })

  // Group by date
  const byDate: Record<
    string,
    {
      present: number
      absent: number
      late: number
      excused: number
      sick: number
      total: number
    }
  > = {}

  // Initialize all days of the month
  const daysInMonth = endDate.getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${input.year}-${String(input.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    byDate[dateStr] = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      sick: 0,
      total: 0,
    }
  }

  // Aggregate attendance data
  attendance.forEach((record) => {
    const dateStr = record.date.toISOString().split("T")[0]
    if (byDate[dateStr]) {
      byDate[dateStr].total++
      switch (record.status) {
        case "PRESENT":
          byDate[dateStr].present++
          break
        case "ABSENT":
          byDate[dateStr].absent++
          break
        case "LATE":
          byDate[dateStr].late++
          break
        case "EXCUSED":
          byDate[dateStr].excused++
          break
        case "SICK":
          byDate[dateStr].sick++
          break
      }
    }
  })

  // Convert to array with rates
  const days = Object.entries(byDate).map(([date, stats]) => ({
    date,
    ...stats,
    rate:
      stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0,
  }))

  // Calculate weekly stats
  const weeklyStats: Array<{
    weekNumber: number
    startDate: string
    endDate: string
    present: number
    absent: number
    late: number
    total: number
    rate: number
  }> = []

  // Group days by week
  let currentWeek = 1
  let weekStart = 1
  const firstDayOfWeek = new Date(input.year, input.month, 1).getDay()

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(input.year, input.month, day)
    const dayOfWeek = currentDate.getDay()

    // Start new week on Sunday (dayOfWeek === 0) unless it's the first day
    if (dayOfWeek === 0 && day > 1) {
      // Calculate stats for the previous week
      const weekDays = days.filter((d) => {
        const dayNum = parseInt(d.date.split("-")[2])
        return dayNum >= weekStart && dayNum < day
      })

      const weekStats = weekDays.reduce(
        (acc, d) => ({
          present: acc.present + d.present,
          absent: acc.absent + d.absent,
          late: acc.late + d.late,
          total: acc.total + d.total,
        }),
        { present: 0, absent: 0, late: 0, total: 0 }
      )

      weeklyStats.push({
        weekNumber: currentWeek,
        startDate: `${input.year}-${String(input.month + 1).padStart(2, "0")}-${String(weekStart).padStart(2, "0")}`,
        endDate: `${input.year}-${String(input.month + 1).padStart(2, "0")}-${String(day - 1).padStart(2, "0")}`,
        ...weekStats,
        rate:
          weekStats.total > 0
            ? Math.round(
                ((weekStats.present + weekStats.late) / weekStats.total) * 100
              )
            : 0,
      })

      currentWeek++
      weekStart = day
    }
  }

  // Add the last week
  const lastWeekDays = days.filter((d) => {
    const dayNum = parseInt(d.date.split("-")[2])
    return dayNum >= weekStart
  })

  if (lastWeekDays.length > 0) {
    const lastWeekStats = lastWeekDays.reduce(
      (acc, d) => ({
        present: acc.present + d.present,
        absent: acc.absent + d.absent,
        late: acc.late + d.late,
        total: acc.total + d.total,
      }),
      { present: 0, absent: 0, late: 0, total: 0 }
    )

    weeklyStats.push({
      weekNumber: currentWeek,
      startDate: `${input.year}-${String(input.month + 1).padStart(2, "0")}-${String(weekStart).padStart(2, "0")}`,
      endDate: `${input.year}-${String(input.month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`,
      ...lastWeekStats,
      rate:
        lastWeekStats.total > 0
          ? Math.round(
              ((lastWeekStats.present + lastWeekStats.late) /
                lastWeekStats.total) *
                100
            )
          : 0,
    })
  }

  return {
    success: true,
    data: {
      month: input.month,
      year: input.year,
      days,
      weeklyStats,
    },
  }
}

/**
 * Get class comparison stats
 */
export async function getClassComparisonStats(input?: {
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.AttendanceWhereInput = { schoolId }

  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  const classes = await db.class.findMany({
    where: { schoolId },
    select: {
      id: true,
      name: true,
      _count: { select: { studentClasses: true } },
    },
  })

  const stats = await Promise.all(
    classes.map(async (cls) => {
      const [total, present, late] = await Promise.all([
        db.attendance.count({ where: { ...where, classId: cls.id } }),
        db.attendance.count({
          where: { ...where, classId: cls.id, status: "PRESENT" },
        }),
        db.attendance.count({
          where: { ...where, classId: cls.id, status: "LATE" },
        }),
      ])

      return {
        classId: cls.id,
        className: cls.name,
        studentCount: cls._count.studentClasses,
        totalRecords: total,
        rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0,
      }
    })
  )

  return { stats: stats.sort((a, b) => b.rate - a.rate) }
}

/**
 * Get students at risk (below threshold)
 */
export async function getStudentsAtRisk(input?: {
  threshold?: number // default 80%
  dateFrom?: string
  dateTo?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const threshold = input?.threshold ?? 80

  const where: Prisma.AttendanceWhereInput = { schoolId }
  if (input?.dateFrom || input?.dateTo) {
    where.date = {}
    if (input.dateFrom) where.date.gte = new Date(input.dateFrom)
    if (input.dateTo) where.date.lte = new Date(input.dateTo)
  }

  // Get all students with their attendance
  const students = await db.student.findMany({
    where: { schoolId },
    select: {
      id: true,
      givenName: true,
      surname: true,
      attendances: {
        where,
        select: { status: true },
      },
    },
  })

  const atRisk = students
    .map((student) => {
      const total = student.attendances.length
      const present = student.attendances.filter(
        (a: { status: string }) => a.status === "PRESENT" || a.status === "LATE"
      ).length
      const rate = total > 0 ? Math.round((present / total) * 100) : 100

      return {
        studentId: student.id,
        name: `${student.givenName} ${student.surname}`,
        totalDays: total,
        presentDays: present,
        absentDays: total - present,
        rate,
      }
    })
    .filter((s) => s.rate < threshold && s.totalDays > 0)
    .sort((a, b) => a.rate - b.rate)

  return { students: atRisk, threshold }
}

// ============================================================================
// RECENT ACTIVITY
// ============================================================================

/**
 * Get recent attendance records
 */
export async function getRecentAttendance(input?: {
  limit?: number
  classId?: string
}) {
  const { schoolId } = await getTenantContext()

  // Return empty data if no school context
  if (!schoolId) {
    return { records: [] }
  }

  const limit = input?.limit ?? 50

  const where: Prisma.AttendanceWhereInput = { schoolId }
  if (input?.classId) where.classId = input.classId

  const records = await db.attendance.findMany({
    where,
    orderBy: { markedAt: "desc" },
    take: limit,
    include: {
      student: {
        select: { givenName: true, surname: true },
      },
      class: {
        select: { name: true },
      },
    },
  })

  return {
    records: records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: `${r.student.givenName} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      date: r.date.toISOString(),
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime?.toISOString(),
      markedAt: r.markedAt.toISOString(),
      markedBy: r.markedBy,
    })),
  }
}

// ============================================================================
// QR CODE SESSION MANAGEMENT
// ============================================================================

/**
 * Generate QR code session for a class
 */
export async function generateQRSession(
  input: z.infer<typeof qrCodeGenerationSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const session = await auth()
  const parsed = qrCodeGenerationSchema.parse(input)

  // Generate unique code
  const code = randomBytes(16).toString("hex")
  const expiresAt = new Date(Date.now() + parsed.validFor * 1000)

  // Invalidate previous active sessions for this class
  await db.qRCodeSession.updateMany({
    where: { schoolId, classId: parsed.classId, isActive: true },
    data: { isActive: false, invalidatedAt: new Date() },
  })

  const qrSession = await db.qRCodeSession.create({
    data: {
      schoolId,
      classId: parsed.classId,
      code,
      payload: {
        classId: parsed.classId,
        schoolId,
        includeLocation: parsed.includeLocation,
        createdAt: new Date().toISOString(),
      },
      generatedBy: session?.user?.id || "system",
      expiresAt,
      isActive: true,
      configuration: {
        validFor: parsed.validFor,
        includeLocation: parsed.includeLocation,
      },
    },
  })

  return {
    success: true,
    sessionId: qrSession.id,
    code: qrSession.code,
    expiresAt: qrSession.expiresAt.toISOString(),
  }
}

/**
 * Validate and process QR code scan
 */
export async function processQRScan(input: {
  code: string
  studentId: string
  location?: { lat: number; lon: number; accuracy?: number }
  deviceId?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  // Find and validate session
  const qrSession = await db.qRCodeSession.findFirst({
    where: {
      schoolId,
      code: input.code,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  })

  if (!qrSession) {
    return { success: false, error: "Invalid or expired QR code" }
  }

  // Check if student already scanned
  const scannedBy = qrSession.scannedBy as string[]
  if (scannedBy.includes(input.studentId)) {
    return { success: false, error: "Already checked in" }
  }

  // Mark attendance
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find existing daily attendance (where periodId is null)
  const existing = await db.attendance.findFirst({
    where: {
      schoolId,
      studentId: input.studentId,
      classId: qrSession.classId,
      date: today,
      periodId: null,
    },
  })

  if (existing) {
    await db.attendance.update({
      where: { id: existing.id },
      data: {
        status: "PRESENT",
        method: "QR_CODE",
        checkInTime: new Date(),
        location: input.location,
      },
    })
  } else {
    await db.attendance.create({
      data: {
        schoolId,
        studentId: input.studentId,
        classId: qrSession.classId,
        date: today,
        status: "PRESENT",
        method: "QR_CODE",
        checkInTime: new Date(),
        location: input.location,
        deviceId: input.deviceId,
      },
    })
  }

  // Update session
  await db.qRCodeSession.update({
    where: { id: qrSession.id },
    data: {
      scanCount: { increment: 1 },
      scannedBy: [...scannedBy, input.studentId],
    },
  })

  return { success: true, message: "Attendance marked successfully" }
}

/**
 * Get active QR sessions
 */
export async function getActiveQRSessions(classId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.QRCodeSessionWhereInput = {
    schoolId,
    isActive: true,
    expiresAt: { gt: new Date() },
  }

  if (classId) where.classId = classId

  const sessions = await db.qRCodeSession.findMany({
    where,
    include: {
      class: { select: { name: true } },
    },
    orderBy: { generatedAt: "desc" },
  })

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      code: s.code,
      classId: s.classId,
      className: s.class.name,
      expiresAt: s.expiresAt.toISOString(),
      scanCount: s.scanCount,
      scannedBy: s.scannedBy as string[],
    })),
  }
}

// ============================================================================
// STUDENT IDENTIFIER MANAGEMENT
// ============================================================================

/**
 * Add student identifier (barcode, RFID, etc.)
 */
export async function addStudentIdentifier(
  input: z.infer<typeof studentIdentifierSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const session = await auth()
  const parsed = studentIdentifierSchema.parse(input)

  const identifier = await db.studentIdentifier.create({
    data: {
      schoolId,
      studentId: parsed.studentId,
      type: parsed.type,
      value: parsed.value,
      isActive: parsed.isActive,
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : undefined,
      issuedBy: session?.user?.id,
    },
  })

  return { success: true, identifier }
}

/**
 * Get student identifiers
 */
export async function getStudentIdentifiers(studentId?: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const where: Prisma.StudentIdentifierWhereInput = { schoolId }
  if (studentId) where.studentId = studentId

  const identifiers = await db.studentIdentifier.findMany({
    where,
    include: {
      student: {
        select: { givenName: true, surname: true },
      },
    },
    orderBy: { issuedAt: "desc" },
  })

  return {
    identifiers: identifiers.map((i) => ({
      id: i.id,
      studentId: i.studentId,
      studentName: `${i.student.givenName} ${i.student.surname}`,
      type: i.type,
      value: i.value,
      isActive: i.isActive,
      isPrimary: i.isPrimary,
      issuedAt: i.issuedAt.toISOString(),
      expiresAt: i.expiresAt?.toISOString(),
      lastUsedAt: i.lastUsedAt?.toISOString(),
      usageCount: i.usageCount,
    })),
  }
}

/**
 * Find student by identifier (for scanning)
 */
export async function findStudentByIdentifier(input: {
  type: string
  value: string
}): Promise<
  | { found: false; error: string }
  | { found: true; student: { id: string; name: string } }
> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { found: false, error: "Missing school context" }
  }

  const identifier = await db.studentIdentifier.findFirst({
    where: {
      schoolId,
      type: input.type as
        | "BARCODE"
        | "QR_CODE"
        | "RFID_CARD"
        | "NFC_TAG"
        | "FINGERPRINT"
        | "FACE_ID"
        | "BLUETOOTH_MAC",
      value: input.value,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: {
      student: {
        select: {
          id: true,
          givenName: true,
          surname: true,
        },
      },
    },
  })

  if (!identifier) {
    return { found: false, error: "Identifier not found or expired" }
  }

  // Update usage stats
  await db.studentIdentifier.update({
    where: { id: identifier.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  })

  return {
    found: true,
    student: {
      id: identifier.student.id,
      name: `${identifier.student.givenName} ${identifier.student.surname}`,
    },
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Bulk upload attendance records
 *
 * Uses Prisma transaction for atomic rollback:
 * - Phase 1: Validate ALL records first (student exists, data format)
 * - Phase 2: Execute all DB operations in single transaction
 * - If ANY operation fails, entire batch is rolled back
 *
 * @returns Detailed report with row numbers for failed validations
 */
export async function bulkUploadAttendance(
  input: z.infer<typeof bulkUploadSchema>
): Promise<{
  successful: number
  failed: number
  errors: Array<{ studentId: string; row: number; error: string }>
  rolledBack: boolean
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return {
      successful: 0,
      failed: 0,
      errors: [{ studentId: "", row: 0, error: "Missing school context" }],
      rolledBack: false,
    }
  }

  const session = await auth()
  const parsed = bulkUploadSchema.parse(input)

  // Phase 1: Pre-validate all records BEFORE any DB operations
  const validationErrors: Array<{
    studentId: string
    row: number
    error: string
  }> = []

  // Get all student IDs to validate they exist in this school
  const studentIds = parsed.records.map((r) => r.studentId)
  const existingStudents = await db.student.findMany({
    where: { schoolId, id: { in: studentIds } },
    select: { id: true },
  })
  const validStudentIds = new Set(existingStudents.map((s) => s.id))

  // Validate each record
  for (let i = 0; i < parsed.records.length; i++) {
    const record = parsed.records[i]
    const rowNum = i + 1 // 1-indexed for user-friendly error messages

    // Check student exists in this school
    if (!validStudentIds.has(record.studentId)) {
      validationErrors.push({
        studentId: record.studentId,
        row: rowNum,
        error: `Student not found in this school: ${record.studentId}`,
      })
    }
  }

  // If any validation errors, abort entire operation
  if (validationErrors.length > 0) {
    return {
      successful: 0,
      failed: validationErrors.length,
      errors: validationErrors,
      rolledBack: true,
    }
  }

  // Validate class exists
  const classExists = await db.class.findFirst({
    where: { id: parsed.classId, schoolId },
  })
  if (!classExists) {
    return {
      successful: 0,
      failed: parsed.records.length,
      errors: [
        { studentId: "", row: 0, error: `Class not found: ${parsed.classId}` },
      ],
      rolledBack: true,
    }
  }

  // Phase 2: Execute all operations in a single transaction
  try {
    await db.$transaction(async (tx) => {
      for (const record of parsed.records) {
        // Find existing daily attendance (where periodId is null, exclude soft-deleted)
        const existing = await tx.attendance.findFirst({
          where: {
            schoolId,
            studentId: record.studentId,
            classId: parsed.classId,
            date: new Date(parsed.date),
            periodId: null,
            deletedAt: null, // Exclude soft-deleted records
          },
        })

        if (existing) {
          await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              checkInTime: record.checkInTime
                ? new Date(record.checkInTime)
                : undefined,
              checkOutTime: record.checkOutTime
                ? new Date(record.checkOutTime)
                : undefined,
              notes: record.notes,
            },
          })
        } else {
          await tx.attendance.create({
            data: {
              schoolId,
              studentId: record.studentId,
              classId: parsed.classId,
              date: new Date(parsed.date),
              status: record.status,
              method: parsed.method,
              markedBy: session?.user?.id,
              markedAt: new Date(),
              checkInTime: record.checkInTime
                ? new Date(record.checkInTime)
                : undefined,
              checkOutTime: record.checkOutTime
                ? new Date(record.checkOutTime)
                : undefined,
              notes: record.notes,
            },
          })
        }
      }
    })

    revalidatePath("/attendance")
    return {
      successful: parsed.records.length,
      failed: 0,
      errors: [],
      rolledBack: false,
    }
  } catch (error) {
    // Transaction failed - all operations rolled back
    return {
      successful: 0,
      failed: parsed.records.length,
      errors: [
        {
          studentId: "",
          row: 0,
          error: `Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      rolledBack: true,
    }
  }
}

// ============================================================================
// REPORTS & EXPORT
// ============================================================================

/**
 * Get attendance report data
 */
export async function getAttendanceReport(
  input: z.infer<typeof attendanceFilterSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const parsed = attendanceFilterSchema.parse(input)

  const where: Prisma.AttendanceWhereInput = { schoolId, deletedAt: null }

  if (parsed.classId) where.classId = parsed.classId
  if (parsed.studentId) where.studentId = parsed.studentId
  if (parsed.status) {
    where.status = Array.isArray(parsed.status)
      ? { in: parsed.status }
      : parsed.status
  }
  if (parsed.method) {
    where.method = Array.isArray(parsed.method)
      ? { in: parsed.method }
      : parsed.method
  }
  if (parsed.dateFrom || parsed.dateTo) {
    where.date = {}
    if (parsed.dateFrom) where.date.gte = new Date(parsed.dateFrom)
    if (parsed.dateTo) where.date.lte = new Date(parsed.dateTo)
  }

  const [records, total] = await Promise.all([
    db.attendance.findMany({
      where,
      include: {
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: parsed.limit,
      skip: parsed.offset,
    }),
    db.attendance.count({ where }),
  ])

  return {
    records: records.map((r) => ({
      id: r.id,
      date: r.date.toISOString(),
      studentId: r.studentId,
      studentName: `${r.student.givenName} ${r.student.surname}`,
      classId: r.classId,
      className: r.class.name,
      status: r.status,
      method: r.method,
      checkInTime: r.checkInTime?.toISOString(),
      checkOutTime: r.checkOutTime?.toISOString(),
      notes: r.notes,
    })),
    total,
    page: Math.floor(parsed.offset / parsed.limit) + 1,
    pageSize: parsed.limit,
    totalPages: Math.ceil(total / parsed.limit),
  }
}

/**
 * Get CSV export data
 */
export async function getAttendanceReportCsv(input: {
  classId?: string
  studentId?: string
  status?: string
  from?: string
  to?: string
  limit?: number
}): Promise<string> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }

  const schema = z.object({
    classId: z.string().optional(),
    studentId: z.string().optional(),
    status: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    limit: z.number().int().positive().max(5000).default(1000).optional(),
  })
  const sp = schema.parse(input ?? {})

  const where: Prisma.AttendanceWhereInput = { schoolId, deletedAt: null }
  if (sp.classId) where.classId = sp.classId
  if (sp.studentId) where.studentId = sp.studentId
  if (sp.status) where.status = sp.status.toUpperCase() as AttendanceStatus
  if (sp.from || sp.to) {
    where.date = {}
    if (sp.from) where.date.gte = new Date(sp.from)
    if (sp.to) where.date.lte = new Date(sp.to)
  }

  const rows = await db.attendance.findMany({
    where,
    orderBy: { date: "desc" },
    take: sp.limit ?? 1000,
    include: {
      student: { select: { givenName: true, surname: true } },
      class: { select: { name: true } },
    },
  })

  const header =
    "date,studentId,studentName,classId,className,status,method,checkInTime,checkOutTime,notes\n"
  const body = rows
    .map((r) =>
      [
        new Date(r.date).toISOString().slice(0, 10),
        r.studentId,
        `"${r.student.givenName} ${r.student.surname}"`,
        r.classId,
        `"${r.class.name}"`,
        String(r.status),
        String(r.method),
        r.checkInTime?.toISOString() || "",
        r.checkOutTime?.toISOString() || "",
        `"${r.notes || ""}"`,
      ].join(",")
    )
    .join("\n")

  return header + body
}

// ============================================================================
// CHECK OUT
// ============================================================================

/**
 * Check out student (mark departure time)
 */
export async function checkOutStudent(input: {
  studentId: string
  classId: string
  date: string
}): Promise<{ success: boolean; error?: string }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const attendance = await db.attendance.findFirst({
    where: {
      schoolId,
      studentId: input.studentId,
      classId: input.classId,
      date: new Date(input.date),
      periodId: null,
    },
  })

  if (!attendance) {
    return { success: false, error: "No check-in record found" }
  }

  if (attendance.checkOutTime) {
    return { success: false, error: "Already checked out" }
  }

  await db.attendance.update({
    where: { id: attendance.id },
    data: { checkOutTime: new Date() },
  })

  revalidatePath("/attendance")
  return { success: true }
}

/**
 * Bulk check out all students for a class
 */
export async function bulkCheckOut(input: {
  classId: string
  date: string
}): Promise<{ success: boolean; count: number }> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, count: 0 }
  }

  const result = await db.attendance.updateMany({
    where: {
      schoolId,
      classId: input.classId,
      date: new Date(input.date),
      checkOutTime: null,
    },
    data: { checkOutTime: new Date() },
  })

  revalidatePath("/attendance")
  return { success: true, count: result.count }
}

// ============================================================================
// BULK UPLOAD HISTORY
// ============================================================================

/**
 * Get recent bulk uploads (grouped by date and method=BULK_UPLOAD)
 */
export async function getRecentBulkUploads(limit = 5): Promise<{
  uploads: Array<{
    date: Date
    classId: string
    className: string
    total: number
    successful: number
    failed: number
  }>
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { uploads: [] }

  // Get unique date+class combinations for BULK_UPLOAD method
  const recentUploads = await db.attendance.groupBy({
    by: ["date", "classId"],
    where: {
      schoolId,
      method: "BULK_UPLOAD",
    },
    _count: {
      _all: true,
    },
    orderBy: { date: "desc" },
    take: limit,
  })

  // Get class names
  const classIds = [...new Set(recentUploads.map((u) => u.classId))]
  const classes = await db.class.findMany({
    where: { id: { in: classIds }, schoolId },
    select: { id: true, name: true },
  })
  const classMap = new Map(classes.map((c) => [c.id, c.name]))

  // Get success/fail counts for each upload
  const uploads = await Promise.all(
    recentUploads.map(async (upload) => {
      const successCount = await db.attendance.count({
        where: {
          schoolId,
          date: upload.date,
          classId: upload.classId,
          method: "BULK_UPLOAD",
          status: { not: "ABSENT" }, // Consider non-absent as successful processing
        },
      })

      return {
        date: upload.date,
        classId: upload.classId,
        className: classMap.get(upload.classId) || "Unknown Class",
        total: upload._count._all,
        successful: successCount,
        failed: upload._count._all - successCount,
      }
    })
  )

  return { uploads }
}

// ============================================================================
// EARLY WARNING SYSTEM (Phase 3.1 - Chronic Absenteeism Detection)
// ============================================================================

/**
 * Risk levels based on US Department of Education guidelines
 * https://www.ed.gov/teaching-and-administration/supporting-students/chronic-absenteeism
 */
export type AttendanceRiskLevel =
  | "SATISFACTORY"
  | "AT_RISK"
  | "MODERATELY_CHRONIC"
  | "SEVERELY_CHRONIC"

interface StudentRiskData {
  studentId: string
  studentName: string
  classId: string | null
  className: string | null
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  attendanceRate: number
  riskLevel: AttendanceRiskLevel
  trend: "improving" | "stable" | "declining"
  consecutiveAbsences: number
  lastAttendance: string | null
}

/**
 * Calculate risk level based on attendance rate
 */
function calculateRiskLevel(rate: number): AttendanceRiskLevel {
  if (rate >= 95) return "SATISFACTORY"
  if (rate >= 90) return "AT_RISK"
  if (rate >= 80) return "MODERATELY_CHRONIC"
  return "SEVERELY_CHRONIC"
}

/**
 * Get students by risk level for early warning dashboard
 */
export async function getStudentsByRiskLevel(input?: {
  classId?: string
  riskLevel?: AttendanceRiskLevel
  dateFrom?: string
  dateTo?: string
  limit?: number
}): Promise<
  ActionResponse<{
    students: StudentRiskData[]
    summary: {
      satisfactory: number
      atRisk: number
      moderatelyChronic: number
      severelyChronic: number
      total: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Default to current school year (last 90 days if not specified)
    const dateFrom = input?.dateFrom
      ? new Date(input.dateFrom)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const dateTo = input?.dateTo ? new Date(input.dateTo) : new Date()

    // Get all students with their attendance
    const where: Prisma.StudentWhereInput = { schoolId }
    if (input?.classId) {
      where.studentClasses = { some: { classId: input.classId } }
    }

    const students = await db.student.findMany({
      where,
      select: {
        id: true,
        givenName: true,
        surname: true,
        studentClasses: {
          take: 1,
          include: { class: { select: { id: true, name: true } } },
        },
        attendances: {
          where: {
            date: { gte: dateFrom, lte: dateTo },
            schoolId,
          },
          orderBy: { date: "desc" },
          select: { status: true, date: true },
        },
      },
    })

    const riskData: StudentRiskData[] = students.map((student) => {
      const attendances = student.attendances
      const totalDays = attendances.length
      const presentDays = attendances.filter(
        (a) => a.status === "PRESENT"
      ).length
      const lateDays = attendances.filter((a) => a.status === "LATE").length
      const absentDays = attendances.filter((a) => a.status === "ABSENT").length
      const excusedDays = attendances.filter(
        (a) => a.status === "EXCUSED" || a.status === "SICK"
      ).length

      // Late counts as present for rate calculation
      const attendanceRate =
        totalDays > 0
          ? Math.round(((presentDays + lateDays) / totalDays) * 100)
          : 100
      const riskLevel = calculateRiskLevel(attendanceRate)

      // Calculate trend (compare last 30 days vs previous 30 days)
      const midpoint = Math.floor(attendances.length / 2)
      const recentAttendances = attendances.slice(0, midpoint)
      const olderAttendances = attendances.slice(midpoint)

      const recentRate =
        recentAttendances.length > 0
          ? (recentAttendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length /
              recentAttendances.length) *
            100
          : 100
      const olderRate =
        olderAttendances.length > 0
          ? (olderAttendances.filter(
              (a) => a.status === "PRESENT" || a.status === "LATE"
            ).length /
              olderAttendances.length) *
            100
          : 100

      let trend: "improving" | "stable" | "declining" = "stable"
      if (recentRate - olderRate > 5) trend = "improving"
      else if (olderRate - recentRate > 5) trend = "declining"

      // Count consecutive absences from most recent
      let consecutiveAbsences = 0
      for (const a of attendances) {
        if (a.status === "ABSENT") consecutiveAbsences++
        else break
      }

      const primaryClass = student.studentClasses[0]?.class

      return {
        studentId: student.id,
        studentName: `${student.givenName} ${student.surname}`,
        classId: primaryClass?.id || null,
        className: primaryClass?.name || null,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        excusedDays,
        attendanceRate,
        riskLevel,
        trend,
        consecutiveAbsences,
        lastAttendance: attendances[0]?.date.toISOString() || null,
      }
    })

    // Filter by risk level if specified
    let filteredData = riskData
    if (input?.riskLevel) {
      filteredData = riskData.filter((s) => s.riskLevel === input.riskLevel)
    }

    // Sort by attendance rate (lowest first) and limit
    filteredData.sort((a, b) => a.attendanceRate - b.attendanceRate)
    if (input?.limit) {
      filteredData = filteredData.slice(0, input.limit)
    }

    // Calculate summary
    const summary = {
      satisfactory: riskData.filter((s) => s.riskLevel === "SATISFACTORY")
        .length,
      atRisk: riskData.filter((s) => s.riskLevel === "AT_RISK").length,
      moderatelyChronic: riskData.filter(
        (s) => s.riskLevel === "MODERATELY_CHRONIC"
      ).length,
      severelyChronic: riskData.filter(
        (s) => s.riskLevel === "SEVERELY_CHRONIC"
      ).length,
      total: riskData.length,
    }

    return { success: true, data: { students: filteredData, summary } }
  } catch (error) {
    console.error("[getStudentsByRiskLevel] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get students by risk level",
    }
  }
}

/**
 * Get detailed early warning data for a specific student
 */
export async function getStudentEarlyWarningDetails(studentId: string): Promise<
  ActionResponse<{
    student: StudentRiskData
    weeklyTrends: Array<{ week: string; rate: number; absences: number }>
    recentAbsences: Array<{
      date: string
      className: string
      hasExcuse: boolean
    }>
    alerts: Array<{
      type: string
      message: string
      severity: "low" | "medium" | "high"
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Get last 90 days of attendance
    const dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        id: true,
        givenName: true,
        surname: true,
        studentClasses: {
          take: 1,
          include: { class: { select: { id: true, name: true } } },
        },
        attendances: {
          where: { date: { gte: dateFrom }, schoolId },
          orderBy: { date: "desc" },
          include: {
            class: { select: { name: true } },
            excuse: { select: { status: true } },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const attendances = student.attendances
    const totalDays = attendances.length
    const presentDays = attendances.filter((a) => a.status === "PRESENT").length
    const lateDays = attendances.filter((a) => a.status === "LATE").length
    const absentDays = attendances.filter((a) => a.status === "ABSENT").length
    const excusedDays = attendances.filter(
      (a) => a.status === "EXCUSED" || a.status === "SICK"
    ).length
    const attendanceRate =
      totalDays > 0
        ? Math.round(((presentDays + lateDays) / totalDays) * 100)
        : 100

    // Calculate weekly trends
    const weeklyData: Record<
      string,
      { total: number; present: number; absent: number }
    > = {}
    attendances.forEach((a) => {
      const weekStart = new Date(a.date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekKey = weekStart.toISOString().split("T")[0]

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, present: 0, absent: 0 }
      }
      weeklyData[weekKey].total++
      if (a.status === "PRESENT" || a.status === "LATE")
        weeklyData[weekKey].present++
      if (a.status === "ABSENT") weeklyData[weekKey].absent++
    })

    const weeklyTrends = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        rate:
          data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
        absences: data.absent,
      }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Get recent absences
    const recentAbsences = attendances
      .filter((a) => a.status === "ABSENT")
      .slice(0, 10)
      .map((a) => ({
        date: a.date.toISOString(),
        className: a.class.name,
        hasExcuse: !!a.excuse && a.excuse.status === "APPROVED",
      }))

    // Generate alerts
    const alerts: Array<{
      type: string
      message: string
      severity: "low" | "medium" | "high"
    }> = []

    // Calculate consecutive absences
    let consecutiveAbsences = 0
    for (const a of attendances) {
      if (a.status === "ABSENT") consecutiveAbsences++
      else break
    }

    if (consecutiveAbsences >= 5) {
      alerts.push({
        type: "consecutive_absences",
        message: `Student has ${consecutiveAbsences} consecutive absences`,
        severity: "high",
      })
    } else if (consecutiveAbsences >= 3) {
      alerts.push({
        type: "consecutive_absences",
        message: `Student has ${consecutiveAbsences} consecutive absences`,
        severity: "medium",
      })
    }

    if (attendanceRate < 80) {
      alerts.push({
        type: "severely_chronic",
        message: "Student is severely chronically absent (<80% attendance)",
        severity: "high",
      })
    } else if (attendanceRate < 90) {
      alerts.push({
        type: "moderately_chronic",
        message:
          "Student is moderately chronically absent (80-89.9% attendance)",
        severity: "medium",
      })
    } else if (attendanceRate < 95) {
      alerts.push({
        type: "at_risk",
        message:
          "Student is at risk of chronic absenteeism (90-94.9% attendance)",
        severity: "low",
      })
    }

    // Check trend
    const midpoint = Math.floor(attendances.length / 2)
    const recentAtt = attendances.slice(0, midpoint)
    const olderAtt = attendances.slice(midpoint)
    const recentRate =
      recentAtt.length > 0
        ? (recentAtt.filter(
            (a) => a.status === "PRESENT" || a.status === "LATE"
          ).length /
            recentAtt.length) *
          100
        : 100
    const olderRate =
      olderAtt.length > 0
        ? (olderAtt.filter((a) => a.status === "PRESENT" || a.status === "LATE")
            .length /
            olderAtt.length) *
          100
        : 100

    let trend: "improving" | "stable" | "declining" = "stable"
    if (recentRate - olderRate > 5) trend = "improving"
    else if (olderRate - recentRate > 5) {
      trend = "declining"
      alerts.push({
        type: "declining_trend",
        message: "Attendance is declining compared to previous period",
        severity: "medium",
      })
    }

    const primaryClass = student.studentClasses[0]?.class

    return {
      success: true,
      data: {
        student: {
          studentId: student.id,
          studentName: `${student.givenName} ${student.surname}`,
          classId: primaryClass?.id || null,
          className: primaryClass?.name || null,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendanceRate,
          riskLevel: calculateRiskLevel(attendanceRate),
          trend,
          consecutiveAbsences,
          lastAttendance: attendances[0]?.date.toISOString() || null,
        },
        weeklyTrends,
        recentAbsences,
        alerts,
      },
    }
  } catch (error) {
    console.error("[getStudentEarlyWarningDetails] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student early warning details",
    }
  }
}

/**
 * Submit an excuse for an absence (called by parent/guardian)
 */
export async function submitExcuse(input: {
  attendanceId: string
  reason:
    | "MEDICAL"
    | "FAMILY_EMERGENCY"
    | "RELIGIOUS"
    | "SCHOOL_ACTIVITY"
    | "TRANSPORTATION"
    | "WEATHER"
    | "OTHER"
  description?: string
  attachments?: string[]
}): Promise<ActionResponse<{ excuseId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate input
    const parsed = submitExcuseSchema.parse(input)

    // Get the attendance record
    const attendance = await db.attendance.findFirst({
      where: {
        id: parsed.attendanceId,
        schoolId,
      },
      include: {
        student: {
          include: {
            studentGuardians: {
              include: {
                guardian: {
                  select: { userId: true },
                },
              },
            },
          },
        },
        excuse: true, // Check if excuse already exists
      },
    })

    if (!attendance) {
      return { success: false, error: "Attendance record not found" }
    }

    // Check if an excuse already exists
    if (attendance.excuse) {
      return {
        success: false,
        error: "An excuse has already been submitted for this absence",
      }
    }

    // Verify user is a guardian of this student
    const isGuardian = attendance.student.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )

    // Also allow admins and teachers to submit on behalf
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "TEACHER"

    if (!isGuardian && !isStaff) {
      return {
        success: false,
        error: "You are not authorized to submit an excuse for this student",
      }
    }

    // Create the excuse
    const excuse = await db.attendanceExcuse.create({
      data: {
        schoolId,
        attendanceId: parsed.attendanceId,
        reason: parsed.reason,
        description: parsed.description,
        attachments: parsed.attachments || [],
        submittedBy: session.user.id,
        status: "PENDING",
      },
    })

    // Send notification to teacher/admin about new excuse submission
    const classTeachers = await db.classTeacher.findMany({
      where: {
        schoolId,
        classId: attendance.classId,
      },
      include: {
        teacher: {
          select: { userId: true, givenName: true, surname: true },
        },
      },
    })

    const studentName = `${attendance.student.givenName} ${attendance.student.surname}`
    const dateStr = attendance.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Notify each teacher assigned to the class
    for (const ct of classTeachers) {
      if (ct.teacher.userId) {
        await db.notification.create({
          data: {
            schoolId,
            userId: ct.teacher.userId,
            type: "attendance_alert",
            priority: "normal",
            title: `Excuse Submitted: ${studentName}`,
            body: `An excuse has been submitted for ${studentName}'s absence on ${dateStr}. Please review and approve or reject.`,
            metadata: {
              excuseId: excuse.id,
              studentId: attendance.studentId,
              studentName,
              attendanceId: attendance.id,
              date: attendance.date.toISOString(),
              reason: parsed.reason,
            },
            channels: ["in_app", "email"],
            actorId: session.user.id,
          },
        })
      }
    }

    revalidatePath("/attendance")
    revalidatePath("/parent-portal/attendance")

    return { success: true, data: { excuseId: excuse.id } }
  } catch (error) {
    console.error("[submitExcuse] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit excuse",
    }
  }
}

/**
 * Review (approve/reject) an excuse (called by teacher/admin)
 */
export async function reviewExcuse(input: {
  excuseId: string
  status: "APPROVED" | "REJECTED"
  reviewNotes?: string
}): Promise<ActionResponse<{ updated: boolean }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Validate input
    const parsed = reviewExcuseSchema.parse(input)

    // Check user role - only teachers and admins can review
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return {
        success: false,
        error: "Only teachers and administrators can review excuses",
      }
    }

    // Get the excuse
    const excuse = await db.attendanceExcuse.findFirst({
      where: {
        id: parsed.excuseId,
        schoolId,
      },
      include: {
        attendance: {
          include: {
            student: {
              include: {
                studentGuardians: {
                  include: {
                    guardian: {
                      select: {
                        userId: true,
                        givenName: true,
                        emailAddress: true,
                      },
                    },
                  },
                },
              },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!excuse) {
      return { success: false, error: "Excuse not found" }
    }

    if (excuse.status !== "PENDING") {
      return { success: false, error: "This excuse has already been reviewed" }
    }

    // Update the excuse
    await db.attendanceExcuse.update({
      where: { id: excuse.id },
      data: {
        status: parsed.status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: parsed.reviewNotes,
      },
    })

    // If approved, update attendance status to EXCUSED
    if (parsed.status === "APPROVED") {
      await db.attendance.update({
        where: { id: excuse.attendanceId },
        data: { status: "EXCUSED" },
      })
    }

    // Notify the guardian who submitted the excuse
    const studentName = `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`
    const className = excuse.attendance.class.name
    const statusTextAr =
      parsed.status === "APPROVED" ? "تمت الموافقة على" : "تم رفض"

    // Find the guardian who submitted
    const submitter = excuse.attendance.student.studentGuardians.find(
      (sg) => sg.guardian.userId === excuse.submittedBy
    )

    if (submitter?.guardian.userId) {
      await db.notification.create({
        data: {
          schoolId,
          userId: submitter.guardian.userId,
          type: "attendance_alert",
          priority: "normal",
          title: `${statusTextAr} العذر: ${studentName}`,
          body: `${statusTextAr} عذر غياب ${studentName} في ${excuse.attendance.date.toLocaleDateString("ar-SA")} (${className}).${parsed.reviewNotes ? ` ملاحظة: ${parsed.reviewNotes}` : ""}`,
          metadata: {
            excuseId: excuse.id,
            studentId: excuse.attendance.studentId,
            studentName,
            attendanceId: excuse.attendanceId,
            date: excuse.attendance.date.toISOString(),
            status: parsed.status,
            reviewNotes: parsed.reviewNotes,
          },
          channels: ["in_app", "email"],
          actorId: session.user.id,
        },
      })
    }

    revalidatePath("/attendance")
    revalidatePath("/parent-portal/attendance")

    return { success: true, data: { updated: true } }
  } catch (error) {
    console.error("[reviewExcuse] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to review excuse",
    }
  }
}

/**
 * Get excuses for a specific student (for parent portal)
 */
export async function getExcusesForStudent(studentId: string): Promise<
  ActionResponse<{
    excuses: Array<{
      id: string
      attendanceId: string
      date: string
      className: string
      reason: string
      description: string | null
      status: string
      submittedAt: string
      reviewedAt: string | null
      reviewNotes: string | null
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Verify access: either guardian of the student, or staff
    const student = await db.student.findFirst({
      where: {
        id: studentId,
        schoolId,
      },
      include: {
        studentGuardians: {
          include: {
            guardian: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const isGuardian = student.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "TEACHER"

    if (!isGuardian && !isStaff) {
      return {
        success: false,
        error: "You are not authorized to view this student's excuses",
      }
    }

    // Get all excuses for this student's attendance records
    const excuses = await db.attendanceExcuse.findMany({
      where: {
        schoolId,
        attendance: {
          studentId,
        },
      },
      include: {
        attendance: {
          include: {
            class: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    })

    return {
      success: true,
      data: {
        excuses: excuses.map((e) => ({
          id: e.id,
          attendanceId: e.attendanceId,
          date: e.attendance.date.toISOString(),
          className: e.attendance.class.name,
          reason: e.reason,
          description: e.description,
          status: e.status,
          submittedAt: e.submittedAt.toISOString(),
          reviewedAt: e.reviewedAt?.toISOString() || null,
          reviewNotes: e.reviewNotes,
        })),
      },
    }
  } catch (error) {
    console.error("[getExcusesForStudent] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get excuses",
    }
  }
}

/**
 * Get pending excuses for review (for teachers/admins)
 */
export async function getPendingExcuses(input?: {
  classId?: string
  limit?: number
}): Promise<
  ActionResponse<{
    excuses: Array<{
      id: string
      attendanceId: string
      studentId: string
      studentName: string
      className: string
      date: string
      reason: string
      description: string | null
      attachments: string[]
      submittedBy: string
      submitterName: string | null
      submittedAt: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only teachers and admins can view pending excuses
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return {
        success: false,
        error: "Only teachers and administrators can review excuses",
      }
    }

    const where: Prisma.AttendanceExcuseWhereInput = {
      schoolId,
      status: "PENDING",
    }

    // For teachers, optionally filter to only their assigned classes
    let teacherClassIds: string[] | null = null
    if (session.user.role === "TEACHER") {
      const teacherClasses = await db.classTeacher.findMany({
        where: {
          schoolId,
          teacher: { userId: session.user.id },
        },
        select: { classId: true },
      })
      teacherClassIds = teacherClasses.map((tc) => tc.classId)
    }

    const excuses = await db.attendanceExcuse.findMany({
      where: {
        ...where,
        ...(teacherClassIds && teacherClassIds.length > 0
          ? {
              attendance: {
                classId: { in: teacherClassIds },
              },
            }
          : {}),
        ...(input?.classId
          ? {
              attendance: {
                classId: input.classId,
              },
            }
          : {}),
      },
      include: {
        attendance: {
          include: {
            student: {
              select: { id: true, givenName: true, surname: true },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
      take: input?.limit ?? 50,
    })

    // Get submitter names (use username or email as fallback)
    const submitterIds = [...new Set(excuses.map((e) => e.submittedBy))]
    const users = await db.user.findMany({
      where: { id: { in: submitterIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        excuses: excuses.map((e) => ({
          id: e.id,
          attendanceId: e.attendanceId,
          studentId: e.attendance.studentId,
          studentName: `${e.attendance.student.givenName} ${e.attendance.student.surname}`,
          className: e.attendance.class.name,
          date: e.attendance.date.toISOString(),
          reason: e.reason,
          description: e.description,
          attachments: e.attachments,
          submittedBy: e.submittedBy,
          submitterName: userMap.get(e.submittedBy) || null,
          submittedAt: e.submittedAt.toISOString(),
        })),
      },
    }
  } catch (error) {
    console.error("[getPendingExcuses] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get pending excuses",
    }
  }
}

/**
 * Get excuse details by ID
 */
export async function getExcuseById(excuseId: string): Promise<
  ActionResponse<{
    excuse: {
      id: string
      attendanceId: string
      studentId: string
      studentName: string
      className: string
      date: string
      attendanceStatus: string
      reason: string
      description: string | null
      attachments: string[]
      status: string
      submittedBy: string
      submitterName: string | null
      submittedAt: string
      reviewedBy: string | null
      reviewerName: string | null
      reviewedAt: string | null
      reviewNotes: string | null
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const excuse = await db.attendanceExcuse.findFirst({
      where: {
        id: excuseId,
        schoolId,
      },
      include: {
        attendance: {
          include: {
            student: {
              select: { id: true, givenName: true, surname: true },
            },
            class: {
              select: { name: true },
            },
          },
        },
      },
    })

    if (!excuse) {
      return { success: false, error: "Excuse not found" }
    }

    // Get submitter and reviewer names (use username or email as fallback)
    const userIds = [excuse.submittedBy, excuse.reviewedBy].filter(
      Boolean
    ) as string[]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        excuse: {
          id: excuse.id,
          attendanceId: excuse.attendanceId,
          studentId: excuse.attendance.studentId,
          studentName: `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`,
          className: excuse.attendance.class.name,
          date: excuse.attendance.date.toISOString(),
          attendanceStatus: excuse.attendance.status,
          reason: excuse.reason,
          description: excuse.description,
          attachments: excuse.attachments,
          status: excuse.status,
          submittedBy: excuse.submittedBy,
          submitterName: userMap.get(excuse.submittedBy) || null,
          submittedAt: excuse.submittedAt.toISOString(),
          reviewedBy: excuse.reviewedBy,
          reviewerName: excuse.reviewedBy
            ? userMap.get(excuse.reviewedBy) || null
            : null,
          reviewedAt: excuse.reviewedAt?.toISOString() || null,
          reviewNotes: excuse.reviewNotes,
        },
      },
    }
  } catch (error) {
    console.error("[getExcuseById] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get excuse details",
    }
  }
}

/**
 * Get absences that can have an excuse submitted (for parent portal)
 * Returns unexcused absences for the guardian's children
 */
export async function getUnexcusedAbsences(studentId?: string): Promise<
  ActionResponse<{
    absences: Array<{
      id: string
      studentId: string
      studentName: string
      classId: string
      className: string
      date: string
      status: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get guardian's children
    let studentIds: string[] = []

    if (studentId) {
      // Verify user has access to this student
      const student = await db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          studentGuardians: {
            include: {
              guardian: { select: { userId: true } },
            },
          },
        },
      })

      if (!student) {
        return { success: false, error: "Student not found" }
      }

      const isGuardian = student.studentGuardians.some(
        (sg) => sg.guardian.userId === session.user.id
      )
      const isStaff =
        session.user.role === "ADMIN" || session.user.role === "TEACHER"

      if (!isGuardian && !isStaff) {
        return { success: false, error: "Not authorized to view this student" }
      }

      studentIds = [studentId]
    } else {
      // Get all students for this guardian
      const guardianStudents = await db.studentGuardian.findMany({
        where: {
          schoolId,
          guardian: { userId: session.user.id },
        },
        select: { studentId: true },
      })
      studentIds = guardianStudents.map((gs) => gs.studentId)
    }

    if (studentIds.length === 0) {
      return { success: true, data: { absences: [] } }
    }

    // Get absences without excuses
    const absences = await db.attendance.findMany({
      where: {
        schoolId,
        studentId: { in: studentIds },
        status: "ABSENT",
        excuse: null, // No excuse submitted yet
      },
      include: {
        student: {
          select: { id: true, givenName: true, surname: true },
        },
        class: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    })

    return {
      success: true,
      data: {
        absences: absences.map((a) => ({
          id: a.id,
          studentId: a.studentId,
          studentName: `${a.student.givenName} ${a.student.surname}`,
          classId: a.classId,
          className: a.class.name,
          date: a.date.toISOString(),
          status: a.status,
        })),
      },
    }
  } catch (error) {
    console.error("[getUnexcusedAbsences] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get unexcused absences",
    }
  }
}

/**
 * Create a new intervention for a student with attendance issues
 */
export async function createIntervention(input: {
  studentId: string
  type: InterventionTypeVal
  title: string
  description: string
  priority?: number
  scheduledDate?: string
  assignedTo?: string
  tags?: string[]
}): Promise<ActionResponse<{ interventionId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can create interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can create interventions",
      }
    }

    // Verify student exists
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const intervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId: input.studentId,
        type: input.type,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 2,
        scheduledDate: input.scheduledDate
          ? new Date(input.scheduledDate)
          : null,
        assignedTo: input.assignedTo,
        initiatedBy: session.user.id,
        tags: input.tags ?? [],
        status: "SCHEDULED",
      },
    })

    return { success: true, data: { interventionId: intervention.id } }
  } catch (error) {
    console.error("[createIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create intervention",
    }
  }
}

/**
 * Update an existing intervention (status, outcome, etc.)
 */
export async function updateIntervention(input: {
  interventionId: string
  status?: InterventionStatusVal
  outcome?: string
  completedDate?: string
  followUpDate?: string
  parentNotified?: boolean
  contactMethod?: string
  contactResult?: string
  assignedTo?: string
  priority?: number
}): Promise<ActionResponse<{ updated: boolean }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can update interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can update interventions",
      }
    }

    // Verify intervention exists and belongs to this school
    const existing = await db.attendanceIntervention.findFirst({
      where: { id: input.interventionId, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Intervention not found" }
    }

    await db.attendanceIntervention.update({
      where: { id: input.interventionId },
      data: {
        ...(input.status && { status: input.status }),
        ...(input.outcome && { outcome: input.outcome }),
        ...(input.completedDate && {
          completedDate: new Date(input.completedDate),
        }),
        ...(input.followUpDate && {
          followUpDate: new Date(input.followUpDate),
        }),
        ...(input.parentNotified !== undefined && {
          parentNotified: input.parentNotified,
        }),
        ...(input.contactMethod && { contactMethod: input.contactMethod }),
        ...(input.contactResult && { contactResult: input.contactResult }),
        ...(input.assignedTo && { assignedTo: input.assignedTo }),
        ...(input.priority && { priority: input.priority }),
      },
    })

    return { success: true, data: { updated: true } }
  } catch (error) {
    console.error("[updateIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update intervention",
    }
  }
}

/**
 * Escalate an intervention to a higher level
 */
export async function escalateIntervention(input: {
  interventionId: string
  newType: InterventionTypeVal
  title: string
  description: string
  assignedTo?: string
}): Promise<ActionResponse<{ newInterventionId: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can escalate interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can escalate interventions",
      }
    }

    // Get the existing intervention
    const existing = await db.attendanceIntervention.findFirst({
      where: { id: input.interventionId, schoolId },
    })

    if (!existing) {
      return { success: false, error: "Intervention not found" }
    }

    // Update old intervention to ESCALATED status
    await db.attendanceIntervention.update({
      where: { id: input.interventionId },
      data: {
        status: "ESCALATED",
        completedDate: new Date(),
      },
    })

    // Create new escalated intervention
    const newIntervention = await db.attendanceIntervention.create({
      data: {
        schoolId,
        studentId: existing.studentId,
        type: input.newType,
        title: input.title,
        description: input.description,
        priority: Math.min(existing.priority + 1, 4), // Increase priority, max 4
        assignedTo: input.assignedTo,
        initiatedBy: session.user.id,
        escalatedFrom: existing.id,
        status: "SCHEDULED",
        tags: existing.tags,
      },
    })

    return { success: true, data: { newInterventionId: newIntervention.id } }
  } catch (error) {
    console.error("[escalateIntervention] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to escalate intervention",
    }
  }
}

/**
 * Get interventions for a specific student
 */
export async function getStudentInterventions(studentId: string): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      type: string
      title: string
      description: string
      status: string
      priority: number
      scheduledDate: string | null
      completedDate: string | null
      followUpDate: string | null
      initiatedBy: string
      initiatorName: string | null
      assignedTo: string | null
      assigneeName: string | null
      parentNotified: boolean
      outcome: string | null
      createdAt: string
    }>
    summary: {
      total: number
      scheduled: number
      inProgress: number
      completed: number
      escalated: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    // Verify student exists
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: "desc" },
    })

    // Get user names for initiators and assignees
    const userIds = [
      ...new Set([
        ...interventions.map((i) => i.initiatedBy),
        ...interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string),
      ]),
    ]

    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, email: true },
    })

    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    // Calculate summary
    const summary = {
      total: interventions.length,
      scheduled: interventions.filter((i) => i.status === "SCHEDULED").length,
      inProgress: interventions.filter((i) => i.status === "IN_PROGRESS")
        .length,
      completed: interventions.filter((i) => i.status === "COMPLETED").length,
      escalated: interventions.filter((i) => i.status === "ESCALATED").length,
    }

    return {
      success: true,
      data: {
        interventions: interventions.map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          description: i.description,
          status: i.status,
          priority: i.priority,
          scheduledDate: i.scheduledDate?.toISOString() || null,
          completedDate: i.completedDate?.toISOString() || null,
          followUpDate: i.followUpDate?.toISOString() || null,
          initiatedBy: i.initiatedBy,
          initiatorName: userMap.get(i.initiatedBy) || null,
          assignedTo: i.assignedTo,
          assigneeName: i.assignedTo ? userMap.get(i.assignedTo) || null : null,
          parentNotified: i.parentNotified,
          outcome: i.outcome,
          createdAt: i.createdAt.toISOString(),
        })),
        summary,
      },
    }
  } catch (error) {
    console.error("[getStudentInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student interventions",
    }
  }
}

/**
 * Get all pending/active interventions for dashboard
 */
export async function getActiveInterventions(input?: {
  assignedTo?: string
  status?: InterventionStatusVal
  limit?: number
}): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      studentId: string
      studentName: string
      className: string | null
      type: string
      title: string
      status: string
      priority: number
      scheduledDate: string | null
      assigneeName: string | null
      riskLevel: AttendanceRiskLevel
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    const where: Prisma.AttendanceInterventionWhereInput = {
      schoolId,
      status: input?.status || { in: ["SCHEDULED", "IN_PROGRESS"] },
      ...(input?.assignedTo && { assignedTo: input.assignedTo }),
    }

    const interventions = await db.attendanceIntervention.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            studentClasses: {
              include: {
                class: { select: { name: true } },
              },
              take: 1,
            },
            attendances: {
              where: {
                date: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
                },
              },
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { scheduledDate: "asc" }],
      take: input?.limit ?? 50,
    })

    // Get assignee names
    const assigneeIds = [
      ...new Set(
        interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string)
      ),
    ]
    const users = await db.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        interventions: interventions.map((intervention) => {
          // Calculate risk level from attendance
          const totalDays = intervention.student.attendances.length
          const presentDays = intervention.student.attendances.filter(
            (a: { status: string }) =>
              a.status === "PRESENT" || a.status === "LATE"
          ).length
          const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100
          const riskLevel = calculateRiskLevel(rate)

          return {
            id: intervention.id,
            studentId: intervention.studentId,
            studentName: `${intervention.student.givenName} ${intervention.student.surname}`,
            className:
              intervention.student.studentClasses[0]?.class.name || null,
            type: intervention.type,
            title: intervention.title,
            status: intervention.status,
            priority: intervention.priority,
            scheduledDate: intervention.scheduledDate?.toISOString() || null,
            assigneeName: intervention.assignedTo
              ? userMap.get(intervention.assignedTo) || null
              : null,
            riskLevel,
          }
        }),
      },
    }
  } catch (error) {
    console.error("[getActiveInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get active interventions",
    }
  }
}

/**
 * Get all interventions with filtering and pagination
 */
export async function getAllInterventions(input?: {
  status?: InterventionStatusVal | InterventionStatusVal[]
  type?: InterventionTypeVal
  studentId?: string
  assignedTo?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}): Promise<
  ActionResponse<{
    interventions: Array<{
      id: string
      studentId: string
      studentName: string
      className: string | null
      type: string
      title: string
      description: string | null
      status: string
      priority: number
      scheduledDate: string | null
      completedDate: string | null
      assigneeName: string | null
      outcome: string | null
      createdAt: string
      riskLevel: AttendanceRiskLevel
    }>
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only staff can view interventions
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "TEACHER" &&
      session.user.role !== "STAFF" &&
      session.user.role !== "DEVELOPER"
    ) {
      return {
        success: false,
        error: "Only staff members can view interventions",
      }
    }

    const page = input?.page ?? 1
    const limit = input?.limit ?? 20
    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.AttendanceInterventionWhereInput = {
      schoolId,
      ...(input?.status && {
        status: Array.isArray(input.status)
          ? { in: input.status }
          : input.status,
      }),
      ...(input?.type && { type: input.type }),
      ...(input?.studentId && { studentId: input.studentId }),
      ...(input?.assignedTo && { assignedTo: input.assignedTo }),
      ...(input?.dateFrom && {
        createdAt: { gte: new Date(input.dateFrom) },
      }),
      ...(input?.dateTo && {
        createdAt: { lte: new Date(input.dateTo) },
      }),
      ...(input?.search && {
        OR: [
          { title: { contains: input.search, mode: "insensitive" } },
          { description: { contains: input.search, mode: "insensitive" } },
          {
            student: {
              OR: [
                { givenName: { contains: input.search, mode: "insensitive" } },
                { surname: { contains: input.search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    }

    // Get total count for pagination
    const total = await db.attendanceIntervention.count({ where })

    const interventions = await db.attendanceIntervention.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            givenName: true,
            surname: true,
            studentClasses: {
              include: {
                class: { select: { name: true } },
              },
              take: 1,
            },
            attendances: {
              where: {
                date: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                },
              },
              select: { status: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    })

    // Get assignee names
    const assigneeIds = [
      ...new Set(
        interventions
          .filter((i) => i.assignedTo)
          .map((i) => i.assignedTo as string)
      ),
    ]
    const users = await db.user.findMany({
      where: { id: { in: assigneeIds } },
      select: { id: true, username: true, email: true },
    })
    const userMap = new Map(
      users.map((u) => [u.id, u.username || u.email || "Unknown"])
    )

    return {
      success: true,
      data: {
        interventions: interventions.map((intervention) => {
          // Calculate risk level from attendance
          const totalDays = intervention.student.attendances.length
          const presentDays = intervention.student.attendances.filter(
            (a: { status: string }) =>
              a.status === "PRESENT" || a.status === "LATE"
          ).length
          const rate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100
          const riskLevel = calculateRiskLevel(rate)

          return {
            id: intervention.id,
            studentId: intervention.studentId,
            studentName: `${intervention.student.givenName} ${intervention.student.surname}`,
            className:
              intervention.student.studentClasses[0]?.class.name || null,
            type: intervention.type,
            title: intervention.title,
            description: intervention.description,
            status: intervention.status,
            priority: intervention.priority,
            scheduledDate: intervention.scheduledDate?.toISOString() || null,
            completedDate: intervention.completedDate?.toISOString() || null,
            assigneeName: intervention.assignedTo
              ? userMap.get(intervention.assignedTo) || null
              : null,
            outcome: intervention.outcome,
            createdAt: intervention.createdAt.toISOString(),
            riskLevel,
          }
        }),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    }
  } catch (error) {
    console.error("[getAllInterventions] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get interventions",
    }
  }
}

/**
 * Get intervention statistics for reporting
 */
export async function getInterventionStats(): Promise<
  ActionResponse<{
    byType: Array<{ type: string; count: number }>
    byStatus: Array<{ status: string; count: number }>
    byMonth: Array<{ month: string; created: number; completed: number }>
    successRate: number
    averageDaysToComplete: number
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only admins can view stats
    if (session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can view intervention statistics",
      }
    }

    // Get all interventions for this school
    const interventions = await db.attendanceIntervention.findMany({
      where: { schoolId },
      select: {
        type: true,
        status: true,
        createdAt: true,
        completedDate: true,
      },
    })

    // Group by type
    const byType = Object.entries(
      interventions.reduce(
        (acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    ).map(([type, count]) => ({ type, count }))

    // Group by status
    const byStatus = Object.entries(
      interventions.reduce(
        (acc, i) => {
          acc[i.status] = (acc[i.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      )
    ).map(([status, count]) => ({ status, count }))

    // Group by month (last 12 months)
    const now = new Date()
    const byMonth: Array<{
      month: string
      created: number
      completed: number
    }> = []

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      const monthKey = monthDate.toISOString().slice(0, 7) // YYYY-MM

      const created = interventions.filter((int) => {
        const d = new Date(int.createdAt)
        return d >= monthDate && d <= monthEnd
      }).length

      const completed = interventions.filter((int) => {
        if (!int.completedDate) return false
        const d = new Date(int.completedDate)
        return d >= monthDate && d <= monthEnd
      }).length

      byMonth.push({ month: monthKey, created, completed })
    }

    // Calculate success rate (completed vs total excluding scheduled)
    const nonScheduled = interventions.filter((i) => i.status !== "SCHEDULED")
    const completed = interventions.filter((i) => i.status === "COMPLETED")
    const successRate =
      nonScheduled.length > 0
        ? (completed.length / nonScheduled.length) * 100
        : 0

    // Calculate average days to complete
    const completedWithDates = interventions.filter((i) => i.completedDate)
    let totalDays = 0
    completedWithDates.forEach((i) => {
      if (i.completedDate) {
        const days = Math.floor(
          (new Date(i.completedDate).getTime() -
            new Date(i.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
        totalDays += days
      }
    })
    const averageDaysToComplete =
      completedWithDates.length > 0 ? totalDays / completedWithDates.length : 0

    return {
      success: true,
      data: {
        byType,
        byStatus,
        byMonth,
        successRate: Math.round(successRate * 10) / 10,
        averageDaysToComplete: Math.round(averageDaysToComplete * 10) / 10,
      },
    }
  } catch (error) {
    console.error("[getInterventionStats] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get intervention statistics",
    }
  }
}

/**
 * Get staff members who can be assigned interventions
 */
export async function getInterventionAssignees(): Promise<
  ActionResponse<{
    assignees: Array<{
      id: string
      name: string
      role: string
      activeInterventions: number
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get all staff users for this school
    const staffUsers = await db.user.findMany({
      where: {
        schoolId,
        role: { in: ["ADMIN", "TEACHER", "STAFF"] },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    })

    // Get count of active interventions per assignee
    const activeCounts = await db.attendanceIntervention.groupBy({
      by: ["assignedTo"],
      where: {
        schoolId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        assignedTo: { not: null },
      },
      _count: true,
    })

    const countMap = new Map(activeCounts.map((c) => [c.assignedTo, c._count]))

    return {
      success: true,
      data: {
        assignees: staffUsers.map((u) => ({
          id: u.id,
          name: u.username || u.email || "Unknown",
          role: u.role,
          activeInterventions: countMap.get(u.id) || 0,
        })),
      },
    }
  } catch (error) {
    console.error("[getInterventionAssignees] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get assignees",
    }
  }
}

// ============================================================================
// PERIOD-BY-PERIOD TRACKING ACTIONS
// ============================================================================

/**
 * Get periods for a class on a specific day (from timetable)
 */
export async function getPeriodsForClass(input: {
  classId: string
  date: string
}): Promise<
  ActionResponse<{
    periods: Array<{
      periodId: string
      periodName: string
      startTime: string
      endTime: string
      timetableId: string
      subjectName: string | null
      teacherName: string | null
      hasAttendance: boolean
    }>
    settings: {
      isPeriodBasedAttendance: boolean
      schoolName: string
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get day of week from date
    const dateObj = new Date(input.date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday

    // Get active term
    const activeTerm = await db.term.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
    })

    if (!activeTerm) {
      return {
        success: true,
        data: {
          periods: [],
          settings: {
            isPeriodBasedAttendance: false,
            schoolName: "",
          },
        },
      }
    }

    // Get timetable entries for this class on this day
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        classId: input.classId,
        termId: activeTerm.id,
        dayOfWeek,
      },
      include: {
        period: {
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
        class: {
          include: {
            subject: {
              select: { subjectName: true },
            },
          },
        },
        teacher: {
          select: {
            givenName: true,
            surname: true,
          },
        },
      },
      orderBy: {
        period: {
          startTime: "asc",
        },
      },
    })

    // Get school for settings
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { name: true },
    })

    // Check which periods already have attendance
    const existingAttendance = await db.attendance.findMany({
      where: {
        schoolId,
        classId: input.classId,
        date: dateObj,
        periodId: { not: null },
      },
      select: { periodId: true },
    })

    const attendedPeriods = new Set(existingAttendance.map((a) => a.periodId))

    return {
      success: true,
      data: {
        periods: timetableEntries.map((entry) => ({
          periodId: entry.periodId,
          periodName: entry.period.name,
          startTime: entry.period.startTime.toISOString(),
          endTime: entry.period.endTime.toISOString(),
          timetableId: entry.id,
          subjectName: entry.class.subject?.subjectName || null,
          teacherName: entry.teacher
            ? `${entry.teacher.givenName} ${entry.teacher.surname}`
            : null,
          hasAttendance: attendedPeriods.has(entry.periodId),
        })),
        settings: {
          isPeriodBasedAttendance: timetableEntries.length > 0,
          schoolName: school?.name || "",
        },
      },
    }
  } catch (error) {
    console.error("[getPeriodsForClass] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get periods",
    }
  }
}

/**
 * Get current period based on time and timetable
 */
export async function getCurrentPeriod(classId?: string): Promise<
  ActionResponse<{
    currentPeriod: {
      periodId: string
      periodName: string
      startTime: string
      endTime: string
      classId: string | null
      className: string | null
      subjectName: string | null
    } | null
    nextPeriod: {
      periodId: string
      periodName: string
      startTime: string
    } | null
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const now = new Date()
    const dayOfWeek = now.getDay()
    const currentTime = now.toTimeString().slice(0, 8) // HH:MM:SS

    // Get active term
    const activeTerm = await db.term.findFirst({
      where: {
        schoolId,
        isActive: true,
      },
    })

    if (!activeTerm) {
      return {
        success: true,
        data: {
          currentPeriod: null,
          nextPeriod: null,
        },
      }
    }

    // Get all periods for today
    const periods = await db.period.findMany({
      where: {
        schoolId,
        yearId: activeTerm.yearId,
      },
      orderBy: { startTime: "asc" },
    })

    // Find current period
    let currentPeriod = null
    let nextPeriod = null

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i]
      const startTime = period.startTime.toTimeString().slice(0, 8)
      const endTime = period.endTime.toTimeString().slice(0, 8)

      if (currentTime >= startTime && currentTime <= endTime) {
        // Found current period - get timetable entry if classId provided
        let classInfo = null
        if (classId) {
          const timetableEntry = await db.timetable.findFirst({
            where: {
              schoolId,
              classId,
              termId: activeTerm.id,
              dayOfWeek,
              periodId: period.id,
            },
            include: {
              class: {
                select: {
                  name: true,
                  subject: { select: { subjectName: true } },
                },
              },
            },
          })

          if (timetableEntry) {
            classInfo = {
              classId: timetableEntry.classId,
              className: timetableEntry.class.name,
              subjectName: timetableEntry.class.subject?.subjectName || null,
            }
          }
        }

        currentPeriod = {
          periodId: period.id,
          periodName: period.name,
          startTime: period.startTime.toISOString(),
          endTime: period.endTime.toISOString(),
          classId: classInfo?.classId || null,
          className: classInfo?.className || null,
          subjectName: classInfo?.subjectName || null,
        }

        // Get next period
        if (i + 1 < periods.length) {
          const next = periods[i + 1]
          nextPeriod = {
            periodId: next.id,
            periodName: next.name,
            startTime: next.startTime.toISOString(),
          }
        }

        break
      } else if (currentTime < startTime) {
        // This is the next period
        nextPeriod = {
          periodId: period.id,
          periodName: period.name,
          startTime: period.startTime.toISOString(),
        }
        break
      }
    }

    return {
      success: true,
      data: {
        currentPeriod,
        nextPeriod,
      },
    }
  } catch (error) {
    console.error("[getCurrentPeriod] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get current period",
    }
  }
}

/**
 * Mark attendance with period context
 */
export async function markPeriodAttendance(input: {
  classId: string
  date: string
  periodId: string
  timetableId?: string
  records: Array<{
    studentId: string
    status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
    notes?: string
    checkInTime?: string
  }>
}): Promise<
  ActionResponse<{
    marked: number
    updated: number
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Only teachers and admins can mark attendance
    if (session.user.role !== "ADMIN" && session.user.role !== "TEACHER") {
      return {
        success: false,
        error: "Only teachers and administrators can mark attendance",
      }
    }

    // Verify class exists
    const classRecord = await db.class.findFirst({
      where: { id: input.classId, schoolId },
    })

    if (!classRecord) {
      return { success: false, error: "Class not found" }
    }

    // Get period name for caching
    const period = await db.period.findFirst({
      where: { id: input.periodId, schoolId },
    })

    const dateObj = new Date(input.date)
    let marked = 0
    let updated = 0

    for (const record of input.records) {
      // Check for existing attendance
      const existing = await db.attendance.findFirst({
        where: {
          schoolId,
          studentId: record.studentId,
          classId: input.classId,
          date: dateObj,
          periodId: input.periodId,
        },
      })

      if (existing) {
        // Update existing
        await db.attendance.update({
          where: { id: existing.id },
          data: {
            status: record.status,
            notes: record.notes,
            checkInTime: record.checkInTime
              ? new Date(record.checkInTime)
              : null,
            markedBy: session.user.id,
            markedAt: new Date(),
          },
        })
        updated++
      } else {
        // Create new
        await db.attendance.create({
          data: {
            schoolId,
            studentId: record.studentId,
            classId: input.classId,
            date: dateObj,
            status: record.status,
            notes: record.notes,
            periodId: input.periodId,
            periodName: period?.name,
            timetableId: input.timetableId,
            markedBy: session.user.id,
            checkInTime: record.checkInTime
              ? new Date(record.checkInTime)
              : null,
            method: "MANUAL",
          },
        })
        marked++
      }
    }

    revalidatePath("/attendance")

    return {
      success: true,
      data: { marked, updated },
    }
  } catch (error) {
    console.error("[markPeriodAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark period attendance",
    }
  }
}

/**
 * Get period-level attendance analytics
 */
export async function getPeriodAttendanceAnalytics(input?: {
  classId?: string
  dateFrom?: string
  dateTo?: string
}): Promise<
  ActionResponse<{
    byPeriod: Array<{
      periodId: string
      periodName: string
      totalRecords: number
      presentCount: number
      absentCount: number
      lateCount: number
      attendanceRate: number
    }>
    worstPeriods: Array<{
      periodName: string
      attendanceRate: number
      absentCount: number
    }>
    insights: Array<{
      type: "warning" | "info"
      message: string
      periodName?: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Default date range: last 30 days
    const dateFrom = input?.dateFrom
      ? new Date(input.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const dateTo = input?.dateTo ? new Date(input.dateTo) : new Date()

    const where: Prisma.AttendanceWhereInput = {
      schoolId,
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      periodId: { not: null },
      ...(input?.classId && { classId: input.classId }),
    }

    // Get all period-based attendance
    const attendances = await db.attendance.findMany({
      where,
      select: {
        periodId: true,
        periodName: true,
        status: true,
      },
    })

    // Group by period
    const periodStats = new Map<
      string,
      {
        periodName: string
        totalRecords: number
        presentCount: number
        absentCount: number
        lateCount: number
      }
    >()

    for (const a of attendances) {
      if (!a.periodId) continue

      if (!periodStats.has(a.periodId)) {
        periodStats.set(a.periodId, {
          periodName: a.periodName || "Unknown",
          totalRecords: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
        })
      }

      const stats = periodStats.get(a.periodId)!
      stats.totalRecords++

      if (a.status === "PRESENT") {
        stats.presentCount++
      } else if (a.status === "ABSENT") {
        stats.absentCount++
      } else if (a.status === "LATE") {
        stats.lateCount++
      }
    }

    // Convert to array with attendance rates
    const byPeriod = Array.from(periodStats.entries()).map(
      ([periodId, stats]) => ({
        periodId,
        periodName: stats.periodName,
        totalRecords: stats.totalRecords,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
        attendanceRate:
          stats.totalRecords > 0
            ? Math.round(
                ((stats.presentCount + stats.lateCount) / stats.totalRecords) *
                  1000
              ) / 10
            : 100,
      })
    )

    // Sort by attendance rate (worst first)
    const worstPeriods = [...byPeriod]
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 3)
      .map((p) => ({
        periodName: p.periodName,
        attendanceRate: p.attendanceRate,
        absentCount: p.absentCount,
      }))

    // Generate insights
    const insights: Array<{
      type: "warning" | "info"
      message: string
      periodName?: string
    }> = []

    // Check for periods with high absence rates
    for (const period of byPeriod) {
      if (period.attendanceRate < 80 && period.totalRecords >= 10) {
        insights.push({
          type: "warning",
          message: `${period.periodName} has a ${period.attendanceRate}% attendance rate - consider investigating`,
          periodName: period.periodName,
        })
      }
    }

    // Check for late-afternoon periods with higher absences
    const firstPeriods = byPeriod.slice(0, Math.ceil(byPeriod.length / 2))
    const lastPeriods = byPeriod.slice(Math.ceil(byPeriod.length / 2))

    const firstHalfRate =
      firstPeriods.length > 0
        ? firstPeriods.reduce((sum, p) => sum + p.attendanceRate, 0) /
          firstPeriods.length
        : 100

    const lastHalfRate =
      lastPeriods.length > 0
        ? lastPeriods.reduce((sum, p) => sum + p.attendanceRate, 0) /
          lastPeriods.length
        : 100

    if (firstHalfRate - lastHalfRate > 10) {
      insights.push({
        type: "info",
        message:
          "Attendance drops significantly in later periods - students may be leaving early",
      })
    }

    return {
      success: true,
      data: {
        byPeriod,
        worstPeriods,
        insights,
      },
    }
  } catch (error) {
    console.error("[getPeriodAttendanceAnalytics] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get period analytics",
    }
  }
}

/**
 * Get student's period-by-period attendance for a day
 */
export async function getStudentDayAttendance(input: {
  studentId: string
  date: string
}): Promise<
  ActionResponse<{
    student: {
      id: string
      name: string
    }
    periods: Array<{
      periodId: string | null
      periodName: string
      className: string
      subjectName: string | null
      status: string
      checkInTime: string | null
      notes: string | null
      markedAt: string
      markedBy: string | null
    }>
    summary: {
      totalPeriods: number
      present: number
      absent: number
      late: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    // Get student
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: { id: true, givenName: true, surname: true },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Get all attendance records for the student on this day
    const dateObj = new Date(input.date)

    const attendances = await db.attendance.findMany({
      where: {
        schoolId,
        studentId: input.studentId,
        date: dateObj,
      },
      include: {
        class: {
          select: {
            name: true,
            subject: { select: { subjectName: true } },
          },
        },
      },
      orderBy: [{ periodName: "asc" }, { markedAt: "asc" }],
    })

    // Get marker names
    const markerIds = [
      ...new Set(
        attendances.filter((a) => a.markedBy).map((a) => a.markedBy as string)
      ),
    ]
    const markers = await db.user.findMany({
      where: { id: { in: markerIds } },
      select: { id: true, username: true, email: true },
    })
    const markerMap = new Map(
      markers.map((m) => [m.id, m.username || m.email || "Unknown"])
    )

    // Calculate summary
    const summary = {
      totalPeriods: attendances.length,
      present: attendances.filter((a) => a.status === "PRESENT").length,
      absent: attendances.filter((a) => a.status === "ABSENT").length,
      late: attendances.filter((a) => a.status === "LATE").length,
    }

    return {
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.givenName} ${student.surname}`,
        },
        periods: attendances.map((a) => ({
          periodId: a.periodId,
          periodName: a.periodName || "All Day",
          className: a.class.name,
          subjectName: a.class.subject?.subjectName || null,
          status: a.status,
          checkInTime: a.checkInTime?.toISOString() || null,
          notes: a.notes,
          markedAt: a.markedAt.toISOString(),
          markedBy: a.markedBy ? markerMap.get(a.markedBy) || null : null,
        })),
        summary,
      },
    }
  } catch (error) {
    console.error("[getStudentDayAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get student day attendance",
    }
  }
}

// ============================================================================
// PRACTICAL DASHBOARD ACTIONS
// ============================================================================

/**
 * Get comprehensive today's attendance dashboard
 * Returns everything needed for actionable overview
 */
export async function getTodaysDashboard(): Promise<
  ActionResponse<{
    today: {
      date: string
      dayName: string
    }
    stats: {
      totalStudents: number
      markedToday: number
      present: number
      absent: number
      late: number
      attendanceRate: number
    }
    unmarkedClasses: Array<{
      id: string
      name: string
      studentCount: number
      scheduledTime?: string
    }>
    followUpNeeded: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "chronic" | "unexcused_pending"
      details: string
      priority: "high" | "medium" | "low"
    }>
    recentActivity: Array<{
      id: string
      studentName: string
      className: string
      status: string
      time: string
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]

    // Get all classes with student counts
    const classes = await db.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        _count: { select: { studentClasses: true } },
      },
    })

    // Get today's attendance records
    const todayAttendance = await db.attendance.findMany({
      where: {
        schoolId,
        date: today,
      },
      select: {
        id: true,
        classId: true,
        studentId: true,
        status: true,
        markedAt: true,
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { markedAt: "desc" },
    })

    // Calculate stats
    const markedClassIds = new Set(todayAttendance.map((a) => a.classId))
    const unmarkedClasses = classes.filter(
      (c) => !markedClassIds.has(c.id) && c._count.studentClasses > 0
    )

    const totalStudents = classes.reduce(
      (sum, c) => sum + c._count.studentClasses,
      0
    )
    const uniqueStudentsMarked = new Set(
      todayAttendance.map((a) => a.studentId)
    ).size
    const present = todayAttendance.filter((a) => a.status === "PRESENT").length
    const absent = todayAttendance.filter((a) => a.status === "ABSENT").length
    const late = todayAttendance.filter((a) => a.status === "LATE").length

    // Get students with consecutive absences (3+ days)
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentAbsences = await db.attendance.findMany({
      where: {
        schoolId,
        status: "ABSENT",
        date: { gte: threeDaysAgo, lte: today },
      },
      select: {
        studentId: true,
        date: true,
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    })

    // Group absences by student
    const studentAbsences = new Map<
      string,
      { name: string; className: string; dates: Date[] }
    >()
    for (const absence of recentAbsences) {
      const key = absence.studentId
      if (!studentAbsences.has(key)) {
        studentAbsences.set(key, {
          name: `${absence.student.givenName} ${absence.student.surname}`,
          className: absence.class.name,
          dates: [],
        })
      }
      studentAbsences.get(key)!.dates.push(absence.date)
    }

    // Build follow-up list
    const followUpNeeded: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "chronic" | "unexcused_pending"
      details: string
      priority: "high" | "medium" | "low"
    }> = []

    for (const [studentId, data] of studentAbsences) {
      // Check for consecutive absences
      const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime())
      let consecutiveCount = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const diff =
          (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
          (1000 * 60 * 60 * 24)
        if (diff <= 1) {
          consecutiveCount++
        } else {
          break
        }
      }

      if (consecutiveCount >= 3) {
        followUpNeeded.push({
          studentId,
          studentName: data.name,
          className: data.className,
          issue: "consecutive_absence",
          details: `Absent ${consecutiveCount} consecutive days`,
          priority: consecutiveCount >= 5 ? "high" : "medium",
        })
      }
    }

    // Get recent activity (last 10)
    const recentActivity = todayAttendance.slice(0, 10).map((a) => ({
      id: a.id,
      studentName: `${a.student.givenName} ${a.student.surname}`,
      className: a.class.name,
      status: a.status,
      time: a.markedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }))

    return {
      success: true,
      data: {
        today: {
          date: today.toISOString().split("T")[0],
          dayName: dayNames[today.getDay()],
        },
        stats: {
          totalStudents,
          markedToday: uniqueStudentsMarked,
          present,
          absent,
          late,
          attendanceRate:
            totalStudents > 0
              ? Math.round((present / Math.max(uniqueStudentsMarked, 1)) * 100)
              : 0,
        },
        unmarkedClasses: unmarkedClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.studentClasses,
        })),
        followUpNeeded: followUpNeeded.slice(0, 5), // Top 5 priority
        recentActivity,
      },
    }
  } catch (error) {
    console.error("[getTodaysDashboard] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get today's dashboard",
    }
  }
}

/**
 * Get teacher's classes for today based on timetable
 */
export async function getTeacherClassesToday(): Promise<
  ActionResponse<{
    classes: Array<{
      id: string
      name: string
      studentCount: number
      period?: string
      time?: string
      isMarked: boolean
      markedCount: number
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get teacher's assigned classes (Teacher has direct relation to Class via teacherId)
    const teacher = await db.teacher.findFirst({
      where: { userId: session.user.id, schoolId },
      select: {
        id: true,
        classes: {
          select: {
            id: true,
            name: true,
            _count: { select: { studentClasses: true } },
          },
        },
      },
    })

    if (!teacher) {
      // If not a teacher, get all classes (admin view)
      const allClasses = await db.class.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          _count: { select: { studentClasses: true } },
        },
      })

      // Get today's attendance counts per class
      const attendanceCounts = await db.attendance.groupBy({
        by: ["classId"],
        where: { schoolId, date: today },
        _count: true,
      })

      const countsMap = new Map(
        attendanceCounts.map((a) => [a.classId, a._count])
      )

      return {
        success: true,
        data: {
          classes: allClasses.map((c) => ({
            id: c.id,
            name: c.name,
            studentCount: c._count.studentClasses,
            isMarked: (countsMap.get(c.id) || 0) > 0,
            markedCount: countsMap.get(c.id) || 0,
          })),
        },
      }
    }

    // Get classes directly from teacher
    const teacherClasses = teacher.classes

    // Get today's attendance counts per class
    const classIds = teacherClasses.map((c) => c.id)
    const attendanceCounts = await db.attendance.groupBy({
      by: ["classId"],
      where: { schoolId, date: today, classId: { in: classIds } },
      _count: true,
    })

    const countsMap = new Map(
      attendanceCounts.map((a) => [a.classId, a._count])
    )

    return {
      success: true,
      data: {
        classes: teacherClasses.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.studentClasses,
          isMarked: (countsMap.get(c.id) || 0) > 0,
          markedCount: countsMap.get(c.id) || 0,
        })),
      },
    }
  } catch (error) {
    console.error("[getTeacherClassesToday] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get teacher classes",
    }
  }
}

/**
 * Quick mark all students present in a class
 * Returns list of students so teacher can mark exceptions
 */
export async function quickMarkAllPresent(input: {
  classId: string
  date?: string
}): Promise<
  ActionResponse<{
    markedCount: number
    students: Array<{
      id: string
      name: string
      status: "PRESENT"
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Authentication required" }
    }

    const date = input.date ? new Date(input.date) : new Date()
    date.setHours(0, 0, 0, 0)

    // Get all students in the class via StudentClass join table
    const classData = await db.class.findFirst({
      where: { id: input.classId, schoolId },
      select: {
        id: true,
        studentClasses: {
          select: {
            student: {
              select: {
                id: true,
                givenName: true,
                surname: true,
              },
            },
          },
        },
      },
    })

    if (!classData) {
      return { success: false, error: "Class not found" }
    }

    // Extract students from StudentClass join table
    const students = classData.studentClasses.map((sc) => sc.student)

    // Mark all students present
    const now = new Date()
    const results = []

    for (const student of students) {
      // Check if already marked
      const existing = await db.attendance.findFirst({
        where: {
          schoolId,
          studentId: student.id,
          classId: input.classId,
          date,
          periodId: null,
        },
      })

      if (existing) {
        // Update to present
        await db.attendance.update({
          where: { id: existing.id },
          data: {
            status: "PRESENT",
            markedBy: session.user.id,
            markedAt: now,
          },
        })
      } else {
        // Create new
        await db.attendance.create({
          data: {
            schoolId,
            studentId: student.id,
            classId: input.classId,
            date,
            status: "PRESENT",
            method: "MANUAL",
            markedBy: session.user.id,
            markedAt: now,
            checkInTime: now,
          },
        })
      }

      results.push({
        id: student.id,
        name: `${student.givenName} ${student.surname}`,
        status: "PRESENT" as const,
      })
    }

    revalidatePath("/attendance")

    return {
      success: true,
      data: {
        markedCount: results.length,
        students: results,
      },
    }
  } catch (error) {
    console.error("[quickMarkAllPresent] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to mark attendance",
    }
  }
}

/**
 * Get students needing follow-up attention
 * - Consecutive absences (3+ days)
 * - Low attendance rate (<80%)
 * - Pending unexcused absences
 */
export async function getFollowUpStudents(input?: { limit?: number }): Promise<
  ActionResponse<{
    students: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
      severity: "critical" | "warning" | "info"
      details: string
      actionUrl?: string
    }>
    summary: {
      critical: number
      warning: number
      info: number
    }
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const limit = input?.limit || 20
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const results: Array<{
      studentId: string
      studentName: string
      className: string
      issue: "consecutive_absence" | "low_attendance" | "unexcused_pending"
      severity: "critical" | "warning" | "info"
      details: string
      actionUrl?: string
    }> = []

    // 1. Get students with recent absences for consecutive check
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentAbsences = await db.attendance.findMany({
      where: {
        schoolId,
        status: "ABSENT",
        date: { gte: sevenDaysAgo, lte: today },
      },
      select: {
        studentId: true,
        date: true,
        student: { select: { givenName: true, surname: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    })

    // Group and find consecutive absences
    const studentAbsenceMap = new Map<
      string,
      { name: string; className: string; dates: Date[] }
    >()
    for (const absence of recentAbsences) {
      if (!studentAbsenceMap.has(absence.studentId)) {
        studentAbsenceMap.set(absence.studentId, {
          name: `${absence.student.givenName} ${absence.student.surname}`,
          className: absence.class.name,
          dates: [],
        })
      }
      studentAbsenceMap.get(absence.studentId)!.dates.push(absence.date)
    }

    for (const [studentId, data] of studentAbsenceMap) {
      const sortedDates = data.dates.sort((a, b) => b.getTime() - a.getTime())
      let consecutive = 1

      for (let i = 1; i < sortedDates.length; i++) {
        const diffDays = Math.round(
          (sortedDates[i - 1].getTime() - sortedDates[i].getTime()) /
            (1000 * 60 * 60 * 24)
        )
        if (diffDays <= 1) {
          consecutive++
        } else {
          break
        }
      }

      if (consecutive >= 3) {
        results.push({
          studentId,
          studentName: data.name,
          className: data.className,
          issue: "consecutive_absence",
          severity: consecutive >= 5 ? "critical" : "warning",
          details: `Absent ${consecutive} consecutive days`,
          actionUrl: `/students/${studentId}`,
        })
      }
    }

    // 2. Get pending unexcused absences
    const pendingExcuses = await db.attendanceExcuse.findMany({
      where: {
        schoolId,
        status: "PENDING",
      },
      select: {
        id: true,
        attendance: {
          select: {
            studentId: true,
            date: true,
            student: { select: { givenName: true, surname: true } },
            class: { select: { name: true } },
          },
        },
      },
      take: 10,
    })

    for (const excuse of pendingExcuses) {
      results.push({
        studentId: excuse.attendance.studentId,
        studentName: `${excuse.attendance.student.givenName} ${excuse.attendance.student.surname}`,
        className: excuse.attendance.class.name,
        issue: "unexcused_pending",
        severity: "info",
        details: `Excuse pending review since ${excuse.attendance.date.toLocaleDateString()}`,
        actionUrl: `/attendance/excuses/${excuse.id}`,
      })
    }

    // Sort by severity and limit
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    results.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )

    const summary = {
      critical: results.filter((r) => r.severity === "critical").length,
      warning: results.filter((r) => r.severity === "warning").length,
      info: results.filter((r) => r.severity === "info").length,
    }

    return {
      success: true,
      data: {
        students: results.slice(0, limit),
        summary,
      },
    }
  } catch (error) {
    console.error("[getFollowUpStudents] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get follow-up students",
    }
  }
}

// ============================================================================
// SOFT DELETE OPERATIONS
// ============================================================================

/**
 * Soft delete attendance record
 *
 * Sets deletedAt timestamp instead of hard delete.
 * Historical records are preserved for audit and compliance.
 *
 * @param attendanceId - The attendance record ID to soft delete
 * @returns Success status and deleted record info
 */
export async function deleteAttendance(attendanceId: string): Promise<{
  success: boolean
  error?: string
  deletedAt?: Date
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Verify attendance exists and belongs to this school
    const attendance = await db.attendance.findFirst({
      where: {
        id: attendanceId,
        schoolId,
        deletedAt: null, // Can't delete already deleted
      },
    })

    if (!attendance) {
      return { success: false, error: "Attendance record not found" }
    }

    // Soft delete by setting deletedAt timestamp
    const now = new Date()
    await db.attendance.update({
      where: { id: attendanceId },
      data: { deletedAt: now },
    })

    revalidatePath("/attendance")

    return { success: true, deletedAt: now }
  } catch (error) {
    console.error("[deleteAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete attendance record",
    }
  }
}

/**
 * Bulk soft delete attendance records
 *
 * @param attendanceIds - Array of attendance record IDs to soft delete
 * @returns Count of successfully deleted records
 */
export async function bulkDeleteAttendance(attendanceIds: string[]): Promise<{
  success: boolean
  deleted: number
  error?: string
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, deleted: 0, error: "Missing school context" }
  }

  const session = await auth()
  if (!session?.user) {
    return { success: false, deleted: 0, error: "Unauthorized" }
  }

  try {
    const now = new Date()
    const result = await db.attendance.updateMany({
      where: {
        id: { in: attendanceIds },
        schoolId,
        deletedAt: null,
      },
      data: { deletedAt: now },
    })

    revalidatePath("/attendance")

    return { success: true, deleted: result.count }
  } catch (error) {
    console.error("[bulkDeleteAttendance] Error:", error)
    return {
      success: false,
      deleted: 0,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete attendance records",
    }
  }
}

/**
 * Restore soft-deleted attendance record
 *
 * @param attendanceId - The attendance record ID to restore
 * @returns Success status
 */
export async function restoreAttendance(attendanceId: string): Promise<{
  success: boolean
  error?: string
}> {
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Verify attendance exists and is soft-deleted
    const attendance = await db.attendance.findFirst({
      where: {
        id: attendanceId,
        schoolId,
        deletedAt: { not: null },
      },
    })

    if (!attendance) {
      return { success: false, error: "Deleted attendance record not found" }
    }

    // Restore by clearing deletedAt
    await db.attendance.update({
      where: { id: attendanceId },
      data: { deletedAt: null },
    })

    revalidatePath("/attendance")

    return { success: true }
  } catch (error) {
    console.error("[restoreAttendance] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to restore attendance record",
    }
  }
}
