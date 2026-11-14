// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse, type NextRequest } from "next/server"

import { ACTION_ERRORS } from "@/lib/action-errors"
import {
  getRoomChatFor,
  recordChatMessageFor,
} from "@/components/school-dashboard/live/chat-core"

import { authenticate, isAuthError } from "../../../lib/authenticate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * The room chat's memory for the app — the same `chat-core` the web room's
 * actions call, with the JWT's viewer. The live messages themselves travel
 * over LiveKit (`lk.chat`); this only saves and reads them back.
 *
 * GET  ?before=<ms>  → { success, data: { messages, hasMore } }
 * POST { messageId, text } → { success }
 */
function statusOf(error?: string) {
  if (error === ACTION_ERRORS.NOT_FOUND) return 404
  if (error === ACTION_ERRORS.UNAUTHORIZED) return 403
  if (error === ACTION_ERRORS.RATE_LIMITED) return 429
  if (error === ACTION_ERRORS.VALIDATION_ERROR) return 400
  return 500
}

function reply(result: { success: boolean; error?: string }) {
  return NextResponse.json(result, {
    status: result.success ? 200 : statusOf(result.error),
    headers: { "Cache-Control": "no-store" },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth
  const { id } = await params
  const before = Number(request.nextUrl.searchParams.get("before"))
  const result = await getRoomChatFor(
    { userId: auth.userId, schoolId: auth.schoolId, role: auth.role },
    { sessionId: id, ...(before > 0 ? { before } : {}) }
  )
  return reply(result as { success: boolean; error?: string })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth
  const { id } = await params
  const body = (await request.json().catch(() => null)) as {
    messageId?: unknown
    text?: unknown
  } | null
  if (typeof body?.messageId !== "string" || typeof body?.text !== "string") {
    return reply({ success: false, error: ACTION_ERRORS.VALIDATION_ERROR })
  }
  const result = await recordChatMessageFor(
    { userId: auth.userId, schoolId: auth.schoolId, role: auth.role },
    { sessionId: id, messageId: body.messageId, text: body.text }
  )
  return reply(result as { success: boolean; error?: string })
}
