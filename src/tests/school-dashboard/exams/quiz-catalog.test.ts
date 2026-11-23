// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getQuizQuestionStats,
  getQuizSummary,
  getQuizzes,
} from "@/components/school-dashboard/exams/quiz/actions"
import {
  buildQuizWhere,
  QUIZ_PAGE_SIZE,
} from "@/components/school-dashboard/exams/quiz/query"
import { resolveQuizScope } from "@/components/school-dashboard/exams/quiz/scope"

const db = vi.hoisted(() => ({
  exam: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() },
  question: { findMany: vi.fn(), groupBy: vi.fn() },
  subject: { findMany: vi.fn() },
  subjectSelection: { findMany: vi.fn() },
  teacher: { findFirst: vi.fn() },
}))
const teaching = vi.hoisted(() => ({ getTeacherSubjectIds: vi.fn() }))

vi.mock("@/lib/db", () => ({ db }))
vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn().mockResolvedValue({ schoolId: null }),
}))
vi.mock("@/components/translation/localize", () => ({
  localize: vi.fn(async (_m: string, rows: unknown[]) => rows),
}))
vi.mock("@/lib/teaching-scope", () => teaching)
vi.mock("@/components/school-dashboard/exams/lib/scope", () => ({
  getEnrolledSubjectIds: vi.fn().mockResolvedValue(["s1"]),
}))

beforeEach(() => vi.clearAllMocks())

describe("quiz query builder", () => {
  it("applies the subject scope and the quiz types", () => {
    expect(buildQuizWhere({ enrolledSubjectIds: ["a", "b"] })).toEqual({
      status: "PUBLISHED",
      examType: { in: ["quiz", "diagnostic"] },
      subjectId: { in: ["a", "b"] },
    })
  })

  it("a chosen subject wins over the scope; bad types are ignored", () => {
    const w = buildQuizWhere({
      catalogSubjectId: "x",
      enrolledSubjectIds: ["a"],
      examType: "final",
    })
    expect(w.subjectId).toBe("x")
    expect(w.examType).toEqual({ in: ["quiz", "diagnostic"] })
  })
})

describe("getQuizzes paging", () => {
  it("passes scope + take/skip and a stable order, selecting no heavy columns", async () => {
    db.exam.findMany.mockResolvedValue([])
    db.exam.count.mockResolvedValue(50)
    const res = await getQuizzes({ enrolledSubjectIds: ["a"], page: 3 })
    const args = db.exam.findMany.mock.calls[0][0]
    expect(args.where.subjectId).toEqual({ in: ["a"] })
    expect(args.take).toBe(QUIZ_PAGE_SIZE)
    expect(args.skip).toBe(2 * QUIZ_PAGE_SIZE)
    expect(args.include).toBeUndefined()
    expect(args.select.questions).toBeUndefined()
    expect(args.orderBy.at(-1)).toEqual({ id: "asc" })
    expect(res.total).toBe(50)
    expect(res.pageCount).toBe(3)
  })

  it("a page beyond the last returns empty, with the total intact", async () => {
    db.exam.findMany.mockResolvedValue([])
    db.exam.count.mockResolvedValue(30)
    const res = await getQuizzes({ page: 99 })
    expect(db.exam.findMany.mock.calls[0][0].skip).toBe(98 * QUIZ_PAGE_SIZE)
    expect(res.items).toEqual([])
    expect(res.total).toBe(30)
    expect(res.page).toBe(99)
  })

  it("garbage page numbers fall back to page 1", async () => {
    db.exam.findMany.mockResolvedValue([])
    db.exam.count.mockResolvedValue(0)
    await getQuizzes({ page: Number.NaN })
    expect(db.exam.findMany.mock.calls[0][0].skip).toBe(0)
  })
})

describe("stats use aggregates, never row loads", () => {
  it("summary uses aggregate count + avg", async () => {
    db.exam.aggregate.mockResolvedValue({
      _count: { _all: 10 },
      _avg: { totalQuestions: 12.4 },
    })
    const s = await getQuizSummary({ enrolledSubjectIds: ["a"] })
    expect(s).toEqual({ totalQuizzes: 10, avgQuestions: 12 })
    expect(db.exam.findMany).not.toHaveBeenCalled()
  })

  it("question stats come from groupBy over the same scope", async () => {
    db.question.groupBy.mockResolvedValue([
      {
        catalogSubjectId: "a",
        difficulty: "EASY",
        questionType: "MCQ",
        _count: { _all: 3 },
      },
      {
        catalogSubjectId: "a",
        difficulty: "HARD",
        questionType: "MCQ",
        _count: { _all: 2 },
      },
      {
        catalogSubjectId: "b",
        difficulty: "EASY",
        questionType: "TF",
        _count: { _all: 9 },
      },
    ])
    db.subject.findMany.mockResolvedValue([
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ])
    const stats = await getQuizQuestionStats(undefined, ["a", "b"])
    expect(db.question.findMany).not.toHaveBeenCalled()
    expect(db.question.groupBy.mock.calls[0][0].where.catalogSubjectId).toEqual(
      {
        in: ["a", "b"],
      }
    )
    expect(stats.map((s) => [s.name, s.totalQuestions])).toEqual([
      ["B", 9],
      ["A", 5],
    ])
    expect(stats[1].byDifficulty).toEqual({ EASY: 3, HARD: 2 })
  })
})

describe("default scope per role", () => {
  it("teacher: subjects they teach", async () => {
    db.teacher.findFirst.mockResolvedValue({ id: "t1" })
    teaching.getTeacherSubjectIds.mockResolvedValue(["m", "p"])
    expect(await resolveQuizScope("TEACHER", "u", "sc")).toEqual({
      subjectIds: ["m", "p"],
      canBrowseCatalog: true,
    })
  })

  it("teacher with no assignment, and admin: the school's selections", async () => {
    db.teacher.findFirst.mockResolvedValue({ id: "t1" })
    teaching.getTeacherSubjectIds.mockResolvedValue([])
    db.subjectSelection.findMany.mockResolvedValue([
      { catalogSubjectId: "x" },
      { catalogSubjectId: "y" },
    ])
    expect((await resolveQuizScope("TEACHER", "u", "sc")).subjectIds).toEqual([
      "x",
      "y",
    ])
    expect((await resolveQuizScope("ADMIN", "u", "sc")).subjectIds).toEqual([
      "x",
      "y",
    ])
  })

  it("student: enrolled subjects, no catalog browsing", async () => {
    expect(await resolveQuizScope("STUDENT", "u", "sc")).toEqual({
      subjectIds: ["s1"],
      canBrowseCatalog: false,
    })
  })
})
