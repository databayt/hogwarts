// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { POLICY_ERROR_CODES, type PolicyContext, type Role } from "./types"

// ---------------------------------------------------------------------------
// Policy-context errors. Thrown when the caller needs a populated context
// but we can't build one (no session, or the required role row is missing).
// Translated on the client via ErrorHelper — never serialize an English
// message here. See .claude/rules/translation.md.
// ---------------------------------------------------------------------------

export class PolicyContextError extends Error {
  constructor(
    public code: (typeof POLICY_ERROR_CODES)[keyof typeof POLICY_ERROR_CODES]
  ) {
    super(code)
    this.name = "PolicyContextError"
  }
}

// NextAuth session shape, loosened — ExtendedUser augments it with schoolId/role
// but session.user is typed as DefaultSession in several callers. We cast narrowly here.
type ExtendedSessionUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
}

// ---------------------------------------------------------------------------
// getPolicyContext — single entry point for every policy check. Runs once
// per request thanks to React.cache(); subsequent calls in the same request
// return the memoized result. Performs these lookups in parallel:
//
//   1. auth()              — session
//   2. getTenantContext()  — resolves schoolId via impersonation / subdomain / session
//   3. role-table lookup   — Student | Teacher | Guardian | StaffMember, by userId
//
// The role-table lookup only runs for roles that have an associated row
// (STUDENT → Student, TEACHER → Teacher, GUARDIAN → Guardian,
// ACCOUNTANT | STAFF → StaffMember). ADMIN/DEVELOPER/USER skip it.
// ---------------------------------------------------------------------------

export const getPolicyContext = cache(async (): Promise<PolicyContext> => {
  const [session, tenant] = await Promise.all([auth(), getTenantContext()])
  const user = session?.user as ExtendedSessionUser | undefined

  if (!user?.id) {
    throw new PolicyContextError(POLICY_ERROR_CODES.NOT_AUTHENTICATED)
  }

  const role = (user.role ?? "USER") as Role
  const userId = user.id
  const schoolId = tenant.schoolId

  // DEVELOPER/USER never have role-table rows; skip the lookup entirely.
  // ADMIN is keyed to a school but has no extra role-table row either.
  if (role === "DEVELOPER" || role === "ADMIN" || role === "USER") {
    return {
      userId,
      role,
      email: user.email ?? null,
      schoolId,
    }
  }

  // Single query per role — each returns null if the row is missing (e.g.,
  // a STUDENT user whose Student record was deleted out from under them).
  // Keep selects minimal: we only need IDs + grade scope, never full rows.
  const [student, teacher, guardian, staffMember] = await Promise.all([
    role === "STUDENT"
      ? db.student.findUnique({
          where: { userId },
          select: {
            id: true,
            sectionId: true,
            academicGradeId: true,
            academicGrade: { select: { gradeNumber: true } },
          },
        })
      : null,
    role === "TEACHER"
      ? db.teacher.findUnique({
          where: { userId },
          select: { id: true },
        })
      : null,
    role === "GUARDIAN"
      ? db.guardian.findUnique({
          where: { userId },
          select: { id: true },
        })
      : null,
    role === "ACCOUNTANT" || role === "STAFF"
      ? db.staffMember.findUnique({
          where: { userId },
          select: { id: true },
        })
      : null,
  ])

  return {
    userId,
    role,
    email: user.email ?? null,
    schoolId,
    studentId: student?.id,
    sectionId: student?.sectionId ?? null,
    academicGradeId: student?.academicGradeId ?? null,
    academicGradeNumber: student?.academicGrade?.gradeNumber ?? null,
    teacherId: teacher?.id,
    guardianId: guardian?.id,
    staffMemberId: staffMember?.id,
  }
})

// ---------------------------------------------------------------------------
// Convenience helpers. Use these in the common case where you only care
// about a single field; prefer getPolicyContext() when you need several.
// ---------------------------------------------------------------------------

export async function currentStudentId(): Promise<string> {
  const ctx = await getPolicyContext()
  if (!ctx.studentId) {
    throw new PolicyContextError(POLICY_ERROR_CODES.DENIED)
  }
  return ctx.studentId
}

export async function currentTeacherId(): Promise<string> {
  const ctx = await getPolicyContext()
  if (!ctx.teacherId) {
    throw new PolicyContextError(POLICY_ERROR_CODES.DENIED)
  }
  return ctx.teacherId
}

export async function currentGuardianId(): Promise<string> {
  const ctx = await getPolicyContext()
  if (!ctx.guardianId) {
    throw new PolicyContextError(POLICY_ERROR_CODES.DENIED)
  }
  return ctx.guardianId
}

// Type-narrowing: asserts that schoolId is non-null (everyone but DEVELOPER/USER).
// Throws MISSING_SCHOOL_CONTEXT otherwise — an invariant violation we'd
// rather fail loudly than silently cross-tenant on.
export async function requireSchoolContext(): Promise<
  PolicyContext & { schoolId: string }
> {
  const ctx = await getPolicyContext()
  if (!ctx.schoolId) {
    throw new PolicyContextError(POLICY_ERROR_CODES.MISSING_SCHOOL_CONTEXT)
  }
  return ctx as PolicyContext & { schoolId: string }
}

// Escape hatch for the rare call site that wants raw UserRole back from
// Prisma. Normally you want ctx.role (the string-literal Role).
export function toPrismaRole(role: Role): UserRole {
  return role as UserRole
}
