// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A teacher's DRAFT homework / quick check (an AI suggestion not yet
 * published) must not reach a student on the class page or the room's shelf;
 * the host still sees it.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { readLiveClass } from "@/components/school-dashboard/live/actions/read-live-class"
import { loadClassWork } from "@/components/school-dashboard/live/class-work-load"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    conferenceEvent: { findMany: vi.fn() },
    student: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    assignmentSubmission: { findMany: vi.fn(), groupBy: vi.fn() },
    quickAssessmentResponse: { findMany: vi.fn(), groupBy: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/live/combined", () => ({
  sessionSectionIds: vi.fn().mockResolvedValue(["sec1"]),
}))
vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  canAccessSession: vi.fn().mockResolvedValue(true),
}))
vi.mock("@/components/lesson-draft/claude", () => ({
  lessonDraftEnabled: vi.fn(() => true),
}))

const SCHOOL = "school-1"
const published = {
  schoolAssignment: {
    id: "hw-pub",
    title: "واجب منشور",
    dueDate: new Date(),
    totalPoints: 10,
    status: "PUBLISHED",
  },
  quickAssessment: null,
}
const draftHw = {
  schoolAssignment: {
    id: "hw-draft",
    title: "واجب مسودة",
    dueDate: new Date(),
    totalPoints: 10,
    status: "DRAFT",
  },
  quickAssessment: null,
}
const draftQuick = {
  schoolAssignment: null,
  quickAssessment: { id: "qa-draft", title: "اختبار مسودة", status: "DRAFT" },
}
const activeQuick = {
  schoolAssignment: null,
  quickAssessment: { id: "qa-active", title: "اختبار منشور", status: "ACTIVE" },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.conferenceEvent.findMany).mockResolvedValue([])
  vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu1" } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
  vi.mocked(db.assignmentSubmission.findMany).mockResolvedValue([])
  vi.mocked(db.assignmentSubmission.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.quickAssessmentResponse.findMany).mockResolvedValue([])
  vi.mocked(db.quickAssessmentResponse.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.conference.findFirst).mockResolvedValue({
    id: "c1",
    status: "ended",
    sectionId: "sec1",
    subjectId: "sub1",
    catalogLessonId: null,
    visibility: "section",
    resources: [published, draftHw, draftQuick, activeQuick],
  } as never)
})

describe("loadClassWork", () => {
  const ids = (w: NonNullable<Awaited<ReturnType<typeof loadClassWork>>>) => ({
    hw: w.homework.map((h) => h.id),
    quick: w.quickChecks.map((q) => q.id),
  })

  it.each(["STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"])(
    "%s sees no DRAFT",
    async (role) => {
      const work = await loadClassWork("c1", { userId: "u", role, schoolId: SCHOOL })
      expect(ids(work!)).toEqual({ hw: ["hw-pub"], quick: ["qa-active"] })
      expect(work!.canSuggest).toBe(false)
    }
  )

  it.each(["TEACHER", "ADMIN", "DEVELOPER"])("%s still sees drafts", async (role) => {
    const work = await loadClassWork("c1", { userId: "u", role, schoolId: SCHOOL })
    expect(ids(work!)).toEqual({
      hw: ["hw-pub", "hw-draft"],
      quick: ["qa-draft", "qa-active"],
    })
    expect(work!.canSuggest).toBe(true)
  })

  it("canSuggest needs a section AND a subject", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: "c1",
      status: "ended",
      sectionId: "sec1",
      subjectId: null,
      catalogLessonId: null,
      resources: [],
    } as never)
    const work = await loadClassWork("c1", { userId: "u", role: "TEACHER", schoolId: SCHOOL })
    expect(work!.canSuggest).toBe(false)
  })

  it("canSuggest is false while the flag is off", async () => {
    const { lessonDraftEnabled } = await import("@/components/lesson-draft/claude")
    vi.mocked(lessonDraftEnabled).mockReturnValueOnce(false)
    const work = await loadClassWork("c1", { userId: "u", role: "TEACHER", schoolId: SCHOOL })
    expect(work!.canSuggest).toBe(false)
  })

  it("selects the linked rows' status", async () => {
    await loadClassWork("c1", { userId: "u", role: "TEACHER", schoolId: SCHOOL })
    const select = vi.mocked(db.conference.findFirst).mock.calls[0][0]!.select as any
    expect(select.resources.select.schoolAssignment.select.status).toBe(true)
    expect(select.resources.select.quickAssessment.select.status).toBe(true)
  })
})

describe("readLiveClass", () => {
  const resolve = (role: string) =>
    vi.fn(async () => ({ ok: true as const, schoolId: SCHOOL, userId: "u", role }))
  const row = () => ({
    id: "c1",
    visibility: "section",
    sectionId: "sec1",
    resources: [
      { id: "r1", url: null, title: null, schoolExam: null, schoolAssignment: published.schoolAssignment },
      { id: "r2", url: null, title: null, schoolExam: null, schoolAssignment: draftHw.schoolAssignment },
      { id: "r3", url: "https://x", title: "رابط", schoolExam: null, schoolAssignment: null },
    ],
  })
  const titles = (r: Awaited<ReturnType<typeof readLiveClass>>) =>
    r.success ? r.data.resources.map((x) => x.id) : null

  beforeEach(() => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(row() as never)
  })

  it("drops a DRAFT homework for a student", async () => {
    const r = await readLiveClass("c1", resolve("STUDENT") as never)
    expect(titles(r)).toEqual(["r1", "r3"])
  })

  it("drops it for a guardian too", async () => {
    const r = await readLiveClass("c1", resolve("GUARDIAN") as never)
    expect(titles(r)).toEqual(["r1", "r3"])
  })

  it("keeps it for a teacher", async () => {
    const r = await readLiveClass("c1", resolve("TEACHER") as never)
    expect(titles(r)).toEqual(["r1", "r2", "r3"])
  })
})
