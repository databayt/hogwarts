// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  getLiveKitReadiness,
  isLiveKitConfigured,
  isRecordingConfigured,
} from "@/components/school-dashboard/live/livekit/client"

const ENV = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_RECORDING_BUCKET",
  "LIVEKIT_S3_ACCESS_KEY",
  "LIVEKIT_S3_SECRET",
  "AWS_S3_BUCKET",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k]
    delete process.env[k]
  }
})
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("getLiveKitReadiness", () => {
  it("reports required vars missing + not configured when env is empty", () => {
    const r = getLiveKitReadiness()
    expect(r.configured).toBe(false)
    expect(r.missing).toEqual(
      expect.arrayContaining([
        "LIVEKIT_HOST",
        "LIVEKIT_WS_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
      ])
    )
    // The recording bucket is NOT a room prerequisite — it reports on its own.
    expect(r.missing).not.toContain("LIVEKIT_RECORDING_BUCKET")
    expect(r.recordingMissing).toEqual(["LIVEKIT_RECORDING_BUCKET"])
    expect(isLiveKitConfigured()).toBe(false)
    expect(isRecordingConfigured()).toBe(false)
  })

  it("rooms are usable with no recording bucket at all", () => {
    process.env.LIVEKIT_HOST = "https://lk.test"
    process.env.LIVEKIT_WS_URL = "wss://lk.test"
    process.env.LIVEKIT_API_KEY = "key"
    process.env.LIVEKIT_API_SECRET = "secret-long-enough-for-hs256-signing"
    const r = getLiveKitReadiness()
    expect(r.configured).toBe(true)
    expect(r.missing).toEqual([])
    expect(isLiveKitConfigured()).toBe(true)
    // ...and recording stays off, independently, without blocking the room.
    expect(r.recordingConfigured).toBe(false)
    expect(isRecordingConfigured()).toBe(false)
  })

  it("recording turns on separately once a bucket is set; creds tracked apart", () => {
    process.env.LIVEKIT_HOST = "https://lk.test"
    process.env.LIVEKIT_WS_URL = "wss://lk.test"
    process.env.LIVEKIT_API_KEY = "key"
    process.env.LIVEKIT_API_SECRET = "secret-long-enough-for-hs256-signing"
    process.env.LIVEKIT_RECORDING_BUCKET = "aldar-recordings"
    const r = getLiveKitReadiness()
    expect(r.configured).toBe(true)
    expect(r.missing).toEqual([])
    expect(r.recordingConfigured).toBe(true)
    expect(r.recordingMissing).toEqual([])
    expect(r.recordingCredsMissing).toEqual([
      "LIVEKIT_S3_ACCESS_KEY",
      "LIVEKIT_S3_SECRET",
    ])
    expect(isLiveKitConfigured()).toBe(true)
    expect(isRecordingConfigured()).toBe(true)
  })

  it("flags no mismatch when the recording bucket is unset", () => {
    process.env.AWS_S3_BUCKET = "hogwarts-databayt"
    expect(getLiveKitReadiness().recordingBucketMismatch).toBe(false)
  })

  it("flags no mismatch when the app bucket is unset", () => {
    process.env.LIVEKIT_RECORDING_BUCKET = "aldar-recordings"
    expect(getLiveKitReadiness().recordingBucketMismatch).toBe(false)
  })

  it("flags no mismatch when both buckets are the same name", () => {
    process.env.LIVEKIT_RECORDING_BUCKET = "hogwarts-databayt"
    process.env.AWS_S3_BUCKET = "hogwarts-databayt"
    const r = getLiveKitReadiness()
    expect(r.recordingBucketMismatch).toBe(false)
    // Advisory only — never flips the real verdicts.
    expect(r.recordingConfigured).toBe(true)
  })

  it("flags a mismatch without touching configured/recordingConfigured (RUNBOOK.md's own self-host example: distinct bucket names)", () => {
    process.env.LIVEKIT_RECORDING_BUCKET = "aldar-recordings-me-central-1"
    process.env.AWS_S3_BUCKET = "hogwarts-databayt"
    const r = getLiveKitReadiness()
    expect(r.recordingBucketMismatch).toBe(true)
    expect(r.recordingConfigured).toBe(true)
    expect(r.recordingMissing).toEqual([])
  })
})
