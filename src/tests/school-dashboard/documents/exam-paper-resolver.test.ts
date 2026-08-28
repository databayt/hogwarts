// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The EXAM_PAPER resolver — the step that turns a `GeneratedExam` into the
 * merge data a school's `.docx` is filled with.
 *
 * The numbering assertions here exist because filling the shipped starter
 * against a REAL generated exam printed a paper numbered "4. 5. 6. 7. 8."
 * followed by "1. 2. 3.". Question selection walks the distribution object's
 * key order, `sections` regroups by a fixed pedagogical order, and nothing
 * reconciled the two — so the printed numbers stopped ascending. No unit test
 * caught it because every fixture happened to list questions in an order that
 * already agreed with SECTION_ORDER.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { resolveExamPaperData } from "@/components/school-dashboard/documents/resolvers/exam-paper"

vi.mock("@/lib/db", () => ({
  db: {
    generatedExam: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const SCHOOL = "school-1"
const ctx = { schoolId: SCHOOL, lang: "en" as const }

/** One persisted `GeneratedExamQuestion`, as the resolver's query returns it. */
function row(order: number, questionType: string, questionText: string) {
  return {
    order,
    points: 5,
    question: { questionText, options: [], questionType },
  }
}

/** True/false selected FIRST, multiple-choice SECOND — the real-world case. */
function examWith(questions: ReturnType<typeof row>[]) {
  vi.mocked(db.generatedExam.findFirst).mockResolvedValue({
    exam: {
      title: "Term test",
      examDate: new Date("2026-09-15T00:00:00Z"),
      duration: 60,
      totalMarks: 40,
      startTime: "08:00",
      endTime: "09:00",
      instructions: "",
      subject: { name: "Science" },
      class: { name: "Grade 7" },
    },
    questions,
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    name: "Al Amal",
    nameEn: "Al Amal",
    logoUrl: null,
  } as never)
})

describe("printed numbering", () => {
  it("numbers continuously in the order the paper READS, not the order selected", async () => {
    // Persisted order says TF first; SECTION_ORDER prints multiple-choice first.
    examWith([
      row(1, "TRUE_FALSE", "TF one"),
      row(2, "TRUE_FALSE", "TF two"),
      row(3, "MULTIPLE_CHOICE", "MCQ one"),
      row(4, "MULTIPLE_CHOICE", "MCQ two"),
    ])

    const data = await resolveExamPaperData("gen-1", ctx)
    const sections = data.sections as Array<{
      title: string
      questions: Array<{ order: number; numberInSection: number; text: string }>
    }>

    // Multiple choice prints first and therefore takes numbers 1 and 2 —
    // even though those questions were selected third and fourth.
    expect(sections[0].title).toBe("Multiple choice")
    expect(sections[0].questions.map((q) => q.order)).toEqual([1, 2])
    expect(sections[1].questions.map((q) => q.order)).toEqual([3, 4])

    // The whole paper ascends 1..n with no repeats and no gaps.
    const all = sections.flatMap((s) => s.questions.map((q) => q.order))
    expect(all).toEqual([1, 2, 3, 4])
  })

  it("still counts each question's position within its own section", async () => {
    examWith([
      row(1, "TRUE_FALSE", "TF one"),
      row(2, "MULTIPLE_CHOICE", "MCQ one"),
      row(3, "MULTIPLE_CHOICE", "MCQ two"),
    ])

    const data = await resolveExamPaperData("gen-1", ctx)
    const sections = data.sections as Array<{
      questions: Array<{ numberInSection: number }>
    }>

    expect(sections[0].questions.map((q) => q.numberInSection)).toEqual([1, 2])
    expect(sections[1].questions.map((q) => q.numberInSection)).toEqual([1])
  })

  it("gives the flat list the same sequence and numbers as the sections", async () => {
    // The documented contract — "both layouts number identically" — only holds
    // if the flat list is the sections flattened.
    examWith([
      row(1, "ESSAY", "Essay one"),
      row(2, "MULTIPLE_CHOICE", "MCQ one"),
      row(3, "TRUE_FALSE", "TF one"),
    ])

    const data = await resolveExamPaperData("gen-1", ctx)
    const flat = data.questions as Array<{ order: number; text: string }>
    const sections = data.sections as Array<{
      questions: Array<{ order: number; text: string }>
    }>

    expect(flat.map((q) => q.text)).toEqual(
      sections.flatMap((s) => s.questions.map((q) => q.text))
    )
    expect(flat.map((q) => q.order)).toEqual([1, 2, 3])
    // Objective types lead, written answers last.
    expect(flat[0].text).toBe("MCQ one")
    expect(flat[2].text).toBe("Essay one")
  })

  it("counts the questions it actually emitted", async () => {
    examWith([
      row(1, "TRUE_FALSE", "TF one"),
      row(2, "MULTIPLE_CHOICE", "MCQ one"),
    ])

    const data = await resolveExamPaperData("gen-1", ctx)
    expect(data.questionCount).toBe(2)
    expect(data.sectionCount).toBe(2)
  })

  it("keeps a question type that has no canonical section", async () => {
    // An unknown type must still reach the paper rather than vanishing.
    examWith([
      row(1, "MULTIPLE_CHOICE", "MCQ one"),
      row(2, "SOMETHING_NEW", "Odd one"),
    ])

    const data = await resolveExamPaperData("gen-1", ctx)
    const flat = data.questions as Array<{ order: number; text: string }>
    expect(flat.map((q) => q.text)).toContain("Odd one")
    expect(flat.map((q) => q.order)).toEqual([1, 2])
  })
})

describe("tenant scope", () => {
  it("asks for the generated exam scoped by schoolId", async () => {
    examWith([row(1, "MULTIPLE_CHOICE", "MCQ one")])

    await resolveExamPaperData("gen-1", ctx)

    const where = vi.mocked(db.generatedExam.findFirst).mock.calls[0][0]
      ?.where as Record<string, unknown>
    expect(where.id).toBe("gen-1")
    expect(where.schoolId).toBe(SCHOOL)
  })

  it("throws rather than filling a paper for an exam it cannot find", async () => {
    vi.mocked(db.generatedExam.findFirst).mockResolvedValue(null as never)
    await expect(resolveExamPaperData("gen-1", ctx)).rejects.toThrow()
  })
})
