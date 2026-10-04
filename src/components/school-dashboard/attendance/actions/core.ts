"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { AttendanceMethod, AttendanceStatus, Prisma } from "@prisma/client"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { isChannelAvailable, sendAttendanceSMS } from "@/lib/notifications/sms"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import {
  canMarkAttendance,
  isAdminRole,
  isStaffRole,
} from "@/components/school-dashboard/attendance/authorization"
import { markAttendanceSchema } from "@/components/school-dashboard/attendance/validation"
import { getNames } from "@/components/translation/person"
import { fullName } from "@/components/translation/util"

import { guardAttendance } from "./helpers"

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
  classId: string | null,
  date: Date,
  markedBy?: string,
  sectionId?: string | null
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

    // Get class, school info, and compliance config (extra channels = ADEK 2h SLA)
    // Section-based marking passes a sectionId (not a classId) — resolve the
    // display name from whichever is present so the alert isn't "Unknown class".
    const [classInfo, sectionInfo, schoolInfo, complianceConfig] =
      await Promise.all([
        classId
          ? db.class.findFirst({
              where: { id: classId, schoolId },
              select: { name: true },
            })
          : Promise.resolve(null),
        sectionId
          ? db.section.findFirst({
              where: { id: sectionId, schoolId },
              select: { name: true },
            })
          : Promise.resolve(null),
        db.school.findFirst({
          where: { id: schoolId },
          select: { name: true, preferredLanguage: true },
        }),
        db.schoolComplianceConfig.findFirst({
          where: { schoolId, enabled: true },
          select: { parentContactSlaMinutes: true },
        }),
      ])

    // When compliance is enabled, the email + WhatsApp crons must drain the
    // notification row so we have multi-channel attempt evidence for the ADEK
    // 2h SLA. For non-compliance schools we keep the in-app + (SMS) status quo.
    const extraChannels: ("email" | "whatsapp")[] = complianceConfig
      ? ["email", "whatsapp"]
      : []

    const studentName = `${student.firstName} ${student.lastName}`
    const className = classInfo?.name || sectionInfo?.name || "Unknown class"
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

      // Create in-app notification (+ email/whatsapp for compliance tenants)
      await dispatchNotification({
        schoolId,
        userId: guardian.userId,
        type: "attendance_alert",
        priority: "high",
        // Push rides along for guardians who turned it on in a browser or the
        // installed app (Web Push lane, 2026-09-12); the dispatcher drops it for
        // anyone who disabled the channel.
        channels: Array.from(new Set(["in_app", "push", ...extraChannels])),
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
          (schoolInfo?.preferredLanguage as "ar" | "en") || "ar"
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
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const session = await auth()
    if (!session?.user?.role || !canMarkAttendance(session.user.role as any)) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
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

    // Batch fetch all existing daily attendance records (1 query instead of N)
    const allStudentIds = parsed.records.map((r) => r.studentId)
    const existingRecords = await db.attendance.findMany({
      where: {
        schoolId,
        studentId: { in: allStudentIds },
        ...(parsed.sectionId
          ? { sectionId: parsed.sectionId }
          : { classId: parsed.classId }),
        date: attendanceDate,
        periodId: null,
      },
      select: { id: true, studentId: true },
    })
    const existingMap = new Map(existingRecords.map((r) => [r.studentId, r.id]))

    // Resolve final statuses (auto-excuse logic)
    const now = new Date()
    const toUpdate: { id: string; status: AttendanceStatus }[] = []
    const toCreate: Prisma.AttendanceCreateManyInput[] = []

    for (const rec of parsed.records) {
      let finalStatus = statusMap[rec.status]
      if (rec.status === "absent" && excusedStudentIds.has(rec.studentId)) {
        finalStatus = "EXCUSED"
      }

      const existingId = existingMap.get(rec.studentId)
      if (existingId) {
        toUpdate.push({ id: existingId, status: finalStatus })
      } else {
        toCreate.push({
          schoolId,
          studentId: rec.studentId,
          classId: parsed.classId || undefined,
          sectionId: parsed.sectionId || undefined,
          date: attendanceDate,
          status: finalStatus,
          method: "MANUAL",
          markedBy: session?.user?.id,
          markedAt: now,
          checkInTime: now,
        })
      }
      results.push(rec.studentId)

      if (rec.status === "absent" && !excusedStudentIds.has(rec.studentId)) {
        absentStudents.push(rec.studentId)
      }
    }

    // Batch update existing records (1 query per distinct status)
    const updatesByStatus = new Map<AttendanceStatus, string[]>()
    for (const u of toUpdate) {
      const ids = updatesByStatus.get(u.status) ?? []
      ids.push(u.id)
      updatesByStatus.set(u.status, ids)
    }
    await Promise.all(
      Array.from(updatesByStatus.entries()).map(([status, ids]) =>
        db.attendance.updateMany({
          where: { id: { in: ids }, schoolId },
          // `deletedAt: null` revives a soft-deleted record on re-mark — the
          // existing-record lookup above intentionally finds deleted rows (the
          // unique constraint still reserves their key), so without this a
          // re-mark would update a row that stays hidden from every stat read.
          data: {
            status,
            markedBy: session?.user?.id,
            markedAt: now,
            deletedAt: null,
          },
        })
      )
    )

    // Batch create new records (1 query)
    if (toCreate.length > 0) {
      await db.attendance.createMany({
        data: toCreate,
        skipDuplicates: true,
      })
    }

    // Send absence notifications to guardians (non-blocking)
    Promise.all(
      absentStudents.map((studentId) =>
        triggerAbsenceNotification(
          schoolId,
          studentId,
          parsed.classId || null,
          attendanceDate,
          session?.user?.id,
          parsed.sectionId || null
        )
      )
    ).catch((err) => console.error("[markAttendance] Notification error:", err))

    // No revalidatePath: every caller (the marking page, quick attendance,
    // the per-student context) already holds the marks it just sent in
    // client state. The path string matched no cache entry anyway — its only
    // effect was to make this response a full re-render of the page from the
    // root layout (dictionary included) and to purge every prefetched link,
    // on the save a teacher makes for every class, every day.
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
  /** The section the day is kept on. */
  sectionId: string
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
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const session = await auth()
    if (!session?.user?.role || !canMarkAttendance(session.user.role as any)) {
      return {
        success: false,
        error: "Unauthorized: insufficient role to mark attendance",
      }
    }

    // The student must be this school's and in the section
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId, sectionId: input.sectionId },
      select: { id: true },
    })
    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    // Find existing daily attendance (where periodId is null)
    const existing = await db.attendance.findFirst({
      where: {
        schoolId,
        studentId: input.studentId,
        sectionId: input.sectionId,
        date: new Date(input.date),
        periodId: null,
      },
    })

    if (existing) {
      await db.attendance.updateMany({
        where: { id: existing.id, schoolId },
        data: {
          status: input.status,
          method: input.method,
          markedBy: session?.user?.id,
          markedAt: new Date(),
          checkOutTime: input.checkOutTime
            ? new Date(input.checkOutTime)
            : undefined,
          notes: input.notes,
          // Revive a soft-deleted record when it is re-marked (see markAttendance).
          deletedAt: null,
        },
      })
    } else {
      await db.attendance.create({
        data: {
          schoolId,
          studentId: input.studentId,
          sectionId: input.sectionId,
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
        null,
        new Date(input.date),
        session?.user?.id,
        input.sectionId
      ).catch((err) =>
        console.error("[markSingleAttendance] Notification error:", err)
      )
    }

    // No revalidatePath — see markAttendance: the caller already shows the
    // mark it sent, and a re-render of the whole page confirmed nothing.
    return { success: true, data: { attendance: { id: existing?.id } } }
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
 * Get attendance list for a section (or legacy class) on a specific date
 */
export async function getAttendanceList(input: {
  classId?: string
  sectionId?: string
  date: string
  lang?: string
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
    // SECURITY: roster names + statuses — requires an authenticated marking
    // role, not just a resolvable subdomain (getTenantContext alone is
    // reachable unauthenticated).
    const g = await guardAttendance("mark")
    if (!g.ok) return g.error
    const { schoolId } = g

    const parsed = z
      .object({
        classId: z.string().optional(),
        sectionId: z.string().optional(),
        date: z.string().min(1),
        lang: z.string().optional(),
      })
      .refine((data) => data.classId || data.sectionId, {
        message: "Either classId or sectionId must be provided",
      })
      .parse(input)

    // Dual path: section-based (preferred) or legacy class-based
    let students: Array<{
      id: string
      firstName: string
      lastName: string
      userId: string | null
    }>

    if (parsed.sectionId) {
      // Section-based: query students directly from section
      students = await db.student.findMany({
        where: { schoolId, sectionId: parsed.sectionId },
        select: { id: true, firstName: true, lastName: true, userId: true },
        orderBy: { firstName: "asc" },
      })
    } else if (parsed.classId) {
      // Legacy: query through StudentClass join table
      const enrollments = await db.studentClass.findMany({
        where: { schoolId, classId: parsed.classId },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
            },
          },
        },
      })
      students = enrollments.map((e) => e.student)
    } else {
      return { success: true, data: { rows: [] } }
    }

    // Fetch attendance marks using sectionId or classId
    const [marks, school] = await Promise.all([
      db.attendance.findMany({
        where: {
          schoolId,
          ...(parsed.sectionId
            ? { sectionId: parsed.sectionId }
            : { classId: parsed.classId }),
          date: new Date(parsed.date),
          deletedAt: null, // Exclude soft-deleted records
        },
      }),
      parsed.lang
        ? db.school.findFirst({
            where: { id: schoolId },
            select: { preferredLanguage: true },
          })
        : null,
    ])

    const contentLang = (school?.preferredLanguage as "ar" | "en") || "ar"
    const displayLang = (parsed.lang as "ar" | "en") || contentLang
    const needsTranslation = contentLang !== displayLang

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

    // PERF: one batched, deduped name resolution for the whole roster (was a
    // getText call per student inside Promise.all — N translation lookups, which
    // the translation rules explicitly forbid in a .map()).
    const nameMap = needsTranslation
      ? await getNames(
          students,
          (s) => ({ firstName: s.firstName, lastName: s.lastName }),
          displayLang,
          schoolId
        )
      : null

    const rows = students.map((s) => {
      const rawName = fullName({
        firstName: s.firstName,
        lastName: s.lastName,
      })
      const name = nameMap?.get(rawName) ?? rawName

      return {
        studentId: s.id,
        name,
        status:
          (statusByStudent[s.id]?.status as "present" | "absent" | "late") ||
          "present",
        checkInTime: statusByStudent[s.id]?.checkInTime,
        method: statusByStudent[s.id]?.method,
      }
    })

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
 * Get sections for selection dropdown.
 * Teachers see only their homeroom sections or sections where they have timetable slots; admins see all.
 * Accepts optional gradeId for filtering.
 */
export async function getSectionsForSelection(gradeId?: string): Promise<
  ActionResponse<{
    sections: Array<{
      id: string
      name: string
      gradeName: string
      gradeId: string
      teacher: string | null
      studentCount: number
    }>
  }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { success: true, data: { sections: [] } }

    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: true, data: { sections: [] } }

    // Teacher scoping: if teacher, only show sections where they are homeroom teacher
    // or where they have timetable slots
    const role = session.user.role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionFilter: any = { schoolId }

    if (gradeId) sectionFilter.gradeId = gradeId

    if (role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { schoolId, userId: session.user.id },
        select: { id: true },
      })
      if (!teacher) return { success: true, data: { sections: [] } }

      // Find sections where teacher is homeroom or has timetable slots
      const timetableSlots = await db.timetable.findMany({
        where: {
          schoolId,
          teacherId: teacher.id,
          sectionId: { not: null },
        },
        select: { sectionId: true },
        distinct: ["sectionId"],
      })
      const sectionIds = timetableSlots
        .map((s) => s.sectionId)
        .filter((id): id is string => id !== null)

      // Homeroom, a timetable period, or a subject assignment (which can
      // exist before the term's timetable does).
      sectionFilter.OR = [
        { homeroomTeacherId: teacher.id },
        { id: { in: sectionIds } },
        { subjectTeachers: { some: { schoolId, teacherId: teacher.id } } },
      ]
    }

    const sections = await db.section.findMany({
      where: sectionFilter,
      select: {
        id: true,
        name: true,
        letter: true,
        gradeId: true,
        grade: { select: { name: true } },
        homeroomTeacher: { select: { firstName: true, lastName: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    })

    return {
      success: true,
      data: {
        sections: sections.map((s) => ({
          id: s.id,
          name: s.name,
          gradeName: s.grade.name,
          gradeId: s.gradeId,
          teacher: s.homeroomTeacher
            ? `${s.homeroomTeacher.firstName} ${s.homeroomTeacher.lastName}`
            : null,
          studentCount: s._count.students,
        })),
      },
    }
  } catch (error) {
    console.error("[getSectionsForSelection] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get sections for selection",
    }
  }
}

/**
 * Get classes for selection dropdown.
 * Teachers see only their assigned classes; admins see all.
 * Accepts optional gradeId/termId for filtering.
 *
 * Legacy: classes are being retired. The announcements class scope is the
 * last caller and goes with it; attendance itself picks sections
 * (`getSectionsForSelection`).
 */
export async function getClassesForSelection(input?: {
  gradeId?: string
  termId?: string
}): Promise<
  ActionResponse<{
    classes: Array<{
      id: string
      name: string
      teacher: string | null
      gradeId: string | null
      gradeName: string | null
    }>
  }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const session = await auth()
    if (!session?.user?.id || !session.user.role) {
      return { success: false, error: "Authentication required" }
    }

    if (!isStaffRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized" }
    }

    const where: Prisma.ClassWhereInput = { schoolId }

    // Teacher scoping: only the classes they teach or co-teach
    if (session.user.role === "TEACHER") {
      const teacher = await db.teacher.findFirst({
        where: { userId: session.user.id, schoolId },
        select: { id: true },
      })
      if (!teacher) return { success: true, data: { classes: [] } }
      where.OR = [
        { teacherId: teacher.id },
        { classTeachers: { some: { schoolId, teacherId: teacher.id } } },
      ]
    }

    // Optional grade filter
    if (input?.gradeId) {
      where.gradeId = input.gradeId
    }

    // Optional term filter
    if (input?.termId) {
      where.termId = input.termId
    }

    const classes = await db.class.findMany({
      where,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        gradeId: true,
        grade: { select: { name: true } },
        teacher: {
          select: { firstName: true, lastName: true },
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
            ? `${c.teacher.firstName} ${c.teacher.lastName}`
            : null,
          gradeId: c.gradeId,
          gradeName: c.grade?.name ?? null,
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
 * Check out student (mark departure time)
 */
export async function checkOutStudent(input: {
  studentId: string
  sectionId: string
  date: string
}): Promise<{ success: boolean; error?: string }> {
  // SECURITY: previously had NO auth() call — reachable unauthenticated via the
  // x-subdomain header. Now requires a marking role.
  const guard = await guardAttendance("mark")
  if (!guard.ok) return guard.error
  const { schoolId } = guard

  const attendance = await db.attendance.findFirst({
    where: {
      schoolId,
      studentId: input.studentId,
      sectionId: input.sectionId,
      date: new Date(input.date),
      periodId: null,
      deletedAt: null, // never check out a soft-deleted record
    },
  })

  if (!attendance) {
    return { success: false, error: "No check-in record found" }
  }

  if (attendance.checkOutTime) {
    return { success: false, error: "Already checked out" }
  }

  await db.attendance.updateMany({
    where: { id: attendance.id, schoolId },
    data: { checkOutTime: new Date() },
  })

  refreshPage("/attendance")
  return { success: true }
}

/**
 * Bulk check out all students of a section
 */
export async function bulkCheckOut(input: {
  sectionId: string
  date: string
}): Promise<{ success: boolean; count: number }> {
  // SECURITY: previously had NO auth() call — reachable unauthenticated via the
  // x-subdomain header. Now requires a marking role.
  const guard = await guardAttendance("mark")
  if (!guard.ok) return { success: false, count: 0 }
  const { schoolId } = guard

  const result = await db.attendance.updateMany({
    where: {
      schoolId,
      sectionId: input.sectionId,
      date: new Date(input.date),
      checkOutTime: null,
      deletedAt: null,
    },
    data: { checkOutTime: new Date() },
  })

  refreshPage("/attendance")
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
    return actionError(ACTION_ERRORS.MISSING_SCHOOL)
  }

  const session = await auth()
  if (!session?.user) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }
  if (!canMarkAttendance(session.user.role as any)) {
    return {
      success: false,
      error: "Unauthorized: insufficient role to delete attendance",
    }
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

    // Soft delete by setting deletedAt timestamp (scoped by schoolId)
    const now = new Date()
    await db.attendance.updateMany({
      where: { id: attendanceId, schoolId },
      data: { deletedAt: now },
    })

    refreshPage("/attendance")

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
    return { success: false, deleted: 0, error: ACTION_ERRORS.MISSING_SCHOOL }
  }

  const session = await auth()
  if (!session?.user) {
    return { success: false, deleted: 0, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  if (!canMarkAttendance(session.user.role as any)) {
    return {
      success: false,
      deleted: 0,
      error: "Unauthorized: insufficient role",
    }
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

    refreshPage("/attendance")

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
    return actionError(ACTION_ERRORS.MISSING_SCHOOL)
  }

  const session = await auth()
  if (!session?.user) {
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }
  if (!isAdminRole(session.user.role as any)) {
    return {
      success: false,
      error: "Unauthorized: only admins can restore attendance records",
    }
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

    // Restore by clearing deletedAt (scoped by schoolId)
    await db.attendance.updateMany({
      where: { id: attendanceId, schoolId },
      data: { deletedAt: null },
    })

    refreshPage("/attendance")

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
