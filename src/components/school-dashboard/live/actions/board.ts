"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import {
  ACTION_ERRORS,
  actionError,
  type ActionErrorCode,
} from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"

import { getBoardFor, saveBoardFor } from "./board-core"

/**
 * The board's memory for the web room. Strokes travel over the data channel;
 * the host's client keeps the latest page as ONE `ConferenceEvent` row, so a
 * teacher who reloads, or whose tab crashes, comes back to the same board.
 * The checks and the storage live in `board-core.ts`, shared with the app.
 */
type Actor =
  | { ok: true; userId: string; schoolId: string }
  | { ok: false; error: ActionErrorCode }

async function actor(): Promise<Actor> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return { ok: false, error: ACTION_ERRORS.NOT_AUTHENTICATED }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { ok: false, error: ACTION_ERRORS.MISSING_SCHOOL }
  return { ok: true, userId, schoolId }
}

/** Save the board as it stands now. Called debounced by the host. */
export async function saveBoard(input: {
  sessionId: string
  strokes: unknown
}) {
  const a = await actor()
  if (!a.ok) return actionError(a.error)
  const res = await saveBoardFor(a, input.sessionId, input.strokes)
  return res.success ? res : actionError(res.error)
}

/** The saved board, for a host coming back into the room. */
export async function getBoard(input: { sessionId: string }) {
  const a = await actor()
  if (!a.ok) return actionError(a.error)
  const res = await getBoardFor(a, input.sessionId)
  return res.success ? res : actionError(res.error)
}
