// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { markInvoicePaid } from "@/components/school-dashboard/finance/invoice/actions"
import { postInvoicePayment } from "@/components/school-dashboard/finance/lib/accounting/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn().mockResolvedValue(true),
  checkFinancePermission: vi.fn().mockResolvedValue(true),
}))
vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postInvoicePayment: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/db", () => {
  const m = () => ({
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  })
  return { db: { userInvoice: m(), user: m(), $transaction: vi.fn() } }
})

const SCHOOL = "school-1"
const USER = "user-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER, role: "ADMIN", schoolId: SCHOOL },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
  } as never)
  // canSeeAllSchoolInvoices() reads the user's role.
  vi.mocked(db.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never)
  // markInvoicePaid reads the balance + flips inside one transaction; run the
  // callback against the same db mock so tx === db.
  vi.mocked(db.$transaction).mockImplementation((cb: never) =>
    (cb as (tx: typeof db) => unknown)(db)
  )
})

describe("markInvoicePaid", () => {
  it("rejects an already-settled invoice (no remaining balance) without flipping it", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      invoice_no: "INV-1",
      total: 100,
      amountPaid: 100,
      status: "PAID",
      schoolId: SCHOOL,
    } as never)

    const res = await markInvoicePaid("inv-1")

    expect(res.success).toBe(false)
    expect(db.userInvoice.updateMany).not.toHaveBeenCalled()
    expect(postInvoicePayment).not.toHaveBeenCalled()
  })

  it("returns an error for a missing invoice", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
    const res = await markInvoicePaid("inv-x")
    expect(res.success).toBe(false)
  })

  it("does not post when the conditional flip loses the race (count 0)", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      invoice_no: "INV-1",
      total: 250,
      amountPaid: 0,
      status: "UNPAID",
      schoolId: SCHOOL,
    } as never)
    vi.mocked(db.userInvoice.updateMany).mockResolvedValue({
      count: 0,
    } as never)

    const res = await markInvoicePaid("inv-1")

    expect(res.success).toBe(false)
    expect(postInvoicePayment).not.toHaveBeenCalled()
  })

  it("flips an unpaid invoice (schoolId-scoped CAS) and posts only the remaining balance", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      invoice_no: "INV-1",
      total: 250,
      amountPaid: 100, // a prior partial payment
      status: "PARTIAL",
      schoolId: SCHOOL,
    } as never)
    vi.mocked(db.userInvoice.updateMany).mockResolvedValue({
      count: 1,
    } as never)

    const res = await markInvoicePaid("inv-1")

    expect(res.success).toBe(true)
    expect(db.userInvoice.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "inv-1",
          schoolId: SCHOOL,
          status: { notIn: ["PAID", "CANCELLED"] },
        }),
        data: { amountPaid: 250, status: "PAID" },
      })
    )
    // Posts the balance still due (250 − 100 = 150), not the full total.
    expect(postInvoicePayment).toHaveBeenCalledWith(
      SCHOOL,
      expect.objectContaining({ invoiceId: "inv-1", amount: 150 })
    )
  })
})
