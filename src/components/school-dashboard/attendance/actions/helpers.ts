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
 * Get class IDs assigned to a teacher (primary + co-teacher via ClassTeacher bridge).
 * Returns null for non-teachers (meaning "all classes").
 */
export async function getTeacherClassIds(
  schoolId: string,
  userId: string
): Promise<string[] | null> {
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) return null

  // Combine primary classes (Class.teacherId) and co-teacher assignments (ClassTeacher)
  const [primaryClasses, bridgeClasses] = await Promise.all([
    db.class.findMany({
      where: { schoolId, teacherId: teacher.id },
      select: { id: true },
    }),
    db.classTeacher.findMany({
      where: { schoolId, teacherId: teacher.id },
      select: { classId: true },
    }),
  ])

  const ids = new Set([
    ...primaryClasses.map((c) => c.id),
    ...bridgeClasses.map((ct) => ct.classId),
  ])

  return [...ids]
}

/**
 * Get class IDs filtered by grade, optionally intersected with teacher's classes.
 */
export async function getClassIdsByGrade(
  schoolId: string,
  gradeId: string,
  teacherClassIds?: string[] | null
): Promise<string[]> {
  const where: { schoolId: string; gradeId: string; id?: { in: string[] } } = {
    schoolId,
    gradeId,
  }

  // If teacher scoping is active, only return classes the teacher owns
  if (teacherClassIds && teacherClassIds.length > 0) {
    where.id = { in: teacherClassIds }
  }

  const classes = await db.class.findMany({
    where,
    select: { id: true },
  })

  return classes.map((c) => c.id)
}
