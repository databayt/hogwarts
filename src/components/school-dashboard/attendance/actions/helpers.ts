// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkAttendancePermission,
  getAuthContext,
  type AttendanceAction,
  type AuthContext,
} from "@/components/school-dashboard/attendance/authorization"

// ============================================================================
// AUTH GUARD
// ============================================================================

export type AttendanceGuard =
  | {
      ok: true
      schoolId: string
      userId: string
      role: UserRole
      auth: AuthContext
    }
  | { ok: false; error: ReturnType<typeof actionError> }

/**
 * Single entry-point guard for attendance server actions.
 *
 * Enforces, in order: (1) tenant context resolves a schoolId,
 * (2) an authenticated session exists, (3) the session role satisfies the
 * RBAC matrix for `action`. Returns a discriminated union so callers can
 * `if (!g.ok) return g.error` and then use `g.schoolId` / `g.userId` / `g.role`
 * with confidence.
 *
 * CRITICAL: `getTenantContext()` resolves schoolId from the x-subdomain header
 * (set by middleware) and therefore does NOT by itself require authentication.
 * Any action that only checks schoolId is reachable by unauthenticated requests
 * to a school subdomain — every mutating/reading action MUST pass through here
 * (or an equivalent auth() + permission check).
 */
export async function guardAttendance(
  action: AttendanceAction
): Promise<AttendanceGuard> {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  if (!schoolId)
    return { ok: false, error: actionError(ACTION_ERRORS.MISSING_SCHOOL) }

  const ctx = getAuthContext(session)
  if (!ctx)
    return { ok: false, error: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }

  const authCtx: AuthContext = { ...ctx, schoolId }
  if (!checkAttendancePermission(authCtx, action)) {
    return { ok: false, error: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return {
    ok: true,
    schoolId,
    userId: ctx.userId,
    role: ctx.role,
    auth: authCtx,
  }
}

/**
 * Resolve the Student row owned by the current session user (STUDENT role) or
 * the set of student ids a GUARDIAN is linked to. Used for ownership checks on
 * self/child read actions. Returns null when the user is not a student/guardian
 * or owns no matching student.
 */
export async function getOwnedStudentIds(
  schoolId: string,
  userId: string,
  role: UserRole
): Promise<string[] | null> {
  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    })
    return student ? [student.id] : []
  }
  if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { schoolId, userId },
      select: {
        studentGuardians: { select: { studentId: true } },
      },
    })
    if (!guardian) return []
    return guardian.studentGuardians.map((s) => s.studentId)
  }
  // Staff/admin roles are not constrained to owned students here.
  return null
}

/**
 * The sections a teacher's attendance covers: their homeroom, a section they
 * have a timetable period with, or one they are assigned a subject in (which
 * can exist before the term's timetable does). A TEACHER-role user with no
 * teacher record covers none — never "the whole school".
 */
export async function getTeacherSectionIds(
  schoolId: string,
  userId: string
): Promise<string[]> {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })
  if (!teacher) return []

  const sections = await db.section.findMany({
    where: {
      schoolId,
      OR: [
        { homeroomTeacherId: teacher.id },
        { timetables: { some: { schoolId, teacherId: teacher.id } } },
        { subjectTeachers: { some: { schoolId, teacherId: teacher.id } } },
      ],
    },
    select: { id: true },
  })
  return sections.map((s) => s.id)
}

/**
 * The attendance rows a viewer may read by section: a teacher's sections,
 * narrowed to `sectionId` / `gradeId` when given. An explicit section outside
 * a teacher's own is INTERSECTED away (matches nothing) — never let a filter
 * widen the teacher's scope.
 */
export function sectionScopeWhere(input: {
  teacherSectionIds: string[] | null
  sectionId?: string | null
  gradeId?: string | null
}): { sectionId?: string | { in: string[] }; section?: { gradeId: string } } {
  const { teacherSectionIds, sectionId, gradeId } = input
  const where: {
    sectionId?: string | { in: string[] }
    section?: { gradeId: string }
  } = {}
  if (sectionId) {
    where.sectionId =
      teacherSectionIds && !teacherSectionIds.includes(sectionId)
        ? { in: [] }
        : sectionId
  } else if (teacherSectionIds) {
    where.sectionId = { in: teacherSectionIds }
  }
  if (gradeId) where.section = { gradeId }
  return where
}
