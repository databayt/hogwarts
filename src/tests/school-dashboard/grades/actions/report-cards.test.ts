// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  generateReportCards,
  getReportCard,
  getReportCards,
  publishReportCards,
} from "@/components/school-dashboard/grades/actions/report-cards"

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (ops: unknown[]) => ops),
    schoolGradingConfig: { findUnique: vi.fn() },
    student: { findMany: vi.fn() },
    studentClass: { findMany: vi.fn() },
    class: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
    examResult: { findMany: vi.fn() },
    result: { findMany: vi.fn() },
    attendance: { groupBy: vi.fn() },
    academicGrade: { findMany: vi.fn() },
    reportCard: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn(),
    },
    reportCardGrade: { deleteMany: vi.fn(), createMany: vi.fn() },
    school: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}))
// Fire-and-forget notifications — keep them out of these tests.
vi.mock("@/components/school-dashboard/grades/actions/notifications", () => ({
  sendBatchGradeNotifications: vi.fn().mockResolvedValue({ success: true }),
}))

const SCHOOL = "school-1"

function asAdmin(schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin(SCHOOL)
})

describe("generateReportCards", () => {
  it("rejects without a school context", async () => {
    asAdmin(null)
    const r = await generateReportCards({ termId: "term-1" })
    expect(r.success).toBe(false)
  })

  it("404s when the term is missing", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue(null)
    const r = await generateReportCards({ termId: "term-x" })
    expect(r.success).toBe(false)
  })

  it("returns zero counts when the term has no classes", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "term-1" } as never)
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.class.findMany).mockResolvedValue([] as never)
    const r = await generateReportCards({ termId: "term-1" })
    expect(r.success).toBe(true)
    if (r.success)
      expect(r.data).toEqual({ created: 0, updated: 0, skipped: 0 })
  })

  it("returns zero counts when no students match", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "term-1" } as never)
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "cl-1", subjectId: "sub-1", credits: 1 },
    ] as never)
    vi.mocked(db.student.findMany).mockResolvedValue([] as never)
    const r = await generateReportCards({ termId: "term-1" })
    expect(r.success).toBe(true)
    if (r.success)
      expect(r.data).toEqual({ created: 0, updated: 0, skipped: 0 })
  })

  /**
   * The cohort is read in a fixed number of set-based queries — one per source,
   * never one per student × class. These mocks stand in for those queries; if a
   * future edit reintroduces a per-student read it will surface here as an
   * unmocked call.
   */
  function mockCohort() {
    vi.mocked(db.term.findFirst).mockResolvedValue({
      id: "term-1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-04-01"),
    } as never)
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "cl-1", subjectId: "sub-1", credits: 1 },
    ] as never)
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "stu-1", academicGradeId: "ag-1" },
      { id: "stu-2", academicGradeId: "ag-1" },
    ] as never)
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { studentId: "stu-1", classId: "cl-1" },
      { studentId: "stu-2", classId: "cl-1" },
    ] as never)
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      {
        studentId: "stu-1",
        examId: "ex-1",
        marksObtained: 90,
        totalMarks: 100,
        exam: { classId: "cl-1" },
      },
    ] as never)
    vi.mocked(db.result.findMany).mockResolvedValue([] as never)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { studentId: "stu-1", status: "PRESENT", _count: { status: 42 } },
    ] as never)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "ag-1", yearLevelId: "yl-1" },
    ] as never)
    vi.mocked(db.reportCardGrade.deleteMany).mockResolvedValue({} as never)
    vi.mocked(db.reportCardGrade.createMany).mockResolvedValue({} as never)
    vi.mocked(db.reportCard.createMany).mockResolvedValue({} as never)
  }

  it("creates a card with rank + attendance and skips scoreless students", async () => {
    mockCohort()
    // No pre-existing card, then the post-create re-read returns the new id.
    vi.mocked(db.reportCard.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ id: "rc-1", studentId: "stu-1" }] as never)

    const r = await generateReportCards({ termId: "term-1" })

    expect(r.success).toBe(true)
    // stu-2 is enrolled but has no score anywhere → skipped, not carded.
    if (r.success)
      expect(r.data).toEqual({ created: 1, updated: 0, skipped: 1 })

    const createArg = vi.mocked(db.reportCard.createMany).mock.calls[0][0] as {
      data: Array<Record<string, unknown>>
    }
    expect(createArg.data).toHaveLength(1)
    expect(createArg.data[0]).toMatchObject({
      schoolId: SCHOOL,
      studentId: "stu-1",
      termId: "term-1",
      overallGrade: "A-",
      rank: 1,
      totalStudents: 1,
      daysPresent: 42,
      yearLevelId: "yl-1",
    })

    const gradeArg = vi.mocked(db.reportCardGrade.createMany).mock
      .calls[0][0] as { data: Array<Record<string, unknown>> }
    expect(gradeArg.data[0]).toMatchObject({
      schoolId: SCHOOL,
      reportCardId: "rc-1",
      subjectId: "sub-1",
      percentage: 90,
    })
  })

  it("updates an existing card instead of duplicating it", async () => {
    mockCohort()
    vi.mocked(db.reportCard.findMany)
      .mockResolvedValueOnce([{ id: "rc-1", studentId: "stu-1" }] as never)
      .mockResolvedValueOnce([{ id: "rc-1", studentId: "stu-1" }] as never)
    vi.mocked(db.reportCard.update).mockReturnValue({} as never)

    const r = await generateReportCards({ termId: "term-1" })

    expect(r.success).toBe(true)
    if (r.success)
      expect(r.data).toEqual({ created: 0, updated: 1, skipped: 1 })
    expect(db.reportCard.createMany).not.toHaveBeenCalled()
    // Per-card updates ride one batched transaction, not one round-trip each.
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })

  it("scopes every cohort read by schoolId", async () => {
    mockCohort()
    vi.mocked(db.reportCard.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ id: "rc-1", studentId: "stu-1" }] as never)

    await generateReportCards({ termId: "term-1" })

    for (const call of [
      vi.mocked(db.class.findMany).mock.calls[0][0],
      vi.mocked(db.student.findMany).mock.calls[0][0],
      vi.mocked(db.studentClass.findMany).mock.calls[0][0],
      vi.mocked(db.examResult.findMany).mock.calls[0][0],
      vi.mocked(db.result.findMany).mock.calls[0][0],
      vi.mocked(db.attendance.groupBy).mock.calls[0][0],
    ]) {
      expect((call as { where: Record<string, unknown> }).where.schoolId).toBe(
        SCHOOL
      )
    }
  })
})

describe("publishReportCards", () => {
  it("publishes unpublished cards for the term and returns the count", async () => {
    vi.mocked(db.reportCard.updateMany).mockResolvedValue({ count: 4 } as never)
    const r = await publishReportCards({ termId: "term-1" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.published).toBe(4)
    const arg = vi.mocked(db.reportCard.updateMany).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
      termId: "term-1",
      isPublished: false,
    })
  })
})

describe("getReportCards", () => {
  it("scopes by schoolId and paginates", async () => {
    vi.mocked(db.reportCard.findMany).mockResolvedValue([] as never)
    vi.mocked(db.reportCard.count).mockResolvedValue(0 as never)
    const r = await getReportCards({ termId: "term-1", page: 2, pageSize: 10 })
    expect(r.total).toBe(0)
    const arg = vi.mocked(db.reportCard.findMany).mock.calls[0][0] as {
      where: Record<string, unknown>
      skip: number
      take: number
    }
    expect(arg.where).toMatchObject({ schoolId: SCHOOL, termId: "term-1" })
    expect(arg.skip).toBe(10)
    expect(arg.take).toBe(10)
  })

  it("returns empty without a school", async () => {
    asAdmin(null)
    const r = await getReportCards({ termId: "term-1" })
    expect(r).toEqual({ items: [], total: 0 })
  })
})

describe("getReportCard", () => {
  it("scopes the single lookup by id AND schoolId", async () => {
    vi.mocked(db.reportCard.findFirst).mockResolvedValue({
      id: "rc-1",
    } as never)
    const rc = await getReportCard("rc-1")
    expect(rc).toBeTruthy()
    const arg = vi.mocked(db.reportCard.findFirst).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      id: "rc-1",
      schoolId: SCHOOL,
    })
  })
})
