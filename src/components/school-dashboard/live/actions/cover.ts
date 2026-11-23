"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cover («ادخل كمعلم الحصة») — a thin wrapper: the viewer comes from the
// session, never from input; the rules live in ../cover-core.ts.
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"

import { coverSession } from "../cover-core"
import { requireContext } from "./helpers"

const idSchema = z.string().min(1)

/**
 * Take over a class nobody came to teach. Returns the room path (or the
 * meeting link of an external class); the client navigates there.
 */
export async function coverSessionAction(sessionId: string) {
  // `read_school_dashboard` admits ADMIN / TEACHER / STAFF — every role a
  // supervisor may hold; the core then asks "admin or supervisor of the stage".
  const ctx = await requireContext("read_school_dashboard")
  if (!ctx.ok) return ctx.response
  const parsed = idSchema.safeParse(sessionId)
  if (!parsed.success) return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  try {
    return await coverSession(
      { userId: ctx.userId, role: ctx.role, schoolId: ctx.schoolId },
      parsed.data
    )
  } catch {
    return actionError(ACTION_ERRORS.LIVE_CLASS_UPDATE_FAILED)
  }
}
