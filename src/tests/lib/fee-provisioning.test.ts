// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { provisionSchoolFees } from "@/lib/fee-provisioning"

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
  vi.mocked(db.academicStream.findMany).mockResolvedValue([
    { id: "stream-sci", name: "Science" },
  ] as never)
  // No pre-existing auto rows by default.
  vi.mocked(db.feeStructure.findMany).mockResolvedValue([] as never)
  vi.mocked(db.feeStructure.create).mockResolvedValue({} as never)
  vi.mocked(db.feeStructure.update).mockResolvedValue({} as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("provisionSchoolFees — pricing matrix", () => {
  it("legacy: no PricingRules → one base structure per grade at School.tuitionFee", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
      { id: "g2", name: "Grade 2", gradeNumber: 2, classes: [] },
    ] as never)
    vi.mocked(db.pricingRule.findMany).mockResolvedValue([] as never)

    const result = await provisionSchoolFees(SCHOOL_ID)

    expect(result.created).toBe(2)
    expect(db.feeStructure.create).toHaveBeenCalledTimes(2)
    // Each base structure: totalAmount == tuition, sourceSignals streamId/type null.
    const firstPayload = vi.mocked(db.feeStructure.create).mock.calls[0][0]
      .data as Record<string, unknown>
    expect(firstPayload.totalAmount).toBe(5000)
    expect(firstPayload.tuitionFee).toBe(5000)
    expect(
      (firstPayload.sourceSignals as Record<string, unknown>).gradeId
    ).toBe("g1")
    expect(
      (firstPayload.sourceSignals as Record<string, unknown>).streamId
    ).toBeNull()
    expect(
      (firstPayload.sourceSignals as Record<string, unknown>).studentType
    ).toBeNull()
  })

  it("materialises a per-stream variant on top of the grade base", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g10", name: "Grade 10", gradeNumber: 10, classes: [] },
    ] as never)
    vi.mocked(db.pricingRule.findMany).mockResolvedValue([
      {
        gradeId: "g10",
        academicStreamId: "stream-sci",
        studentType: null,
        tuitionFee: 6000,
        admissionFee: 500,
        registrationFee: null,
        examFee: null,
        libraryFee: null,
        laboratoryFee: 300,
        sportsFee: null,
        transportFee: null,
        hostelFee: null,
        otherFees: null,
        installments: 4,
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID)

    // Base (g10, null, null) + Science variant (g10, stream-sci, null) = 2.
    expect(result.created).toBe(2)
    const payloads = vi
      .mocked(db.feeStructure.create)
      .mock.calls.map((c) => c[0].data as Record<string, unknown>)

    const base = payloads.find(
      (p) => (p.sourceSignals as Record<string, unknown>).streamId === null
    )!
    const science = payloads.find(
      (p) =>
        (p.sourceSignals as Record<string, unknown>).streamId === "stream-sci"
    )!

    expect(base.totalAmount).toBe(5000) // base falls back to school tuition
    // Science variant total = sum of components: 6000 + 500 + 300 = 6800.
    expect(science.totalAmount).toBe(6800)
    expect(science.tuitionFee).toBe(6000)
    expect(science.name).toContain("Science")
  })

  it("totalAmount is the SUM of all components, not tuition alone (undercharge fix)", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)
    vi.mocked(db.pricingRule.findMany).mockResolvedValue([
      {
        gradeId: "g1",
        academicStreamId: null,
        studentType: null,
        tuitionFee: 5000,
        admissionFee: 1000,
        registrationFee: 500,
        examFee: 200,
        libraryFee: null,
        laboratoryFee: null,
        sportsFee: null,
        transportFee: null,
        hostelFee: null,
        otherFees: [{ name: "Uniform", amount: 300 }],
        installments: 4,
      },
    ] as never)

    await provisionSchoolFees(SCHOOL_ID)

    const payload = vi.mocked(db.feeStructure.create).mock.calls[0][0]
      .data as Record<string, unknown>
    // 5000 + 1000 + 500 + 200 + 300(otherFees) = 7000.
    expect(payload.totalAmount).toBe(7000)
  })

  it("skips locked auto-generated rows on recompute", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g1", name: "Grade 1", gradeNumber: 1, classes: [] },
    ] as never)
    vi.mocked(db.pricingRule.findMany).mockResolvedValue([] as never)
    // One existing locked base row for g1.
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      {
        id: "fs-existing",
        classId: null,
        isLocked: true,
        isActive: true,
        sourceSignals: { gradeId: "g1", streamId: null, studentType: null },
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID, { mode: "recompute" })

    expect(result.lockedSkipped).toBe(1)
    expect(result.updated).toBe(0)
    expect(db.feeStructure.create).not.toHaveBeenCalled()
  })

  it("deactivates an auto-generated variant whose PricingRule was removed (orphan sweep)", async () => {
    setupSchool(5000)
    vi.mocked(db.academicGrade.findMany).mockResolvedValue([
      { id: "g10", name: "Grade 10", gradeNumber: 10, classes: [] },
    ] as never)
    // No rules now → only the base variant is materialised this run.
    vi.mocked(db.pricingRule.findMany).mockResolvedValue([] as never)
    // But a stale Science variant exists from a previous run.
    vi.mocked(db.feeStructure.findMany).mockResolvedValue([
      {
        id: "fs-science-stale",
        classId: null,
        isLocked: false,
        isActive: true,
        sourceSignals: {
          gradeId: "g10",
          streamId: "stream-sci",
          studentType: null,
        },
      },
    ] as never)

    const result = await provisionSchoolFees(SCHOOL_ID, { mode: "recompute" })

    expect(result.deactivated).toBe(1)
    expect(db.feeStructure.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "fs-science-stale" },
        data: { isActive: false },
      })
    )
  })
})
