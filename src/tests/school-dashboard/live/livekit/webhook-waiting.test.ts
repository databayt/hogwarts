// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The webhook's side of "someone is waiting": an arrival the SFU confirms
 * asks the nudge, after the response; a removed participant's does not; and a
 * nudge that fails never fails the event.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { handleWebhookEvent } from "@/components/school-dashboard/live/livekit/webhook"

const deferred: Array<() => unknown> = []
vi.mock("next/server", () => ({
  after: (fn: () => unknown) => void deferred.push(fn),
}))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn(), updateMany: vi.fn() },
    conferenceParticipant: { findFirst: vi.fn(), update: vi.fn() },
    conferenceEvent: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}))
const nudgeWaiting = vi.fn<(input: unknown) => Promise<string | null>>(
  async () => null
)
vi.mock("@/components/school-dashboard/live/actions/waiting-nudge", () => ({
  nudgeWaiting: (a: unknown) => nudgeWaiting(a),
}))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassStarted: vi.fn(),
  notifyClassRecordingReady: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/actions/publish-recording", () => ({
  publishRecordingAsLessonVideo: vi.fn(),
}))
const removeParticipant = vi.fn(async () => undefined)
vi.mock("@/components/school-dashboard/live/livekit/rooms", () => ({
  removeParticipant: () => removeParticipant(),
}))
vi.mock("@/components/school-dashboard/live/livekit/egress", () => ({
  startCompositeEgress: vi.fn(),
}))

const joined = (identity = "u-student") =>
  ({
    id: `EV_${Math.random().toString(36).slice(2)}`,
    event: "participant_joined",
    room: { name: "sch-sch1-lc-s1", sid: "RM_1" },
    participant: { identity },
    createdAt: BigInt(Math.floor(Date.now() / 1000)),
  }) as never

beforeEach(() => {
  vi.clearAllMocks()
  deferred.length = 0
  vi.mocked(db.conference.findFirst).mockResolvedValue({
    id: "s1",
    recordingEnabled: false,
    timetableId: "tt-1",
    scheduledEnd: new Date(Date.now() + 30 * 60_000),
    school: { conferenceRetentionDays: 90 },
  } as never)
  vi.mocked(db.conferenceEvent.findUnique).mockResolvedValue(null as never)
  vi.mocked(db.conferenceEvent.create).mockResolvedValue({ id: "c1" } as never)
  vi.mocked(db.conferenceParticipant.update).mockResolvedValue({} as never)
  vi.mocked(db.conferenceParticipant.findFirst).mockResolvedValue({
    id: "p1",
    joinedAt: null,
    activeSince: null,
    status: "invited",
  } as never)
})

describe("participant_joined → waiting nudge", () => {
  it("asks after the response, with the tenant, the class and the arrival", async () => {
    expect(await handleWebhookEvent(joined())).toBe(true)
    // Not during the event: the presence write is what the SFU is waiting on.
    expect(nudgeWaiting).not.toHaveBeenCalled()
    expect(deferred).toHaveLength(1)
    await deferred[0]()
    expect(nudgeWaiting).toHaveBeenCalledWith({
      schoolId: "sch1",
      sessionId: "s1",
      joinerUserId: "u-student",
    })
  })

  it("does not ask for someone the host removed, or someone with no seat", async () => {
    vi.mocked(db.conferenceParticipant.findFirst).mockResolvedValueOnce({
      id: "p1",
      joinedAt: new Date(),
      activeSince: null,
      status: "removed",
    } as never)
    await handleWebhookEvent(joined())
    vi.mocked(db.conferenceParticipant.findFirst).mockResolvedValueOnce(
      null as never
    )
    await handleWebhookEvent(joined("u-stranger"))
    expect(deferred).toHaveLength(0)
  })

  it("a failing nudge is logged and goes no further", async () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})
    nudgeWaiting.mockRejectedValueOnce(new Error("db down"))
    await handleWebhookEvent(joined())
    await expect(deferred[0]()).resolves.toBeUndefined()
    expect(quiet).toHaveBeenCalled()
    expect(db.conferenceEvent.delete).not.toHaveBeenCalled()
    quiet.mockRestore()
  })
})
