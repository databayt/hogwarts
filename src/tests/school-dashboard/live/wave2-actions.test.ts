// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Wave-2 gap fixes: settings update, host kick, recurring-link carry-forward.

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { kickParticipant } from "@/components/school-dashboard/live/actions/moderation"
import { carryForwardConferenceLinks } from "@/components/school-dashboard/live/actions/recurring"
import { updateConferenceSettings } from "@/components/school-dashboard/live/actions/settings"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn(), update: vi.fn() },
    conference: { findFirst: vi.fn() },
    conferenceParticipant: { findFirst: vi.fn(), updateMany: vi.fn() },
    conferenceLink: { findMany: vi.fn(), createMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    term: { findFirst: vi.fn() },
  },
}))
const removeParticipant = vi.fn(async () => undefined)
const isLiveKitConfigured = vi.fn(() => true)
vi.mock("@/components/school-dashboard/live/livekit/rooms", () => ({
  removeParticipant: (...a: unknown[]) => removeParticipant(...a),
}))
vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  isLiveKitConfigured: () => isLiveKitConfigured(),
}))

const SCHOOL = "sch1"

function asRole(role: string, id = "u1") {
  vi.mocked(auth).mockResolvedValue({ user: { id, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  isLiveKitConfigured.mockReturnValue(true)
})

describe("updateConferenceSettings", () => {
  const valid = {
    conferenceRetentionDays: 60,
    conferenceMaxConcurrent: 30,
    conferenceMaxDuration: 90,
    conferenceRecordingDefault: false,
  }

  it("ADMIN with valid input → updates the school row", async () => {
    asRole("ADMIN")
    vi.mocked(db.school.update).mockResolvedValue({} as never)
    const res = await updateConferenceSettings(valid)
    expect("success" in res && res.success).toBe(true)
    expect(db.school.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SCHOOL },
        // The action normalises the "not set" fields to null on the way in —
        // an empty string is the admin CLEARING a value, never a value.
        data: expect.objectContaining(valid),
      })
    )
  })

  it("clearing the window start clears the whole window", async () => {
    // How a school comes back off the emergency switch: there is no separate
    // "cancel closure" verb to forget to call. An `until` or a reason with no
    // start is meaningless and must not linger.
    asRole("ADMIN")
    vi.mocked(db.school.update).mockResolvedValue({} as never)
    await updateConferenceSettings({
      ...valid,
      conferenceOnlineFrom: "",
      conferenceOnlineUntil: "2026-03-20",
      conferenceOnlineNote: "flooding",
    })
    const data = vi.mocked(db.school.update).mock.calls[0]?.[0]?.data as Record<
      string,
      unknown
    >
    expect(data.conferenceOnlineFrom).toBeNull()
    expect(data.conferenceOnlineUntil).toBeNull()
    expect(data.conferenceOnlineNote).toBeNull()
  })

  it("stores a window day as an instant inside that day in the SCHOOL's zone", async () => {
    // Stored at noon, not midnight: a midnight instant can be pushed across
    // the date line by any later rounding or offset read, silently moving the
    // window by a day.
    asRole("ADMIN")
    vi.mocked(db.school.update).mockResolvedValue({} as never)
    await updateConferenceSettings({
      ...valid,
      conferenceOnlineFrom: "2026-03-10",
    })
    const data = vi.mocked(db.school.update).mock.calls[0]?.[0]?.data as Record<
      string,
      unknown
    >
    const from = data.conferenceOnlineFrom as Date
    expect(from).toBeInstanceOf(Date)
    expect(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Khartoum",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(from)
    ).toBe("2026-03-10")
  })

  it("invalid input (out of range) → VALIDATION_ERROR, no write", async () => {
    asRole("ADMIN")
    const res = await updateConferenceSettings({
      ...valid,
      conferenceMaxDuration: 9999,
    })
    expect("success" in res && res.success).toBe(false)
    expect(db.school.update).not.toHaveBeenCalled()
  })

  it("STUDENT → unauthorized, no write", async () => {
    asRole("STUDENT")
    const res = await updateConferenceSettings(valid)
    expect("success" in res && res.success).toBe(false)
    expect(db.school.update).not.toHaveBeenCalled()
  })
})

describe("kickParticipant", () => {
  it("ADMIN → removes from SFU + marks participant removed", async () => {
    asRole("ADMIN")
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      roomName: "sch-sch1-lc-s1",
      teacherId: "t9",
    } as never)
    vi.mocked(db.conferenceParticipant.findFirst).mockResolvedValue({
      id: "p1",
    } as never)
    vi.mocked(db.conferenceParticipant.updateMany).mockResolvedValue(
      {} as never
    )
    const res = await kickParticipant("s1", "victim")
    expect("success" in res && res.success).toBe(true)
    expect(removeParticipant).toHaveBeenCalledWith("sch-sch1-lc-s1", "victim")
    expect(db.conferenceParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "removed" }),
      })
    )
  })

  it("LiveKit not configured → NOT_IMPLEMENTED", async () => {
    asRole("ADMIN")
    isLiveKitConfigured.mockReturnValue(false)
    const res = await kickParticipant("s1", "victim")
    expect("success" in res && res.success).toBe(false)
    expect(removeParticipant).not.toHaveBeenCalled()
  })

  it("TEACHER kicking another teacher's session → UNAUTHORIZED", async () => {
    asRole("TEACHER", "u-teacher")
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      roomName: "sch-sch1-lc-s1",
      teacherId: "t-owner",
    } as never)
    vi.mocked(db.teacher.findFirst).mockResolvedValue({
      id: "t-other",
    } as never)
    const res = await kickParticipant("s1", "victim")
    expect("success" in res && res.success).toBe(false)
    expect(removeParticipant).not.toHaveBeenCalled()
  })
})

describe("carryForwardConferenceLinks", () => {
  it("clones links to the next term, skipping ones that already exist", async () => {
    asRole("ADMIN")
    // Both terms must resolve to this school before the clone proceeds.
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "term-x" } as never)
    vi.mocked(db.conferenceLink.findMany)
      .mockResolvedValueOnce([
        {
          subjectId: "su1",
          sectionId: "se1",
          provider: "external",
          meetingUrl: "u1",
          meetingProvider: null,
        },
        {
          subjectId: "su2",
          sectionId: "se2",
          provider: "external",
          meetingUrl: "u2",
          meetingProvider: null,
        },
      ] as never) // source (fromTerm)
      .mockResolvedValueOnce([{ subjectId: "su1", sectionId: "se1" }] as never) // existing (toTerm)
    vi.mocked(db.conferenceLink.createMany).mockResolvedValue({
      count: 1,
    } as never)

    const res = await carryForwardConferenceLinks("term-1", "term-2")
    expect("success" in res && res.success).toBe(true)
    if ("success" in res && res.success) {
      expect(res.data.created).toBe(1) // only su2/se2 (su1/se1 already exists)
    }
    // One batched insert; skipDuplicates absorbs the concurrent-create race.
    expect(db.conferenceLink.createMany).toHaveBeenCalledTimes(1)
    expect(db.conferenceLink.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ subjectId: "su2", termId: "term-2" })],
        skipDuplicates: true,
      })
    )
  })

  it("same from/to term → VALIDATION_ERROR", async () => {
    asRole("ADMIN")
    const res = await carryForwardConferenceLinks("term-1", "term-1")
    expect("success" in res && res.success).toBe(false)
    expect(db.conferenceLink.findMany).not.toHaveBeenCalled()
  })
})
