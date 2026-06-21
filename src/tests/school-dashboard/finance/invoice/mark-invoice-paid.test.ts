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
}))
vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postInvoicePayment: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/db", () => {
  const m = () => ({ findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() })
  return { db: { userInvoice: m(), user: m() } }
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
})

describe("markInvoicePaid", () => {
  it("rejects an already-paid invoice and does not update it", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      invoice_no: "INV-1",
      total: 100,
      status: "PAID",
      schoolId: SCHOOL,
    } as never)

    const res = await markInvoicePaid("inv-1")

    expect(res.success).toBe(false)
    expect(db.userInvoice.update).not.toHaveBeenCalled()
    expect(postInvoicePayment).not.toHaveBeenCalled()
  })

  it("returns an error for a missing invoice", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
    const res = await markInvoicePaid("inv-x")
    expect(res.success).toBe(false)
  })

  it("marks an unpaid invoice paid (amountPaid=total, PAID) and posts the ledger", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-1",
      invoice_no: "INV-1",
      total: 250,
      status: "UNPAID",
      schoolId: SCHOOL,
    } as never)
    vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)

    const res = await markInvoicePaid("inv-1")

    expect(res.success).toBe(true)
    expect(db.userInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { amountPaid: 250, status: "PAID" } })
    )
    expect(postInvoicePayment).toHaveBeenCalledWith(
      SCHOOL,
      expect.objectContaining({
        invoiceId: "inv-1",
        amount: 250,
        invoiceNumber: "INV-1",
      })
    )
  })
})
