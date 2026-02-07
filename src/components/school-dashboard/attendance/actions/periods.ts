"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"

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
