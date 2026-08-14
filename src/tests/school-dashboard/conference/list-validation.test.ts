// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// List-layer create/update schema — the wizard's contract:
//   provider `external` → meetingUrl required + must be a URL
//   provider `livekit`  → meetingUrl not required (in-app room, no link)
//   visibility defaults to `section` (private stays the default)
//   resources rows carry exactly ONE of exam / assignment / url

import { describe, expect, it } from "vitest"

import {
  createLiveClassSchema,
  liveClassSchema,
  updateLiveClassSchema,
} from "@/components/school-dashboard/conference/list-validation"

const BASE = {
  title: "Algebra revision",
  teacherId: "t-1",
  startDate: new Date("2026-07-15"),
  endDate: new Date("2026-07-15"),
  startTime: "09:00",
  endTime: "10:00",
}

describe("createLiveClassSchema — provider-conditional meetingUrl", () => {
  it("external without meetingUrl fails on meetingUrl", () => {
    const r = liveClassSchema.safeParse({ ...BASE, provider: "external" })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "meetingUrl")).toBe(true)
    }
  })

  it("external with an invalid URL fails on meetingUrl", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      provider: "external",
      meetingUrl: "not-a-url",
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "meetingUrl")).toBe(true)
    }
  })

  it("external with a valid URL passes", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      provider: "external",
      meetingUrl: "https://meet.google.com/abc-defg-hij",
    })
    expect(r.success).toBe(true)
  })

  it("livekit needs NO meetingUrl", () => {
    const r = liveClassSchema.safeParse({ ...BASE, provider: "livekit" })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.provider).toBe("livekit")
    }
  })

  it("provider defaults to external (URL flow) when omitted", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      meetingUrl: "https://zoom.us/j/123",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.provider).toBe("external")
  })

  it("visibility defaults to section — private is the default posture", () => {
    const r = liveClassSchema.safeParse({ ...BASE, provider: "livekit" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.visibility).toBe("section")
  })

  it("visibility school is accepted", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      provider: "livekit",
      visibility: "school",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.visibility).toBe("school")
  })

  it("maxParticipants is clamped to the hard ceiling", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      provider: "livekit",
      maxParticipants: 500,
    })
    expect(r.success).toBe(false)
  })
})

describe("createLiveClassSchema — resources", () => {
  const withResources = (resources: unknown[]) =>
    liveClassSchema.safeParse({
      ...BASE,
      provider: "livekit",
      resources,
    })

  it("a row with exactly one ref (exam) passes", () => {
    expect(withResources([{ schoolExamId: "ex-1" }]).success).toBe(true)
  })

  it("a row with exactly one ref (url) passes", () => {
    expect(
      withResources([{ url: "https://example.com/worksheet.pdf" }]).success
    ).toBe(true)
  })

  it("a row with NO ref fails", () => {
    expect(withResources([{ title: "orphan" }]).success).toBe(false)
  })

  it("a row with TWO refs fails", () => {
    expect(
      withResources([{ schoolExamId: "ex-1", schoolAssignmentId: "as-1" }])
        .success
    ).toBe(false)
  })

  it("an invalid ad-hoc URL fails", () => {
    expect(withResources([{ url: "javascript:alert(1)" }]).success).toBe(false)
  })

  it("more than 10 rows fails", () => {
    const rows = Array.from({ length: 11 }, (_, i) => ({
      url: `https://example.com/${i}`,
    }))
    expect(withResources(rows).success).toBe(false)
  })

  it("i18n factory carries the translated one-ref message", () => {
    const schema = createLiveClassSchema({
      resourceOneRef: "اختر مرجعًا واحدًا",
    } as never)
    const r = schema.safeParse({
      ...BASE,
      provider: "livekit",
      resources: [{ title: "orphan" }],
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.map((i) => i.message)).toContain(
        "اختر مرجعًا واحدًا"
      )
    }
  })
})

describe("createLiveClassSchema — schedule ordering", () => {
  // Regression: the refine used to compare DATES only, so a same-day
  // 10:00 → 08:00 passed. That stores a negative duration, which is never
  // `> cap` (slipping the duration guard) and reads as already-stranded to
  // the end-stale cron — which would end a live class and attendance-sync a
  // partial roster.
  const EXT = { provider: "external", meetingUrl: "https://meet.example.com/x" }

  it("rejects an end time before the start time on the same day", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      ...EXT,
      startTime: "10:00",
      endTime: "08:00",
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path.join("."))).toContain("endTime")
    }
  })

  it("rejects a zero-length session", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      ...EXT,
      startTime: "09:00",
      endTime: "09:00",
    })
    expect(r.success).toBe(false)
  })

  it("accepts an earlier wall time on a LATER day", () => {
    // Ordering is decided day-first, so 23:00 → 01:00 overnight is legal.
    const r = liveClassSchema.safeParse({
      ...BASE,
      ...EXT,
      endDate: new Date("2026-07-16"),
      startTime: "23:00",
      endTime: "01:00",
    })
    expect(r.success).toBe(true)
  })

  it("still rejects an end DATE before the start date", () => {
    const r = liveClassSchema.safeParse({
      ...BASE,
      ...EXT,
      endDate: new Date("2026-07-14"),
    })
    expect(r.success).toBe(false)
  })
})

describe("updateLiveClassSchema", () => {
  it("rejects a fully-supplied schedule whose end precedes its start", () => {
    const r = updateLiveClassSchema.safeParse({
      id: "lc-1",
      startDate: new Date("2026-07-15"),
      endDate: new Date("2026-07-15"),
      startTime: "10:00",
      endTime: "08:00",
    })
    expect(r.success).toBe(false)
  })

  it("passes a PARTIAL schedule through — the action checks it against the row", () => {
    // Only one half is present, so the schema can't judge ordering; the
    // effective-boundary check in `updateLiveClass` is what catches it.
    const r = updateLiveClassSchema.safeParse({
      id: "lc-1",
      startTime: "10:00",
    })
    expect(r.success).toBe(true)
  })

  it("provider is not an updatable field (immutable after create)", () => {
    const r = updateLiveClassSchema.safeParse({
      id: "lc-1",
      provider: "livekit",
    })
    // Unknown keys are stripped, never applied.
    expect(r.success).toBe(true)
    if (r.success) {
      expect("provider" in r.data).toBe(false)
    }
  })

  it("accepts visibility + catalogLessonId + resources", () => {
    const r = updateLiveClassSchema.safeParse({
      id: "lc-1",
      visibility: "school",
      catalogLessonId: "lsn-1",
      resources: [{ schoolAssignmentId: "as-1" }],
    })
    expect(r.success).toBe(true)
  })
})
