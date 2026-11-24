// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({ db: {} }))

import { shouldWriteActivity, touchActivity } from "@/lib/activity"

const NOW = new Date("2026-11-24T12:00:00Z")
const ago = (min: number) => new Date(NOW.getTime() - min * 60_000)
const stored = (over = {}) => ({
  lastSeenAt: ago(10),
  lastClient: "app",
  lastPlatform: "android",
  lastAppVersion: 16,
  ...over,
})

describe("shouldWriteActivity", () => {
  it("writes when nothing is stored", () => {
    expect(shouldWriteActivity(null, { client: "web" }, NOW)).toBe(true)
  })
  it("skips a recent touch with nothing changed", () => {
    expect(
      shouldWriteActivity(
        stored(),
        { client: "app", platform: "android", appVersion: 16 },
        NOW
      )
    ).toBe(false)
  })
  it("a bare touch (no client info) within the hour is skipped", () => {
    expect(shouldWriteActivity(stored(), {}, NOW)).toBe(false)
  })
  it("writes once the stored stamp is 60 minutes old", () => {
    expect(shouldWriteActivity(stored({ lastSeenAt: ago(59) }), {}, NOW)).toBe(
      false
    )
    expect(shouldWriteActivity(stored({ lastSeenAt: ago(60) }), {}, NOW)).toBe(
      true
    )
  })
  it("writes at once when client, platform or app version changes", () => {
    expect(shouldWriteActivity(stored(), { client: "web" }, NOW)).toBe(true)
    expect(shouldWriteActivity(stored(), { platform: "ios" }, NOW)).toBe(true)
    expect(shouldWriteActivity(stored(), { appVersion: 17 }, NOW)).toBe(true)
  })
})

describe("touchActivity", () => {
  it("never throws, even when the db is unavailable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    await expect(touchActivity({ userId: "u1", now: NOW })).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
