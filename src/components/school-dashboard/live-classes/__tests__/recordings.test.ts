// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  deleteRecording,
  getRecordingUrl,
  listRecordings,
} from "../actions/recordings"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassRecording: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/livekit/recording-urls", () => ({
  getRecordingPlaybackUrl: vi.fn(async () => "https://signed.example/play.mp4"),
  deleteRecordingObject: vi.fn(async () => true),
}))

const SCHOOL_ID = "school-aldar"

function mockAdmin(schoolId = SCHOOL_ID) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-admin", role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "ADMIN",
    isPlatformAdmin: false,
  } as never)
}

function mockStudent() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-stu", role: "STUDENT" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    requestId: null,
    role: "STUDENT",
    isPlatformAdmin: false,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("listRecordings", () => {
  it("admin lists recordings — scoped to schoolId + sessionId + not soft-deleted", async () => {
    mockAdmin()
    vi.mocked(db.liveClassRecording.findMany).mockResolvedValue([] as never)
    await listRecordings("lcs-1")
    expect(db.liveClassRecording.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
          sessionId: "lcs-1",
          deletedAt: null,
        }),
      })
    )
  })

  it("student can also list (view_recordings allows STUDENT)", async () => {
    mockStudent()
    vi.mocked(db.liveClassRecording.findMany).mockResolvedValue([] as never)
    const result = await listRecordings("lcs-1")
    expect("success" in result && result.success).toBe(true)
  })
})

describe("getRecordingUrl", () => {
  it("returns short-lived signed URL when recording is ready", async () => {
    mockAdmin()
    vi.mocked(db.liveClassRecording.findFirst).mockResolvedValue({
      s3Bucket: "b",
      s3Key: "k",
      s3Region: "me-central-1",
      mimeType: "video/mp4",
    } as never)
    const result = await getRecordingUrl("rec-1")
    expect("success" in result && result.success).toBe(true)
    if ("success" in result && result.success) {
      expect(result.data.url).toMatch(/^https:\/\//)
    }
    expect(db.liveClassRecording.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "rec-1",
          schoolId: SCHOOL_ID,
          status: "ready",
          deletedAt: null,
        }),
      })
    )
  })

  it("recording not found / not ready → LIVE_CLASS_RECORDING_NOT_FOUND", async () => {
    mockAdmin()
    vi.mocked(db.liveClassRecording.findFirst).mockResolvedValue(null as never)
    const result = await getRecordingUrl("missing")
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_RECORDING_NOT_FOUND")
  })
})

describe("deleteRecording", () => {
  it("admin deletes — calls S3 delete, sets deletedAt, flips status=expired", async () => {
    mockAdmin()
    vi.mocked(db.liveClassRecording.findFirst).mockResolvedValue({
      id: "rec-1",
      sessionId: "lcs-1",
      s3Bucket: "b",
      s3Key: "k",
      s3Region: "me-central-1",
    } as never)
    vi.mocked(db.liveClassRecording.update).mockResolvedValue({} as never)
    const result = await deleteRecording("rec-1")
    expect("success" in result && result.success).toBe(true)
    expect(db.liveClassRecording.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "expired",
          deletedAt: expect.any(Date),
        }),
      })
    )
  })

  it("teacher (no delete permission) → UNAUTHORIZED", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-t", role: "TEACHER" },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: null,
      role: "TEACHER",
      isPlatformAdmin: false,
    } as never)
    const result = await deleteRecording("rec-1")
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("not found → LIVE_CLASS_RECORDING_NOT_FOUND", async () => {
    mockAdmin()
    vi.mocked(db.liveClassRecording.findFirst).mockResolvedValue(null as never)
    const result = await deleteRecording("nope")
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_RECORDING_NOT_FOUND")
  })
})
