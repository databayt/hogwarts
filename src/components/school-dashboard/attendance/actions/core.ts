"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AttendanceMethod, AttendanceStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { isChannelAvailable, sendAttendanceSMS } from "@/lib/notifications/sms"
import { getTenantContext } from "@/lib/tenant-context"
import { markAttendanceSchema } from "@/components/school-dashboard/attendance/validation"

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
    const attendanceDate = new Date(parsed.date)

    // Pre-fetch approved absence intentions for this date to auto-excuse
    const approvedIntentions = await db.absenceIntention.findMany({
      where: {
        schoolId,
        status: "APPROVED",
        dateFrom: { lte: attendanceDate },
        dateTo: { gte: attendanceDate },
        studentId: { in: parsed.records.map((r) => r.studentId) },
      },
      select: { studentId: true },
    })
    const excusedStudentIds = new Set(
      approvedIntentions.map((i) => i.studentId)
    )

    for (const rec of parsed.records) {
      // Auto-excuse: if student has approved intention and is marked absent
      let finalStatus = statusMap[rec.status]
      if (rec.status === "absent" && excusedStudentIds.has(rec.studentId)) {
        finalStatus = "EXCUSED"
      }

      // Find existing daily attendance (where periodId is null)
      const existing = await db.attendance.findFirst({
        where: {
          schoolId,
          studentId: rec.studentId,
          classId: parsed.classId,
          date: attendanceDate,
          periodId: null,
        },
      })

      let result
      if (existing) {
        result = await db.attendance.update({
          where: { id: existing.id },
          data: {
            status: finalStatus,
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
            date: attendanceDate,
            status: finalStatus,
            method: "MANUAL",
            markedBy: session?.user?.id,
            markedAt: new Date(),
            checkInTime: new Date(),
          },
        })
      }
      results.push(result)

      // Track absent students for notification (not excused ones)
      if (rec.status === "absent" && !excusedStudentIds.has(rec.studentId)) {
        absentStudents.push(rec.studentId)
      }
    }

    // Send absence notifications to guardians (non-blocking)
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
