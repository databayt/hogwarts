"use server"

import { unstable_cache } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type {
  ActivityBreakdown,
  ActivityType,
  ContributionDataPoint,
  ContributionGraphData,
  ContributionSummary,
  GetContributionDataParams,
  GetContributionDataResult,
  ProfileRole,
} from "./types"
import { ACTIVITY_LABELS } from "./types"

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map UserRole to ProfileRole
 */
function mapUserRoleToProfileRole(role: string): ProfileRole | null {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    case "STAFF":
    case "ADMIN":
    case "ACCOUNTANT":
      return "staff"
    default:
      return null
  }
}

/**
 * Get date range for a year
 */
function getYearDateRange(year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, 0, 1) // January 1st
  const endDate = new Date(year, 11, 31) // December 31st
  return { startDate, endDate }
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0]
}

/**
 * Initialize empty contribution map for the year
 */
function initializeContributionMap(
  startDate: Date,
  endDate: Date
): Map<string, ContributionDataPoint> {
  const map = new Map<string, ContributionDataPoint>()
  const current = new Date(startDate)

  while (current <= endDate) {
    const dateKey = formatDateKey(current)
    map.set(dateKey, {
      date: dateKey,
      count: 0,
      level: 0,
      activities: [],
    })
    current.setDate(current.getDate() + 1)
  }

  return map
}

/**
 * Add activity to contribution map
 */
function addActivity(
  map: Map<string, ContributionDataPoint>,
  date: Date,
  type: ActivityType,
  count: number = 1
): void {
  const dateKey = formatDateKey(date)
  const day = map.get(dateKey)
  if (!day) return

  day.count += count

  const existing = day.activities.find((a) => a.type === type)
  if (existing) {
    existing.count += count
  } else {
    day.activities.push({
      type,
      count,
      label: ACTIVITY_LABELS[type],
    })
  }
}

/**
 * Calculate intensity levels based on percentiles
 */
function calculateIntensityLevels(
  map: Map<string, ContributionDataPoint>
): void {
  const counts = Array.from(map.values())
    .map((c) => c.count)
    .filter((c) => c > 0)
    .sort((a, b) => a - b)

  if (counts.length === 0) return

  // Use percentile-based thresholds (like GitHub)
  const p25 = counts[Math.floor(counts.length * 0.25)] || 1
  const p50 = counts[Math.floor(counts.length * 0.5)] || 2
  const p75 = counts[Math.floor(counts.length * 0.75)] || 4

  for (const day of map.values()) {
    if (day.count === 0) {
      day.level = 0
    } else if (day.count <= p25) {
      day.level = 1
    } else if (day.count <= p50) {
      day.level = 2
    } else if (day.count <= p75) {
      day.level = 3
    } else {
      day.level = 4
    }
  }
}

/**
 * Calculate summary statistics
 */
function calculateSummary(
  contributions: ContributionDataPoint[]
): ContributionSummary {
  const activeDays = contributions.filter((c) => c.count > 0).length
  const totalDays = contributions.length

  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0

  // Sort by date descending for current streak
  const sorted = [...contributions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Current streak (consecutive days from today)
  for (const day of sorted) {
    if (day.count > 0) {
      currentStreak++
    } else {
      break
    }
  }

  // Longest streak
  for (const day of contributions) {
    if (day.count > 0) {
      tempStreak++
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak
      }
    } else {
      tempStreak = 0
    }
  }

  // Average and peak
  const totalActivities = contributions.reduce((sum, c) => sum + c.count, 0)
  const averagePerDay = activeDays > 0 ? totalActivities / totalDays : 0

  const peakDay = contributions.reduce(
    (max, c) => (c.count > (max?.count || 0) ? c : max),
    null as ContributionDataPoint | null
  )

  return {
    activeDays,
    longestStreak,
    currentStreak,
    averagePerDay: Math.round(averagePerDay * 100) / 100,
    peakDay: peakDay ? { date: peakDay.date, count: peakDay.count } : null,
  }
}

// ============================================================================
// Role-Specific Activity Fetchers
// ============================================================================

/**
 * Fetch student activities
 */
async function fetchStudentActivities(
  studentId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  // Fetch student record to get the student.id (different from userId)
  const student = await db.student.findFirst({
    where: { userId: studentId, schoolId },
    select: { id: true },
  })

  if (!student) return

  const [attendance, submissions, results, borrowRecords] = await Promise.all([
    // Attendance records
    db.attendance.findMany({
      where: {
        schoolId,
        studentId: student.id,
        date: { gte: startDate, lte: endDate },
        status: { in: ["PRESENT", "LATE"] },
      },
      select: { date: true },
    }),

    // Assignment submissions
    db.assignmentSubmission.findMany({
      where: {
        schoolId,
        studentId: student.id,
        submittedAt: { gte: startDate, lte: endDate },
        status: { in: ["SUBMITTED", "LATE_SUBMITTED", "GRADED"] },
      },
      select: { submittedAt: true },
    }),

    // Exam/assignment results
    db.result.findMany({
      where: {
        schoolId,
        studentId: student.id,
        gradedAt: { gte: startDate, lte: endDate },
      },
      select: { gradedAt: true },
    }),

    // Library borrow records (uses userId, not studentId)
    db.borrowRecord.findMany({
      where: {
        schoolId,
        userId: studentId,
        borrowDate: { gte: startDate, lte: endDate },
      },
      select: { borrowDate: true },
    }),
  ])

  // Add to map
  attendance.forEach((a) => addActivity(map, a.date, "attendance"))
  submissions.forEach((s) => {
    if (s.submittedAt) addActivity(map, s.submittedAt, "assignment_submitted")
  })
  results.forEach((r) => addActivity(map, r.gradedAt, "exam_completed"))
  borrowRecords.forEach((b) => addActivity(map, b.borrowDate, "library_visit"))
}

/**
 * Fetch teacher activities
 */
async function fetchTeacherActivities(
  teacherUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  // Fetch teacher record
  const teacher = await db.teacher.findFirst({
    where: { userId: teacherUserId, schoolId },
    select: { id: true },
  })

  if (!teacher) return

  const [attendanceMarked, gradesPublished, lessonsCreated] = await Promise.all(
    [
      // Attendance marked by teacher
      db.attendance.findMany({
        where: {
          schoolId,
          markedBy: teacher.id,
          markedAt: { gte: startDate, lte: endDate },
        },
        select: { markedAt: true },
      }),

      // Grades published by teacher
      db.result.findMany({
        where: {
          schoolId,
          gradedBy: teacher.id,
          gradedAt: { gte: startDate, lte: endDate },
        },
        select: { gradedAt: true },
      }),

      // Lessons created
      db.lesson.findMany({
        where: {
          schoolId,
          createdAt: { gte: startDate, lte: endDate },
          // Note: Lesson model doesn't have teacherId, using class relation would require join
        },
        select: { createdAt: true },
      }),
    ]
  )

  // Add to map
  attendanceMarked.forEach((a) =>
    addActivity(map, a.markedAt, "attendance_taken")
  )
  gradesPublished.forEach((g) =>
    addActivity(map, g.gradedAt, "grade_published")
  )
  lessonsCreated.forEach((l) => addActivity(map, l.createdAt, "lesson_created"))
}

/**
 * Fetch parent/guardian activities
 */
async function fetchParentActivities(
  guardianUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  const [payments, messages] = await Promise.all([
    // Payments made (Payment model doesn't have paidBy field, using studentId relation)
    db.payment
      .findMany({
        where: {
          schoolId,
          // Note: paidBy field doesn't exist in schema, querying all payments for school
          paymentDate: { gte: startDate, lte: endDate },
        },
        select: { paymentDate: true },
        take: 0, // Disabled until proper guardian-payment relation exists
      })
      .catch(() => []), // Handle if payment model doesn't exist

    // Messages sent (Message model doesn't have schoolId, using senderId only)
    db.message
      .findMany({
        where: {
          senderId: guardianUserId,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { createdAt: true },
      })
      .catch(() => []), // Handle if message model doesn't exist
  ])

  // Add to map
  payments.forEach((p) => addActivity(map, p.paymentDate, "payment_made"))
  messages.forEach((m) => addActivity(map, m.createdAt, "message_sent"))
}

/**
 * Fetch staff activities
 */
async function fetchStaffActivities(
  staffUserId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date,
  map: Map<string, ContributionDataPoint>
): Promise<void> {
  const [timesheetEntries, expenses] = await Promise.all([
    // Timesheet entries (uses teacherId, not userId)
    db.timesheetEntry
      .findMany({
        where: {
          schoolId,
          teacherId: staffUserId,
          entryDate: { gte: startDate, lte: endDate },
        },
        select: { entryDate: true },
      })
      .catch(() => []),

    // Expenses processed
    db.expense
      .findMany({
        where: {
          schoolId,
          approvedBy: staffUserId,
          approvedAt: { gte: startDate, lte: endDate },
        },
        select: { approvedAt: true },
      })
      .catch(() => []),
  ])

  // Add to map
  timesheetEntries.forEach((t) =>
    addActivity(map, t.entryDate, "task_completed")
  )
  expenses.forEach((e) => {
    if (e.approvedAt) addActivity(map, e.approvedAt, "expense_processed")
  })
}

// ============================================================================
// Cached Data Fetcher
// ============================================================================

const getCachedContributionData = unstable_cache(
  async (
    userId: string,
    schoolId: string,
    year: number,
    role: ProfileRole
  ): Promise<ContributionGraphData> => {
    const { startDate, endDate } = getYearDateRange(year)
    const map = initializeContributionMap(startDate, endDate)

    // Fetch role-specific activities
    switch (role) {
      case "student":
        await fetchStudentActivities(userId, schoolId, startDate, endDate, map)
        break
      case "teacher":
        await fetchTeacherActivities(userId, schoolId, startDate, endDate, map)
        break
      case "parent":
        await fetchParentActivities(userId, schoolId, startDate, endDate, map)
        break
      case "staff":
        await fetchStaffActivities(userId, schoolId, startDate, endDate, map)
        break
    }

    // Calculate intensity levels
    calculateIntensityLevels(map)

    // Convert to array
    const contributions = Array.from(map.values())
    const totalActivities = contributions.reduce((sum, c) => sum + c.count, 0)
    const summary = calculateSummary(contributions)

    return {
      contributions,
      totalActivities,
      year,
      role,
      summary,
    }
  },
  ["contribution-data"],
  {
    revalidate: 300, // 5 minutes
    tags: ["contribution-data"],
  }
)

// ============================================================================
// Main Server Action
// ============================================================================

/**
 * Get contribution data for a user
 */
export async function getContributionData(
  params: GetContributionDataParams = {}
): Promise<GetContributionDataResult> {
  try {
    // 1. Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    // 2. Tenant context check
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "School context not found" }
    }

    // 3. Parameter validation
    const userId = params.userId || session.user.id
    const year = params.year || new Date().getFullYear()

    if (year < 2020 || year > new Date().getFullYear() + 1) {
      return { success: false, error: "Invalid year parameter" }
    }

    // 4. Determine user role
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    const role = mapUserRoleToProfileRole(user.role)
    if (!role) {
      return { success: false, error: "Unsupported user role" }
    }

    // 5. Fetch cached data
    const data = await getCachedContributionData(userId, schoolId, year, role)

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching contribution data:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch contribution data",
    }
  }
}

/**
 * Determine profile role for a user
 */
export async function getUserProfileRole(
  userId?: string
): Promise<ProfileRole | null> {
  try {
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) return null

    const user = await db.user.findUnique({
      where: { id: targetUserId },
      select: { role: true },
    })

    if (!user) return null

    return mapUserRoleToProfileRole(user.role)
  } catch {
    return null
  }
}
