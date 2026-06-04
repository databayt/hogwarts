// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  cancelSchema,
  liveClassDefaultLinkSchema,
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

describe("liveClassScheduleSchema — dual provider", () => {
  it("defaults provider to livekit and saveAsDefault to false", () => {
    const result = liveClassScheduleSchema.safeParse(baseInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.provider).toBe("livekit")
      expect(result.data.saveAsDefault).toBe(false)
    }
  })

  it("accepts an external session with a valid meeting URL", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      provider: "external",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
      meetingProvider: "Google Meet",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an external session with no meeting URL", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      provider: "external",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-URL meeting link", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      provider: "external",
      meetingUrl: "not-a-url",
    })
    expect(result.success).toBe(false)
  })

  it("does not require a meeting URL for the livekit provider", () => {
    const result = liveClassScheduleSchema.safeParse({
      ...baseInput,
      provider: "livekit",
    })
    expect(result.success).toBe(true)
  })
})

describe("liveClassDefaultLinkSchema", () => {
  const base = {
    subjectId: "sub-1",
    sectionId: "sec-1",
    termId: "term-1",
    meetingUrl: "https://meet.google.com/recurring",
  }

  it("accepts a valid default link (provider defaults to external)", () => {
    const result = liveClassDefaultLinkSchema.safeParse(base)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.provider).toBe("external")
  })

  it("rejects a missing meeting URL", () => {
    const withoutUrl = {
      subjectId: base.subjectId,
      sectionId: base.sectionId,
      termId: base.termId,
    }
    expect(liveClassDefaultLinkSchema.safeParse(withoutUrl).success).toBe(false)
  })

  it("rejects a non-URL meeting link", () => {
    expect(
      liveClassDefaultLinkSchema.safeParse({ ...base, meetingUrl: "nope" })
        .success
    ).toBe(false)
  })
})
