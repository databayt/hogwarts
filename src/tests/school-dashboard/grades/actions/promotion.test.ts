// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  approvePromotionBatch,
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
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
// promotion.ts imports the Prisma namespace for JsonNull — provide a stub.
vi.mock("@prisma/client", () => ({
  Prisma: { JsonNull: null },
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
    expect(
      (findArg as { where: Record<string, unknown> }).where
    ).toMatchObject({ id: "cand-1", schoolId: SCHOOL })
    const updArg = vi.mocked(db.promotionCandidate.update).mock.calls[0][0]
    expect((updArg as { data: { finalDecision: string } }).data.finalDecision).toBe(
      "RETAIN"
    )
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
