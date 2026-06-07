// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getLiveKitReadiness, isLiveKitConfigured } from "@/components/school-dashboard/conference/livekit/client"

const ENV = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_RECORDING_BUCKET",
  "LIVEKIT_S3_ACCESS_KEY",
  "LIVEKIT_S3_SECRET",
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
        "LIVEKIT_RECORDING_BUCKET",
      ])
    )
    expect(isLiveKitConfigured()).toBe(false)
  })

  it("configured once all required vars are set; S3 creds tracked separately", () => {
    process.env.LIVEKIT_HOST = "https://lk.test"
    process.env.LIVEKIT_WS_URL = "wss://lk.test"
    process.env.LIVEKIT_API_KEY = "key"
    process.env.LIVEKIT_API_SECRET = "secret-long-enough-for-hs256-signing"
    process.env.LIVEKIT_RECORDING_BUCKET = "aldar-recordings"
    const r = getLiveKitReadiness()
    expect(r.configured).toBe(true)
    expect(r.missing).toEqual([])
    expect(r.recordingMissing).toEqual([
      "LIVEKIT_S3_ACCESS_KEY",
      "LIVEKIT_S3_SECRET",
    ])
    expect(isLiveKitConfigured()).toBe(true)
  })
})
