// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { rateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"

import { GET } from "../route"

vi.mock("@/lib/db", () => ({
  db: {
    classroom: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(),
  RATE_LIMITS: { API: { requests: 60, window: 60 } },
}))
vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))
vi.mock("@/lib/auth-security", () => ({
  createErrorResponse: (err: unknown) =>
    new Response(JSON.stringify({ error: String(err) }), { status: 500 }),
}))

function makeRequest() {
  return new Request(
    "http://localhost:3000/api/classrooms"
  ) as unknown as import("next/server").NextRequest
}

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(rateLimit).mockResolvedValue(null) // not rate-limited
})

describe("GET /api/classrooms", () => {
  it("returns rooms scoped to the resolved schoolId", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as any)
    vi.mocked(db.classroom.findMany).mockResolvedValue([
      { id: "r1", roomName: "A101" },
    ] as any)

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ classrooms: [{ id: "r1", roomName: "A101" }] })
    expect(vi.mocked(db.classroom.findMany)).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL },
      select: { id: true, roomName: true },
    })
  })

  it("returns an empty list (200) when schoolId is missing — graceful degradation", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({ schoolId: null } as any)

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ classrooms: [] })
    expect(vi.mocked(db.classroom.findMany)).not.toHaveBeenCalled()
  })

  it("propagates the rate-limit response when the limiter returns one", async () => {
    const limited = new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
    })
    vi.mocked(rateLimit).mockResolvedValue(limited as unknown as Response)

    const res = await GET(makeRequest())

    expect(res.status).toBe(429)
    expect(vi.mocked(getTenantContext)).not.toHaveBeenCalled()
    expect(vi.mocked(db.classroom.findMany)).not.toHaveBeenCalled()
  })

  it("returns 500 (via createErrorResponse) when the database throws", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as any)
    vi.mocked(db.classroom.findMany).mockRejectedValue(new Error("db down"))

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
  })
})
