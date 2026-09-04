// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"

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

  // Rate-limited per user+session, generous enough for the ~4-minute
  // legitimate cadence (mirrors the LUMOS_MEDIA re-mint budget — same shape:
  // a client re-fetches a short-lived credential on a timer). auth() here is
  // a cheap JWT decode ("jwt" session strategy, no DB hit) purely to key the
  // limiter; performLiveClassJoin re-resolves the session on its own below.
  // RATE_LIMITED is deliberately NOT one of the room's DENY_CODES, so a 429
  // here is just another transient failure the client already retries with
  // backoff — never an eject.
  const session = await auth()
  const rl = await checkUserRateLimit(
    `${session?.user?.id ?? "anon"}:${sessionId}`,
    RATE_LIMITS.LUMOS_MEDIA,
    "conference-token"
  )
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: ACTION_ERRORS.RATE_LIMITED },
      { status: 429, headers: { "Cache-Control": "no-store" } }
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
