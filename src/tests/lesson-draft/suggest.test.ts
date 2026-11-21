// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { suggestNextLessonFor } from "@/components/lesson-draft/suggest"

vi.mock("@/lib/db", () => ({
  db: { lesson: { findMany: vi.fn() }, conference: { findFirst: vi.fn() } },
}))
vi.mock("@/components/school-dashboard/live/queries", () => ({
  lessonVisibilityFilter: (schoolId: string) => ({ status: "PUBLISHED", schoolId }),
}))

const lessons = [{ id: "l1", name: "1" }, { id: "l2", name: "2" }, { id: "l3", name: "3" }]
const input = { sectionId: "sec1", subjectId: "sub1" }

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.lesson.findMany).mockResolvedValue(lessons as never)
})

describe("suggestNextLessonFor", () => {
  it("no history: the subject's first lesson", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(null)
    expect(await suggestNextLessonFor("school-1", input)).toBe("l1")
  })

  it("the lesson after the last class's, in book order", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({ catalogLessonId: "l1" } as never)
    expect(await suggestNextLessonFor("school-1", input)).toBe("l2")
  })

  it("stays on the last lesson at the end of the book", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({ catalogLessonId: "l3" } as never)
    expect(await suggestNextLessonFor("school-1", input)).toBe("l3")
  })

  it("a last lesson this school hides falls back to the first", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({ catalogLessonId: "gone" } as never)
    expect(await suggestNextLessonFor("school-1", input)).toBe("l1")
  })

  it("null when the subject has no visible lessons", async () => {
    vi.mocked(db.lesson.findMany).mockResolvedValue([])
    vi.mocked(db.conference.findFirst).mockResolvedValue(null)
    expect(await suggestNextLessonFor("school-1", input)).toBeNull()
  })

  it("is school-scoped: the history query carries schoolId, section and subject", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue(null)
    await suggestNextLessonFor("school-1", input)
    expect(vi.mocked(db.conference.findFirst).mock.calls[0][0]!.where).toMatchObject({
      schoolId: "school-1",
      sectionId: "sec1",
      subjectId: "sub1",
    })
    expect(vi.mocked(db.lesson.findMany).mock.calls[0][0]!.where).toMatchObject({
      schoolId: "school-1",
    })
  })
})
