/**
 * Timetable Seed
 * Creates conflict-free timetable entries for classes
 *
 * Phase 12: Operations (Timetable)
 *
 * Features:
 * - Match teachers to classes by subject (via class→subject→department→teacher)
 * - Each class gets 3-5 periods/week distributed across different days
 * - No teacher double-booking (tracked in-memory)
 * - No classroom double-booking (tracked in-memory)
 * - Lab subjects → lab classrooms when available
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
import { logSuccess } from "./utils"

// ============================================================================
// TIMETABLE CONFIGURATION
// ============================================================================

// Sudanese school week: Sunday (0) to Thursday (4)
const SCHOOL_DAYS = [0, 1, 2, 3, 4]

// Periods per week each class should have (varies by level)
const PERIODS_PER_WEEK = 4 // Most classes get 4 periods/week

// Lab-related subject keywords
const LAB_SUBJECTS = ["فيزياء", "كيمياء", "أحياء", "علوم", "حاسوب"]

// ============================================================================
// SCHEDULING HELPERS
// ============================================================================

/**
 * Build a map of subjectId → teachers who can teach it
 * by matching teacher's department to the subject's department
 */
async function buildSubjectTeacherMap(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[]
): Promise<Map<string, TeacherRef[]>> {
  // Get teacher department assignments via TeacherDepartment join table
  const teacherDepts = await prisma.teacherDepartment.findMany({
    where: { schoolId },
    select: { teacherId: true, departmentId: true },
  })

  const teacherDeptMap = new Map<string, string>()
  for (const td of teacherDepts) {
    teacherDeptMap.set(td.teacherId, td.departmentId)
  }

  // Get subject department assignments
  const subjects = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, departmentId: true },
  })

  const subjectDeptMap = new Map<string, string>()
  for (const s of subjects) {
    if (s.departmentId) subjectDeptMap.set(s.id, s.departmentId)
  }

  // Build subjectId → matching teachers
  const result = new Map<string, TeacherRef[]>()
  for (const [subjectId, deptId] of subjectDeptMap) {
    const matching = teachers.filter((t) => teacherDeptMap.get(t.id) === deptId)
    if (matching.length > 0) {
      result.set(subjectId, matching)
    }
  }

  return result
}

/**
 * Check if a classroom name suggests it's a lab
 */
function isLabClassroom(name: string): boolean {
  return (
    name.includes("مختبر") ||
    name.includes("معمل") ||
    name.includes("lab") ||
    name.includes("Lab")
  )
}

/**
 * Check if a subject name suggests it needs a lab
 */
function needsLab(subjectName: string): boolean {
  return LAB_SUBJECTS.some((kw) => subjectName.includes(kw))
}

// ============================================================================
// TIMETABLE SEEDING
// ============================================================================

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
    (p) =>
      !p.name.toLowerCase().includes("break") &&
      !p.name.includes("استراحة") &&
      !p.name.includes("فترة راحة")
  )

  if (teachingPeriods.length === 0 || classrooms.length === 0) {
    logSuccess("Timetable", 0, "No periods or classrooms available")
    return 0
  }

  // Separate lab and regular classrooms
  const labClassrooms = classrooms.filter((c) => isLabClassroom(c.name))
  const regularClassrooms = classrooms.filter((c) => !isLabClassroom(c.name))

  // Build subject→teacher map
  const subjectTeacherMap = await buildSubjectTeacherMap(
    prisma,
    schoolId,
    teachers
  )

  // Get subject names for lab detection
  const subjectRecords = await prisma.subject.findMany({
    where: { schoolId },
    select: { id: true, subjectName: true },
  })
  const subjectNameMap = new Map<string, string>()
  for (const s of subjectRecords) {
    subjectNameMap.set(s.id, s.subjectName)
  }

  // Occupancy tracking: "day-period" → Set of occupied teacherIds/classroomIds
  const teacherOccupied = new Map<string, Set<string>>() // "day-periodId" → teacherIds
  const classroomOccupied = new Map<string, Set<string>>() // "day-periodId" → classroomIds
  const classScheduled = new Map<string, Set<number>>() // classId → Set of days scheduled

  function getSlotKey(day: number, periodId: string): string {
    return `${day}-${periodId}`
  }

  function isTeacherFree(
    day: number,
    periodId: string,
    teacherId: string
  ): boolean {
    const key = getSlotKey(day, periodId)
    return !teacherOccupied.get(key)?.has(teacherId)
  }

  function isClassroomFree(
    day: number,
    periodId: string,
    classroomId: string
  ): boolean {
    const key = getSlotKey(day, periodId)
    return !classroomOccupied.get(key)?.has(classroomId)
  }

  function markOccupied(
    day: number,
    periodId: string,
    teacherId: string,
    classroomId: string
  ) {
    const key = getSlotKey(day, periodId)
    if (!teacherOccupied.has(key)) teacherOccupied.set(key, new Set())
    if (!classroomOccupied.has(key)) classroomOccupied.set(key, new Set())
    teacherOccupied.get(key)!.add(teacherId)
    classroomOccupied.get(key)!.add(classroomId)
  }

  const weekOffset = 0

  // Process classes - spread each class across different days
  // Use a round-robin teacher index per subject for load balancing
  const subjectTeacherIndex = new Map<string, number>()

  // Batch data for createMany
  const timetableData: Array<{
    schoolId: string
    termId: string
    dayOfWeek: number
    periodId: string
    classId: string
    teacherId: string
    classroomId: string
    weekOffset: number
    rotationWeek: number
    constraintViolations: never[]
  }> = []

  for (const classInfo of classes) {
    const subjectName = subjectNameMap.get(classInfo.subjectId) || ""
    const isLabSubject = needsLab(subjectName)

    // Find a teacher for this class's subject
    const availableTeachers =
      subjectTeacherMap.get(classInfo.subjectId) || teachers

    // Round-robin teacher selection per subject
    const teacherIdx = subjectTeacherIndex.get(classInfo.subjectId) || 0
    subjectTeacherIndex.set(
      classInfo.subjectId,
      (teacherIdx + 1) % availableTeachers.length
    )

    // Pick available classrooms
    const preferredClassrooms =
      isLabSubject && labClassrooms.length > 0
        ? labClassrooms
        : regularClassrooms.length > 0
          ? regularClassrooms
          : classrooms

    // Schedule this class for PERIODS_PER_WEEK different day-period slots
    let slotsScheduled = 0
    const scheduledDays = classScheduled.get(classInfo.id) || new Set<number>()

    // Shuffle days for variety
    const shuffledDays = [...SCHOOL_DAYS].sort(() => Math.random() - 0.5)

    for (const day of shuffledDays) {
      if (slotsScheduled >= PERIODS_PER_WEEK) break
      if (scheduledDays.has(day)) continue // One slot per day per class

      // Try to find a free period for this day
      // Spread across periods: start from a different period index based on class
      const startPeriodIdx =
        (classes.indexOf(classInfo) + day) % teachingPeriods.length

      for (let attempt = 0; attempt < teachingPeriods.length; attempt++) {
        const periodIdx = (startPeriodIdx + attempt) % teachingPeriods.length
        const period = teachingPeriods[periodIdx]

        // Try each available teacher starting from round-robin position
        let assignedTeacher: TeacherRef | null = null
        for (let ti = 0; ti < availableTeachers.length; ti++) {
          const teacher =
            availableTeachers[(teacherIdx + ti) % availableTeachers.length]
          if (isTeacherFree(day, period.id, teacher.id)) {
            assignedTeacher = teacher
            break
          }
        }
        if (!assignedTeacher) continue

        // Try each classroom
        let assignedClassroom: ClassroomRef | null = null
        for (const classroom of preferredClassrooms) {
          if (isClassroomFree(day, period.id, classroom.id)) {
            assignedClassroom = classroom
            break
          }
        }
        // Fallback to any classroom
        if (!assignedClassroom) {
          for (const classroom of classrooms) {
            if (isClassroomFree(day, period.id, classroom.id)) {
              assignedClassroom = classroom
              break
            }
          }
        }
        if (!assignedClassroom) continue

        // Found a valid slot!
        markOccupied(day, period.id, assignedTeacher.id, assignedClassroom.id)
        scheduledDays.add(day)

        timetableData.push({
          schoolId,
          termId: term.id,
          dayOfWeek: day,
          periodId: period.id,
          classId: classInfo.id,
          teacherId: assignedTeacher.id,
          classroomId: assignedClassroom.id,
          weekOffset,
          rotationWeek: 0,
          constraintViolations: [],
        })

        slotsScheduled++
        break // Move to next day
      }
    }

    classScheduled.set(classInfo.id, scheduledDays)
  }

  // Batch insert with skipDuplicates
  if (timetableData.length > 0) {
    // Delete existing timetable for this term to allow clean re-seed
    await prisma.timetable.deleteMany({
      where: { schoolId, termId: term.id, weekOffset: 0 },
    })

    // Insert in batches of 100
    const BATCH_SIZE = 100
    for (let i = 0; i < timetableData.length; i += BATCH_SIZE) {
      const batch = timetableData.slice(i, i + BATCH_SIZE)
      try {
        const result = await prisma.timetable.createMany({
          data: batch,
          skipDuplicates: true,
        })
        entryCount += result.count
      } catch {
        // Fall back to individual upserts if batch fails
        for (const entry of batch) {
          try {
            await prisma.timetable.upsert({
              where: {
                schoolId_termId_dayOfWeek_periodId_classId_weekOffset: {
                  schoolId: entry.schoolId,
                  termId: entry.termId,
                  dayOfWeek: entry.dayOfWeek,
                  periodId: entry.periodId,
                  classId: entry.classId,
                  weekOffset: entry.weekOffset,
                },
              },
              update: {
                teacherId: entry.teacherId,
                classroomId: entry.classroomId,
              },
              create: entry,
            })
            entryCount++
          } catch {
            // Skip constraint violations
          }
        }
      }
    }
  }

  logSuccess(
    "Timetable Entries",
    entryCount,
    "conflict-free, subject-matched, Sun-Thu"
  )

  return entryCount
}
