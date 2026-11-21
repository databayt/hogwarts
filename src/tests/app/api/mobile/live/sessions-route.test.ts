// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// A grade supervisor (homeroom teacher) sees her sections' sessions flagged
// `supervising: true` on the phone — and only those.

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { authenticate } from "@/app/api/mobile/lib/authenticate"
import { GET } from "@/app/api/mobile/live/sessions/route"

vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    teacher: { findFirst: vi.fn() },
    conference: { count: vi.fn(), findMany: vi.fn() },
  },
}))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn(async () => ({})),
}))
vi.mock("@/lib/name-utils", () => ({
  displayName: (t: { firstName: string }) => t.firstName,
}))
vi.mock("@/components/school-dashboard/live/demo-clock", () => ({
  ensureDemoClock: vi.fn(),
}))
const sharedRooms = vi.hoisted(() => ({ ids: [] as string[] }))
vi.mock("@/components/school-dashboard/live/combined", () => ({
  sharedRoomSlotIds: vi.fn(async () => sharedRooms.ids),
}))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  resolveViewerSectionScope: vi.fn(async () => "all"),
  buildLiveClassWhere: vi.fn(() => ({})),
  resolveSupervisedSectionIds: vi.fn(async () => ["sec-mine"]),
}))

const row = (id: string, teacherId: string, sectionId: string) => ({
  id,
  title: id,
  isPractice: false,
  status: "scheduled",
  scheduledStart: new Date("2026-11-16T08:00:00Z"),
  scheduledEnd: new Date("2026-11-16T09:00:00Z"),
  actualStart: null,
  actualEnd: null,
  provider: "livekit",
  meetingUrl: null,
  visibility: "section",
  subject: null,
  section: { id: sectionId, name: sectionId, grade: null },
  teacher: {
    id: teacherId,
    firstName: teacherId,
    middleName: null,
    lastName: "x",
    profilePhotoUrl: null,
  },
  recordings: [],
})

const req = () =>
  new NextRequest("http://x/api/mobile/live/sessions?window=today", {
    headers: { authorization: "Bearer t" },
  })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authenticate).mockResolvedValue({
    userId: "u1",
    email: "u@e.com",
    schoolId: "school-1",
    role: "TEACHER",
  })
  vi.mocked(db.school.findUnique).mockResolvedValue({ domain: "x" } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t-me" } as never)
  vi.mocked(db.conference.count).mockResolvedValue(3 as never)
  vi.mocked(db.conference.findMany).mockResolvedValue([
    row("own", "t-me", "sec-other"),
    row("covered", "t-other", "sec-mine"),
    row("elsewhere", "t-other", "sec-not-mine"),
  ] as never)
})

describe("GET /api/mobile/live/sessions — supervising flag", () => {
  it("flags another teacher's session in a supervised section, and nothing else", async () => {
    const body = await (await GET(req())).json()
    const flag = Object.fromEntries(
      body.data.map((d: { id: string; supervising: boolean }) => [
        d.id,
        d.supervising,
      ])
    )
    expect(flag).toEqual({ own: false, covered: true, elsewhere: false })
    expect(body.total).toBe(3)
  })

  it("never flags for a non-teacher", async () => {
    vi.mocked(authenticate).mockResolvedValue({
      userId: "u1",
      email: "u@e.com",
      schoolId: "school-1",
      role: "ADMIN",
    })
    const body = await (await GET(req())).json()
    expect(
      body.data.every((d: { supervising: boolean }) => !d.supervising)
    ).toBe(true)
  })
})

describe("GET /api/mobile/live/sessions — make-up classes (additive fields)", () => {
  it("adds is_makeup / makeup_for / made_up_by and keeps every existing field", async () => {
    vi.mocked(db.conference.findMany).mockResolvedValue([
      {
        ...row("makeup", "t-me", "sec-mine"),
        makeupForId: "missed-1",
        makeupFor: { id: "missed-1", scheduledStart: new Date("2026-11-13T08:00:00Z") },
        makeups: [],
      },
      {
        ...row("missed", "t-me", "sec-mine"),
        status: "cancelled",
        makeupForId: null,
        makeupFor: null,
        makeups: [{ id: "makeup", scheduledStart: new Date("2026-11-16T08:00:00Z") }],
      },
      row("plain", "t-me", "sec-mine"), // an old-shaped row: none of the new fields
    ] as never)
    const body = await (await GET(req())).json()
    const byId = Object.fromEntries(body.data.map((d: { id: string }) => [d.id, d]))

    expect(byId.makeup.is_makeup).toBe(true)
    expect(byId.makeup.makeup_for).toEqual({
      id: "missed-1",
      scheduled_start: "2026-11-13T08:00:00.000Z",
    })
    expect(byId.makeup.made_up_by).toBeNull()

    expect(byId.missed.is_makeup).toBe(false)
    expect(byId.missed.made_up_by).toEqual({
      id: "makeup",
      scheduled_start: "2026-11-16T08:00:00.000Z",
    })

    expect(byId.plain.is_makeup).toBe(false)
    expect(byId.plain.makeup_for).toBeNull()
    expect(byId.plain.made_up_by).toBeNull()

    // Additive only: the fields the app already reads are all still there.
    for (const key of [
      "id",
      "title",
      "is_practice",
      "status",
      "scheduled_start",
      "scheduled_end",
      "actual_start",
      "actual_end",
      "provider",
      "meeting_url",
      "visibility",
      "subject",
      "section",
      "teacher",
      "has_recording",
      "supervising",
    ]) {
      expect(byId.plain, key).toHaveProperty(key)
    }
  })

  it("selects the make-up links, school-scoped through the list's own where", async () => {
    await GET(req())
    const select = vi.mocked(db.conference.findMany).mock.calls[0][0]?.select as Record<
      string,
      unknown
    >
    expect(select.makeupForId).toBe(true)
    expect(select.makeupFor).toEqual({ select: { id: true, scheduledStart: true } })
    expect(select.makeups).toMatchObject({
      take: 1,
      where: { deletedAt: null, status: { in: ["scheduled", "live", "ended"] } },
    })
  })
})
