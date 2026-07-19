// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payslip PDF: proves the @react-pdf tree actually renders to a valid PDF
 * (a typecheck can't catch a bad style prop that throws at render time), and
 * that the download route enforces the same owner-OR-finance access as the
 * on-screen page before it renders anything.
 */

import { auth } from "@/auth"
import { renderToBuffer } from "@react-pdf/renderer"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkFinancePermission } from "@/components/school-dashboard/finance/lib/permissions"
import { PayslipDocument } from "@/components/school-dashboard/finance/payroll/payslip/payslip-document"

const T = {
  payslip: "Payslip",
  earnings: "Earnings",
  deductions: "Deductions",
  netPay: "Net pay",
}

const DOC_DATA = {
  slipNumber: "SS-1",
  employeeName: "Amina Y",
  payPeriod: "2026-01-01 — 2026-01-31",
  payDate: "2026-02-01",
  status: "PAID",
  currency: "SDG",
  locale: "ar-SD",
  baseSalary: 100000,
  allowances: [{ name: "Housing", amount: 5000 }],
  grossSalary: 105000,
  taxAmount: 10500,
  socialSecurityAmount: 7000,
  otherDeductions: [{ name: "Loan", amount: 2000 }],
  totalDeductions: 19500,
  netSalary: 85500,
  schoolName: "نموذج",
}

describe("payslip PDF — renders", () => {
  it("produces a non-empty, valid PDF buffer", async () => {
    const buffer = await renderToBuffer(
      PayslipDocument({ data: DOC_DATA, t: T })
    )
    expect(buffer.length).toBeGreaterThan(1000)
    // Every PDF starts with the %PDF- magic bytes.
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-")
  })
})

// ── Route access ────────────────────────────────────────────────────────────
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkFinancePermission: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { salarySlip: { findFirst: vi.fn() } },
}))

const { GET } = await import("@/app/api/payroll/slip/[id]/route")

const SCHOOL = "school-1"
const OWNER = "user-owner"

function callerIs(userId: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role: "TEACHER", schoolId: SCHOOL },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
  } as never)
}

const routeParams = { params: Promise.resolve({ id: "slip-1" }) }
const req = new Request("http://demo.localhost/api/payroll/slip/slip-1")

describe("payslip PDF route — access", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      teacher: { userId: OWNER, firstName: "Amina", lastName: "Y" },
      school: {
        name: "نموذج",
        currency: "SDG",
        logoUrl: null,
        preferredLanguage: "ar",
      },
    } as never)
  })

  it("403s a non-owner without payroll:view (never renders the PDF)", async () => {
    callerIs("user-other")
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const res = await GET(req, routeParams)

    expect(res.status).toBe(403)
    expect(res.headers.get("content-type")).toContain("application/json")
  })

  it("serves a PDF to the slip's owner", async () => {
    callerIs(OWNER)
    vi.mocked(checkFinancePermission).mockResolvedValue(false)

    const res = await GET(req, routeParams)

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/pdf")
  })
})
