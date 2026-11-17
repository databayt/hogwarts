// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who in a family may open which assignment. A student sees what is set for
 * their own section or grade; a guardian sees the same for a linked child.
 * Drafts never reach either. Every query carries the schoolId — another
 * school's assignment is simply "not found". Plain server module (takes a
 * userId), so never re-export it from a `"use server"` file.
 */

import { db } from "@/lib/db"
import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { studentAudienceWhere } from "@/lib/teaching-audience"
import { getStudentScopes } from "@/lib/teaching-scope"

export interface GuardianChild {
  id: string
  name: string
}

/** The signed-in guardian's linked children (Student.id + display name). */
export async function getGuardianChildren(
  userId: string,
  schoolId: string
): Promise<GuardianChild[]> {
  const [links, nameDisplay] = await Promise.all([
    db.studentGuardian.findMany({
      where: { schoolId, guardian: { userId } },
      select: {
        student: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },
    }),
    schoolNameDisplay(schoolId),
  ])
  return links.map((l) => ({
    id: l.student.id,
    name: displayName(l.student, nameDisplay),
  }))
}

/** Pick the child a guardian asked for (`?child=`), else the first. */
export function pickChild<T extends { id: string }>(
  children: readonly T[],
  requested: string | null | undefined
): T | null {
  if (children.length === 0) return null
  return children.find((c) => c.id === requested) ?? children[0]
}

/** Whether this assignment is set for this student, and is not a draft. */
export async function studentReachesAssignment(
  schoolId: string,
  studentId: string,
  assignmentId: string
): Promise<boolean> {
  const scopes = await getStudentScopes(schoolId, [studentId])
  if (scopes.length === 0) return false
  const row = await db.schoolAssignment.findFirst({
    where: {
      id: assignmentId,
      schoolId,
      wizardStep: null,
      status: { not: "DRAFT" },
      ...studentAudienceWhere(scopes),
    },
    select: { id: true },
  })
  return !!row
}

/**
 * The student whose view of `assignmentId` this STUDENT / GUARDIAN gets, or
 * null when they may not open it at all. A guardian's `childId` must be one of
 * their own links; without it the first linked child it reaches is used.
 */
export async function resolveFamilyStudent(input: {
  schoolId: string
  userId: string
  role: "STUDENT" | "GUARDIAN"
  assignmentId: string
  childId?: string | null
}): Promise<{ studentId: string; childName?: string } | null> {
  const { schoolId, userId, role, assignmentId, childId } = input

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!student) return null
    return (await studentReachesAssignment(schoolId, student.id, assignmentId))
      ? { studentId: student.id }
      : null
  }

  const children = await getGuardianChildren(userId, schoolId)
  const candidates = childId
    ? children.filter((c) => c.id === childId)
    : children
  for (const child of candidates) {
    if (await studentReachesAssignment(schoolId, child.id, assignmentId)) {
      return { studentId: child.id, childName: child.name }
    }
  }
  return null
}
