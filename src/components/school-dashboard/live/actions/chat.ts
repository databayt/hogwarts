"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getRoomChatFor,
  recordChatMessageFor,
  type ChatViewer,
} from "@/components/school-dashboard/live/chat-core"

export type { RoomChatMessage } from "@/components/school-dashboard/live/chat-core"

/** The web room's chat memory — thin wrappers over `chat-core.ts`. */
async function viewer(): Promise<ChatViewer | keyof typeof ACTION_ERRORS> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return "NOT_AUTHENTICATED"
  const { schoolId } = await getTenantContext()
  if (!schoolId) return "MISSING_SCHOOL"
  return { userId, schoolId, role: session.user.role }
}

/** Save one message the caller just sent over the room. Fire-and-forget. */
export async function recordChatMessage(input: {
  sessionId: string
  /** The LiveKit chat message id — the same id every peer received. */
  messageId: string
  text: string
}) {
  const v = await viewer()
  if (typeof v === "string") return actionError(ACTION_ERRORS[v])
  return recordChatMessageFor(v, input)
}

/** The newest page of the room's chat, oldest first. `before` (ms) pages back. */
export async function getRoomChat(input: { sessionId: string; before?: number }) {
  const v = await viewer()
  if (typeof v === "string") return actionError(ACTION_ERRORS[v])
  return getRoomChatFor(v, input)
}
