// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { checkUserRateLimit } from "@/lib/rate-limit"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"
import { GET } from "@/app/api/mobile/conference/[id]/join/route"
import { authenticate, isAuthError } from "@/app/api/mobile/lib/authenticate"

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn(),
  RATE_LIMITS: { LUMOS_MEDIA: { windowMs: 60_000, maxRequests: 40 } },
}))
vi.mock("@/components/school-dashboard/live/actions/join-core", () => ({
  performLiveClassJoin: vi.fn(),
}))

const SCHOOL = "school-1"
const USER = "user-1"
const SESSION = "s1"

function req() {
  return new NextRequest(`http://x/api/mobile/conference/${SESSION}/join`, {
    headers: { authorization: "Bearer t" },
  })
}
const params = Promise.resolve({ id: SESSION })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authenticate).mockResolvedValue({
    userId: USER,
    email: "u@e.com",
    schoolId: SCHOOL,
    role: "STUDENT",
  })
  vi.mocked(checkUserRateLimit).mockResolvedValue({
    allowed: true,
    remaining: 39,
    resetTime: Date.now() + 60_000,
  })
})

describe("GET /api/mobile/conference/[id]/join", () => {
  it("401s (via authenticate's own response) on a missing/invalid Bearer token, before any rate-limit or join work", async () => {
    const unauthorized = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401 }
    )
    vi.mocked(authenticate).mockResolvedValue(unauthorized as never)
    vi.mocked(isAuthError).mockReturnValueOnce(true)

    const res = await GET(req(), { params })

    expect(res.status).toBe(401)
    expect(checkUserRateLimit).not.toHaveBeenCalled()
    expect(performLiveClassJoin).not.toHaveBeenCalled()
  })

  it("passes the JWT-decoded identity through as `actor` — bypasses cookie/tenant resolution entirely", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: true,
      data: { token: "t", wsUrl: "ws://x" },
    } as never)

    const res = await GET(req(), { params })

    expect(performLiveClassJoin).toHaveBeenCalledWith(SESSION, {
      actor: { userId: USER, role: "STUDENT", schoolId: SCHOOL },
    })
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  it("rate-limits per user+session, keyed off the JWT actor — never reaches performLiveClassJoin when exceeded", async () => {
    vi.mocked(checkUserRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 30_000,
    })

    const res = await GET(req(), { params })

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      success: false,
      error: "RATE_LIMITED",
    })
    expect(checkUserRateLimit).toHaveBeenCalledWith(
      `${USER}:${SESSION}`,
      expect.objectContaining({ maxRequests: 40 }),
      "conference-mobile-join"
    )
    expect(performLiveClassJoin).not.toHaveBeenCalled()
  })

  it("maps LIVE_CLASS_NOT_FOUND to 404", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_NOT_FOUND",
    } as never)
    const res = await GET(req(), { params })
    expect(res.status).toBe(404)
  })

  it("maps LIVE_CLASS_PARTICIPANT_DENIED to 403", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_PARTICIPANT_DENIED",
    } as never)
    const res = await GET(req(), { params })
    expect(res.status).toBe(403)
  })

  it("keeps an external session's LIVE_CLASS_INVALID_STATE in-band at 200 — the mobile client switches on `error`, not the HTTP status", async () => {
    // join-core rejects any non-livekit provider with LIVE_CLASS_INVALID_STATE
    // (an external session IS its meeting URL, not something to mint a ticket
    // for) — this route does not special-case it into an HTTP error status.
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_INVALID_STATE",
    } as never)
    const res = await GET(req(), { params })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: false,
      error: "LIVE_CLASS_INVALID_STATE",
    })
  })
})
