// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Per-school payroll override: the DB layer that makes country rules
 * "adjustable in config". Locks in that (a) resolveSchoolPayrollPolicy applies
 * a saved override over the country pack, and (b) the save action is gated by
 * payroll:edit and validated before it writes.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkFinancePermission: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { schoolPayrollPolicy: { findUnique: vi.fn(), upsert: vi.fn() } },
}))

const { resolveSchoolPayrollPolicy } =
  await import("@/components/school-dashboard/finance/payroll/country-rules/school-policy")
const { saveSchoolPayrollPolicy } =
  await import("@/components/school-dashboard/finance/payroll/settings/actions")
const { calculateProgressiveTax } =
  await import("@/components/school-dashboard/finance/payroll/config")

const SCHOOL = "school-1"

describe("resolveSchoolPayrollPolicy — DB override over country pack", () => {
  beforeEach(() => vi.clearAllMocks())

  it("applies a saved SS-rate override on top of the SD country pack", async () => {
    vi.mocked(db.schoolPayrollPolicy.findUnique).mockResolvedValue({
      countryOverride: null,
      taxBrackets: null,
      socialSecurityEmployeeRate: 5, // overrides SD's 7
      socialSecurityEmployerRate: null,
    } as never)

    const policy = await resolveSchoolPayrollPolicy(SCHOOL, { country: "SD" })

    expect(policy.country).toBe("SD")
    expect(policy.socialSecurityEmployeeRate).toBe(5) // overridden
    expect(policy.socialSecurityEmployerRate).toBe(12) // inherited from SD pack
  })

  it("countryOverride forces a different pack (SD school → AE rules, 0% tax)", async () => {
    vi.mocked(db.schoolPayrollPolicy.findUnique).mockResolvedValue({
      countryOverride: "AE",
      taxBrackets: null,
      socialSecurityEmployeeRate: null,
      socialSecurityEmployerRate: null,
    } as never)

    const policy = await resolveSchoolPayrollPolicy(SCHOOL, { country: "SD" })

    expect(policy.country).toBe("AE")
    expect(calculateProgressiveTax(250_000, policy.taxBrackets)).toBe(0)
  })

  it("no override row → pure country pack", async () => {
    vi.mocked(db.schoolPayrollPolicy.findUnique).mockResolvedValue(
      null as never
    )
    const policy = await resolveSchoolPayrollPolicy(SCHOOL, { country: "SD" })
    expect(policy.socialSecurityEmployeeRate).toBe(7)
  })
})

describe("saveSchoolPayrollPolicy — gated + validated upsert", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u-1", role: "ADMIN", schoolId: SCHOOL },
    } as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL,
      subdomain: "demo",
    } as never)
    vi.mocked(db.schoolPayrollPolicy.upsert).mockResolvedValue({} as never)
  })

  it("refuses a caller without payroll:edit — writes nothing", async () => {
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const res = await saveSchoolPayrollPolicy({
      countryOverride: "AE",
      socialSecurityEmployeeRate: "5",
      socialSecurityEmployerRate: "",
    })

    expect(res.success).toBe(false)
    expect(db.schoolPayrollPolicy.upsert).not.toHaveBeenCalled()
  })

  it("upserts blank fields as null (inherit) and a country as upper-case ISO-2", async () => {
    vi.mocked(checkFinancePermission).mockResolvedValue(true)

    const res = await saveSchoolPayrollPolicy({
      countryOverride: "ae",
      socialSecurityEmployeeRate: "5.5",
      socialSecurityEmployerRate: "",
    })

    expect(res.success).toBe(true)
    const call = vi.mocked(db.schoolPayrollPolicy.upsert).mock.calls[0][0] as {
      create: Record<string, unknown>
      where: { schoolId: string }
    }
    expect(call.where.schoolId).toBe(SCHOOL)
    expect(call.create.countryOverride).toBe("AE")
    expect(call.create.socialSecurityEmployeeRate).toBe(5.5)
    expect(call.create.socialSecurityEmployerRate).toBeNull() // blank → inherit
  })

  it("rejects an invalid country / out-of-range rate — no write", async () => {
    vi.mocked(checkFinancePermission).mockResolvedValue(true)

    const bad = await saveSchoolPayrollPolicy({
      countryOverride: "Sudan", // not ISO-2
      socialSecurityEmployeeRate: "",
      socialSecurityEmployerRate: "",
    })
    expect(bad.success).toBe(false)

    const badRate = await saveSchoolPayrollPolicy({
      countryOverride: "",
      socialSecurityEmployeeRate: "250", // >100
      socialSecurityEmployerRate: "",
    })
    expect(badRate.success).toBe(false)
    expect(db.schoolPayrollPolicy.upsert).not.toHaveBeenCalled()
  })
})
