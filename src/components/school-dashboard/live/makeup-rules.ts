// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who is OFFERED the make-up class («حصة تعويضية») buttons. Pure, so the class
 * page (`detail-load.ts`) and the room's title card ask one rule. This only
 * decides what to show: `makeup-core.ts` enforces the same thing on the write.
 */

/** Roles that may plan or move a make-up for any teacher. */
export const MAKEUP_ADMIN_ROLES: readonly string[] = ["DEVELOPER", "ADMIN"]

/** The viewer is the class's own teacher, or an admin. */
export function ownsMakeupClass(
  viewer: { role: string | null | undefined; userId: string | null | undefined },
  teacherUserId: string | null | undefined
): boolean {
  return (
    MAKEUP_ADMIN_ROLES.includes(viewer.role ?? "") ||
    (viewer.role === "TEACHER" &&
      Boolean(viewer.userId) &&
      teacherUserId === viewer.userId)
  )
}

/** «غيّر الموعد» / «إلغاء» — a make-up still waiting to start, for its owner. */
export function canManageMakeup(
  viewer: { role: string | null | undefined; userId: string | null | undefined },
  session: {
    makeupForId: string | null | undefined
    status: string
    teacherUserId: string | null | undefined
  }
): boolean {
  return (
    Boolean(session.makeupForId) &&
    session.status === "scheduled" &&
    ownsMakeupClass(viewer, session.teacherUserId)
  )
}
