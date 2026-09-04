// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The one `scheduled → live` writer. What matters: exactly ONE of the racing
// callers (webhook, Join-as-HOST, Start) performs the side effects, and a
// loser performs none — before this module the app's write usually beat the
// webhook, whose guarded update then matched nothing, so on the real join
// path no class ever notified its roster or started recording.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { transitionToLive } from "@/components/school-dashboard/live/actions/went-live"
import { startCompositeEgress } from "@/components/school-dashboard/live/livekit/egress"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { updateMany: vi.fn(async () => ({ count: 1 })) },
    conferenceRecording: { upsert: vi.fn(async () => ({})) },
  },
}))

const notifyClassStarted = vi.fn(async () => ({ created: 0 }))
vi.mock("@/components/school-dashboard/live/actions/notifications", () => ({
  notifyClassStarted: (...a: unknown[]) => notifyClassStarted(...a),
}))

vi.mock("@/components/school-dashboard/live/livekit/egress", () => ({
  startCompositeEgress: vi.fn(async () => ({
    egressId: "egr-1",
    s3Bucket: "bucket",
    s3Key: "schools/sch1/live-class/lcs1/1.mp4",
    s3Region: "me-central-1",
  })),
}))

const RECORDING_ENV = {
  LIVEKIT_HOST: "https://lk.example",
  LIVEKIT_WS_URL: "wss://lk.example",
  LIVEKIT_API_KEY: "k",
  LIVEKIT_API_SECRET: "s",
  LIVEKIT_RECORDING_BUCKET: "bucket",
  LIVEKIT_RECORDING_REGION: "me-central-1",
}

const INPUT = {
  schoolId: "sch1",
  sessionId: "lcs1",
  roomName: "sch-sch1-lc-lcs1",
  recordingEnabled: true,
}

describe("transitionToLive", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 1 } as never)
    for (const [k, v] of Object.entries(RECORDING_ENV)) process.env[k] = v
  })
  afterEach(() => {
    for (const k of Object.keys(RECORDING_ENV)) delete process.env[k]
  })

  it("flips only a `scheduled` row of THIS school, and stamps actualStart", async () => {
    const r = await transitionToLive(INPUT)
    expect(r.transitioned).toBe(true)
    expect(db.conference.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "lcs1", schoolId: "sch1", status: "scheduled" },
        data: expect.objectContaining({
          status: "live",
          actualStart: expect.any(Date),
        }),
      })
    )
  })

  it("the winner notifies the roster and starts the egress", async () => {
    await transitionToLive(INPUT)
    expect(notifyClassStarted).toHaveBeenCalledWith("sch1", "lcs1")
    expect(startCompositeEgress).toHaveBeenCalledWith({
      roomName: "sch-sch1-lc-lcs1",
      schoolId: "sch1",
      sessionId: "lcs1",
    })
    expect(db.conferenceRecording.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { egressId: "egr-1" },
        create: expect.objectContaining({
          schoolId: "sch1",
          sessionId: "lcs1",
          status: "pending",
          s3Bucket: "bucket",
        }),
      })
    )
  })

  it("a loser (the row was already live) does NOTHING — no double notification, no second egress", async () => {
    vi.mocked(db.conference.updateMany).mockResolvedValue({ count: 0 } as never)
    const r = await transitionToLive(INPUT)
    expect(r.transitioned).toBe(false)
    expect(notifyClassStarted).not.toHaveBeenCalled()
    expect(startCompositeEgress).not.toHaveBeenCalled()
    expect(db.conferenceRecording.upsert).not.toHaveBeenCalled()
  })

  it("writes the room SID only when the caller knows it", async () => {
    await transitionToLive({ ...INPUT, roomSid: "sid-1" })
    expect(db.conference.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ roomSid: "sid-1" }),
      })
    )
    await transitionToLive(INPUT)
    const last = vi.mocked(db.conference.updateMany).mock.calls.at(-1)?.[0] as {
      data: Record<string, unknown>
    }
    expect("roomSid" in last.data).toBe(false)
  })

  it("no egress when the session opted out of recording", async () => {
    await transitionToLive({ ...INPUT, recordingEnabled: false })
    expect(startCompositeEgress).not.toHaveBeenCalled()
    expect(notifyClassStarted).toHaveBeenCalled()
  })

  it("no egress when recording is not configured — the room still goes live", async () => {
    delete process.env.LIVEKIT_RECORDING_BUCKET
    const r = await transitionToLive(INPUT)
    expect(r.transitioned).toBe(true)
    expect(startCompositeEgress).not.toHaveBeenCalled()
  })

  it("an egress failure is best-effort — the transition stands", async () => {
    vi.mocked(startCompositeEgress).mockRejectedValueOnce(new Error("sfu down"))
    const r = await transitionToLive(INPUT)
    expect(r.transitioned).toBe(true)
    expect(notifyClassStarted).toHaveBeenCalled()
    expect(db.conferenceRecording.upsert).not.toHaveBeenCalled()
  })
})
