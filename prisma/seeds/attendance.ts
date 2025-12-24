/**
 * Attendance Seed
 * Creates 10 days of attendance records for all students
 *
 * Phase 12: Operations (Attendance)
 */

import type { AttendanceStatus, PrismaClient } from "@prisma/client"

import type { ClassRef, StudentRef, TeacherRef } from "./types"
import { logPhase, logSuccess, processBatch, randomNumber } from "./utils"

// ============================================================================
// ATTENDANCE CONFIGURATION
// ============================================================================

const ATTENDANCE_DAYS = 10 // As specified: 10 days only
const SCHOOL_DAYS = [0, 1, 2, 3, 4] // Sunday to Thursday (Sudanese schedule)

// Attendance distribution (realistic)
const ATTENDANCE_DISTRIBUTION = {
  PRESENT: 85, // 85% present
  LATE: 8, // 8% late
  ABSENT: 5, // 5% absent
  EXCUSED: 2, // 2% excused absence
}

// ============================================================================
// ATTENDANCE SEEDING
// ============================================================================

/**
 * Get random attendance status based on distribution
 * Returns typed AttendanceStatus enum value
 */
function getRandomAttendanceStatus(): AttendanceStatus {
  const rand = randomNumber(1, 100)
  if (rand <= ATTENDANCE_DISTRIBUTION.PRESENT) return "PRESENT"
  if (rand <= ATTENDANCE_DISTRIBUTION.PRESENT + ATTENDANCE_DISTRIBUTION.LATE)
    return "LATE"
  if (
    rand <=
    ATTENDANCE_DISTRIBUTION.PRESENT +
      ATTENDANCE_DISTRIBUTION.LATE +
      ATTENDANCE_DISTRIBUTION.ABSENT
  )
    return "ABSENT"
  return "EXCUSED"
}

/**
 * Generate school days starting from term start
 */
function getSchoolDays(startDate: Date, count: number): Date[] {
  const days: Date[] = []
  const current = new Date(startDate)

  while (days.length < count) {
    const dayOfWeek = current.getDay()
    if (SCHOOL_DAYS.includes(dayOfWeek)) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}

/**
 * Seed attendance records (10 days for 1000 students)
 */
export async function seedAttendance(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[],
  teachers: TeacherRef[]
): Promise<number> {
  logPhase(12, "OPERATIONS - ATTENDANCE", "الحضور")

  let recordCount = 0

  // Get school days starting from Sept 1, 2025
  const termStart = new Date("2025-09-01")
  const schoolDays = getSchoolDays(termStart, ATTENDANCE_DAYS)

  // Group students by year level for class assignment
  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue
    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

  // Get a class for each year level
  const classByLevel = new Map<string, ClassRef>()
  for (const classInfo of classes) {
    if (!classByLevel.has(classInfo.yearLevelId)) {
      classByLevel.set(classInfo.yearLevelId, classInfo)
    }
  }

  // First teacher for marking
  const teacher = teachers[0]

  // For each day
  for (const date of schoolDays) {
    // Process students in batches
    await processBatch(students, 100, async (student) => {
      if (!student.yearLevelId) return

      const classInfo = classByLevel.get(student.yearLevelId)
      if (!classInfo) return

      const status = getRandomAttendanceStatus()
      const checkInTime =
        status === "PRESENT"
          ? new Date(date.getTime() + 7 * 60 * 60 * 1000 + 45 * 60 * 1000) // 7:45 AM
          : status === "LATE"
            ? new Date(
                date.getTime() +
                  8 * 60 * 60 * 1000 +
                  randomNumber(5, 30) * 60 * 1000
              ) // 8:05-8:30 AM
            : null

      try {
        // Schema has @@unique([schoolId, studentId, classId, date, periodId])
        // Using null periodId for daily attendance tracking
        // Note: Can't use upsert with null in composite unique key, use findFirst + create
        const existing = await prisma.attendance.findFirst({
          where: {
            schoolId,
            studentId: student.id,
            classId: classInfo.id,
            date,
            periodId: null,
          },
        })

        if (existing) {
          await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              status,
              checkInTime,
              markedBy: teacher?.id,
            },
          })
        } else {
          await prisma.attendance.create({
            data: {
              schoolId,
              studentId: student.id,
              classId: classInfo.id,
              date,
              status,
              checkInTime,
              markedBy: teacher?.id,
              markedAt: new Date(date.getTime() + 8 * 60 * 60 * 1000), // 8 AM
              method: "MANUAL",
            },
          })
        }
        recordCount++
      } catch {
        // Skip if attendance record already exists
      }
    })
  }

  // Calculate expected count
  const expectedCount = ATTENDANCE_DAYS * students.length
  const percentage = Math.round((recordCount / expectedCount) * 100)

  logSuccess(
    "Attendance Records",
    recordCount,
    `${ATTENDANCE_DAYS} days, ${percentage}% coverage`
  )

  return recordCount
}
