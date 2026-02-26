// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { UserRole } from "@prisma/client"

export type ClassroomAction = "create" | "read" | "update" | "delete"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export interface ClassroomContext {
  schoolId?: string
}

export function checkClassroomPermission(
  auth: AuthContext,
  action: ClassroomAction,
  classroom?: ClassroomContext
): boolean {
  const { role, schoolId } = auth

  // DEVELOPER has full access
  if (role === "DEVELOPER") return true

  // Must have school context
  if (!schoolId) return false

  // ADMIN has full school access
  if (role === "ADMIN") {
    if (!classroom?.schoolId) return true
    return schoolId === classroom.schoolId
  }

  // TEACHER and STAFF can read classrooms
  if (role === "TEACHER" || role === "STAFF") {
    if (action === "read") {
      if (!classroom?.schoolId) return true
      return schoolId === classroom.schoolId
    }
    return false
  }

  // Default: deny
  return false
}

export function assertClassroomPermission(
  auth: AuthContext,
  action: ClassroomAction,
  classroom?: ClassroomContext
): void {
  if (!checkClassroomPermission(auth, action, classroom)) {
    throw new Error(`Unauthorized: ${auth.role} cannot ${action} classrooms`)
  }
}

export function getAuthContext(session: any): AuthContext | null {
  if (!session?.user) return null
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId || null,
  }
}
