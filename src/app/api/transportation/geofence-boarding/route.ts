// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Service-account webhook for geofence-driven boarding.
//
// Auth: Authorization: Bearer <prefix>.<secret>
// Scope required: "transportation.geofence_boarding"
// Rate limit: 120 events / 60s / IP (RATE_LIMITS.GEOFENCE_WEBHOOK)
//
// Status codes:
//   200 — boarding recorded OR ack-and-ignore (no matching route/assignment/trip)
//   400 — invalid JSON or validation error
//   401 — missing or invalid token
//   403 — token valid but missing required scope
//   429 — rate-limited (handled by middleware)
//   500 — unexpected DB error
//
// Token issuance is out of scope of this route. Insert via SQL or the demo
// seed (see prisma/seeds/transportation.ts).

import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { verifyApiToken } from "@/lib/api-tokens"
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit"
import { recordBoardingFromGeofenceInternal } from "@/components/school-dashboard/transportation/actions/geofence-internal"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const SCOPE = "transportation.geofence_boarding"

const bodySchema = z.object({
  studentId: z.string().min(1),
  geofenceId: z.string().min(1),
  eventType: z.enum(["ENTER", "EXIT"]),
  timestamp: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  const rl = await rateLimit(
    request,
    RATE_LIMITS.GEOFENCE_WEBHOOK,
    "geofence-boarding"
  )
  if (rl) return rl

  // Bearer token
  const authHeader = request.headers.get("authorization") ?? ""
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  if (!match) {
    return NextResponse.json(
      { ok: false, error: "MISSING_API_TOKEN" },
      { status: 401 }
    )
  }
  const plaintext = match[1].trim()

  const verification = await verifyApiToken(plaintext, SCOPE)
  if (!verification.ok) {
    const status =
      verification.reason === "INSUFFICIENT_SCOPE"
        ? 403
        : verification.reason === "MISSING_API_TOKEN"
          ? 401
          : 401
    return NextResponse.json(
      { ok: false, error: verification.reason },
      { status }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON" },
      { status: 400 }
    )
  }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR",
        details: parsed.error.format(),
      },
      { status: 400 }
    )
  }

  // Record. schoolId is taken from the TOKEN, never from the body.
  const result = await recordBoardingFromGeofenceInternal({
    schoolId: verification.token.schoolId,
    studentId: parsed.data.studentId,
    geofenceId: parsed.data.geofenceId,
    eventType: parsed.data.eventType,
    timestamp: parsed.data.timestamp,
    recordedBy: `system:api-token:${verification.token.id}`,
  })

  if (!("success" in result) || !result.success) {
    const code = "error" in result ? (result.error as string) : "INTERNAL_ERROR"

    // Ack-and-ignore for "no matching trip/route/assignment" — geofence
    // collectors should NOT retry these.
    const ackCodes = new Set([
      "ROUTE_NOT_FOUND",
      "ROUTE_ASSIGNMENT_NOT_FOUND",
      "TRIP_INVALID_STATE",
    ])
    const status = ackCodes.has(code) ? 200 : 500

    return NextResponse.json(
      {
        ok: false,
        code,
        ack: ackCodes.has(code),
      },
      { status }
    )
  }

  return NextResponse.json(
    { ok: true, data: { boardingId: result.data.id, tripId: result.tripId } },
    { status: 200 }
  )
}
