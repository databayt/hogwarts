// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  buildQuarterlySchedule,
  provisionSchoolFees,
} from "@/lib/fee-provisioning"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    schoolYear: { findFirst: vi.fn() },
    academicGrade: { findMany: vi.fn() },
    pricingRule: { findMany: vi.fn() },
    academicStream: { findMany: vi.fn() },
    feeStructure: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    student: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/payment/gateway-config", () => ({
  resolveDefaultCurrency: vi.fn().mockReturnValue("USD"),
}))

// The school-level provisioner fans out to ensureStudentFeeAssignments — mock
// it so these tests focus on structure materialisation, not the per-student layer.
vi.mock("@/lib/fee-auto-assign", () => ({
  ensureStudentFeeAssignments: vi.fn().mockResolvedValue({
    created: 0,
    existing: 0,
    skipped: 0,
    assignmentIds: [],
    warnings: [],
  }),
}))

const SCHOOL_ID = "school-1"
const YEAR = "2026-2027"

function setupSchool(tuitionFee = 5000) {
  vi.mocked(db.school.findUnique).mockResolvedValue({
    id: SCHOOL_ID,
    country: "US",
    currency: "USD",
    timezone: "UTC",
    schoolType: "PRIVATE",
    schoolLevel: "K12",
    tuitionFee,
  } as never)
  vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
    yearName: YEAR,
  } as never)
  vi.mocked(db.student.findMany).mockResolvedValue([] as never)
  vi.mocked(db.pricingRule.findMany).mockResolvedValue([] as never)
  vi.mocked(db.academicStream.findMany).mockResolvedValue([] as never)
  vi.mocked(db.feeStructure.findMany).mockResolvedValue([] as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// buildQuarterlySchedule
// ---------------------------------------------------------------------------

describe("buildQuarterlySchedule", () => {
  it("produces 4 entries summing to totalAmount", () => {
    const schedule = buildQuarterlySchedule("2026-2027", 5000)
    expect(schedule).toHaveLength(4)
    const total = schedule.reduce((s, e) => s + e.amount, 0)
    expect(total).toBeCloseTo(5000, 2)
  })

  it("first entry starts in September of the start year", () => {
    const schedule = buildQuarterlySchedule("2026-2027", 1200)
    const first = new Date(schedule[0].dueDate)
    expect(first.getUTCMonth()).toBe(8) // September = month index 8
    expect(first.getUTCFullYear()).toBe(2026)
  })

  it("last entry absorbs rounding remainder", () => {
    const schedule = buildQuarterlySchedule("2026-2027", 1000)
    const totalFromSlices = schedule.reduce((s, e) => s + e.amount, 0)
    expect(totalFromSlices).toBe(1000)
  })

  it("labels include Q1..Q4 and the academic year", () => {
    const schedule = buildQuarterlySchedule("2025-2026", 800)
    expect(schedule[0].description).toContain("Q1")
    expect(schedule[3].description).toContain("Q4")
    expect(schedule[0].description).toContain("2025-2026")
  })
})

// ---------------------------------------------------------------------------
// provisionSchoolFees — structure materialisation
// ---------------------------------------------------------------------------

describe("provisionSchoolFees", () => {
  it("creates one FeeStructure per grade when no existing rows", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [{ id: "c1" }] },
      { id: "g2", name: "Grade 2", gradeNumber: 2, classes: [{ id: "c2" }] },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID)

    expect(result.created).toBe(2)
    expect(result.updated).toBe(0)
    expect(db.feeStructure.create).toHaveBeenCalledTimes(2)
  })

  it("updates unlocked auto-generated rows in recompute mode", async () => {
    setupSchool(6000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      {
        id: "fs-g1",
        isLocked: false,
        isActive: true,
        classId: null,
        sourceSignals: {
          gradeId: "g1",
          tuitionFee: 5000,
          currency: "USD",
          country: "US",
          schoolType: "PRIVATE",
          schoolLevel: "K12",
          version: 1,
        },
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID, { mode: "recompute" })

    expect(result.updated).toBe(1)
    expect(result.created).toBe(0)
    expect(db.feeStructure.update).toHaveBeenCalledTimes(1)
  })

  it("skips locked auto-generated rows in recompute mode", async () => {
    setupSchool()
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      {
        id: "fs-g1",
        isLocked: true,
        isActive: true,
        classId: null,
        sourceSignals: { gradeId: "g1", version: 1 },
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID, { mode: "recompute" })

    expect(result.lockedSkipped).toBe(1)
    expect(result.updated).toBe(0)
    expect(db.feeStructure.update).not.toHaveBeenCalled()
  })

  it("does not touch rows when mode is new-scope and row already exists", async () => {
    setupSchool()
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      {
        id: "fs-g1",
        isLocked: false,
        isActive: true,
        classId: null,
        sourceSignals: { gradeId: "g1", version: 1 },
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID, { mode: "new-scope" })

    expect(result.created).toBe(0)
    expect(result.updated).toBe(0)
    expect(db.feeStructure.update).not.toHaveBeenCalled()
  })

  it("created structures have a quarterly paymentSchedule when tuitionFee > 0", async () => {
    setupSchool(4000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)

    await provisionSchoolFees(SCHOOL_ID)

    const createCall = vi.mocked(db.feeStructure.create).mock.calls[0]
    const payload = (createCall?.[0] as { data: { paymentSchedule?: unknown } })
      ?.data
    expect(Array.isArray(payload?.paymentSchedule)).toBe(true)
    expect((payload?.paymentSchedule as unknown[]).length).toBe(4)
  })
})
