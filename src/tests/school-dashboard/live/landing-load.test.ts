// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * `loadLiveLanding` — the /live landing's one loader (the page and the phone
 * both call it). Its reads are regrouped into fewer sequential waves; these
 * tests pin the RETURNED SHAPE and the wave order: the teacher row and the
 * name display are read beside the scope, supervised sections only after the
 * teacher, the three landing reads only after those.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { loadLiveLanding } from "@/components/school-dashboard/live/landing/load"
import { listMissedClasses } from "@/components/school-dashboard/live/makeup-core"
import {
  getLiveLandingCatchUp,
  getLiveLandingRecordings,
  getLiveLandingSessions,
  resolveCatchUpAttendees,
  resolveSupervisedSectionIds,
  resolveViewerSectionScope,
} from "@/components/school-dashboard/live/queries"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    teacher: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/school-name-format", () => ({ schoolNameDisplay: vi.fn() }))
vi.mock("@/components/catalog/image-url", () => ({
  getCatalogImageUrl: vi.fn(() => null),
}))
vi.mock("@/components/school-dashboard/live/demo-clock", () => ({
  ensureDemoClock: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/online-policy", () => ({
  ONLINE_POLICY_SELECT: { timezone: true },
  effectivePolicy: vi.fn(() => ({
    online: true,
    source: "school",
    provider: "livekit",
    degraded: false,
  })),
}))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  getLiveLandingCatchUp: vi.fn(),
  getLiveLandingRecordings: vi.fn(),
  getLiveLandingSessions: vi.fn(),
  resolveCatchUpAttendees: vi.fn(),
  resolveSupervisedSectionIds: vi.fn(),
  resolveViewerSectionScope: vi.fn(),
}))
vi.mock("@/components/school-dashboard/live/makeup-core", () => ({
  listMissedClasses: vi.fn(),
}))
vi.mock("@/components/translation/localize", () => ({
  localize: vi.fn(async (_m: string, rows: unknown[]) => rows),
}))
vi.mock("@/components/translation/person", () => ({
  getNames: vi.fn(async () => new Map<string, string>()),
  getLabels: vi.fn(async () => new Map<string, string>()),
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const SCHOOL = "school-1"

const row = (id: string, teacherId = "t-1") => ({
  id,
  title: `Class ${id}`,
  teacherId,
  sectionId: "sec-1",
  isPractice: false,
  scheduledStart: new Date(Date.now() + 60 * 60_000),
  scheduledEnd: new Date(Date.now() + 110 * 60_000),
  actualStart: null,
  teacher: {
    id: teacherId,
    firstName: "Sara",
    middleName: null,
    lastName: "Omar",
    profilePhotoUrl: null,
  },
  subject: { name: "Math", thumbnail: null, color: null },
  section: { name: "7-A", grade: { name: "Grade 7" } },
  catalogLesson: null,
  recordings: [],
})

const order: string[] = []

beforeEach(() => {
  vi.clearAllMocks()
  order.length = 0
  m(db.school.findUnique).mockImplementation(async () => {
    order.push("school")
    return { timezone: "Africa/Khartoum", conferenceDeliveryMode: "online" }
  })
  m(db.teacher.findFirst).mockImplementation(async () => {
    order.push("teacher")
    return { id: "t-1" }
  })
  m(schoolNameDisplay).mockImplementation(async () => {
    order.push("nameDisplay")
    return "first-last"
  })
  m(resolveViewerSectionScope).mockImplementation(async () => {
    order.push("scope")
    return "all"
  })
  m(resolveCatchUpAttendees).mockImplementation(async () => {
    order.push("attendees")
    return ["u-1"]
  })
  m(resolveSupervisedSectionIds).mockImplementation(async () => {
    order.push("supervised")
    return ["sec-9"]
  })
  m(getLiveLandingSessions).mockImplementation(async () => {
    order.push("reads")
    return { live: [row("live-1")], upcoming: [row("up-1")] }
  })
  m(listMissedClasses).mockResolvedValue([])
  m(getLiveLandingCatchUp).mockImplementation(async () => [row("past-1")])
  m(getLiveLandingRecordings).mockImplementation(async () => [row("past-1")])
})

describe("loadLiveLanding", () => {
  it("returns the landing shape: viewer, policy and the four session lists", async () => {
    const landing = await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-1",
      role: "TEACHER",
      lang: "en",
      isDemo: false,
    })
    expect(Object.keys(landing).sort()).toEqual([
      "catchUp",
      "live",
      "missed",
      "policy",
      "recordings",
      "upcoming",
      "viewer",
    ])
    expect(landing.policy).toEqual({
      deliveryMode: "online",
      isOnline: true,
      windowActive: false,
      provider: "livekit",
      degraded: false,
    })
    expect(landing.live.map((s) => s.id)).toEqual(["live-1"])
    expect(landing.upcoming.map((s) => s.id)).toEqual(["up-1"])
    expect(landing.catchUp.map((s) => s.id)).toEqual(["past-1"])
    expect(landing.recordings.map((s) => s.id)).toEqual(["past-1"])
    expect(Object.keys(landing.live[0]).sort()).toEqual(
      [
        "chapterName",
        "color",
        "gradeName",
        "hasRecording",
        "id",
        "imageUrl",
        "isLive",
        "lessonName",
        "makeup",
        "phase",
        "progress",
        "scheduledStart",
        "sectionName",
        "subjectName",
        "supervising",
        "teacherName",
        "teacherPhotoUrl",
        "title",
      ].sort()
    )
  })

  it("reads school, scope, attendees, teacher and name display before anything that needs them", async () => {
    await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-1",
      role: "TEACHER",
      lang: "en",
      isDemo: false,
    })
    const wave1 = ["school", "scope", "attendees", "teacher", "nameDisplay"]
    expect(order.slice(0, 5).sort()).toEqual([...wave1].sort())
    // The supervised sections need the teacher row; the landing reads need both.
    expect(order.indexOf("supervised")).toBe(5)
    expect(order.indexOf("reads")).toBe(6)
    // The teacher's own id reaches the reads (and the supervised lookup).
    expect(resolveSupervisedSectionIds).toHaveBeenCalledWith(SCHOOL, "t-1")
    expect(getLiveLandingSessions).toHaveBeenCalledWith(
      SCHOOL,
      expect.objectContaining({
        teacherId: "t-1",
        supervisedSectionIds: ["sec-9"],
      })
    )
  })

  it("lists a host's missed classes, localized and dated in the school's zone", async () => {
    m(listMissedClasses).mockResolvedValue([
      {
        id: "missed-1",
        title: "Math · 7-A",
        scheduledStart: new Date("2026-11-10T09:40:00Z"),
        scheduledEnd: new Date("2026-11-10T10:25:00Z"),
        section: { id: "sec-1", name: "7-A", grade: null },
        subject: { id: "sub-1", name: "Math" },
        teacher: { id: "t-1" },
        madeUpBy: null,
      },
    ])
    const landing = await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-1",
      role: "TEACHER",
      lang: "en",
      isDemo: false,
    })
    expect(listMissedClasses).toHaveBeenCalledWith(
      { userId: "user-1", role: "TEACHER", schoolId: SCHOOL },
      { days: 14 }
    )
    expect(landing.missed).toEqual([
      expect.objectContaining({
        id: "missed-1",
        subjectName: "Math",
        sectionName: "7-A",
        // 09:40Z is 11:40 in Khartoum (UTC+2).
        when: expect.stringMatching(/11:40/),
      }),
    ])
  })

  it("never reads missed classes for a student", async () => {
    await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-1",
      role: "STUDENT",
      lang: "en",
      isDemo: false,
    })
    expect(listMissedClasses).not.toHaveBeenCalled()
  })

  it("never reads a teacher row for a student, and still returns the shape", async () => {
    const landing = await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-2",
      role: "STUDENT",
      lang: "ar",
      isDemo: false,
    })
    expect(db.teacher.findFirst).not.toHaveBeenCalled()
    expect(resolveSupervisedSectionIds).not.toHaveBeenCalled()
    expect(Object.keys(landing).sort()).toEqual([
      "catchUp",
      "live",
      "missed",
      "policy",
      "recordings",
      "upcoming",
      "viewer",
    ])
  })

  it("a reader with no scope sees an empty landing but still gets the school's policy", async () => {
    m(resolveViewerSectionScope).mockResolvedValue("none")
    const landing = await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-2",
      role: "STUDENT",
      lang: "en",
      isDemo: false,
    })
    expect(landing.live).toEqual([])
    expect(landing.policy.isOnline).toBe(true)
    expect(getLiveLandingSessions).not.toHaveBeenCalled()
  })

  it("keeps the school's policy when a sibling read fails", async () => {
    m(resolveViewerSectionScope).mockRejectedValue(new Error("boom"))
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const landing = await loadLiveLanding({
      schoolId: SCHOOL,
      userId: "user-2",
      role: "STUDENT",
      lang: "en",
      isDemo: false,
    })
    expect(landing.policy.isOnline).toBe(true)
    expect(landing.live).toEqual([])
    spy.mockRestore()
  })
})
