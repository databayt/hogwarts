// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Teaching Seed — sections, placement, subject teachers
 *
 * Phase 6. Classes are retired: a grade has sections (Grade 7-A, Grade 7-B),
 * each student sits in one, and each subject a section takes gets a teacher
 * (SubjectTeacher). Work is set for a grade or a section plus a subject, so
 * the later phases take `GradeSubjectRef`s — one per subject a grade takes.
 */

import type { PrismaClient } from "@prisma/client"

import { ensureSeedAssignments, topUpExpertise } from "./conference"
import { SEED_PROFILE_COUNTS } from "./constants"
import type {
  ClassroomRef,
  GradeSubjectRef,
  StudentRef,
  SubjectRef,
  TeacherRef,
  TermRef,
  YearLevelRef,
} from "./types"
import { logPhase, logSuccess } from "./utils"

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

  // Each grade gets 2 sections (A, B), and each section owns a dedicated
  // grade-assigned main classroom (homeroom) named <letter><2-digit grade> —
  // e.g. Grade 1 → A01 / B01, Grade 12 → A12 / B12. These carry a gradeId
  // so they render with their grade (not the "Shared" badge); labs/halls/admin
  // rooms stay shared. Mirrors autoProvisionSections (the new-school default).
  let classroomType = await prisma.classroomType.findFirst({
    where: { schoolId, name: "classroom" },
    select: { id: true },
  })
  if (!classroomType) {
    classroomType = await prisma.classroomType.upsert({
      where: { schoolId_name: { schoolId, name: "classroom" } },
      update: {},
      create: { schoolId, name: "classroom" },
      select: { id: true },
    })
  }

  const SECTION_LETTERS = SEED_PROFILE_COUNTS.sectionLetters
  let teacherIdx = 0
  let created = 0

  for (const grade of grades) {
    for (const letter of SECTION_LETTERS) {
      const name = `Grade ${grade.gradeNumber}-${letter}`
      const roomName = `${letter}${String(grade.gradeNumber).padStart(2, "0")}`
      const capacity = grade.maxStudents || 30
      const teacher = teachers[teacherIdx % teachers.length]
      teacherIdx++

      try {
        const room = await prisma.classroom.upsert({
          where: { schoolId_roomName: { schoolId, roomName } },
          update: { gradeId: grade.id, typeId: classroomType.id },
          create: {
            schoolId,
            roomName,
            capacity,
            typeId: classroomType.id,
            gradeId: grade.id,
          },
        })

        await prisma.section.upsert({
          where: { schoolId_name: { schoolId, name } },
          update: {
            classroomId: room.id,
            homeroomTeacherId: teacher.id,
          },
          create: {
            schoolId,
            gradeId: grade.id,
            name,
            letter,
            lang: "en",
            homeroomTeacherId: teacher.id,
            classroomId: room.id,
            maxCapacity: capacity,
          },
        })
        created++
      } catch {
        // Skip if already exists with different constraints
      }
    }
  }

  logSuccess(
    "Sections",
    created,
    "homeroom sections (A/B per grade, grade-assigned rooms)"
  )
}

// ============================================================================
// SECTION PLACEMENT
// ============================================================================

/**
 * Place each student in a homeroom section of their grade (round-robin).
 * Their grade's subjects follow from the section — no class enrollments.
 */
export async function seedSectionPlacement(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[]
): Promise<number> {
  // Group students by year level
  const studentsByLevel = new Map<string, StudentRef[]>()
  for (const student of students) {
    if (!student.yearLevelId) continue

    const existing = studentsByLevel.get(student.yearLevelId) || []
    existing.push(student)
    studentsByLevel.set(student.yearLevelId, existing)
  }

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

  return sectionAssignments
}

// ============================================================================
// GRADE SUBJECTS
// ============================================================================

/**
 * One `GradeSubjectRef` per subject a grade takes this term: the school's
 * curriculum (active SubjectSelections), or — for a school with none yet —
 * the subject × grade cross-product, capped to stay lean. Each carries the
 * teacher assigned the subject in the grade's first section.
 */
export async function buildGradeSubjects(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  yearLevels: YearLevelRef[],
  term: TermRef
): Promise<GradeSubjectRef[]> {
  const [academicGrades, selections, firstSections] = await Promise.all([
    prisma.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, yearLevelId: true },
    }),
    prisma.subjectSelection.findMany({
      where: { schoolId, isActive: true },
      select: { gradeId: true, catalogSubjectId: true },
    }),
    prisma.section.findMany({
      where: { schoolId },
      orderBy: [{ gradeId: "asc" }, { letter: "asc" }],
      select: { id: true, gradeId: true },
    }),
  ])
  const gradeByYearLevel = new Map(
    academicGrades
      .filter((g) => g.yearLevelId)
      .map((g) => [g.yearLevelId!, g.id])
  )
  const firstSectionOfGrade = new Map<string, string>()
  for (const section of firstSections) {
    if (!firstSectionOfGrade.has(section.gradeId)) {
      firstSectionOfGrade.set(section.gradeId, section.id)
    }
  }
  const assigned = await prisma.subjectTeacher.findMany({
    where: {
      schoolId,
      termId: term.id,
      sectionId: { in: [...firstSectionOfGrade.values()] },
    },
    select: {
      sectionId: true,
      subjectId: true,
      teacher: { select: { id: true, userId: true } },
    },
  })
  const teacherOf = new Map(
    assigned.map((a) => [`${a.sectionId}:${a.subjectId}`, a.teacher])
  )

  const curriculumPairs = new Set(
    selections.map((s) => `${s.gradeId}:${s.catalogSubjectId}`)
  )
  const useCurriculum = curriculumPairs.size > 0
  const gradeSubjects = useCurriculum
    ? subjects
    : subjects.slice(0, SEED_PROFILE_COUNTS.classSubjectCap)

  const refs: GradeSubjectRef[] = []
  for (const subject of gradeSubjects) {
    for (const level of yearLevels) {
      const gradeId = gradeByYearLevel.get(level.id)
      if (!gradeId) continue
      if (useCurriculum && !curriculumPairs.has(`${gradeId}:${subject.id}`))
        continue
      const sectionId = firstSectionOfGrade.get(gradeId)
      const teacher = sectionId
        ? teacherOf.get(`${sectionId}:${subject.id}`)
        : undefined
      refs.push({
        gradeId,
        yearLevelId: level.id,
        subjectId: subject.id,
        name: `${subject.name} - ${level.levelName}`,
        termId: term.id,
        teacherId: teacher?.id ?? null,
        teacherUserId: teacher?.userId ?? null,
      })
    }
  }

  logSuccess("Grade subjects", refs.length, "subject × grade pairs taught")
  return refs
}

// ============================================================================
// COMBINED TEACHING SEEDING
// ============================================================================

/**
 * Sections, placement and subject teachers, then the grade subjects the
 * later phases set work for.
 */
export async function seedAllTeaching(
  prisma: PrismaClient,
  schoolId: string,
  subjects: SubjectRef[],
  yearLevels: YearLevelRef[],
  teachers: TeacherRef[],
  students: StudentRef[],
  classrooms: ClassroomRef[],
  term: TermRef
): Promise<GradeSubjectRef[]> {
  logPhase(6, "SECTIONS & TEACHING", "الفصول والتدريس")

  await seedSections(prisma, schoolId, teachers, classrooms)
  await seedSectionPlacement(prisma, schoolId, students)

  // Subject teachers BEFORE the timetable (Phase 13): generation keeps a
  // subject in a section to its assigned teacher, so the demo gets one
  // teacher per subject per section.
  const testTeacherId = await topUpExpertise(prisma, schoolId)
  await ensureSeedAssignments(prisma, schoolId, term.id, testTeacherId)

  return buildGradeSubjects(prisma, schoolId, subjects, yearLevels, term)
}
