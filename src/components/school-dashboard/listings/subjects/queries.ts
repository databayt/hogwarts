// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Query builders for Subjects module
 *
 * Since the Subject model has been removed, all queries now go through
 * SubjectSelection (bridge) → Subject.
 *
 * Centralizes query logic for:
 * - Filtering, sorting, pagination
 * - Multi-tenant safety (schoolId)
 */

import { db } from "@/lib/db"
import { getSchoolSubjects } from "@/lib/school-subjects"
import { offeredToStream } from "@/lib/teaching-audience"

// ============================================================================
// Types
// ============================================================================

export type SubjectListFilters = {
  search?: string
  department?: string
  studentId?: string
  teacherId?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type SubjectQueryParams = SubjectListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Resolve student's internal ID from user session ID.
 */
export async function getStudentIdByUserId(
  schoolId: string,
  userId: string
): Promise<string | null> {
  const student = await db.student.findFirst({
    where: { schoolId, userId },
    select: { id: true },
  })
  return student?.id ?? null
}

/**
 * Resolve teacher's internal ID from user session ID.
 */
export async function getTeacherIdByUserId(
  schoolId: string,
  userId: string
): Promise<string | null> {
  const teacher = await db.teacher.findFirst({
    where: { schoolId, userId },
    select: { id: true },
  })
  return teacher?.id ?? null
}

/**
 * Resolve all catalog subject IDs a student should see in a school.
 *
 * The student's academic grade is the gate, not a fallback: a section's
 * timetable can carry another grade's catalog subject, and a student must
 * never be shown those.
 *
 * 1. The grade's active SubjectSelection rows, the curriculum the school chose
 *    for that grade, are always included.
 * 2. Subjects the student is attached to (their section's timetable) are added only when the catalog places them in the student's grade.
 * 3. With no grade on the student record, the attachments stand on their own.
 */
export async function getSubjectIdsForStudent(
  schoolId: string,
  studentId: string
): Promise<Set<string>> {
  const student = await db.student.findFirst({
    where: { id: studentId, schoolId },
    select: {
      sectionId: true,
      academicGradeId: true,
      academicStreamId: true,
      academicGrade: { select: { gradeNumber: true } },
      section: {
        select: { gradeId: true, grade: { select: { gradeNumber: true } } },
      },
    },
  })
  // The section's grade wins over the grade the student was placed in
  const gradeId = student?.section?.gradeId ?? student?.academicGradeId

  // Subjects this student is directly attached to.
  const attached = new Set<string>()

  if (student?.sectionId) {
    const timetableSlots = await db.timetable.findMany({
      where: {
        schoolId,
        sectionId: student.sectionId,
        subjectId: { not: null },
      },
      select: { subjectId: true },
      distinct: ["subjectId"],
    })
    for (const slot of timetableSlots) {
      if (slot.subjectId) {
        attached.add(slot.subjectId)
      }
    }
  }

  // Without a grade there is nothing to gate against.
  if (!student || !gradeId) return attached

  // The grade's subjects for the student's stream (all of them without one)
  const gradeSelections = await db.subjectSelection.findMany({
    where: { schoolId, gradeId, isActive: true },
    select: { catalogSubjectId: true, streamId: true },
  })
  const subjectIds = new Set(
    gradeSelections
      .filter((s) => offeredToStream(s.streamId, student.academicStreamId))
      .map((s) => s.catalogSubjectId)
  )

  // Keep an attachment only when the catalog agrees it belongs to this grade.
  // A subject that declares no grades at all stays in — there is nothing to
  // check it against.
  const unvetted = Array.from(attached).filter((id) => !subjectIds.has(id))
  const gradeNumber = student.section
    ? student.section.grade?.gradeNumber
    : student.academicGrade?.gradeNumber

  if (unvetted.length > 0) {
    if (gradeNumber == null) {
      for (const id of unvetted) subjectIds.add(id)
    } else {
      const rows = await db.subject.findMany({
        where: { id: { in: unvetted } },
        select: { id: true, grades: true },
      })
      for (const row of rows) {
        if (row.grades.length === 0 || row.grades.includes(gradeNumber)) {
          subjectIds.add(row.id)
        }
      }
    }
  }

  return subjectIds
}

/**
 * Resolve all catalog subject IDs associated with a teacher in a school.
 * Considers:
 * 1. Subjects assigned to them in any section (SubjectTeacher)
 * 2. Timetable slots assigned (Timetable.teacherId)
 * 3. Teacher subject expertise (TeacherSubjectExpertise.teacherId)
 */
export async function getSubjectIdsForTeacher(
  schoolId: string,
  teacherId: string
): Promise<Set<string>> {
  const subjectIds = new Set<string>()

  const [assigned, timetableSlots, expertise] = await Promise.all([
    db.subjectTeacher.findMany({
      where: { schoolId, teacherId },
      select: { subjectId: true },
      distinct: ["subjectId"],
    }),
    db.timetable.findMany({
      where: { schoolId, teacherId, subjectId: { not: null } },
      select: { subjectId: true },
      distinct: ["subjectId"],
    }),
    db.teacherSubjectExpertise.findMany({
      where: { schoolId, teacherId },
      select: { subjectId: true },
    }),
  ])

  for (const a of assigned) subjectIds.add(a.subjectId)
  for (const t of timetableSlots) {
    if (t.subjectId) subjectIds.add(t.subjectId)
  }
  for (const e of expertise) {
    if (e.subjectId) subjectIds.add(e.subjectId)
  }

  return subjectIds
}

/**
 * Get subjects list with filtering, sorting, pagination.
 * Uses SubjectSelection → Subject.
 */
export async function getSubjectList(
  schoolId: string,
  params: Partial<SubjectQueryParams> = {}
) {
  const allSubjects = await getSchoolSubjects(schoolId)

  // Apply filters
  let filtered = allSubjects

  if (params.studentId) {
    const studentSubjIds = await getSubjectIdsForStudent(
      schoolId,
      params.studentId
    )
    filtered = filtered.filter((s) => studentSubjIds.has(s.id))
  } else if (params.teacherId) {
    const teacherSubjIds = await getSubjectIdsForTeacher(
      schoolId,
      params.teacherId
    )
    filtered = filtered.filter((s) => teacherSubjIds.has(s.id))
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(searchLower) ||
        (s.department && s.department.toLowerCase().includes(searchLower))
    )
  }

  if (params.department) {
    filtered = filtered.filter((s) => s.department === params.department)
  }

  // Sort
  const sortParams = params.sort
  if (sortParams?.length) {
    filtered.sort((a, b) => {
      for (const s of sortParams) {
        const key = s.id as keyof typeof a
        const aVal = String(a[key] ?? "")
        const bVal = String(b[key] ?? "")
        const cmp = aVal.localeCompare(bVal)
        if (cmp !== 0) return s.desc ? -cmp : cmp
      }
      return 0
    })
  } else {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Paginate
  const page = params.page ?? 1
  const perPage = params.perPage ?? 20
  const skip = (page - 1) * perPage
  const rows = filtered.slice(skip, skip + perPage)

  return { rows, count: filtered.length }
}

/**
 * Get single subject by Subject ID (verified for school).
 */
export async function getSubjectDetail(schoolId: string, id: string) {
  const selection = await db.subjectSelection.findFirst({
    where: { schoolId, catalogSubjectId: id, isActive: true },
    include: {
      subject: true,
    },
  })
  return selection?.subject ?? null
}

/**
 * Get subjects for a specific department
 */
export async function getDepartmentSubjects(
  schoolId: string,
  department: string
) {
  const allSubjects = await getSchoolSubjects(schoolId)
  return allSubjects
    .filter((s) => s.department === department)
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Check if subjects exist and belong to school
 */
export async function verifySubjectOwnership(
  schoolId: string,
  subjectIds: string[]
) {
  const selections = await db.subjectSelection.findMany({
    where: {
      schoolId,
      catalogSubjectId: { in: subjectIds },
      isActive: true,
    },
    select: { catalogSubjectId: true },
  })
  return selections.map((s) => s.catalogSubjectId)
}

/**
 * Get subject statistics for a school
 */
export async function getSubjectStats(schoolId: string) {
  const allSubjects = await getSchoolSubjects(schoolId)

  const byDepartment: Record<string, number> = {}
  for (const s of allSubjects) {
    const dept = s.department || "Unknown"
    byDepartment[dept] = (byDepartment[dept] || 0) + 1
  }

  return {
    total: allSubjects.length,
    byDepartment,
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format subject display with department
 */
export function formatSubjectWithDepartment(subject: {
  name: string
  department?: string | null
}): string {
  if (subject.department) {
    return `${subject.name} (${subject.department})`
  }
  return subject.name
}
