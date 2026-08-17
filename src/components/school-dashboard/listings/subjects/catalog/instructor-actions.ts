"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * School-wide instructor governance — who may teach this school's students.
 *
 * Sibling of `actions.ts` (which owns the per-subject `InstructorPreference`)
 * rather than an append to it: same ownership, same guard, ~700 fewer lines to
 * read. The enforcement half lives in
 * `@/components/lumos/lib/instructor-policy` and is shared with every read
 * path, so nothing written here can be honoured on one surface and ignored on
 * another.
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { isInstructorKey } from "@/components/lumos/lib/instructor-policy"

/** ADMIN or DEVELOPER, with a resolved school. Mirrors `actions.ts`. */
async function requireSchoolAdmin(): Promise<
  { ok: true; schoolId: string } | { ok: false; error: string }
> {
  const session = await auth()
  const role = session?.user?.role
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    return { ok: false, error: ACTION_ERRORS.UNAUTHORIZED }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { ok: false, error: ACTION_ERRORS.MISSING_SCHOOL }
  return { ok: true, schoolId }
}

/**
 * Allow or disable one instructor for the whole school. A disabled
 * instructor's videos are filtered out of every surface — the lesson player,
 * the switcher pills, and the mobile subject lane.
 */
export async function setInstructorEnabled(
  instructorKey: string,
  enabled: boolean
): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    if (!isInstructorKey(instructorKey)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    if (enabled) {
      await db.instructorBlock.deleteMany({
        where: { schoolId, instructorKey },
      })
    } else {
      await db.instructorBlock.upsert({
        where: { schoolId_instructorKey: { schoolId, instructorKey } },
        update: {},
        create: { schoolId, instructorKey },
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("[setInstructorEnabled] Error:", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/**
 * The school-wide default instructor — floated to the top wherever they have a
 * video, with everyone else still switchable. `null` restores the
 * platform-first ordering.
 */
export async function setInstructorDefault(
  instructorKey: string | null
): Promise<ActionResponse> {
  return upsertPolicy("defaultKey", instructorKey)
}

/**
 * Lock Lumos to one instructor. Deliberately not exclusive-or-nothing: on a
 * lesson the locked instructor never covered, the remaining allowed
 * instructors still play, because a video-less lesson records no progress and
 * would silently dent course completion. `null` unlocks.
 */
export async function setInstructorLock(
  instructorKey: string | null
): Promise<ActionResponse> {
  return upsertPolicy("lockedKey", instructorKey)
}

async function upsertPolicy(
  field: "lockedKey" | "defaultKey",
  instructorKey: string | null
): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    if (instructorKey !== null && !isInstructorKey(instructorKey)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.schoolInstructorPolicy.upsert({
      where: { schoolId },
      update: { [field]: instructorKey },
      create: { schoolId, [field]: instructorKey },
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error(`[setInstructorPolicy:${field}] Error:`, error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
