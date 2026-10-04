// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * What an EMPTY wizard draft is — one definition for the three places that
 * act on it: the wizard's Close button discards it, the lists hide it, and
 * the nightly purge deletes the ones left behind by a closed tab.
 *
 * Opening "Add student" / "Add teacher" creates the row up front (its id is
 * in the URL and the documents step uploads against it), so an admin who
 * opened the wizard and changed their mind left a nameless row in the list.
 *
 * A draft stops being empty the moment it holds anything the admin typed or
 * uploaded: a name, a parent, a document, a phone, a grade… Those are kept —
 * an admin who got halfway can come back to them.
 *
 * Deliberately NOT a "use server" file: these are plain Prisma filters.
 */

import type { Prisma } from "@prisma/client"

export const EMPTY_STUDENT_DRAFT = {
  wizardStep: { not: null },
  firstName: "",
  lastName: "",
  userId: null,
  profilePhotoUrl: null,
  academicGradeId: null,
  sectionId: null,
  studentGuardians: { none: {} },
  documents: { none: {} },
  feeAssignments: { none: {} },
  studentYearLevels: { none: {} },
} satisfies Prisma.StudentWhereInput

export const EMPTY_TEACHER_DRAFT = {
  wizardStep: { not: null },
  firstName: "",
  lastName: "",
  // createDraftTeacher stamps a placeholder until the contact step saves one.
  emailAddress: { endsWith: "@draft.internal" },
  userId: null,
  profilePhotoUrl: null,
  phoneNumbers: { none: {} },
  qualifications: { none: {} },
  experiences: { none: {} },
  subjectExpertise: { none: {} },
  teacherDepartments: { none: {} },
} satisfies Prisma.TeacherWhereInput

/**
 * Add "not an empty draft" to a list `where`. The original keys stay at the
 * top level — the tenant guard reads `where.schoolId` there, and wrapping the
 * whole filter in `AND: [where, …]` hid it and tripped "Query without
 * schoolId" on every list render.
 */
function withNot<W extends object>(where: W, empty: object) {
  const and = (where as { AND?: unknown }).AND
  return {
    ...where,
    AND: [...(Array.isArray(and) ? and : and ? [and] : []), { NOT: empty }],
  }
}

export function hideEmptyStudentDrafts<W extends object>(where: W) {
  return withNot(where, EMPTY_STUDENT_DRAFT)
}

export function hideEmptyTeacherDrafts<W extends object>(where: W) {
  return withNot(where, EMPTY_TEACHER_DRAFT)
}

/** The purge leaves today's drafts alone — someone may still have one open. */
export const EMPTY_DRAFT_GRACE_MS = 24 * 60 * 60 * 1000
