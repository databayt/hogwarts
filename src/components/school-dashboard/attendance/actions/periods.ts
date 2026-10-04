"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import type { Prisma, UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"

import { isStaffRole } from "../authorization"
import type { ActionResponse } from "./core"
import { getTeacherSectionIds } from "./helpers"

/**
 * Get a section's periods on a specific day (from timetable)
 */
export async function getPeriodsForSection(input: {
  sectionId: string
  date: string
}): Promise<
  ActionResponse<{
    periods: Array<{
      periodId: string
      periodName: string
      startTime: string
      endTime: string
      timetableId: string
      name: string | null
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

    // Staff-only: the period/timetable structure is a marking surface.
    const role = session.user.role as UserRole | undefined
    if (!role || !isStaffRole(role)) {
      return { success: false, error: "Unauthorized" }
    }

    // Get day of week from date
    const dateObj = new Date(input.date)
    const dayOfWeek = dateObj.getDay() // 0 = Sunday

    // Use shared 3-priority term resolution
    const { term: activeTerm, source } = await resolveActiveTerm(schoolId)

    if (!activeTerm) {
      return {
        success: false,
        error: "No academic term found. Set up terms in Timetable > Settings.",
      }
    }

    // Get the section's timetable entries on this day
    const timetableEntries = await db.timetable.findMany({
      where: {
        schoolId,
        sectionId: input.sectionId,
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
        subject: {
          select: { name: true },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
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
        sectionId: input.sectionId,
        date: dateObj,
        periodId: { not: null },
        deletedAt: null,
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
          name: entry.subject?.name || null,
          teacherName: entry.teacher
            ? `${entry.teacher.firstName} ${entry.teacher.lastName}`
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
    console.error("[getPeriodsForSection] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get periods",
    }
  }
}

/**
 * Get current period based on time and timetable
 */
export async function getCurrentPeriod(sectionId?: string): Promise<
  ActionResponse<{
    currentPeriod: {
      periodId: string
      periodName: string
      startTime: string
      endTime: string
      sectionId: string | null
      /** The section's name. */
      className: string | null
      /** The period's subject. */
      name: string | null
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

    // Use shared 3-priority term resolution
    const { term: activeTerm } = await resolveActiveTerm(schoolId)

    if (!activeTerm) {
      return {
        success: false,
        error: "No academic term found. Set up terms in Timetable > Settings.",
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
        // Found current period - the given section's slot, else the
        // current teacher's
        let classInfo: {
          sectionId: string | null
          className: string
          name: string | null
        } | null = null
        if (sectionId) {
          const timetableEntry = await db.timetable.findFirst({
            where: {
              schoolId,
              sectionId,
              termId: activeTerm.id,
              dayOfWeek,
              periodId: period.id,
            },
            include: {
              section: { select: { name: true } },
              subject: { select: { name: true } },
            },
          })

          if (timetableEntry) {
            classInfo = {
              sectionId: timetableEntry.sectionId,
              className: timetableEntry.section?.name ?? "",
              name: timetableEntry.subject?.name || null,
            }
          }
        }

        if (!classInfo && session?.user?.id) {
          const teacher = await db.teacher.findFirst({
            where: { schoolId, userId: session.user.id },
            select: { id: true },
          })
          if (teacher) {
            const sectionSlot = await db.timetable.findFirst({
              where: {
                schoolId,
                teacherId: teacher.id,
                sectionId: { not: null },
                termId: activeTerm.id,
                dayOfWeek,
                periodId: period.id,
              },
              include: {
                section: { select: { id: true, name: true } },
                subject: { select: { name: true } },
              },
            })
            if (sectionSlot?.section) {
              classInfo = {
                sectionId: sectionSlot.sectionId,
                className: sectionSlot.section.name,
                name: sectionSlot.subject?.name || null,
              }
            }
          }
        }

        currentPeriod = {
          periodId: period.id,
          periodName: period.name,
          startTime: period.startTime.toISOString(),
          endTime: period.endTime.toISOString(),
          sectionId: classInfo?.sectionId || null,
          className: classInfo?.className || null,
          name: classInfo?.name || null,
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
  sectionId: string
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

    // The section must be this school's — and a teacher's own
    const section = await db.section.findFirst({
      where: { id: input.sectionId, schoolId },
      select: { id: true },
    })
    if (!section) {
      return { success: false, error: "Section not found" }
    }
    if (session.user.role === "TEACHER") {
      const own = await getTeacherSectionIds(schoolId, session.user.id)
      if (!own.includes(input.sectionId)) {
        return { success: false, error: "Not your section" }
      }
    }

    // Get period name for caching; a given timetable slot must be this
    // section's
    const [period, slot] = await Promise.all([
      db.period.findFirst({
        where: { id: input.periodId, schoolId },
      }),
      input.timetableId
        ? db.timetable.findFirst({
            where: {
              id: input.timetableId,
              schoolId,
              sectionId: input.sectionId,
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ])
    if (input.timetableId && !slot) {
      return { success: false, error: "Timetable slot not found" }
    }

    const dateObj = new Date(input.date)
    const studentIds = [...new Set(input.records.map((r) => r.studentId))]

    // MULTI-TENANT: every submitted student must be this school's and in the
    // section — otherwise a teacher could fabricate rows for other students.
    const validStudents = await db.student.findMany({
      where: { schoolId, sectionId: input.sectionId, id: { in: studentIds } },
      select: { id: true },
    })
    const validIds = new Set(validStudents.map((s) => s.id))
    if (studentIds.some((id) => !validIds.has(id))) {
      return { success: false, error: "Student not in this section" }
    }

    // PERF: prefetch existing rows in a single query (was a findFirst per
    // record = N+1). Then run all writes inside one transaction so a partial
    // failure can't leave the period half-marked.
    const existingRows = await db.attendance.findMany({
      where: {
        schoolId,
        sectionId: input.sectionId,
        date: dateObj,
        periodId: input.periodId,
        studentId: { in: studentIds },
      },
      select: { id: true, studentId: true },
    })
    const existingByStudent = new Map(
      existingRows.map((r) => [r.studentId, r.id])
    )

    let marked = 0
    let updated = 0

    await db.$transaction(async (tx) => {
      const toCreate: Prisma.AttendanceCreateManyInput[] = []

      for (const record of input.records) {
        const existingId = existingByStudent.get(record.studentId)

        if (existingId) {
          // Update existing — only overwrite notes/checkInTime when explicitly
          // supplied (a re-mark that omits them must not clear prior values).
          await tx.attendance.update({
            where: { id: existingId },
            data: {
              status: record.status,
              ...(record.notes !== undefined && { notes: record.notes }),
              ...(record.checkInTime && {
                checkInTime: new Date(record.checkInTime),
              }),
              markedBy: session.user.id,
              markedAt: new Date(),
              deletedAt: null, // revive a soft-deleted record on re-mark
            },
          })
          updated++
        } else {
          toCreate.push({
            schoolId,
            studentId: record.studentId,
            sectionId: input.sectionId,
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
          })
          marked++
        }
      }

      if (toCreate.length > 0) {
        await tx.attendance.createMany({ data: toCreate })
      }
    })

    refreshPage("/attendance")

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
  sectionId?: string
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
    // SECURITY: school-wide period analytics — staff only (was readable by
    // any authenticated STUDENT/GUARDIAN).
    if (!isStaffRole(session.user.role as any)) {
      return { success: false, error: "Unauthorized" }
    }

    // Default date range: last 30 days
    const dateFrom = input?.dateFrom
      ? new Date(input.dateFrom)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const dateTo = input?.dateTo ? new Date(input.dateTo) : new Date()

    const where: Prisma.AttendanceWhereInput = {
      schoolId,
      deletedAt: null,
      date: {
        gte: dateFrom,
        lte: dateTo,
      },
      periodId: { not: null },
      ...(input?.sectionId && { sectionId: input.sectionId }),
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
      name: string | null
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

    // Get student (+ access data: own user account + linked guardians)
    const student = await db.student.findFirst({
      where: { id: input.studentId, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        studentGuardians: {
          select: { guardian: { select: { userId: true } } },
        },
      },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    // Access control: staff (any school role), the student themselves, or a
    // linked guardian. Without this, any authenticated user could read another
    // student's day attendance within the same tenant (intra-tenant IDOR).
    const role = session.user.role
    const isStaff =
      role === "DEVELOPER" ||
      role === "ADMIN" ||
      role === "TEACHER" ||
      role === "STAFF"
    const isSelf = student.userId === session.user.id
    const isGuardian = student.studentGuardians.some(
      (sg) => sg.guardian.userId === session.user.id
    )
    if (!isStaff && !isSelf && !isGuardian) {
      return {
        success: false,
        error: "You are not authorized to view this student's attendance",
      }
    }

    // Get all attendance records for the student on this day
    const dateObj = new Date(input.date)

    const attendances = await db.attendance.findMany({
      where: {
        schoolId,
        studentId: input.studentId,
        date: dateObj,
        deletedAt: null,
      },
      include: {
        section: { select: { name: true } },
        class: {
          select: {
            name: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: [{ periodName: "asc" }, { markedAt: "asc" }],
    })

    // A period mark's subject is its timetable slot's
    const slotIds = [
      ...new Set(
        attendances.map((a) => a.timetableId).filter((id): id is string => !!id)
      ),
    ]
    const slots = slotIds.length
      ? await db.timetable.findMany({
          where: { schoolId, id: { in: slotIds } },
          select: { id: true, subject: { select: { name: true } } },
        })
      : []
    const subjectBySlot = new Map(slots.map((t) => [t.id, t.subject?.name]))

    // Get marker names
    const markerIds = [
      ...new Set(
        attendances.filter((a) => a.markedBy).map((a) => a.markedBy as string)
      ),
    ]
    const markers = await db.user.findMany({
      where: { id: { in: markerIds }, schoolId },
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
          name: `${student.firstName} ${student.lastName}`,
        },
        periods: attendances.map((a) => ({
          periodId: a.periodId,
          periodName: a.periodName || "All Day",
          // The section, or the class of a mark kept from before sections.
          className: a.section?.name ?? a.class?.name ?? "",
          name:
            (a.timetableId ? subjectBySlot.get(a.timetableId) : null) ??
            a.class?.subject?.name ??
            null,
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
