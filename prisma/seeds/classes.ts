/**
 * Classes Seed
 * Creates Classes and Student Enrollments
 *
 * Phase 4: Classes & Enrollments
 */

import type { PrismaClient } from "@prisma/client"

import { SUBJECTS, YEAR_LEVELS } from "./constants"
import type {
  ClassRef,
  ClassroomRef,
  PeriodRef,
  StudentRef,
  SubjectRef,
  TeacherRef,
  TermRef,
  YearLevelRef,
} from "./types"
import { logPhase, logSuccess, processBatch } from "./utils"

// ============================================================================
// CLASSES SEEDING
// ============================================================================

/**
 * Create classes for each subject/level combination
 * Assigns teachers and classrooms
 */
export async function seedClasses(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  yearLevels: YearLevelRef[],
  teachers: TeacherRef[],
  classrooms: ClassroomRef[],
  periods: PeriodRef[],
  term: TermRef
): Promise<ClassRef[]> {
  logPhase(4, "CLASSES & ENROLLMENTS", "الفصول والتسجيلات")

  const classes: ClassRef[] = []
  let teacherIndex = 0
  let classroomIndex = 0

  // Get teaching periods (exclude breaks)
  const teachingPeriods = periods.filter(
    (p) => !p.name.toLowerCase().includes("break")
  )

  // Default periods if none found
  const startPeriod = teachingPeriods[0] || periods[0]
  const endPeriod = teachingPeriods[1] || periods[1] || startPeriod

  // Create classes for each subject-level combination
  for (const subject of subjects) {
    // Find which levels this subject applies to
    const subjectConfig = SUBJECTS.find((s) => s.name === subject.subjectName)
    if (!subjectConfig) continue

    const applicableLevels = yearLevels.filter((level) => {
      if (subjectConfig.levels.includes("all")) return true

      const levelOrder =
        YEAR_LEVELS.find((yl) => yl.name === level.levelName)?.order || 0

      if (subjectConfig.levels.includes("KG-6")) {
        return levelOrder >= 1 && levelOrder <= 8
      }
      if (subjectConfig.levels.includes("1-6")) {
        return levelOrder >= 3 && levelOrder <= 8
      }
      if (subjectConfig.levels.includes("3-12")) {
        return levelOrder >= 5 && levelOrder <= 14
      }
      if (subjectConfig.levels.includes("4-12")) {
        return levelOrder >= 6 && levelOrder <= 14
      }
      if (subjectConfig.levels.includes("7-12")) {
        return levelOrder >= 9 && levelOrder <= 14
      }
      if (subjectConfig.levels.includes("KG-9")) {
        return levelOrder >= 1 && levelOrder <= 11
      }

      return false
    })

    for (const level of applicableLevels) {
      // Assign a teacher (round-robin)
      const teacher = teachers[teacherIndex % teachers.length]
      teacherIndex++

      // Assign a classroom (round-robin)
      const classroom = classrooms[classroomIndex % classrooms.length]
      classroomIndex++

      // Create class name (Arabic: subject - level)
      const className = `${subject.subjectName} - ${level.levelName}`

      try {
        const classRecord = await prisma.class.upsert({
          where: {
            schoolId_name: {
              schoolId,
              name: className,
            },
          },
          update: {
            lang: "ar",
            teacherId: teacher.id,
            classroomId: classroom.id,
          },
          create: {
            schoolId,
            name: className,
            lang: "ar",
            subjectId: subject.id,
            teacherId: teacher.id,
            termId: term.id,
            classroomId: classroom.id,
            startPeriodId: startPeriod.id,
            endPeriodId: endPeriod.id,
          },
        })

        classes.push({
          id: classRecord.id,
          name: classRecord.name,
          lang: "ar",
          subjectId: subject.id,
          yearLevelId: level.id,
        })
      } catch {
        // Skip if class already exists with different constraints
      }
    }
  }

  logSuccess("Classes", classes.length, "subject-level combinations")

  return classes
}

// ============================================================================
// STUDENT ENROLLMENTS
// ============================================================================

/**
 * Enroll students in their classes based on year level
 */
export async function seedStudentEnrollments(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  classes: ClassRef[]
): Promise<number> {
  let enrollmentCount = 0

  // Group students by year level
  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue

    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

  // For each class, enroll students of matching year level
  await processBatch(classes, 10, async (classInfo) => {
    const levelStudents = studentsByLevel.get(classInfo.yearLevelId) || []

    for (const student of levelStudents) {
      try {
        await prisma.studentClass.upsert({
          where: {
            schoolId_studentId_classId: {
              schoolId,
              studentId: student.id,
              classId: classInfo.id,
            },
          },
          update: {},
          create: {
            schoolId,
            studentId: student.id,
            classId: classInfo.id,
          },
        })
        enrollmentCount++
      } catch {
        // Skip duplicate enrollments
      }
    }
  })

  logSuccess("Student Enrollments", enrollmentCount, "across all classes")

  return enrollmentCount
}

// ============================================================================
// CLASS TEACHERS (CO-TEACHING)
// ============================================================================

/**
 * Assign additional teachers to classes (co-teaching support)
 */
export async function seedClassTeachers(
  prisma: PrismaClient,
  schoolId: string,
  classes: ClassRef[],
  teachers: TeacherRef[]
): Promise<number> {
  let assignmentCount = 0

  // Assign primary teachers for each class
  await processBatch(classes, 20, async (classInfo, index) => {
    const teacher = teachers[index % teachers.length]

    try {
      await prisma.classTeacher.upsert({
        where: {
          schoolId_classId_teacherId: {
            schoolId,
            classId: classInfo.id,
            teacherId: teacher.id,
          },
        },
        update: {
          role: "PRIMARY",
        },
        create: {
          schoolId,
          classId: classInfo.id,
          teacherId: teacher.id,
          role: "PRIMARY",
        },
      })
      assignmentCount++
    } catch {
      // Skip if already assigned
    }
  })

  logSuccess("Teacher Assignments", assignmentCount, "primary teachers")

  return assignmentCount
}

// ============================================================================
// COMBINED CLASSES SEEDING
// ============================================================================

/**
 * Seed all classes, enrollments, and teacher assignments
 */
export async function seedAllClasses(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  yearLevels: YearLevelRef[],
  teachers: TeacherRef[],
  students: StudentRef[],
  classrooms: ClassroomRef[],
  periods: PeriodRef[],
  term: TermRef
): Promise<ClassRef[]> {
  const classes = await seedClasses(
    prisma,
    schoolId,
    subjects,
    yearLevels,
    teachers,
    classrooms,
    periods,
    term
  )

  await seedStudentEnrollments(prisma, schoolId, students, classes)
  await seedClassTeachers(prisma, schoolId, classes, teachers)

  return classes
}
