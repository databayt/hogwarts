// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  cancelSchema,
  liveClassScheduleSchema,
  liveClassSettingsSchema,
} from "../validation"

const baseInput = {
  title: "Algebra review",
  teacherId: "teacher-1",
  scheduledStart: new Date("2026-06-01T09:00:00Z").toISOString(),
  scheduledEnd: new Date("2026-06-01T10:00:00Z").toISOString(),
}

describe("liveClassScheduleSchema", () => {
  it("accepts a minimal valid input", () => {
    const result = liveClassScheduleSchema.safeParse(baseInput)
    expect(result.success).toBe(true)
  })

  it("rejects end <= start", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      scheduledEnd: baseInput.scheduledStart,
    })
    expect(result.success).toBe(false)
  })

  it("rejects duration > 4h (hard ceiling)", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      scheduledEnd: new Date("2026-06-01T14:30:00Z").toISOString(),
    })
    expect(result.success).toBe(false)
  })

  it("defaults lang=ar and recordingEnabled=true", () => {
    const result = liveClassScheduleSchema.parse(baseInput)
    expect(result.lang).toBe("ar")
    expect(result.recordingEnabled).toBe(true)
  })

  it("rejects empty title", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      title: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("cancelSchema", () => {
  it("accepts id only", () => {
    expect(cancelSchema.safeParse({ id: "a" }).success).toBe(true)
  })
  it("accepts id + reason", () => {
    expect(
      cancelSchema.safeParse({ id: "a", reason: "Teacher absent" }).success
    ).toBe(true)
  })
  it("rejects empty id", () => {
    expect(cancelSchema.safeParse({ id: "" }).success).toBe(false)
  })
})

describe("liveClassSettingsSchema", () => {
  it("accepts in-range values", () => {
    expect(
      liveClassSettingsSchema.safeParse({
        liveClassRecordingRetentionDays: 90,
        liveClassMaxConcurrentPerSchool: 50,
        liveClassMaxDurationMinutes: 120,
        liveClassRecordingDefault: true,
      }).success
    ).toBe(true)
  })
  it("rejects retention > 10 years", () => {
    expect(
      liveClassSettingsSchema.safeParse({
        liveClassRecordingRetentionDays: 9999,
        liveClassMaxConcurrentPerSchool: 50,
        liveClassMaxDurationMinutes: 120,
        liveClassRecordingDefault: true,
      }).success
    ).toBe(false)
  })
  it("rejects max-duration > 240min", () => {
    expect(
      liveClassSettingsSchema.safeParse({
        liveClassRecordingRetentionDays: 90,
        liveClassMaxConcurrentPerSchool: 50,
        liveClassMaxDurationMinutes: 300,
        liveClassRecordingDefault: true,
      }).success
    ).toBe(false)
  })
})
