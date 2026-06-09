// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"
import { deleteRecordingObject } from "@/components/school-dashboard/conference/livekit/recording-urls"
import { GET } from "@/app/api/cron/expire-live-recordings/route"

vi.mock("@/lib/cron-auth", () => ({ isAuthorizedCron: vi.fn(() => true) }))
vi.mock("@/lib/db", () => ({
  db: { conferenceRecording: { findMany: vi.fn(), update: vi.fn() } },
}))
vi.mock(
  "@/components/school-dashboard/conference/livekit/recording-urls",
  () => ({ deleteRecordingObject: vi.fn(async () => true) })
)

const req = () =>
  new Request("http://localhost/api/cron/expire-live-recordings")

const DUE = [
  { id: "r1", s3Bucket: "b", s3Key: "k1", s3Region: "me-central-1" },
  { id: "r2", s3Bucket: "b", s3Key: "k2", s3Region: "me-central-1" },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(isAuthorizedCron).mockReturnValue(true)
  vi.mocked(db.conferenceRecording.findMany).mockResolvedValue([] as never)
  vi.mocked(db.conferenceRecording.update).mockResolvedValue({} as never)
  vi.mocked(deleteRecordingObject).mockResolvedValue(true)
})

describe("expire-live-recordings cron", () => {
  it("returns 401 when not an authorized cron request", async () => {
    vi.mocked(isAuthorizedCron).mockReturnValue(false)
    const res = await GET(req())
    expect(res.status).toBe(401)
    expect(db.conferenceRecording.findMany).not.toHaveBeenCalled()
  })

  it("purges every due recording (S3 delete + status expired)", async () => {
    vi.mocked(db.conferenceRecording.findMany).mockResolvedValue(DUE as never)
    const res = await GET(req())
    expect(await res.json()).toEqual({ ok: true, purged: 2, candidates: 2 })
    expect(deleteRecordingObject).toHaveBeenCalledTimes(2)
    expect(db.conferenceRecording.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "r1" },
        data: expect.objectContaining({ status: "expired" }),
      })
    )
  })

  it("swallows a per-row failure and still purges the rest", async () => {
    vi.mocked(db.conferenceRecording.findMany).mockResolvedValue(DUE as never)
    vi.mocked(deleteRecordingObject).mockRejectedValueOnce(new Error("s3 down"))
    const res = await GET(req())
    const body = (await res.json()) as { purged: number; candidates: number }
    expect(body.purged).toBe(1)
    expect(body.candidates).toBe(2)
  })

  it("does NOT mark the row deleted when the S3 delete returns false", async () => {
    vi.mocked(db.conferenceRecording.findMany).mockResolvedValue([
      DUE[0],
    ] as never)
    vi.mocked(deleteRecordingObject).mockResolvedValue(false)
    const res = await GET(req())
    expect(await res.json()).toEqual({ ok: true, purged: 0, candidates: 1 })
    expect(db.conferenceRecording.update).not.toHaveBeenCalled()
  })
})
