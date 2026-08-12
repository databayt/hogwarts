// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { performLiveClassJoin } from "@/components/school-dashboard/conference/actions/join-core"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/conference/token?sessionId=…
 *
 * The in-room token-refresh endpoint (~every 4 min per participant). This is
 * deliberately a route handler and NOT a server action: auth() rotates the
 * session cookie inside action requests, which makes Next ship a full RSC
 * re-render of the room page with EVERY refresh response — ~1MB × every
 * participant × every 4 minutes. As a GET returning JSON, a refresh costs a
 * few indexed queries and ~1KB. Same lesson as /api/notifications/bell.
 *
 * Re-runs the full eligibility check (kicked participants get 403), never
 * auto-starts a room (refresh-only semantics), and mirrors the action's
 * response shape so the client treats both identically.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: "VALIDATION_ERROR" },
      { status: 400 }
    )
  }

  const result = await performLiveClassJoin(sessionId, {
    allowAutoStart: false,
  })

  const status = result.success
    ? 200
    : result.error === ACTION_ERRORS.NOT_AUTHENTICATED
      ? 401
      : result.error === ACTION_ERRORS.LIVE_CLASS_PARTICIPANT_DENIED
        ? 403
        : 200 // remaining codes stay in-band; the client switches on `error`

  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  })
}
