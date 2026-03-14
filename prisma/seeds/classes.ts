// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Classes Seed
 * Creates Classes and Student Enrollments
 *
 * Phase 4: Classes & Enrollments
 */

import type { PrismaClient } from "@prisma/client"

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

  // Build yearLevelId → AcademicGrade.id map for gradeId assignment
  const academicGrades = await prisma.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, yearLevelId: true },
  })
  const gradeByYearLevel = new Map(
    academicGrades
      .filter((g) => g.yearLevelId)
      .map((g) => [g.yearLevelId!, g.id])
  )

  // Create one class per subject × year level
  for (const subject of subjects) {
    for (const level of yearLevels) {
      // Assign a teacher (round-robin)
      const teacher = teachers[teacherIndex % teachers.length]
      teacherIndex++

      // Assign a classroom (round-robin)
      const classroom = classrooms[classroomIndex % classrooms.length]
      classroomIndex++

      // Create class name (Arabic: subject - level)
      const className = `${subject.subjectName} - ${level.levelName}`

      // Resolve gradeId from yearLevel
      const gradeId = gradeByYearLevel.get(level.id) || null

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
            gradeId,
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
            gradeId,
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
// SECTIONS (HOMEROOMS) SEEDING
// ============================================================================

/**
 * Create homeroom sections for each grade (e.g. Grade 7-A, Grade 7-B, Grade 7-C)
 * Assigns homeroom teachers and classrooms via round-robin
 */
export async function seedSections(
  prisma: PrismaClient,
  schoolId: string,
  teachers: TeacherRef[],
  classrooms: ClassroomRef[]
): Promise<void> {
  const grades = await prisma.academicGrade.findMany({
    where: { schoolId },
    orderBy: { gradeNumber: "asc" },
  })

  if (grades.length === 0) return

  // Only use regular classrooms for homeroom sections (not labs, sports, admin)
  const regularClassrooms = await prisma.classroom.findMany({
    where: {
      schoolId,
      classroomType: { name: "classroom" },
    },
    select: { id: true, roomName: true, capacity: true },
    orderBy: { roomName: "asc" },
  })
  const homeroomRooms =
    regularClassrooms.length > 0
      ? regularClassrooms.map((c) => ({
          id: c.id,
          name: c.roomName,
          capacity: c.capacity,
        }))
      : classrooms // fallback to all if no type filter matches

  let teacherIdx = 0
  let classroomIdx = 0
  let created = 0

  for (const grade of grades) {
    const sectionsPerGrade = 3 // A, B, C
    for (let i = 0; i < sectionsPerGrade; i++) {
      const letter = String.fromCharCode(65 + i) // A, B, C
      const name = `Grade ${grade.gradeNumber}-${letter}`
      const teacher = teachers[teacherIdx % teachers.length]
      const classroom = homeroomRooms[classroomIdx % homeroomRooms.length]
      teacherIdx++
      classroomIdx++

      try {
        await prisma.section.upsert({
          where: { schoolId_name: { schoolId, name } },
          update: {
            classroomId: classroom.id,
            homeroomTeacherId: teacher.id,
          },
          create: {
            schoolId,
            gradeId: grade.id,
            name,
            letter,
            lang: "en",
            homeroomTeacherId: teacher.id,
            classroomId: classroom.id,
            maxCapacity: grade.maxStudents || 30,
          },
        })
        created++
      } catch {
        // Skip if already exists with different constraints
      }
    }
  }

  logSuccess("Sections", created, "homeroom sections (A/B/C per grade)")
}

// ============================================================================
// STUDENT ENROLLMENTS
// ============================================================================

/**
 * Enroll students in their classes based on year level,
 * and assign each student to a homeroom section via round-robin
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

  // Assign students to homeroom sections (round-robin within their grade)
  const gradeByYearLevel = new Map<string, string>()
  const academicGrades = await prisma.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, yearLevelId: true },
  })
  for (const g of academicGrades) {
    if (g.yearLevelId) gradeByYearLevel.set(g.yearLevelId, g.id)
  }

  const sections = await prisma.section.findMany({
    where: { schoolId },
    orderBy: [{ gradeId: "asc" }, { letter: "asc" }],
  })
  const sectionsByGrade = new Map<string, typeof sections>()
  for (const sec of sections) {
    const existing = sectionsByGrade.get(sec.gradeId) || []
    existing.push(sec)
    sectionsByGrade.set(sec.gradeId, existing)
  }

  let sectionAssignments = 0
  for (const [yearLevelId, levelStudents] of studentsByLevel) {
    const gradeId = gradeByYearLevel.get(yearLevelId)
    if (!gradeId) continue

    const gradeSections = sectionsByGrade.get(gradeId)
    if (!gradeSections || gradeSections.length === 0) continue

    for (let i = 0; i < levelStudents.length; i++) {
      const section = gradeSections[i % gradeSections.length]
      try {
        await prisma.student.update({
          where: { id: levelStudents[i].id },
          data: { sectionId: section.id, academicGradeId: gradeId },
        })
        sectionAssignments++
      } catch {
        // Skip on error
      }
    }
  }

  logSuccess(
    "Section Assignments",
    sectionAssignments,
    "students assigned to homeroom sections"
  )

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

  await seedSections(prisma, schoolId, teachers, classrooms)
  await seedStudentEnrollments(prisma, schoolId, students, classes)
  await seedClassTeachers(prisma, schoolId, classes, teachers)

  return classes
}
