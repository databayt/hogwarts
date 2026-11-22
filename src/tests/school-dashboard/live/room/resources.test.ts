// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireContext } from "@/components/school-dashboard/live/actions/helpers"
import {
  addClassLink,
  attachLiveClassResource,
  removeClassLink,
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
    conferenceParticipant: { findFirst: vi.fn() },
    quickAssessment: { count: vi.fn() },
    schoolAssignment: { count: vi.fn(), create: vi.fn() },
    conferenceResource: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
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
    // The caller IS the class's own teacher.
    teacher: { userId: "u-teacher" },
    section: { gradeId: "g-7" },
  })
  m(db.conferenceParticipant.findFirst).mockResolvedValue(null)
  m(db.conferenceResource.findFirst).mockResolvedValue(null)
  m(db.conferenceResource.create).mockResolvedValue({ id: "r1" })
  m(db.conferenceResource.findMany).mockResolvedValue([])
  m(db.conferenceResource.deleteMany).mockResolvedValue({ count: 1 })
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
    await attachLiveClassResource({
      sessionId: "s1",
      quickAssessmentId: "qa-1",
    })
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
      teacher: { userId: "u-teacher" },
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

  const otherTeachersClass = {
    id: "s1",
    title: "Algebra",
    subjectId: "sub-1",
    sectionId: "sec-1",
    teacherId: "t-owner",
    teacher: { userId: "u-owner" },
    section: { gradeId: "g-7" },
  }

  // Any teacher of the school used to pass: homework published to a class of
  // a section the caller has nothing to do with.
  it("refuses a teacher who neither teaches this class nor holds a seat in it", async () => {
    m(db.conference.findFirst).mockResolvedValue(otherTeachersClass)
    const r = await setClassHomework({
      sessionId: "s1",
      title: "Read",
      dueDate: "2026-10-20T08:00:00.000Z",
    })
    expect(r).toMatchObject({ success: false })
    expect(db.schoolAssignment.create).not.toHaveBeenCalled()
    expect(db.conferenceParticipant.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sessionId: "s1",
          userId: "u-teacher",
          role: { in: ["HOST", "CO_HOST"] },
        }),
      })
    )
  })

  it("accepts a co-teacher seated in the class", async () => {
    m(db.conference.findFirst).mockResolvedValue(otherTeachersClass)
    m(db.conferenceParticipant.findFirst).mockResolvedValue({ id: "seat" })
    const r = await setClassHomework({
      sessionId: "s1",
      title: "Read",
      dueDate: "2026-10-20T08:00:00.000Z",
    })
    expect(r).toEqual({ success: true, data: { id: "a1" } })
  })
})

describe("addClassLink", () => {
  const VIDEO = "https://youtu.be/abc123"

  it("stores an http(s) link on the class, scoped to the school, after the last row", async () => {
    m(db.conferenceResource.findFirst).mockResolvedValueOnce({ order: 4 })
    const r = await addClassLink({
      sessionId: "s1",
      url: `  ${VIDEO} `,
      title: " فيديو الدرس ",
    })
    expect(r).toMatchObject({ success: true, data: { id: "r1" } })
    expect(db.conferenceResource.create).toHaveBeenCalledWith({
      data: {
        schoolId: "school-1",
        sessionId: "s1",
        url: VIDEO,
        title: "فيديو الدرس",
        order: 5,
      },
      select: { id: true },
    })
  })

  it.each([
    ["javascript:alert(1)"],
    ["data:text/html,<script>1</script>"],
    ["youtu.be/abc123"],
    ["https://"],
    [""],
  ])("refuses %s before touching the class", async (url) => {
    const r = await addClassLink({ sessionId: "s1", url })
    expect(r).toMatchObject({ success: false })
    expect(requireContext).not.toHaveBeenCalled()
    expect(db.conferenceResource.create).not.toHaveBeenCalled()
  })

  it("the same link twice is one link", async () => {
    m(db.conferenceResource.findMany).mockResolvedValue([
      { id: "r-old", url: VIDEO },
    ])
    const r = await addClassLink({ sessionId: "s1", url: VIDEO })
    expect(r).toMatchObject({ success: true, data: { id: "r-old" } })
    expect(db.conferenceResource.create).not.toHaveBeenCalled()
  })

  it("stops at ten links", async () => {
    m(db.conferenceResource.findMany).mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: `r${i}`,
        url: `https://example.com/${i}`,
      }))
    )
    const r = await addClassLink({ sessionId: "s1", url: VIDEO })
    expect(r).toMatchObject({ success: false })
    expect(db.conferenceResource.create).not.toHaveBeenCalled()
  })

  it("a teacher who does not hold the class is refused", async () => {
    m(db.conference.findFirst).mockResolvedValue({
      id: "s1",
      title: "Algebra",
      subjectId: "sub-1",
      sectionId: "sec-1",
      teacherId: "t2",
      teacher: { userId: "u-other" },
      section: { gradeId: "g-7" },
    })
    const r = await addClassLink({ sessionId: "s1", url: VIDEO })
    expect(r).toMatchObject({ success: false })
    expect(db.conferenceResource.create).not.toHaveBeenCalled()
  })
})

describe("removeClassLink", () => {
  it("deletes only a LINK row of this class and school", async () => {
    const r = await removeClassLink({ sessionId: "s1", resourceId: "r9" })
    expect(r).toMatchObject({ success: true })
    expect(db.conferenceResource.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "r9",
        schoolId: "school-1",
        sessionId: "s1",
        url: { not: null },
        schoolExamId: null,
        schoolAssignmentId: null,
        quickAssessmentId: null,
      },
    })
  })

  it("reports a row that is not a link of this class", async () => {
    m(db.conferenceResource.deleteMany).mockResolvedValue({ count: 0 })
    const r = await removeClassLink({ sessionId: "s1", resourceId: "qa-row" })
    expect(r).toMatchObject({ success: false })
  })
})
