// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Who watches a class that has no teacher — pure rules, no database.
//
// School ADMINs are always the first line; a LiveClassSupervisor is an extra
// person an admin picked for one stage. Cover (taking over the class as its
// teacher) is open to exactly those two groups.
import { isLiveStage, type LiveStage } from "./stage"

/** Roles an admin may pick as a supervisor. */
export const SUPERVISOR_ROLES = ["ADMIN", "STAFF", "TEACHER"] as const

export function isSupervisorRole(role: string | null | undefined): boolean {
  return (SUPERVISOR_ROLES as readonly string[]).includes(role ?? "")
}

const COVER_ADMIN_ROLES = ["DEVELOPER", "ADMIN"]

/**
 * May this person see the cover page and cover the class? An admin, or a
 * supervisor of the class's own stage. A class whose stage is unknown is the
 * admins' alone.
 */
export function mayCoverSession(input: {
  role: string | null | undefined
  stage: LiveStage | null
  /** The stages this user supervises in this school. */
  supervisedStages: readonly string[]
  /** This user supervises THIS class (the section's homeroom teacher — Al-Ibda's «مشرفة الصف»). */
  isClassSupervisor?: boolean
}): boolean {
  if (COVER_ADMIN_ROLES.includes(input.role ?? "")) return true
  if (input.isClassSupervisor) return true
  if (!input.stage || !isLiveStage(input.stage)) return false
  return input.supervisedStages.includes(input.stage)
}

/**
 * Admins, the class's own supervisor (its homeroom teacher), then the stage's
 * supervisors — each person once, never the teacher who is absent.
 */
export function noTeacherRecipients(input: {
  adminUserIds: readonly string[]
  supervisorUserIds: readonly string[]
  classSupervisorUserIds?: readonly (string | null | undefined)[]
  absentTeacherUserId?: string | null
}): string[] {
  const all = [
    ...input.adminUserIds,
    ...(input.classSupervisorUserIds ?? []).filter((u): u is string => !!u),
    ...input.supervisorUserIds,
  ]
  return [...new Set(all)].filter((u) => u !== input.absentTeacherUserId)
}

/**
 * Can this class still be covered? Over, cancelled, ended — no. Already covered
 * by SOMEONE ELSE — no (the first cover wins, nobody overwrites it); by the
 * caller — yes (a second tap just walks back in).
 */
export function coverState(input: {
  status: string
  coveredByUserId: string | null
  userId: string
  scheduledEnd: Date
  now: Date
}): "ok" | "mine" | "taken" | "over" {
  if (input.status === "cancelled" || input.status === "ended") return "over"
  if (input.now.getTime() >= input.scheduledEnd.getTime()) return "over"
  if (input.coveredByUserId) {
    return input.coveredByUserId === input.userId ? "mine" : "taken"
  }
  return "ok"
}
