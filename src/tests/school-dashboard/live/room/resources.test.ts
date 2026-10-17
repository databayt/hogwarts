// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import {
  attachLiveClassResource,
  setClassHomework,
} from "@/components/school-dashboard/live/actions/resources"

vi.mock("@/components/school-dashboard/live/actions/helpers", () => ({
  requireContext: vi.fn(),
}))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn().mockResolvedValue({ term: { id: "term-1" } }),
}))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("@/components/translation/prewarm", () => ({ prewarm: vi.fn() }))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    teacher: { findFirst: vi.fn() },
    quickAssessment: { count: vi.fn() },
    schoolAssignment: { count: vi.fn(), create: vi.fn() },
    conferenceResource: { findFirst: vi.fn(), create: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  m(requireContext).mockResolvedValue({
    ok: true,
    schoolId: "school-1",
    userId: "u-teacher",
    role: "TEACHER",
  })
  m(db.conference.findFirst).mockResolvedValue({
    id: "s1",
    title: "Algebra",
    subjectId: "sub-1",
    sectionId: "sec-1",
    teacherId: "t1",
    section: { gradeId: "g-7" },
  })
  m(db.teacher.findFirst).mockResolvedValue({ id: "t1" })
  m(db.conferenceResource.findFirst).mockResolvedValue(null)
  m(db.conferenceResource.create).mockResolvedValue({ id: "r1" })
  m(db.schoolAssignment.create).mockResolvedValue({ id: "a1" })
})

describe("attachLiveClassResource", () => {
  it("refuses another school's quick check", async () => {
    m(db.quickAssessment.count).mockResolvedValue(0)
    const r = await attachLiveClassResource({
      sessionId: "s1",
      quickAssessmentId: "qa-foreign",
    })
    expect(r).toMatchObject({ success: false })
    expect(db.quickAssessment.count).toHaveBeenCalledWith({
      where: { id: "qa-foreign", schoolId: "school-1" },
    })
    expect(db.conferenceResource.create).not.toHaveBeenCalled()
  })

  it("appends after the last row, once", async () => {
    m(db.quickAssessment.count).mockResolvedValue(1)
    m(db.conferenceResource.findFirst)
      .mockResolvedValueOnce(null) // not linked yet
      .mockResolvedValueOnce({ order: 2 }) // last row
    await attachLiveClassResource({ sessionId: "s1", quickAssessmentId: "qa-1" })
    expect(db.conferenceResource.create).toHaveBeenCalledWith({
      data: {
        schoolId: "school-1",
        sessionId: "s1",
        quickAssessmentId: "qa-1",
        order: 3,
      },
      select: { id: true },
    })
  })

  it("takes exactly one reference", async () => {
    const r = await attachLiveClassResource({ sessionId: "s1" })
    expect(r).toMatchObject({ success: false })
    expect(requireContext).not.toHaveBeenCalled()
  })
})

describe("setClassHomework", () => {
  it("files published homework under the class's own audience", async () => {
    const r = await setClassHomework({
      sessionId: "s1",
      title: "  Exercises 1-5 ",
      dueDate: "2026-10-20T08:00:00.000Z",
    })
    expect(r).toEqual({ success: true, data: { id: "a1" } })
    expect(db.schoolAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          gradeId: "g-7",
          sectionId: "sec-1",
          subjectId: "sub-1",
          termId: "term-1",
          title: "Exercises 1-5",
          type: "HOMEWORK",
          status: "PUBLISHED",
        }),
      })
    )
    expect(db.conferenceResource.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sessionId: "s1",
        schoolAssignmentId: "a1",
      }),
    })
  })

  it("refuses a class with no section — nobody to give it to", async () => {
    m(db.conference.findFirst).mockResolvedValue({
      id: "s1",
      title: "Assembly",
      subjectId: null,
      sectionId: null,
      teacherId: "t1",
      section: null,
    })
    const r = await setClassHomework({
      sessionId: "s1",
      title: "Read",
      dueDate: "2026-10-20T08:00:00.000Z",
    })
    expect(r).toMatchObject({ success: false, details: "no_audience" })
    expect(db.schoolAssignment.create).not.toHaveBeenCalled()
  })

  it("refuses a teacher of another school", async () => {
    m(db.teacher.findFirst).mockResolvedValue(null)
    const r = await setClassHomework({
      sessionId: "s1",
      title: "Read",
      dueDate: "2026-10-20T08:00:00.000Z",
    })
    expect(r).toMatchObject({ success: false })
    expect(db.schoolAssignment.create).not.toHaveBeenCalled()
  })
})
