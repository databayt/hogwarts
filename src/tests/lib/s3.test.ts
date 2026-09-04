// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Shared S3 helpers. `copyObject` is the recording→lesson bridge's only
// write path (see publish-recording.ts) and must copy CROSS-bucket — egress
// writes under `LIVEKIT_RECORDING_BUCKET`, the app always writes/reads under
// `AWS_S3_BUCKET`, and the two are different env vars that are not
// guaranteed to match (see conference/ISSUE.md's own self-host example).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  copyObject,
  deleteObject,
  getObjectSize,
  getSignedReadUrl,
} from "@/lib/s3"

const {
  sendMock,
  getSignedUrlMock,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} = vi.hoisted(() => ({
  sendMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
  // Named function expressions (not arrows) so they are newable as commands.
  HeadObjectCommand: vi.fn(function HeadObjectCommand(a: unknown) {
    return { __cmd: "head", a }
  }),
  DeleteObjectCommand: vi.fn(function DeleteObjectCommand(a: unknown) {
    return { __cmd: "delete", a }
  }),
  GetObjectCommand: vi.fn(function GetObjectCommand(a: unknown) {
    return { __cmd: "get", a }
  }),
  CopyObjectCommand: vi.fn(function CopyObjectCommand(a: unknown) {
    return { __cmd: "copy", a }
  }),
}))

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = sendMock
    constructor(_opts: unknown) {}
  }
  return {
    S3Client,
    HeadObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand,
    CopyObjectCommand,
  }
})
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}))

const ENV = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET",
  "AWS_REGION",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV) saved[k] = process.env[k]
  process.env.AWS_ACCESS_KEY_ID = "test-key"
  process.env.AWS_SECRET_ACCESS_KEY = "test-secret"
  process.env.AWS_S3_BUCKET = "app-bucket"
  process.env.AWS_REGION = "us-east-1"
  vi.clearAllMocks()
})

afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("copyObject", () => {
  it("copies cross-bucket: source is the recording bucket, destination is always AWS_S3_BUCKET", async () => {
    sendMock.mockResolvedValueOnce({})
    const ok = await copyObject(
      "aldar-recordings-me-central-1",
      "schools/s1/live-class/c1/1.mp4",
      "stream/s1/video/live-rec-1.mp4",
      "video/mp4"
    )
    expect(ok).toBe(true)
    expect(CopyObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "app-bucket",
        CopySource:
          "aldar-recordings-me-central-1/schools/s1/live-class/c1/1.mp4",
        Key: "stream/s1/video/live-rec-1.mp4",
        ContentType: "video/mp4",
        MetadataDirective: "REPLACE",
      })
    )
  })

  it("copies same-bucket when the source bucket equals the app bucket", async () => {
    sendMock.mockResolvedValueOnce({})
    const ok = await copyObject("app-bucket", "a/b.mp4", "c/d.mp4")
    expect(ok).toBe(true)
    expect(CopyObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "app-bucket",
        CopySource: "app-bucket/a/b.mp4",
        Key: "c/d.mp4",
      })
    )
  })

  it("returns false without calling S3 when the source bucket is empty", async () => {
    const ok = await copyObject("", "a/b.mp4", "c/d.mp4")
    expect(ok).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("returns false when the app bucket (destination) is not configured", async () => {
    delete process.env.AWS_S3_BUCKET
    const ok = await copyObject("rec-bucket", "a/b.mp4", "c/d.mp4")
    expect(ok).toBe(false)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("returns false, never throws, when the copy call rejects (e.g. NoSuchBucket on a real cross-bucket mismatch)", async () => {
    sendMock.mockRejectedValueOnce(new Error("NoSuchBucket"))
    const ok = await copyObject("rec-bucket", "a/b.mp4", "c/d.mp4")
    expect(ok).toBe(false)
  })

  it("URI-encodes the source key in CopySource", async () => {
    sendMock.mockResolvedValueOnce({})
    await copyObject("rec-bucket", "schools/s1/live class/c1 1.mp4", "dst.mp4")
    expect(CopyObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        CopySource: `rec-bucket/${encodeURI("schools/s1/live class/c1 1.mp4")}`,
      })
    )
  })
})

describe("getObjectSize", () => {
  it("returns the HEAD content length from the app bucket", async () => {
    sendMock.mockResolvedValueOnce({ ContentLength: 12345 })
    expect(await getObjectSize("k")).toBe(12345)
    expect(HeadObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "app-bucket", Key: "k" })
    )
  })

  it("returns null when S3 is not configured", async () => {
    delete process.env.AWS_S3_BUCKET
    expect(await getObjectSize("k")).toBeNull()
  })

  it("returns null, never throws, on failure", async () => {
    sendMock.mockRejectedValueOnce(new Error("nope"))
    expect(await getObjectSize("k")).toBeNull()
  })
})

describe("deleteObject", () => {
  it("returns true on success", async () => {
    sendMock.mockResolvedValueOnce({})
    expect(await deleteObject("k")).toBe(true)
  })

  it("returns false, never throws, on failure", async () => {
    sendMock.mockRejectedValueOnce(new Error("nope"))
    expect(await deleteObject("k")).toBe(false)
  })
})

describe("getSignedReadUrl", () => {
  it("signs a GET for the app bucket with the default TTL", async () => {
    getSignedUrlMock.mockResolvedValueOnce("https://signed.example/url")
    const url = await getSignedReadUrl("k")
    expect(url).toBe("https://signed.example/url")
    expect(GetObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "app-bucket", Key: "k" })
    )
  })

  it("returns null when S3 is not configured", async () => {
    delete process.env.AWS_S3_BUCKET
    expect(await getSignedReadUrl("k")).toBeNull()
  })
})
