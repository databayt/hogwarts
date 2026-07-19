// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payslip is salary PII. The detail page must show a slip only to its owner
 * (the staff member whose slip it is) or to someone with payroll:view — never
 * to another staff member. This locks that decision in; the guard-audit ratchet
 * only proves a gate is *present*, not that it's owner-OR-finance.
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn().mockResolvedValue({ finance: {} }),
}))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkFinancePermission: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: {
    salarySlip: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const PayslipPage = (
  await import("@/app/[lang]/s/[subdomain]/(school-dashboard)/finance/payroll/slips/[id]/page")
).default

const SCHOOL = "school-1"
const OWNER_USER = "user-owner"
const OTHER_USER = "user-other"

function callerIs(userId: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role: "TEACHER", schoolId: SCHOOL },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
  } as never)
}

const params = Promise.resolve({
  lang: "en" as const,
  subdomain: "demo",
  id: "slip-1",
})

/** Walk the returned element tree for a component whose function name matches. */
function containsComponent(node: any, name: string): boolean {
  if (!node || typeof node !== "object") return false
  const t = node.type
  if (typeof t === "function" && t.name === name) return true
  const kids = node.props?.children
  if (Array.isArray(kids)) return kids.some((k) => containsComponent(k, name))
  return containsComponent(kids, name)
}

describe("payslip detail — own-data access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.school.findUnique).mockResolvedValue({
      currency: "SDG",
    } as never)
    // The slip belongs to OWNER_USER's staff record.
    vi.mocked(db.salarySlip.findFirst).mockResolvedValue({
      slipNumber: "SS-1",
      payPeriodStart: new Date("2026-01-01"),
      payPeriodEnd: new Date("2026-01-31"),
      payDate: new Date("2026-02-01"),
      status: "PAID",
      baseSalary: 100000,
      allowances: [],
      grossSalary: 100000,
      taxAmount: 10500,
      socialSecurityAmount: 7000,
      otherDeductions: [],
      totalDeductions: 17500,
      netSalary: 82500,
      daysWorked: 22,
      teacher: { userId: OWNER_USER, firstName: "Amina", lastName: "Y" },
    } as never)
  })

  it("shows the payslip to its OWNER (no finance permission needed)", async () => {
    callerIs(OWNER_USER)
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const el = await PayslipPage({ params })

    expect(containsComponent(el, "PayslipBreakdown")).toBe(true)
    expect(containsComponent(el, "FinanceAccessDenied")).toBe(false)
  })

  it("DENIES a different staff member (not owner, no payroll:view)", async () => {
    callerIs(OTHER_USER)
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const el = await PayslipPage({ params })

    expect(containsComponent(el, "FinanceAccessDenied")).toBe(true)
    expect(containsComponent(el, "PayslipBreakdown")).toBe(false)
  })

  it("shows the payslip to a non-owner WITH payroll:view (admin/accountant)", async () => {
    callerIs(OTHER_USER)
    vi.mocked(checkFinancePermission).mockResolvedValue(true)

    const el = await PayslipPage({ params })

    expect(containsComponent(el, "PayslipBreakdown")).toBe(true)
    expect(containsComponent(el, "FinanceAccessDenied")).toBe(false)
  })
})
