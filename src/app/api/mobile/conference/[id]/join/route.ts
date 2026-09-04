// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse, type NextRequest } from "next/server"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"

import { authenticate, isAuthError } from "../../../lib/authenticate"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/mobile/conference/:id/join
 *
 * Mint a LiveKit join ticket for a mobile client. Before this route existed the
 * whole conference feature was web-only: `/api/mobile/timetable` returned raw
 * slots with no live-class field and there was no token endpoint at all, so a
 * phone could not discover an online class, let alone join one.
 *
 * Eligibility is NOT re-implemented here. `performLiveClassJoin` is the single
 * shared `server-only` module the web action and the web refresh route already
 * call; this passes the JWT-derived actor into it and gets the identical
 * enrollment / visibility / state / cap checks and the identical role grants.
 *
 * `allowAutoStart` is on, matching the web room page: a teacher opening their
 * own scheduled class starts it, and a student on a scheduled class is refused
 * with LIVE_CLASS_INVALID_STATE exactly as on the web.
 *
 * The client refreshes by calling this route again — the ticket carries
 * `expiresAt`, and re-running it re-checks eligibility, so revocation lands at
 * the next refresh boundary just as it does on the web.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth

  const { id } = await params
  if (!id) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  // Rate-limited per user+session, generous enough for a phone's own refresh
  // cadence (mirrors the web token route's LUMOS_MEDIA-shaped budget — a
  // short-lived credential re-minted on a timer).
  const rl = await checkUserRateLimit(
    `${auth.userId}:${id}`,
    RATE_LIMITS.LUMOS_MEDIA,
    "conference-mobile-join"
  )
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: ACTION_ERRORS.RATE_LIMITED },
      { status: 429, headers: { "Cache-Control": "no-store" } }
    )
  }

  const result = await performLiveClassJoin(id, {
    actor: {
      userId: auth.userId,
      role: auth.role as UserRole,
      schoolId: auth.schoolId,
    },
  })

  const status = result.success
    ? 200
    : result.error === ACTION_ERRORS.NOT_AUTHENTICATED
      ? 401
      : result.error === ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED
        ? 403
        : result.error === ACTION_ERRORS.LIVE_CLASS_NOT_FOUND
          ? 404
          : 200 // remaining codes stay in-band; the client switches on `error`

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}
