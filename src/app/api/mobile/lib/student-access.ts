// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

import type { MobileAuthContext } from "./authenticate"

/**
 * Verify the authenticated caller has access to the given student's data.
 *
 * Permitted callers:
 *   - DEVELOPER / ADMIN / TEACHER / STAFF in the same school
 *   - the STUDENT themselves (Student.userId === auth.userId)
 *   - a GUARDIAN linked to the student via `StudentGuardian`
 *
 * Returns true if access is allowed, false otherwise. Callers should
 * return a 403 (Forbidden) on `false`.
 *
 * The check is intentionally schoolId-scoped throughout so a guardian in
 * school A linked to a student in school B (which shouldn't happen, but
 * could via stale data) cannot read across tenants.
 */
export async function canAccessStudent(
  auth: MobileAuthContext,
  studentId: string
): Promise<boolean> {
  // Staff roles always have access within their school.
  if (
    auth.role === "DEVELOPER" ||
    auth.role === "ADMIN" ||
    auth.role === "TEACHER" ||
    auth.role === "STAFF"
  ) {
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId },
      select: { id: true },
    })
    return !!student
  }

  // STUDENT: must be looking at their own record
  if (auth.role === "STUDENT") {
    const own = await db.student.findFirst({
      where: { id: studentId, schoolId: auth.schoolId, userId: auth.userId },
      select: { id: true },
    })
    return !!own
  }

  // GUARDIAN: must be linked to this student via StudentGuardian
  if (auth.role === "GUARDIAN") {
    const link = await db.studentGuardian.findFirst({
      where: {
        schoolId: auth.schoolId,
        studentId,
        guardian: { userId: auth.userId },
      },
      select: { id: true },
    })
    return !!link
  }

  return false
}
