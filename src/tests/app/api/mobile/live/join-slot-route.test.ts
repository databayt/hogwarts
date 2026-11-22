// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resolveSlotJoin } from "@/components/school-dashboard/live/actions/join-slot"
import { loadNextClassToday } from "@/components/school-dashboard/live/next-class"
import { GET } from "@/app/api/mobile/live/join-slot/[timetableId]/route"
import { authenticate } from "@/app/api/mobile/lib/authenticate"

vi.mock("server-only", () => ({}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/lib/db", () => ({
  db: { school: { findUnique: vi.fn(async () => ({ timezone: "Africa/Khartoum" })) } },
}))
vi.mock("@/components/school-dashboard/live/actions/join-slot", () => ({
  resolveSlotJoin: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/next-class", () => ({
  loadNextClassToday: vi.fn(),
}))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn(async () => ({
    liveClasses: {
      joinLink: {
        early: "Starts at {start}.",
        over: "Over today.",
      },
    },
  })),
}))

const params = Promise.resolve({ timetableId: "tt-1" })
const req = (qs = "?lang=en") =>
  new NextRequest(`http://x/api/mobile/live/join-slot/tt-1${qs}`, {
    headers: { authorization: "Bearer t" },
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authenticate).mockResolvedValue({
    userId: "u1",
    email: "a@b.c",
    schoolId: "sch1",
    role: "TEACHER",
  } as never)
  vi.mocked(loadNextClassToday).mockResolvedValue(null)
})

describe("GET /api/mobile/live/join-slot/:timetableId", () => {
  it("passes an auth failure straight through", async () => {
    vi.mocked(authenticate).mockResolvedValue(
      new Response("no", { status: 401 }) as never
    )
    const res = await GET(req(), { params })
    expect(res.status).toBe(401)
    expect(resolveSlotJoin).not.toHaveBeenCalled()
  })

  it("room → session_id, no next", async () => {
    vi.mocked(resolveSlotJoin).mockResolvedValue({
      kind: "room",
      sessionId: "s1",
    })
    const res = await GET(req(), { params })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ kind: "room", session_id: "s1" })
    expect(resolveSlotJoin).toHaveBeenCalledWith({
      schoolId: "sch1",
      userId: "u1",
      role: "TEACHER",
      timetableId: "tt-1",
    })
    expect(loadNextClassToday).not.toHaveBeenCalled()
  })

  it("early → times in the school's zone, a duration and the web sentence", async () => {
    vi.mocked(resolveSlotJoin).mockResolvedValue({
      kind: "early",
      opensAt: new Date("2026-11-08T13:50:00Z"),
      startsAt: new Date("2026-11-08T14:00:00Z"),
      opensInMs: 600_000,
    })
    const body = await (await GET(req(), { params })).json()
    expect(body).toMatchObject({
      kind: "early",
      opens_at: "2026-11-08T13:50:00.000Z",
      starts_at: "2026-11-08T14:00:00.000Z",
      opens_in_ms: 600_000,
    })
    // 14:00Z is 16:00 in Khartoum.
    expect(body.message).toMatch(/Starts at 0?4:00/)
    expect(body).not.toHaveProperty("next")
  })

  it("over → the sentence plus the next class", async () => {
    vi.mocked(resolveSlotJoin).mockResolvedValue({ kind: "over" })
    vi.mocked(loadNextClassToday).mockResolvedValue({
      timetableId: "tt-2",
      subject: "Maths",
      section: "7-A",
      startsAt: new Date("2026-11-08T14:55:00Z"),
      endsAt: new Date("2026-11-08T15:45:00Z"),
    })
    const body = await (await GET(req(), { params })).json()
    expect(body.kind).toBe("over")
    expect(body.message).toBe("Over today.")
    expect(body.next).toEqual({
      timetable_id: "tt-2",
      title: "Maths · 7-A",
      starts_at: "2026-11-08T14:55:00.000Z",
      ends_at: "2026-11-08T15:45:00.000Z",
    })
    expect(loadNextClassToday).toHaveBeenCalledWith(
      expect.objectContaining({ afterTimetableId: "tt-1" })
    )
  })

  it("over with nothing left today → next is null", async () => {
    vi.mocked(resolveSlotJoin).mockResolvedValue({ kind: "over" })
    const body = await (await GET(req(), { params })).json()
    expect(body.next).toBeNull()
  })

  it("forbidden → 403, not_found → 404", async () => {
    vi.mocked(resolveSlotJoin).mockResolvedValue({ kind: "forbidden" })
    expect((await GET(req(), { params })).status).toBe(403)
    vi.mocked(resolveSlotJoin).mockResolvedValue({ kind: "not_found" })
    expect((await GET(req(), { params })).status).toBe(404)
  })

  it("a thrown error → 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.mocked(resolveSlotJoin).mockRejectedValue(new Error("boom"))
    expect((await GET(req(), { params })).status).toBe(500)
  })
})
