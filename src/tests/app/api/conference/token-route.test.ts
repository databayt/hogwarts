// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { checkUserRateLimit } from "@/lib/rate-limit"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"
import { GET } from "@/app/api/conference/token/route"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/rate-limit", () => ({
  checkUserRateLimit: vi.fn(),
  RATE_LIMITS: { LUMOS_MEDIA: { windowMs: 60_000, maxRequests: 40 } },
}))
vi.mock("@/components/school-dashboard/live/actions/join-core", () => ({
  performLiveClassJoin: vi.fn(),
}))

function req(sessionId?: string) {
  const url = sessionId
    ? `http://x/api/conference/token?sessionId=${encodeURIComponent(sessionId)}`
    : "http://x/api/conference/token"
  return new NextRequest(url)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-1", role: "TEACHER" },
  } as never)
  vi.mocked(checkUserRateLimit).mockResolvedValue({
    allowed: true,
    remaining: 39,
    resetTime: Date.now() + 60_000,
  })
})

describe("GET /api/conference/token", () => {
  it("400s with VALIDATION_ERROR when sessionId is missing, before any auth/DB work", async () => {
    const res = await GET(req())
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      success: false,
      error: "VALIDATION_ERROR",
    })
    expect(checkUserRateLimit).not.toHaveBeenCalled()
    expect(performLiveClassJoin).not.toHaveBeenCalled()
  })

  it("rate-limits per user+session and never reaches performLiveClassJoin when exceeded", async () => {
    vi.mocked(checkUserRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 30_000,
    })
    const res = await GET(req("s1"))
    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({
      success: false,
      error: "RATE_LIMITED",
    })
    expect(checkUserRateLimit).toHaveBeenCalledWith(
      "u-1:s1",
      expect.objectContaining({ maxRequests: 40 }),
      "conference-token"
    )
    expect(performLiveClassJoin).not.toHaveBeenCalled()
  })

  it("keys the limiter by 'anon:<sessionId>' when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "NOT_AUTHENTICATED",
    } as never)
    await GET(req("s1"))
    expect(checkUserRateLimit).toHaveBeenCalledWith(
      "anon:s1",
      expect.anything(),
      "conference-token"
    )
  })

  it("calls performLiveClassJoin with allowAutoStart:false — the refresh route never starts a room", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: true,
      data: { token: "t", wsUrl: "ws://x" },
    } as never)
    const res = await GET(req("s1"))
    expect(performLiveClassJoin).toHaveBeenCalledWith("s1", {
      allowAutoStart: false,
    })
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe("no-store")
  })

  it("maps NOT_AUTHENTICATED to 401", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "NOT_AUTHENTICATED",
    } as never)
    const res = await GET(req("s1"))
    expect(res.status).toBe(401)
  })

  it("maps LIVE_CLASS_PARTICIPANT_DENIED to 403 — a kicked participant is refused", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_PARTICIPANT_DENIED",
    } as never)
    const res = await GET(req("s1"))
    expect(res.status).toBe(403)
  })

  it("keeps every other error code in-band at 200 (e.g. LIVE_CLASS_INVALID_STATE)", async () => {
    vi.mocked(performLiveClassJoin).mockResolvedValue({
      success: false,
      error: "LIVE_CLASS_INVALID_STATE",
    } as never)
    const res = await GET(req("s1"))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: false,
      error: "LIVE_CLASS_INVALID_STATE",
    })
  })
})
