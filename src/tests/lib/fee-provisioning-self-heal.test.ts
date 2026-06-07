// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { selfHealFeeProvisioning } from "@/lib/fee-provisioning-self-heal"

vi.mock("@/lib/db", () => ({
  db: {
    feeStructure: { count: vi.fn() },
    academicGrade: { count: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const provisionSchoolFees = vi.fn().mockResolvedValue({
  created: 12,
  updated: 0,
  lockedSkipped: 0,
  deactivated: 0,
  errors: [],
  scope: "per-grade",
  mode: "recompute",
  academicYear: "2025/2026",
  currency: "SDG",
  assignedStudents: 0,
})
vi.mock("@/lib/fee-provisioning", () => ({ provisionSchoolFees }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("Step 7 selfHealFeeProvisioning", () => {
  it("triggers provisioning when grades exist, tuition set, and zero auto rows", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.count).mockResolvedValue(12)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: 5000,
    } as never)

    await selfHealFeeProvisioning("school-1")

    expect(provisionSchoolFees).toHaveBeenCalledWith("school-1", {
      mode: "recompute",
    })
  })

  it("skips when auto rows already exist (happy path — onboarding succeeded)", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(12)
    vi.mocked(db.academicGrade.count).mockResolvedValue(12)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: 5000,
    } as never)

    await selfHealFeeProvisioning("school-2")
    expect(provisionSchoolFees).not.toHaveBeenCalled()
  })

  it("skips when no grades (onboarding never reached catalog setup)", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.count).mockResolvedValue(0)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: 5000,
    } as never)

    await selfHealFeeProvisioning("school-3")
    expect(provisionSchoolFees).not.toHaveBeenCalled()
  })

  it("skips when tuitionFee is null (Step 4 never completed)", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.count).mockResolvedValue(12)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: null,
    } as never)

    await selfHealFeeProvisioning("school-4")
    expect(provisionSchoolFees).not.toHaveBeenCalled()
  })

  it("skips when tuitionFee is 0 (explicitly free school — no fee to provision)", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.count).mockResolvedValue(12)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: 0,
    } as never)

    await selfHealFeeProvisioning("school-5")
    expect(provisionSchoolFees).not.toHaveBeenCalled()
  })

  it("swallows provisioning errors (never blocks /finance/fees page render)", async () => {
    vi.mocked(db.feeStructure.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.count).mockResolvedValue(12)
    vi.mocked(db.school.findUnique).mockResolvedValue({
      tuitionFee: 5000,
    } as never)
    provisionSchoolFees.mockRejectedValueOnce(new Error("db blew up"))

    await expect(selfHealFeeProvisioning("school-6")).resolves.toBeUndefined()
  })

  it("swallows pre-heal query errors (never blocks render)", async () => {
    vi.mocked(db.feeStructure.count).mockRejectedValue(new Error("boom"))

    await expect(selfHealFeeProvisioning("school-7")).resolves.toBeUndefined()
    expect(provisionSchoolFees).not.toHaveBeenCalled()
  })
})
