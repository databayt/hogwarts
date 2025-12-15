"use server"

import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// Input validation schemas
const attendanceStatsSchema = z.object({
  studentId: z.string().optional(),
  classId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(["student", "class", "date", "status"]).optional(),
})

const attendancePercentageSchema = z.object({
  studentId: z.string().min(1),
  classId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

// Types
export interface AttendanceStats {
  totalDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  excusedDays: number
  percentage: number
  streak: number
  lastPresent?: Date
}

export interface StudentAttendanceReport {
  studentId: string
  studentName: string
  stats: AttendanceStats
}

export interface ClassAttendanceReport {
  classId: string
  className: string
  date: Date
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}

/**
 * Calculate attendance percentage for a student
 */
export async function calculateAttendancePercentage(
  input: z.infer<typeof attendancePercentageSchema>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const validated = attendancePercentageSchema.parse(input)

  // Build query filters
  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    studentId: validated.studentId,
  }

  if (validated.classId) {
    where.classId = validated.classId
  }

  if (validated.from || validated.to) {
    where.date = {}
    if (validated.from) where.date.gte = new Date(validated.from)
    if (validated.to) where.date.lte = new Date(validated.to)
  }

  // Get all attendance records
  const attendanceRecords = await db.attendance.findMany({
    where,
    orderBy: { date: "desc" },
  })

  if (attendanceRecords.length === 0) {
    return {
      studentId: validated.studentId,
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      percentage: 0,
      streak: 0,
    }
  }

  // Calculate stats
  const stats = attendanceRecords.reduce(
    (acc, record) => {
      acc.totalDays++

      switch (record.status) {
        case "PRESENT":
          acc.presentDays++
          if (!acc.lastPresent || record.date > acc.lastPresent) {
            acc.lastPresent = record.date
          }
          break
        case "ABSENT":
          acc.absentDays++
          break
        case "LATE":
          acc.lateDays++
          acc.presentDays++ // Late counts as present for percentage
          break
        case "EXCUSED":
        case "SICK":
        case "HOLIDAY":
          acc.excusedDays++
          break
      }

      return acc
    },
    {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      lastPresent: null as Date | null,
    }
  )

  // Calculate percentage (present + late) / (total - excused)
  const effectiveDays = stats.totalDays - stats.excusedDays
  const percentage =
    effectiveDays > 0
      ? Math.round((stats.presentDays / effectiveDays) * 100)
      : 0

  // Calculate current streak
  const streak = calculateStreak(attendanceRecords)

  return {
    studentId: validated.studentId,
    ...stats,
    percentage,
    streak,
    lastPresent: stats.lastPresent || undefined,
  }
}

/**
 * Get attendance statistics for multiple students
 */
export async function getBulkAttendanceStats(input: {
  studentIds: string[]
  from?: string
  to?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const results = await Promise.all(
    input.studentIds.map((studentId) =>
      calculateAttendancePercentage({
        studentId,
        from: input.from,
        to: input.to,
      })
    )
  )

  // Get student names
  const students = await db.student.findMany({
    where: {
      schoolId,
      id: { in: input.studentIds },
    },
    select: {
      id: true,
      givenName: true,
      surname: true,
    },
  })

  const studentMap = new Map(
    students.map((s) => [
      s.id,
      `${s.givenName || ""} ${s.surname || ""}`.trim(),
    ])
  )

  return results.map((stats) => ({
    ...stats,
    studentName: studentMap.get(stats.studentId) || "Unknown Student",
  }))
}

/**
 * Get class-level attendance statistics
 */
export async function getClassAttendanceStats(input: {
  classId: string
  date: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Get all enrolled students
  const enrollments = await db.studentClass.findMany({
    where: {
      schoolId,
      classId: input.classId,
    },
    select: { studentId: true },
  })

  const studentIds = enrollments.map((e) => e.studentId)

  // Get attendance for the date
  const attendanceRecords = await db.attendance.findMany({
    where: {
      schoolId,
      classId: input.classId,
      date: new Date(input.date),
      studentId: { in: studentIds },
    },
  })

  // Count by status
  const statusCounts = attendanceRecords.reduce(
    (acc, record) => {
      if (record.status === "PRESENT" || record.status === "LATE") {
        acc.present++
      } else if (record.status === "ABSENT") {
        acc.absent++
      }

      if (record.status === "LATE") {
        acc.late++
      }

      return acc
    },
    { present: 0, absent: 0, late: 0 }
  )

  const totalStudents = studentIds.length
  const attendanceRate =
    totalStudents > 0
      ? Math.round((statusCounts.present / totalStudents) * 100)
      : 0

  // Get class name
  const classData = await db.class.findUnique({
    where: { id: input.classId },
    select: { name: true },
  })

  return {
    classId: input.classId,
    className: classData?.name || "Unknown Class",
    date: new Date(input.date),
    totalStudents,
    presentCount: statusCounts.present,
    absentCount: statusCounts.absent,
    lateCount: statusCounts.late,
    attendanceRate,
  }
}

/**
 * Get attendance trends over time
 */
export async function getAttendanceTrends(input: {
  classId?: string
  studentId?: string
  days?: number
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const days = input.days || 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const where: Prisma.AttendanceWhereInput = {
    schoolId,
    date: { gte: startDate },
  }

  if (input.classId) where.classId = input.classId
  if (input.studentId) where.studentId = input.studentId

  const records = await db.attendance.groupBy({
    by: ["date", "status"],
    where,
    _count: {
      id: true,
    },
    orderBy: { date: "asc" },
  })

  // Group by date
  const trendsByDate = records.reduce(
    (acc, record) => {
      const dateKey = record.date.toISOString().split("T")[0]

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
        }
      }

      const count = record._count.id
      acc[dateKey].total += count

      if (record.status === "PRESENT") {
        acc[dateKey].present += count
      } else if (record.status === "ABSENT") {
        acc[dateKey].absent += count
      } else if (record.status === "LATE") {
        acc[dateKey].late += count
        acc[dateKey].present += count // Late counts as present
      }

      return acc
    },
    {} as Record<string, any>
  )

  return Object.values(trendsByDate).map((day: any) => ({
    ...day,
    attendanceRate:
      day.total > 0 ? Math.round((day.present / day.total) * 100) : 0,
  }))
}

/**
 * Identify at-risk students (attendance < threshold)
 */
export async function getAtRiskStudents(input: {
  classId?: string
  threshold?: number
  days?: number
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const threshold = input.threshold || 80 // Default 80% attendance
  const days = input.days || 30

  // Get all students
  let studentIds: string[]

  if (input.classId) {
    const enrollments = await db.studentClass.findMany({
      where: { schoolId, classId: input.classId },
      select: { studentId: true },
    })
    studentIds = enrollments.map((e) => e.studentId)
  } else {
    const students = await db.student.findMany({
      where: { schoolId },
      select: { id: true },
    })
    studentIds = students.map((s) => s.id)
  }

  // Calculate attendance for each student
  const from = new Date()
  from.setDate(from.getDate() - days)

  const stats = await getBulkAttendanceStats({
    studentIds,
    from: from.toISOString(),
  })

  // Filter at-risk students
  return stats
    .filter((s) => s.percentage < threshold)
    .sort((a, b) => a.percentage - b.percentage)
}

/**
 * Helper: Calculate attendance streak
 */
function calculateStreak(records: Array<{ date: Date; status: string }>) {
  if (records.length === 0) return 0

  // Sort by date descending (most recent first)
  const sorted = [...records].sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  )

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (const record of sorted) {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)

    // Skip future dates
    if (recordDate > today) continue

    // Check if this breaks the streak
    if (
      record.status === "ABSENT" ||
      record.status === "EXCUSED" ||
      record.status === "SICK"
    ) {
      break
    }

    // Count present or late days
    if (record.status === "PRESENT" || record.status === "LATE") {
      streak++
    }
  }

  return streak
}

/**
 * Get perfect attendance students
 */
export async function getPerfectAttendance(input: {
  classId?: string
  from?: string
  to?: string
}) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Get all students
  let studentIds: string[]

  if (input.classId) {
    const enrollments = await db.studentClass.findMany({
      where: { schoolId, classId: input.classId },
      select: { studentId: true },
    })
    studentIds = enrollments.map((e) => e.studentId)
  } else {
    const students = await db.student.findMany({
      where: { schoolId },
      select: { id: true },
    })
    studentIds = students.map((s) => s.id)
  }

  // Get attendance stats
  const stats = await getBulkAttendanceStats({
    studentIds,
    from: input.from,
    to: input.to,
  })

  // Filter for 100% attendance
  return stats.filter((s) => s.percentage === 100)
}
