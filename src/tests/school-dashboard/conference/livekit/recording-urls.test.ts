// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest"

const { sendMock, getSignedUrlMock, GetObjectCommand, DeleteObjectCommand } =
  vi.hoisted(() => ({
    sendMock: vi.fn(),
    getSignedUrlMock: vi.fn(),
    // Named function expressions (not arrows) so they are newable as commands.
    GetObjectCommand: vi.fn(function GetObjectCommand(a: unknown) {
      return { __cmd: "get", a }
    }),
    DeleteObjectCommand: vi.fn(function DeleteObjectCommand(a: unknown) {
      return { __cmd: "delete", a }
    }),
  }))

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    config: { region: string }
    send = sendMock
    constructor(opts: { region: string }) {
      this.config = { region: opts.region }
    }
  }
  return { S3Client, GetObjectCommand, DeleteObjectCommand }
})
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}))

import {
  deleteRecordingObject,
  getRecordingPlaybackUrl,
} from "@/components/school-dashboard/conference/livekit/recording-urls"

beforeEach(() => {
  vi.clearAllMocks()
  getSignedUrlMock.mockResolvedValue("https://signed.example/url")
})

describe("getRecordingPlaybackUrl", () => {
  it("signs a GET for the recording's bucket/key with the TTL", async () => {
    const url = await getRecordingPlaybackUrl({
      s3Bucket: "b",
      s3Key: "k",
      s3Region: "me-central-1",
      mimeType: "video/mp4",
    })
    expect(url).toBe("https://signed.example/url")
    expect(GetObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "b", Key: "k" })
    )
    expect(getSignedUrlMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      { expiresIn: 300 }
    )
  })
})

describe("deleteRecordingObject", () => {
  it("returns true when the delete succeeds", async () => {
    sendMock.mockResolvedValueOnce({})
    const ok = await deleteRecordingObject({
      s3Bucket: "b",
      s3Key: "k",
      s3Region: "me-central-1",
    })
    expect(ok).toBe(true)
    expect(DeleteObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "b", Key: "k" })
    )
  })

  it("returns false when the delete throws", async () => {
    sendMock.mockRejectedValueOnce(new Error("gone"))
    const ok = await deleteRecordingObject({
      s3Bucket: "b",
      s3Key: "k",
      s3Region: "me-central-1",
    })
    expect(ok).toBe(false)
  })
})
