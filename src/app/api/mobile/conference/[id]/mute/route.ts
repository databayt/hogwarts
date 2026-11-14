// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse, type NextRequest } from "next/server"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { muteMicsFor } from "@/components/school-dashboard/live/moderation-core"

import { authenticate, isAuthError } from "../../../lib/authenticate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/mobile/conference/:id/mute  { identity?: string }
 *
 * Host: mute every student's microphone (or one student's, with `identity`).
 * The same `moderation-core` the web room's `muteAll` action calls — a HOST /
 * CO_HOST seat in this session, teachers never muted. The app then sends the
 * class channel's `{ t: "muted" }` so students see why, as the web host does.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth
  const { id } = await params
  const body = (await request.json().catch(() => null)) as {
    identity?: unknown
  } | null
  const identity =
    typeof body?.identity === "string" && body.identity ? body.identity : undefined
  if (identity && !/^[A-Za-z0-9_-]{1,64}$/.test(identity)) {
    return NextResponse.json(
      { success: false, error: ACTION_ERRORS.VALIDATION_ERROR },
      { status: 400 }
    )
  }
  const result = (await muteMicsFor(
    {
      userId: auth.userId,
      schoolId: auth.schoolId,
      role: auth.role as UserRole,
    },
    id,
    identity
  )) as { success: boolean; error?: string }
  return NextResponse.json(result, {
    status: result.success
      ? 200
      : result.error === ACTION_ERRORS.UNAUTHORIZED
        ? 403
        : result.error === ACTION_ERRORS.NOT_FOUND
          ? 404
          : 500,
    headers: { "Cache-Control": "no-store" },
  })
}
