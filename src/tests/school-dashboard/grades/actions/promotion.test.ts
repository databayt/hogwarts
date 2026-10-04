// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { syncStudentSubjectEnrollments } from "@/lib/enrollment-sync"
import { getTenantContext } from "@/lib/tenant-context"
import {
  approvePromotionBatch,
  evaluatePromotionCandidates,
  executePromotions,
  getPromotionBatches,
  getPromotionCandidates,
  getPromotionPolicy,
  overridePromotionDecision,
  upsertPromotionPolicy,
} from "@/components/school-dashboard/grades/actions/promotion"

vi.mock("@/lib/db", () => ({
  db: {
    promotionPolicy: { findUnique: vi.fn(), upsert: vi.fn() },
    promotionCandidate: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    promotionBatch: {
      findFirst: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    academicGrade: { findFirst: vi.fn(), findMany: vi.fn() },
    section: { findMany: vi.fn() },
    student: { findMany: vi.fn(), update: vi.fn() },
    studentYearLevel: { create: vi.fn() },
  },
}))

vi.mock("@/lib/enrollment-sync", () => ({
  syncStudentSubjectEnrollments: vi
    .fn()
    .mockResolvedValue({ subjectIds: [], created: 0 }),
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
// promotion.ts imports the Prisma namespace for JsonNull — provide a stub.
vi.mock("@prisma/client", () => ({
  Prisma: { JsonNull: null },
}))

const SCHOOL = "school-1"

function asAdmin(schoolId: string | null = SCHOOL) {
  as("ADMIN", schoolId)
}

function as(role: string, schoolId: string | null = SCHOOL) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role, schoolId },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin(SCHOOL)
})

describe("getPromotionPolicy", () => {
  it("looks up by the schoolId_gradeId composite key", async () => {
    vi.mocked(db.promotionPolicy.findUnique).mockResolvedValue({
      id: "pol-1",
    } as never)
    await getPromotionPolicy("grade-1")
    const arg = vi.mocked(db.promotionPolicy.findUnique).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toEqual({
      schoolId_gradeId: { schoolId: SCHOOL, gradeId: "grade-1" },
    })
  })

  it("returns null without a school", async () => {
    asAdmin(null)
    expect(await getPromotionPolicy("grade-1")).toBeNull()
  })
})

describe("upsertPromotionPolicy", () => {
  it("upserts on the composite key and defaults missing thresholds on create", async () => {
    vi.mocked(db.promotionPolicy.upsert).mockResolvedValue({
      id: "pol-1",
    } as never)
    const r = await upsertPromotionPolicy({ gradeId: "grade-1" })
    expect(r.success).toBe(true)
    const arg = vi.mocked(db.promotionPolicy.upsert).mock.calls[0][0] as {
      where: Record<string, unknown>
      create: Record<string, unknown>
    }
    expect(arg.where).toEqual({
      schoolId_gradeId: { schoolId: SCHOOL, gradeId: "grade-1" },
    })
    expect(arg.create.schoolId).toBe(SCHOOL)
    expect(arg.create.maxFailedSubjects).toBe(2)
    expect(arg.create.minAttendancePercent).toBe(75)
  })

  it("rejects without a school", async () => {
    asAdmin(null)
    const r = await upsertPromotionPolicy({ gradeId: "grade-1" })
    expect(r.success).toBe(false)
  })
})

describe("overridePromotionDecision", () => {
  it("only overrides candidates whose batch is in review", async () => {
    vi.mocked(db.promotionCandidate.findFirst).mockResolvedValue({
      id: "cand-1",
      batch: { status: "READY_FOR_REVIEW" },
    } as never)
    vi.mocked(db.promotionCandidate.update).mockResolvedValue({} as never)

    const r = await overridePromotionDecision({
      candidateId: "cand-1",
      decision: "RETAIN",
      reason: "Failed core subjects",
    })

    expect(r.success).toBe(true)
    const findArg = vi.mocked(db.promotionCandidate.findFirst).mock.calls[0][0]
    expect((findArg as { where: Record<string, unknown> }).where).toMatchObject(
      { id: "cand-1", schoolId: SCHOOL }
    )
    const updArg = vi.mocked(db.promotionCandidate.update).mock.calls[0][0]
    expect(
      (updArg as { data: { finalDecision: string } }).data.finalDecision
    ).toBe("RETAIN")
  })

  it("blocks override when the batch is not in review", async () => {
    vi.mocked(db.promotionCandidate.findFirst).mockResolvedValue({
      id: "cand-1",
      batch: { status: "APPROVED" },
    } as never)
    const r = await overridePromotionDecision({
      candidateId: "cand-1",
      decision: "PROMOTE",
      reason: "x",
    })
    expect(r.success).toBe(false)
    expect(db.promotionCandidate.update).not.toHaveBeenCalled()
  })
})

describe("approvePromotionBatch", () => {
  it("blocks approval while manual reviews are unresolved", async () => {
    vi.mocked(db.promotionBatch.findFirst).mockResolvedValue({
      id: "batch-1",
      status: "READY_FOR_REVIEW",
    } as never)
    vi.mocked(db.promotionCandidate.count).mockResolvedValue(2 as never)

    const r = await approvePromotionBatch("batch-1")

    expect(r.success).toBe(false)
    expect(db.promotionBatch.update).not.toHaveBeenCalled()
  })

  it("approves when no manual reviews remain", async () => {
    vi.mocked(db.promotionBatch.findFirst).mockResolvedValue({
      id: "batch-1",
      status: "READY_FOR_REVIEW",
    } as never)
    vi.mocked(db.promotionCandidate.count).mockResolvedValue(0 as never)
    vi.mocked(db.promotionBatch.update).mockResolvedValue({} as never)

    const r = await approvePromotionBatch("batch-1")

    expect(r.success).toBe(true)
    const arg = vi.mocked(db.promotionBatch.update).mock.calls[0][0]
    expect((arg as { data: { status: string } }).data.status).toBe("APPROVED")
  })
})

describe("getters", () => {
  it("getPromotionBatches scopes by schoolId", async () => {
    vi.mocked(db.promotionBatch.findMany).mockResolvedValue([] as never)
    await getPromotionBatches()
    const arg = vi.mocked(db.promotionBatch.findMany).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      schoolId: SCHOOL,
    })
  })

  it("getPromotionCandidates scopes by batchId AND schoolId", async () => {
    vi.mocked(db.promotionCandidate.findMany).mockResolvedValue([] as never)
    await getPromotionCandidates("batch-1")
    const arg = vi.mocked(db.promotionCandidate.findMany).mock.calls[0][0]
    expect((arg as { where: Record<string, unknown> }).where).toMatchObject({
      batchId: "batch-1",
      schoolId: SCHOOL,
    })
  })
})

describe("who may promote", () => {
  it.each(["TEACHER", "STUDENT", "GUARDIAN"])(
    "a %s cannot approve, execute, override or set policy",
    async (role) => {
      as(role)

      const results = await Promise.all([
        approvePromotionBatch("batch-1"),
        executePromotions("batch-1"),
        overridePromotionDecision({
          candidateId: "cand-1",
          decision: "PROMOTE",
          reason: "x",
        }),
        upsertPromotionPolicy({ gradeId: "grade-1" }),
        evaluatePromotionCandidates({ yearId: "y1", gradeId: "grade-1" }),
      ])

      expect(results.every((r) => !r.success)).toBe(true)
      expect(db.promotionBatch.findFirst).not.toHaveBeenCalled()
      expect(db.promotionBatch.update).not.toHaveBeenCalled()
      expect(db.promotionCandidate.update).not.toHaveBeenCalled()
      expect(db.promotionPolicy.upsert).not.toHaveBeenCalled()
    }
  )

  it("a teacher may look; a student sees nothing", async () => {
    vi.mocked(db.promotionBatch.findMany).mockResolvedValue([
      { id: "batch-1" },
    ] as never)

    as("TEACHER")
    expect(await getPromotionBatches()).toHaveLength(1)

    as("STUDENT")
    expect(await getPromotionBatches()).toEqual([])
    expect(await getPromotionCandidates("batch-1")).toEqual([])
    expect(await getPromotionPolicy("grade-1")).toBeNull()
  })

  it("evaluation refuses another school's grade", async () => {
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue(null)

    const r = await evaluatePromotionCandidates({
      yearId: "y1",
      gradeId: "foreign-grade",
    })

    expect(r.success).toBe(false)
    expect(vi.mocked(db.academicGrade.findFirst).mock.calls[0][0]).toEqual({
      where: { id: "foreign-grade", schoolId: SCHOOL },
      select: { id: true },
    })
  })
})

describe("executePromotions — sections", () => {
  beforeEach(() => {
    vi.mocked(db.promotionBatch.findFirst).mockResolvedValue({
      id: "batch-1",
      status: "APPROVED",
      gradeId: "g7",
      yearId: "y1",
    } as never)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g7", yearLevelId: null },
      { id: "g8", yearLevelId: null },
    ] as never)
    vi.mocked(db.section.findMany).mockResolvedValue([
      { id: "8a", gradeId: "g8", letter: "A" },
      { id: "8b", gradeId: "g8", letter: "B" },
    ] as never)
  })

  it("moves 7-A to 8-A, leaves a letter the new grade lacks unplaced, and syncs the LMS", async () => {
    vi.mocked(db.promotionCandidate.findMany).mockResolvedValue([
      { id: "c1", studentId: "s1", finalDecision: "PROMOTE", newGradeId: "g8" },
      { id: "c2", studentId: "s2", finalDecision: "PROMOTE", newGradeId: "g8" },
      { id: "c3", studentId: "s3", finalDecision: "PROMOTE", newGradeId: "g8" },
    ] as never)
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "s1", section: { letter: "a " } },
      { id: "s2", section: { letter: "C" } },
      { id: "s3", section: null },
    ] as never)

    const r = await executePromotions("batch-1")

    expect(r).toEqual({ success: true, data: { executed: 3 } })
    const updates = vi
      .mocked(db.student.update)
      .mock.calls.map((c) => c[0] as { where: unknown; data: unknown })
    expect(updates).toEqual([
      {
        where: { id: "s1", schoolId: SCHOOL },
        data: { academicGradeId: "g8", sectionId: "8a" },
      },
      {
        where: { id: "s2", schoolId: SCHOOL },
        data: { academicGradeId: "g8", sectionId: null },
      },
      {
        where: { id: "s3", schoolId: SCHOOL },
        data: { academicGradeId: "g8", sectionId: null },
      },
    ])
    expect(vi.mocked(db.section.findMany).mock.calls[0][0]!.where).toEqual({
      schoolId: SCHOOL,
      gradeId: { in: ["g8"] },
    })
    expect(syncStudentSubjectEnrollments).toHaveBeenCalledTimes(3)
    expect(syncStudentSubjectEnrollments).toHaveBeenCalledWith(SCHOOL, "s1")
  })

  it("a retained student keeps their section", async () => {
    vi.mocked(db.promotionCandidate.findMany).mockResolvedValue([
      { id: "c1", studentId: "s1", finalDecision: "RETAIN", newGradeId: null },
    ] as never)
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "s1", section: { letter: "A" } },
    ] as never)

    await executePromotions("batch-1")

    expect(db.student.update).not.toHaveBeenCalled()
    expect(syncStudentSubjectEnrollments).not.toHaveBeenCalled()
  })
})
