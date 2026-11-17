// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The Android timetable for a SIBLING section of a combined class: its slot has
// no room of its own, so live_class.session_id must be the PRIMARY slot's room —
// the one the teacher is in — and the student then joins it through
// /api/mobile/conference/{id}/join (join-core admits every section of the group).

import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { authenticate } from "@/app/api/mobile/lib/authenticate"
import { canAccessStudent } from "@/app/api/mobile/lib/student-access"
import { GET } from "@/app/api/mobile/timetable/[userId]/route"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    timetable: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
    conference: { findMany: vi.fn() },
    conferenceLink: { findMany: vi.fn() },
  },
}))
vi.mock("@/app/api/mobile/lib/authenticate", () => ({
  authenticate: vi.fn(),
  isAuthError: vi.fn((v: unknown) => v instanceof Response),
}))
vi.mock("@/app/api/mobile/lib/student-access", () => ({
  canAccessStudent: vi.fn(),
}))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(async () => ({
    term: { id: "term-1" },
    source: "x",
  })),
}))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn(async () => "full"),
}))
vi.mock("@/lib/name-utils", () => ({
  displayName: (t: { firstName: string }) => t.firstName,
}))
vi.mock("@/components/school-dashboard/live/day-window", () => ({
  DEFAULT_SCHOOL_TZ: "Africa/Khartoum",
  schoolDayOfWeek: vi.fn(() => 2),
  schoolDayWindow: vi.fn(() => ({
    start: new Date("2026-11-17T00:00:00Z"),
    end: new Date("2026-11-18T00:00:00Z"),
  })),
}))
vi.mock("@/components/school-dashboard/live/online-policy", () => ({
  resolveOnlinePolicies: vi.fn(
    async (_s: string, ids: string[]) =>
      new Map(ids.map((id) => [id, { online: true }]))
  ),
}))

const at = (h: number) => new Date(Date.UTC(1970, 0, 1, h))
const slot = (id: string, sectionId: string) => ({
  id,
  dayOfWeek: 2,
  subject: { id: "sub-1", name: "Maths" },
  teacher: { firstName: "T", middleName: null, lastName: "x" },
  section: { id: sectionId, name: sectionId, grade: { name: "G12" } },
  classroom: null,
  period: { id: "p", name: "P", startTime: at(19), endTime: at(20) },
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(authenticate).mockResolvedValue({
    userId: "u-sib",
    email: "s@e.com",
    schoolId: "school-1",
    role: "STUDENT",
  })
  vi.mocked(db.student.findFirst).mockResolvedValue({
    id: "stu",
    sectionId: "sec-sib",
  } as never)
  vi.mocked(canAccessStudent).mockResolvedValue(true)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "UTC",
  } as never)
  vi.mocked(db.conferenceLink.findMany).mockResolvedValue([] as never)
})

describe("GET /api/mobile/timetable/[userId] — combined class", () => {
  it("gives a sibling section's slot the primary slot's room as live_class.session_id", async () => {
    // The student's own slot (sibling), read first by the route.
    vi.mocked(db.timetable.findMany).mockImplementation((async (args: {
      where: Record<string, unknown>
    }) => {
      const w = args.where
      if (w.sectionId === "sec-sib") return [slot("tt-sib", "sec-sib")]
      // combinedPrimaryForSlots: first the slot's identity, then its peers.
      if (w.id && typeof w.id === "object") {
        return [
          { termId: "term-1", dayOfWeek: 2, weekOffset: 0, teacherId: "t-1" },
        ]
      }
      if (w.OR) {
        return [
          {
            id: "tt-primary",
            teacherId: "t-1",
            sectionId: "sec-prim",
            period: { startTime: at(19) },
          },
          {
            id: "tt-sib",
            teacherId: "t-1",
            sectionId: "sec-sib",
            period: { startTime: at(19) },
          },
        ]
      }
      return []
    }) as never)
    vi.mocked(db.conference.findMany).mockImplementation((async (args: {
      where: { timetableId?: { in?: string[] } }
    }) =>
      args.where.timetableId?.in?.includes("tt-primary")
        ? [
            {
              id: "room-primary",
              provider: "livekit",
              meetingUrl: null,
              status: "live",
              sectionId: "sec-prim",
              subjectId: "sub-1",
              timetableId: "tt-primary",
            },
          ]
        : []) as never)

    const res = await GET(
      new NextRequest("http://x/api/mobile/timetable/u-sib"),
      { params: Promise.resolve({ userId: "u-sib" }) }
    )
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data[0].id).toBe("tt-sib")
    expect(body.data[0].live_class).toEqual(
      expect.objectContaining({ session_id: "room-primary", status: "live" })
    )
  })
})
