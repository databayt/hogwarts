"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class («حصة تعويضية») — the server actions. Thin wrappers: each
// resolves the viewer from the session (never from input), validates, and
// calls the core in ../makeup-core.ts, which holds the rules.
//
// `start_live_class` is the permission: ADMIN / DEVELOPER / TEACHER hold it,
// and a teacher is held to their OWN classes inside the core. (`cancelLiveClass`
// needs `manage_live_class`, admin-only — a teacher could not cancel theirs.)
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"

import {
  cancelMakeup,
  createMakeup,
  listMissedClasses,
  replanMakeup,
  suggestMakeupSlots,
  type MakeupActor,
} from "../makeup-core"
import { requireContext } from "./helpers"

const idSchema = z.string().min(1)
const isoSchema = z.string().datetime()

const listSchema = z
  .object({
    days: z.number().int().min(1).max(60).optional(),
    includeMadeUp: z.boolean().optional(),
  })
  .optional()
const suggestSchema = z.object({
  missedId: idSchema,
  horizonDays: z.number().int().min(1).max(30).optional(),
  limit: z.number().int().min(1).max(40).optional(),
})
const createSchema = z.object({
  missedId: idSchema,
  startIso: isoSchema,
  endIso: isoSchema,
})
const cancelSchema = z.object({ makeupId: idSchema })
const replanSchema = z.object({
  makeupId: idSchema,
  startIso: isoSchema,
  endIso: isoSchema,
})

/** The actor comes from the session, never from the caller's input. */
async function resolveActor(): Promise<
  | { ok: true; actor: MakeupActor }
  | { ok: false; response: ReturnType<typeof actionError> }
> {
  const ctx = await requireContext("start_live_class")
  if (!ctx.ok) return ctx
  return {
    ok: true,
    actor: { userId: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
  }
}

/** The classes the viewer may make up (their own; an admin's: the school's). */
export async function listMissedClassesAction(input?: {
  days?: number
  includeMadeUp?: boolean
}) {
  const who = await resolveActor()
  if (!who.ok) return who.response
  const parsed = listSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  try {
    const data = await listMissedClasses(who.actor, parsed.data ?? {})
    return { success: true as const, data }
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Free times (teacher + section(s)) for a missed class, grouped by school day. */
export async function suggestMakeupSlotsAction(input: {
  missedId: string
  horizonDays?: number
  limit?: number
}) {
  const who = await resolveActor()
  if (!who.ok) return who.response
  const parsed = suggestSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  try {
    return await suggestMakeupSlots(who.actor, parsed.data.missedId, {
      horizonDays: parsed.data.horizonDays,
      limit: parsed.data.limit,
    })
  } catch {
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Schedule a make-up for a missed class. */
export async function createMakeupAction(input: {
  missedId: string
  startIso: string
  endIso: string
}) {
  const who = await resolveActor()
  if (!who.ok) return who.response
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  return createMakeup(who.actor, parsed.data)
}

/** Cancel a planned make-up (the owner or an admin). */
export async function cancelMakeupAction(input: { makeupId: string }) {
  const who = await resolveActor()
  if (!who.ok) return who.response
  const parsed = cancelSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  return cancelMakeup(who.actor, parsed.data.makeupId)
}

/** Move a planned make-up to another time: cancel + create, in one transaction. */
export async function replanMakeupAction(input: {
  makeupId: string
  startIso: string
  endIso: string
}) {
  const who = await resolveActor()
  if (!who.ok) return who.response
  const parsed = replanSchema.safeParse(input)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  return replanMakeup(who.actor, parsed.data)
}
