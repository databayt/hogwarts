// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getEgressClient,
  getLiveKitConfig,
} from "@/components/school-dashboard/conference/livekit/client"
import {
  startCompositeEgress,
  stopEgress,
} from "@/components/school-dashboard/conference/livekit/egress"

vi.mock("@/components/school-dashboard/conference/livekit/client", () => ({
  getEgressClient: vi.fn(),
  getLiveKitConfig: vi.fn(),
}))

const startRoomCompositeEgress = vi.fn()
const stopEgressFn = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getLiveKitConfig).mockReturnValue({
    recordingRegion: "me-central-1",
    recordingBucket: "rec-bucket",
  } as never)
  vi.mocked(getEgressClient).mockReturnValue({
    startRoomCompositeEgress,
    stopEgress: stopEgressFn,
  } as never)
  startRoomCompositeEgress.mockResolvedValue({ egressId: "EG_1" })
})

describe("startCompositeEgress", () => {
  it("writes a per-session S3 path and returns the egress id", async () => {
    const r = await startCompositeEgress({
      roomName: "room",
      schoolId: "s1",
      sessionId: "lcs1",
    })
    expect(r.egressId).toBe("EG_1")
    expect(r.s3Bucket).toBe("rec-bucket")
    expect(r.s3Region).toBe("me-central-1")
    expect(r.s3Key).toMatch(/^schools\/s1\/live-class\/lcs1\/\d+\.mp4$/)
    expect(startRoomCompositeEgress).toHaveBeenCalledWith(
      "room",
      expect.anything(),
      expect.objectContaining({ layout: "speaker" })
    )
  })
})

describe("stopEgress", () => {
  it("delegates to the egress client", async () => {
    await stopEgress("EG_9")
    expect(stopEgressFn).toHaveBeenCalledWith("EG_9")
  })
})
