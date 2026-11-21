// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// create-core.ts — the one create path of a live class. The existing callers'
// behaviour is covered by sessions.test.ts (they go through it); this file
// covers what the make-up core adds: the root link, an external copy, and the
// transaction mode (every read/write on the tx client, side effects deferred,
// failures re-thrown so the transaction rolls back).

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  afterLiveClassCreated,
  createLiveClassCore,
} from "@/components/school-dashboard/live/actions/create-core"
import { notifyClassScheduled } from "@/components/school-dashboard/live/actions/notifications"
import { isLiveKitConfigured } from "@/components/school-dashboard/live/livekit/client"
import { after } from "next/server"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    section: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    conference: { create: vi.fn(), update: vi.fn() },
    conferenceParticipant: { upsert: vi.fn() },
  },
}))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/translation/prewarm", () => ({ prewarm: vi.fn() }))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  liveListRevalidatePaths: () => ["/live-list"],
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassScheduled: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/livekit/client", () => ({
  isLiveKitConfigured: vi.fn(() => true),
}))
vi.mock("@/components/school-dashboard/live/livekit/room-naming", () => ({
  roomNameFor: (s: string, id: string) => `sch-${s}-lc-${id}`,
}))

const SCHOOL = "school-1"
const input = {
  title: "حصة تعويضية: Algebra",
  lang: "ar",
  teacherId: "t-1",
  sectionId: "sec-7",
  subjectId: "sub-1",
  scheduledStart: "2026-11-23T06:00:00.000Z",
  scheduledEnd: "2026-11-23T06:45:00.000Z",
}

function client() {
  return {
    school: {
      findUnique: vi.fn().mockResolvedValue({
        conferenceMaxDuration: 120,
        conferenceRecordingDefault: true,
        preferredLanguage: "ar",
      }),
    },
    section: { findFirst: vi.fn().mockResolvedValue({ conferenceRecordingOptOut: false }) },
    teacher: { findFirst: vi.fn().mockResolvedValue({ id: "t-1", userId: "u-1" }) },
    conference: {
      create: vi.fn().mockResolvedValue({ id: "c-1" }),
      update: vi.fn().mockResolvedValue({ id: "c-1", roomName: "sch-school-1-lc-c-1" }),
    },
    conferenceParticipant: { upsert: vi.fn().mockResolvedValue({}) },
  }
}

const asDb = (c: ReturnType<typeof client>) => c as unknown as typeof db

beforeEach(() => {
  vi.clearAllMocks()
  const c = client()
  Object.assign(db.school, c.school)
  Object.assign(db.section, c.section)
  Object.assign(db.teacher, c.teacher)
  Object.assign(db.conference, c.conference)
  Object.assign(db.conferenceParticipant, c.conferenceParticipant)
  vi.mocked(isLiveKitConfigured).mockReturnValue(true)
})

describe("createLiveClassCore", () => {
  it("creates, invites the host and registers the side effects (no transaction)", async () => {
    const res = await createLiveClassCore({ schoolId: SCHOOL }, input)
    expect(res).toMatchObject({ success: true, data: { id: "c-1" } })
    expect(vi.mocked(db.conference.create).mock.calls[0][0].data).toMatchObject({
      schoolId: SCHOOL,
      teacherId: "t-1",
      timetableId: null,
      sectionId: "sec-7",
    })
    expect(vi.mocked(db.conference.create).mock.calls[0][0].data).not.toHaveProperty(
      "makeupForId"
    )
    expect(db.conferenceParticipant.upsert).toHaveBeenCalled()
    expect(after).toHaveBeenCalledTimes(2) // notify + prewarm
  })

  it("writes the root as makeupForId", async () => {
    await createLiveClassCore({ schoolId: SCHOOL }, input, { makeupForId: "missed-1" })
    expect(vi.mocked(db.conference.create).mock.calls[0][0].data).toMatchObject({
      makeupForId: "missed-1",
      timetableId: null,
    })
  })

  it("copies an external class and needs no SFU for it", async () => {
    vi.mocked(isLiveKitConfigured).mockReturnValue(false)
    const res = await createLiveClassCore({ schoolId: SCHOOL }, input, {
      makeupForId: "missed-1",
      provider: "external",
      meetingUrl: "https://meet.example/abc",
      meetingProvider: "zoom",
    })
    expect(res.success).toBe(true)
    expect(vi.mocked(db.conference.create).mock.calls[0][0].data).toMatchObject({
      provider: "external",
      meetingUrl: "https://meet.example/abc",
      meetingProvider: "zoom",
    })
  })

  it("still refuses a LiveKit class when the SFU is not configured", async () => {
    vi.mocked(isLiveKitConfigured).mockReturnValue(false)
    expect(await createLiveClassCore({ schoolId: SCHOOL }, input)).toMatchObject({
      error: "LIVE_CLASS_PROVIDER_UNAVAILABLE",
    })
  })

  it("refuses a class over the school's maximum duration", async () => {
    const res = await createLiveClassCore(
      { schoolId: SCHOOL },
      { ...input, scheduledEnd: "2026-11-23T09:00:00.000Z" }
    )
    expect(res).toMatchObject({ error: "LIVE_CLASS_MAX_DURATION_EXCEEDED" })
    expect(db.conference.create).not.toHaveBeenCalled()
  })

  it("answers LIVE_CLASS_CREATE_FAILED on a db error", async () => {
    vi.mocked(db.conference.create).mockRejectedValue(new Error("down"))
    expect(await createLiveClassCore({ schoolId: SCHOOL }, input)).toMatchObject({
      error: "LIVE_CLASS_CREATE_FAILED",
    })
  })
})

describe("createLiveClassCore — inside a transaction", () => {
  it("uses the tx client only, registers nothing, and leaves the announcing to the caller", async () => {
    const tx = client()
    const res = await createLiveClassCore({ schoolId: SCHOOL }, input, {
      makeupForId: "missed-1",
      tx: asDb(tx) as never,
    })
    expect(res.success).toBe(true)
    expect(tx.conference.create).toHaveBeenCalled()
    expect(tx.conferenceParticipant.upsert).toHaveBeenCalled()
    expect(db.conference.create).not.toHaveBeenCalled()
    expect(db.school.findUnique).not.toHaveBeenCalled()
    // No notification before the commit.
    expect(after).not.toHaveBeenCalled()

    // After the commit the caller announces it.
    afterLiveClassCreated(SCHOOL, { id: "c-1" } as never)
    expect(after).toHaveBeenCalledTimes(2)
    vi.mocked(after).mock.calls[0][0]()
    expect(notifyClassScheduled).toHaveBeenCalledWith(SCHOOL, "c-1")
  })

  it("re-throws a failure so the transaction rolls back", async () => {
    const tx = client()
    tx.conference.update.mockRejectedValue(new Error("boom"))
    await expect(
      createLiveClassCore({ schoolId: SCHOOL }, input, { tx: asDb(tx) as never })
    ).rejects.toThrow("boom")
  })
})
