/**
 * Timetable Seed
 * Creates timetable entries for classes
 *
 * Phase 12: Operations (Timetable)
 *
 * Note: Timetable unique constraints include weekOffset:
 * - @@unique([schoolId, termId, dayOfWeek, periodId, classId, weekOffset])
 * - @@unique([schoolId, termId, dayOfWeek, periodId, teacherId, weekOffset])
 * - @@unique([schoolId, termId, dayOfWeek, periodId, classroomId, weekOffset])
 */

import type { PrismaClient } from "@prisma/client"

import type {
  ClassRef,
  ClassroomRef,
  PeriodRef,
  TeacherRef,
  TermRef,
} from "./types"
import { logSuccess, processBatch } from "./utils"

// ============================================================================
// TIMETABLE CONFIGURATION
// ============================================================================

// Sudanese school week: Sunday (0) to Thursday (4)
const SCHOOL_DAYS = [0, 1, 2, 3, 4]

// ============================================================================
// TIMETABLE SEEDING
// ============================================================================

/**
 * Seed timetable entries
 * Creates a basic timetable where each class meets during different periods
 * Note: Unique constraint includes weekOffset
 */
export async function seedTimetable(
  prisma: PrismaClient,
  schoolId: string,
  classes: ClassRef[],
  teachers: TeacherRef[],
  classrooms: ClassroomRef[],
  periods: PeriodRef[],
  term: TermRef
): Promise<number> {
  let entryCount = 0

  // Filter teaching periods (not breaks)
  const teachingPeriods = periods.filter(
    (p) => !p.name.toLowerCase().includes("break")
  )

  if (teachingPeriods.length === 0 || classrooms.length === 0) {
    logSuccess("Timetable", 0, "No periods or classrooms available")
    return 0
  }

  // Create a simple round-robin assignment
  let periodIndex = 0
  let classroomIndex = 0
  let teacherIndex = 0

  const weekOffset = 0 // Current week

  await processBatch(classes, 20, async (classInfo) => {
    // Assign this class to 1-2 periods per day
    for (const dayOfWeek of SCHOOL_DAYS) {
      // Each class gets one period per day
      const period = teachingPeriods[periodIndex % teachingPeriods.length]
      const classroom = classrooms[classroomIndex % classrooms.length]
      const teacher = teachers[teacherIndex % teachers.length]

      try {
        // Unique constraint includes weekOffset
        await prisma.timetable.upsert({
          where: {
            schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
              schoolId,
              termId: term.id,
              dayOfWeek,
              periodId: period.id,
              classId: classInfo.id,
              weekOffset,
            },
          },
          update: {
            teacherId: teacher.id,
            classroomId: classroom.id,
          },
          create: {
            schoolId,
            termId: term.id,
            dayOfWeek,
            periodId: period.id,
            classId: classInfo.id,
            teacherId: teacher.id,
            classroomId: classroom.id,
            weekOffset,
            rotationWeek: 0,
            constraintViolations: [],
          },
        })
        entryCount++
      } catch {
        // Skip if timetable entry already exists
      }

      // Rotate indices for variety
      periodIndex++
    }

    classroomIndex++
    teacherIndex++
  })

  logSuccess("Timetable Entries", entryCount, "Sun-Thu schedule")

  return entryCount
}
