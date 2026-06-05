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
} from "../report-cards"

vi.mock("@/lib/db", () => ({
  db: {
    schoolGradingConfig: { findUnique: vi.fn() },
    student: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
    examResult: { findMany: vi.fn() },
    result: { findMany: vi.fn() },
    attendance: { groupBy: vi.fn() },
    academicGrade: { findUnique: vi.fn() },
    reportCard: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    reportCardGrade: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
// Fire-and-forget notifications — keep them out of these tests.
vi.mock("../notifications", () => ({
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

  it("returns zero counts when no students match", async () => {
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.student.findMany).mockResolvedValue([] as never)
    const r = await generateReportCards({ termId: "term-1" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data).toEqual({ created: 0, updated: 0, skipped: 0 })
  })

  it("404s when the term is missing", async () => {
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "stu-1", academicGradeId: "ag-1", studentClasses: [] },
    ] as never)
    vi.mocked(db.term.findFirst).mockResolvedValue(null)
    const r = await generateReportCards({ termId: "term-x" })
    expect(r.success).toBe(false)
  })

  it("creates a report card + grades and assigns rank (schoolId-scoped)", async () => {
    vi.mocked(db.schoolGradingConfig.findUnique).mockResolvedValue(null)
    vi.mocked(db.student.findMany).mockResolvedValue([
      {
        id: "stu-1",
        academicGradeId: "ag-1",
        studentClasses: [
          {
            classId: "cl-1",
            class: {
              id: "cl-1",
              subjectId: "sub-1",
              termId: "term-1",
              credits: 1,
              subject: { id: "sub-1", name: "Math" },
            },
          },
        ],
      },
    ] as never)
    vi.mocked(db.term.findFirst).mockResolvedValue({
      id: "term-1",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-04-01"),
    } as never)
    vi.mocked(db.examResult.findMany).mockResolvedValue([
      { marksObtained: 90, totalMarks: 100, percentage: 90 },
    ] as never)
    vi.mocked(db.result.findMany).mockResolvedValue([] as never)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as never)
    vi.mocked(db.academicGrade.findUnique).mockResolvedValue({
      yearLevelId: "yl-1",
    } as never)
    vi.mocked(db.reportCard.findUnique).mockResolvedValue(null)
    vi.mocked(db.reportCard.create).mockResolvedValue({ id: "rc-1" } as never)
    vi.mocked(db.reportCardGrade.createMany).mockResolvedValue({} as never)
    vi.mocked(db.reportCard.updateMany).mockResolvedValue({} as never)

    const r = await generateReportCards({ termId: "term-1" })

    expect(r.success).toBe(true)
    if (r.success) expect(r.data?.created).toBe(1)
    const createArg = vi.mocked(db.reportCard.create).mock.calls[0][0]
    expect((createArg as { data: { schoolId: string } }).data.schoolId).toBe(
      SCHOOL
    )
    // rank pass runs after generation
    expect(db.reportCard.updateMany).toHaveBeenCalled()
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
