// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  notifyClassCancelled,
  notifyClassScheduled,
} from "@/components/school-dashboard/conference/actions/notifications"
import {
  createLiveClass,
  updateLiveClass,
} from "@/components/school-dashboard/conference/list-actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/conference/list-permissions", () => ({
  canManageLiveClasses: vi.fn(() => true),
  canDeleteLiveClasses: vi.fn(() => true),
}))
vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
    section: { findFirst: vi.fn() },
    conference: { create: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
    conferenceLink: { upsert: vi.fn() },
  },
}))
// create/update/delete fire best-effort `void` notifications — stub them so the
// real fan-out doesn't touch the db mock (it would log a caught error).
vi.mock(
  "@/components/school-dashboard/conference/actions/notifications",
  () => ({
    notifyClassScheduled: vi.fn(async () => ({ created: 0 })),
    notifyClassCancelled: vi.fn(async () => ({ created: 0 })),
  })
)

const SCHOOL = "school-1"

const baseInput = {
  title: "Algebra review",
  teacherId: "t-1",
  subjectId: "sub-1",
  sectionId: "sec-1",
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  meetingProvider: "Google Meet",
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-01"),
  startTime: "09:00",
  endTime: "10:00",
  status: "scheduled" as const,
  description: "",
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-admin", role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as never)
  vi.mocked(resolveActiveTerm).mockResolvedValue({
    term: { id: "term-1" },
  } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t-1" } as never)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    conferenceRecordingDefault: true,
    conferenceMaxDuration: 240,
    timezone: "Asia/Dubai",
  } as never)
  vi.mocked(db.section.findFirst).mockResolvedValue({
    conferenceRecordingOptOut: false,
  } as never)
  vi.mocked(db.conference.create).mockResolvedValue({
    id: "lcs-1",
  } as never)
  vi.mocked(db.conferenceLink.upsert).mockResolvedValue({} as never)
})

describe("createLiveClass — saveAsDefault", () => {
  it("upserts the recurring ConferenceLink keyed by school+subject+section+term", async () => {
    const result = await createLiveClass({ ...baseInput, saveAsDefault: true })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_subjectId_sectionId_termId: {
            schoolId: SCHOOL,
            subjectId: "sub-1",
            sectionId: "sec-1",
            termId: "term-1",
          },
        },
        create: expect.objectContaining({
          provider: "external",
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
        update: expect.objectContaining({
          meetingUrl: "https://meet.google.com/abc-defg-hij",
        }),
      })
    )
  })

  it("does NOT persist a default link when saveAsDefault is false", async () => {
    const result = await createLiveClass({ ...baseInput, saveAsDefault: false })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).not.toHaveBeenCalled()
  })

  it("does NOT persist a default link when subject or section is missing", async () => {
    const result = await createLiveClass({
      ...baseInput,
      subjectId: null,
      saveAsDefault: true,
    })
    expect(result.success).toBe(true)
    expect(db.conferenceLink.upsert).not.toHaveBeenCalled()
  })

  it("still creates the session if the default-link upsert throws (best-effort)", async () => {
    vi.mocked(db.conferenceLink.upsert).mockRejectedValue(new Error("db down"))
    const result = await createLiveClass({ ...baseInput, saveAsDefault: true })
    expect(result.success).toBe(true)
    expect(db.conference.create).toHaveBeenCalled()
  })
})

describe("createLiveClass — school-timezone schedule combine", () => {
  it("stores the wall time as the SCHOOL-TZ instant, not the server's", async () => {
    // School is Asia/Dubai (+04): 09:00 wall on 2026-06-01 → 05:00Z. The old
    // setHours() combine would have stored 09:00 in the server TZ instead.
    const result = await createLiveClass({ ...baseInput })
    expect(result.success).toBe(true)
    const createArgs = vi.mocked(db.conference.create).mock.calls[0][0] as {
      data: { scheduledStart: Date; scheduledEnd: Date }
    }
    expect(createArgs.data.scheduledStart.toISOString()).toBe(
      "2026-06-01T05:00:00.000Z"
    )
    expect(createArgs.data.scheduledEnd.toISOString()).toBe(
      "2026-06-01T06:00:00.000Z"
    )
  })
})

describe("updateLiveClass — status transitions + change-scoped notifications", () => {
  const EXISTING_START = new Date("2026-06-01T05:00:00.000Z")
  const EXISTING_END = new Date("2026-06-01T06:00:00.000Z")

  function existingRow(overrides: Record<string, unknown> = {}) {
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      status: "scheduled",
      provider: "external",
      actualEnd: null,
      scheduledStart: EXISTING_START,
      scheduledEnd: EXISTING_END,
      ...overrides,
    } as never)
    vi.mocked(db.conference.updateMany).mockResolvedValue({
      count: 1,
    } as never)
  }

  it("rejects resurrecting an ended session back to scheduled", async () => {
    existingRow({ status: "ended" })
    const result = await updateLiveClass({ id: "lcs-1", status: "scheduled" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("LIVE_CLASS_INVALID_STATE")
    }
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })

  it("rejects flipping a session to live (room lifecycle owns that)", async () => {
    existingRow({ status: "scheduled" })
    const result = await updateLiveClass({ id: "lcs-1", status: "live" })
    expect(result.success).toBe(false)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })

  it("allows scheduled → cancelled and sends the cancel notice", async () => {
    existingRow({ status: "scheduled" })
    const result = await updateLiveClass({ id: "lcs-1", status: "cancelled" })
    expect(result.success).toBe(true)
    expect(db.conference.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    )
    expect(notifyClassCancelled).toHaveBeenCalledWith(SCHOOL, "lcs-1")
    expect(notifyClassScheduled).not.toHaveBeenCalled()
  })

  it("blocks live → ended for a LiveKit session (must go through endLiveClass)", async () => {
    existingRow({ status: "live", provider: "livekit" })
    const result = await updateLiveClass({ id: "lcs-1", status: "ended" })
    expect(result.success).toBe(false)
    expect(db.conference.updateMany).not.toHaveBeenCalled()
  })

  it("allows live → ended for an external session and stamps actualEnd", async () => {
    existingRow({ status: "live", provider: "external" })
    const result = await updateLiveClass({ id: "lcs-1", status: "ended" })
    expect(result.success).toBe(true)
    const args = vi.mocked(db.conference.updateMany).mock.calls[0][0] as {
      data: { status: string; actualEnd: Date }
    }
    expect(args.data.status).toBe("ended")
    expect(args.data.actualEnd).toBeInstanceOf(Date)
  })

  it("treats a same-status submit as a no-op (edit form always sends status)", async () => {
    existingRow({ status: "scheduled" })
    const result = await updateLiveClass({ id: "lcs-1", status: "scheduled" })
    expect(result.success).toBe(true)
    const args = vi.mocked(db.conference.updateMany).mock.calls[0][0] as {
      data: Record<string, unknown>
    }
    expect(args.data.status).toBeUndefined()
    expect(notifyClassScheduled).not.toHaveBeenCalled()
    expect(notifyClassCancelled).not.toHaveBeenCalled()
  })

  it("does NOT re-notify the roster on a title-only edit", async () => {
    existingRow()
    const result = await updateLiveClass({ id: "lcs-1", title: "New title" })
    expect(result.success).toBe(true)
    expect(notifyClassScheduled).not.toHaveBeenCalled()
  })

  it("recomputes a moved schedule in the school TZ and re-notifies", async () => {
    existingRow()
    const result = await updateLiveClass({
      id: "lcs-1",
      startDate: new Date("2026-06-02"),
      startTime: "09:00",
    })
    expect(result.success).toBe(true)
    const args = vi.mocked(db.conference.updateMany).mock.calls[0][0] as {
      data: { scheduledStart: Date }
    }
    // 09:00 Asia/Dubai on 2026-06-02 → 05:00Z; a moved boundary notifies.
    expect(args.data.scheduledStart.toISOString()).toBe(
      "2026-06-02T05:00:00.000Z"
    )
    expect(notifyClassScheduled).toHaveBeenCalledWith(SCHOOL, "lcs-1")
  })

  it("keeps the existing wall time (school TZ) when only the date changes", async () => {
    existingRow() // existing start 05:00Z = 09:00 Dubai
    const result = await updateLiveClass({
      id: "lcs-1",
      startDate: new Date("2026-06-03"),
    })
    expect(result.success).toBe(true)
    const args = vi.mocked(db.conference.updateMany).mock.calls[0][0] as {
      data: { scheduledStart: Date }
    }
    // Same 09:00 Dubai wall time, new day → 2026-06-03T05:00:00.000Z.
    expect(args.data.scheduledStart.toISOString()).toBe(
      "2026-06-03T05:00:00.000Z"
    )
  })
})
