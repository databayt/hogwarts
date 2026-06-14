// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// HTTP-level tests for the service-account geofence-boarding webhook route
// (src/app/api/transportation/geofence-boarding/route.ts).
//
// The real POST handler is imported and driven with a NextRequest-like object.
// We mock only the route's three collaborators:
//   - @/lib/rate-limit (checkRateLimitAsync → {allowed} ; createRateLimitResponse)
//   - @/lib/api-tokens (verifyApiToken — controls 401/403 + resolved schoolId)
//   - the geofence-internal bridge (controls success / ack / 500 mapping)
//
// CRITICAL invariant under test: the route MUST pass the schoolId resolved from
// the verified TOKEN to the bridge, and NEVER a schoolId from the request body.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { verifyApiToken } from "@/lib/api-tokens"
import { checkRateLimitAsync, createRateLimitResponse } from "@/lib/rate-limit"
import { recordBoardingFromGeofenceInternal } from "@/components/school-dashboard/transportation/actions/geofence-internal"
import { POST } from "@/app/api/transportation/geofence-boarding/route"

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(),
  createRateLimitResponse: vi.fn(),
  RATE_LIMITS: { GEOFENCE_WEBHOOK: { windowMs: 60_000, maxRequests: 120 } },
}))
vi.mock("@/lib/api-tokens", () => ({ verifyApiToken: vi.fn() }))
vi.mock(
  "@/components/school-dashboard/transportation/actions/geofence-internal",
  () => ({ recordBoardingFromGeofenceInternal: vi.fn() })
)

const TOKEN_SCHOOL = "school-from-token"
const TOKEN_ID = "tok-123"
const SCOPE = "transportation.geofence_boarding"

/**
 * Minimal NextRequest-like object: the route only touches
 * `request.headers.get(...)` and `await request.json()`.
 */
function makeRequest(opts: {
  authorization?: string
  body?: unknown
  jsonThrows?: boolean
}) {
  const headers = new Headers()
  if (opts.authorization !== undefined) {
    headers.set("authorization", opts.authorization)
  }
  return {
    headers,
    json: opts.jsonThrows
      ? vi.fn().mockRejectedValue(new SyntaxError("bad json"))
      : vi.fn().mockResolvedValue(opts.body),
  } as never
}

const validBody = {
  studentId: "stu-1",
  geofenceId: "gf-1",
  eventType: "ENTER" as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: not rate-limited (Redis-authoritative async check allows).
  vi.mocked(checkRateLimitAsync).mockResolvedValue({
    allowed: true,
    remaining: 119,
    resetTime: 0,
  })
  // Default: valid token resolving to TOKEN_SCHOOL.
  vi.mocked(verifyApiToken).mockResolvedValue({
    ok: true,
    token: { id: TOKEN_ID, schoolId: TOKEN_SCHOOL, scopes: [SCOPE] },
  } as never)
})

describe("POST /api/transportation/geofence-boarding", () => {
  it("returns the 429 rate-limit response (and skips token verify) when over the limit", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: 12345,
    })
    const limited = new Response(null, { status: 429 })
    vi.mocked(createRateLimitResponse).mockReturnValue(limited)

    const res = await POST(
      makeRequest({ authorization: "Bearer abcd.secret", body: validBody })
    )

    expect(res).toBe(limited)
    expect(createRateLimitResponse).toHaveBeenCalledWith(12345)
    // Rate limit gates BEFORE auth + bridge — neither should run.
    expect(verifyApiToken).not.toHaveBeenCalled()
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("returns 401 MISSING_API_TOKEN when no Bearer header is present", async () => {
    const res = await POST(makeRequest({ body: validBody }))
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "MISSING_API_TOKEN",
    })
    // verifyApiToken should never be consulted without a bearer match.
    expect(verifyApiToken).not.toHaveBeenCalled()
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("returns 403 INSUFFICIENT_SCOPE when the token lacks the scope", async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({
      ok: false,
      reason: "INSUFFICIENT_SCOPE",
    } as never)
    const res = await POST(
      makeRequest({ authorization: "Bearer abcd.secret", body: validBody })
    )
    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "INSUFFICIENT_SCOPE",
    })
    expect(verifyApiToken).toHaveBeenCalledWith("abcd.secret", SCOPE)
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("returns 401 INVALID_API_TOKEN when verification fails as invalid", async () => {
    vi.mocked(verifyApiToken).mockResolvedValue({
      ok: false,
      reason: "INVALID_API_TOKEN",
    } as never)
    const res = await POST(
      makeRequest({ authorization: "Bearer zzzz.nope", body: validBody })
    )
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "INVALID_API_TOKEN",
    })
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("returns 400 INVALID_JSON when the body cannot be parsed", async () => {
    const res = await POST(
      makeRequest({ authorization: "Bearer good.token", jsonThrows: true })
    )
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: "INVALID_JSON",
    })
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it("returns 400 VALIDATION_ERROR on a malformed body (missing studentId / bad eventType)", async () => {
    const res = await POST(
      makeRequest({
        authorization: "Bearer good.token",
        body: { geofenceId: "gf-1", eventType: "WALK" },
      })
    )
    expect(res.status).toBe(400)
    const json = (await res.json()) as { ok: boolean; error: string }
    expect(json.ok).toBe(false)
    expect(json.error).toBe("VALIDATION_ERROR")
    expect(recordBoardingFromGeofenceInternal).not.toHaveBeenCalled()
  })

  it.each([
    "ROUTE_NOT_FOUND",
    "ROUTE_ASSIGNMENT_NOT_FOUND",
    "TRIP_INVALID_STATE",
  ])("acks (200, ack:true) for non-retryable bridge code %s", async (code) => {
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue({
      success: false,
      error: code,
    } as never)
    const res = await POST(
      makeRequest({ authorization: "Bearer good.token", body: validBody })
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      code,
      ack: true,
    })
  })

  it("returns 500 (ack:false) for other internal-bridge error codes", async () => {
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue({
      success: false,
      error: "BOARDING_UPDATE_FAILED",
    } as never)
    const res = await POST(
      makeRequest({ authorization: "Bearer good.token", body: validBody })
    )
    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({
      ok: false,
      code: "BOARDING_UPDATE_FAILED",
      ack: false,
    })
  })

  it("returns 200 ok:true with boardingId + tripId on the success path", async () => {
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue({
      success: true,
      data: { id: "board-1" },
      tripId: "trip-9",
    } as never)
    const res = await POST(
      makeRequest({ authorization: "Bearer good.token", body: validBody })
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      ok: true,
      data: { boardingId: "board-1", tripId: "trip-9" },
    })
    // recordedBy is derived from the token id, not the request.
    expect(recordBoardingFromGeofenceInternal).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "stu-1",
        geofenceId: "gf-1",
        eventType: "ENTER",
        recordedBy: `system:api-token:${TOKEN_ID}`,
      })
    )
  })

  it("CRITICAL: schoolId is taken from the verified token and a body-supplied schoolId is ignored", async () => {
    vi.mocked(recordBoardingFromGeofenceInternal).mockResolvedValue({
      success: true,
      data: { id: "board-2" },
      tripId: "trip-2",
    } as never)
    const res = await POST(
      makeRequest({
        authorization: "Bearer good.token",
        // Attacker-supplied schoolId in the body — MUST NOT be honored.
        body: { ...validBody, schoolId: "attacker-school" },
      })
    )
    expect(res.status).toBe(200)
    expect(recordBoardingFromGeofenceInternal).toHaveBeenCalledTimes(1)
    const callArg = vi.mocked(recordBoardingFromGeofenceInternal).mock
      .calls[0][0]
    expect(callArg.schoolId).toBe(TOKEN_SCHOOL)
    expect(callArg.schoolId).not.toBe("attacker-school")
  })
})
