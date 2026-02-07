"use server"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get overall attendance statistics
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
