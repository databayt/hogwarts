// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Disbursement → ledger integration. Locks in the Phase-2 fix: disbursing an
 * approved payroll run calls postSalaryPayment for every slip, so salary
 * expense reaches the general ledger. Before this vertical shipped, nothing
 * invoked processPayments, so the poster was permanently unreachable and the
 * GL omitted the largest cost a school has.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"

const postSalaryPayment = vi.fn()

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn().mockResolvedValue({}),
}))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkFinancePermission: vi.fn(),
}))
vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postSalaryPayment: (...args: unknown[]) => postSalaryPayment(...args),
}))
vi.mock("@/lib/db", () => ({
  db: {
    payrollRun: { findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() },
    salarySlip: { updateMany: vi.fn(), findMany: vi.fn() },
    school: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
}))

const { processPayments } =
  await import("@/components/school-dashboard/finance/payroll/actions")

const SCHOOL = "school-1"

function signedIn() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-1", role: "ACCOUNTANT", schoolId: SCHOOL },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
  } as never)
}

const APPROVED_RUN = {
  id: "run-1",
  schoolId: SCHOOL,
  status: "APPROVED",
  runNumber: "PR-1",
  processedBy: null,
  salarySlips: [{ id: "slip-1" }, { id: "slip-2" }],
}

const PAID_SLIPS = [
  {
    id: "slip-1",
    teacherId: "t-1",
    grossSalary: 100_000,
    taxAmount: 8_500,
    socialSecurityAmount: 7_000,
    netSalary: 84_500,
    teacher: {},
  },
  {
    id: "slip-2",
    teacherId: "t-2",
    grossSalary: 50_000,
    taxAmount: 3_000,
    socialSecurityAmount: 3_500,
    netSalary: 43_500,
    teacher: {},
  },
]

describe("processPayments → ledger", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    postSalaryPayment.mockResolvedValue({ success: true })
    vi.mocked(db.payrollRun.findFirst).mockResolvedValue(APPROVED_RUN as never)
    vi.mocked(db.salarySlip.updateMany).mockResolvedValue({ count: 2 } as never)
    vi.mocked(db.salarySlip.findMany).mockResolvedValue(PAID_SLIPS as never)
    vi.mocked(db.payrollRun.updateMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      preferredLanguage: "en",
    } as never)
  })

  it("posts every paid slip to the ledger with its gross/tax/net", async () => {
    signedIn()
    vi.mocked(checkFinancePermission).mockResolvedValue(true)

    const res = await processPayments("run-1")

    expect(res.success).toBe(true)
    expect(postSalaryPayment).toHaveBeenCalledTimes(2)
    expect(postSalaryPayment).toHaveBeenCalledWith(
      SCHOOL,
      expect.objectContaining({
        slipId: "slip-1",
        grossSalary: 100_000,
        taxAmount: 8_500,
        // Social security is now withheld and remitted to the ledger, not 0.
        socialSecurityAmount: 7_000,
        netSalary: 84_500,
      })
    )
    // Run flips to PAID only after the ledger is posted.
    expect(db.payrollRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "APPROVED" }),
        data: { status: "PAID" },
      })
    )
  })

  it("refuses a caller without payroll:process — and posts NOTHING", async () => {
    signedIn()
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const res = await processPayments("run-1")

    expect(res.success).toBe(false)
    expect(postSalaryPayment).not.toHaveBeenCalled()
    expect(db.salarySlip.updateMany).not.toHaveBeenCalled()
  })

  it("refuses when the run is not APPROVED (no double-disburse)", async () => {
    signedIn()
    vi.mocked(checkFinancePermission).mockResolvedValue(true)
    vi.mocked(db.payrollRun.findFirst).mockResolvedValue({
      ...APPROVED_RUN,
      status: "PAID",
    } as never)

    const res = await processPayments("run-1")

    expect(res.success).toBe(false)
    expect(postSalaryPayment).not.toHaveBeenCalled()
  })
})
