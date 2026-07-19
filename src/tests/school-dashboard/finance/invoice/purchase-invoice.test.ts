// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Purchase → PAID invoice (Stripe webhook helper). The idempotency contract
// matters most here: Stripe delivers at-least-once, so redelivery must never
// create a second invoice.
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { createPurchaseInvoiceForCheckout } from "@/components/school-dashboard/finance/invoice/purchase-invoice"

vi.mock("@/lib/db", () => {
  const dbMock: any = {
    userInvoice: { findFirst: vi.fn(), create: vi.fn() },
    userInvoiceAddress: { create: vi.fn() },
    school: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  }
  dbMock.$transaction = vi.fn((cb: (tx: any) => any) => cb(dbMock))
  return { db: dbMock }
})

const INPUT = {
  schoolId: "school-1",
  userId: "buyer-1",
  amount: 49.99,
  currency: "USD",
  itemName: "Algebra Course",
  sessionId: "cs_test_abc123",
  purchaseType: "course_enrollment" as const,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.$transaction).mockImplementation((cb: any) => cb(db))
  vi.mocked(db.userInvoice.findFirst).mockResolvedValue(null)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    name: "Hogwarts",
    address: "Castle 1",
    currency: "SDG",
  } as never)
  vi.mocked(db.user.findUnique).mockResolvedValue({
    username: "buyer",
    email: "buyer@example.com",
    student: { firstName: "Ada", lastName: "Lovelace" },
    guardian: null,
  } as never)
  vi.mocked(db.userInvoiceAddress.create)
    .mockResolvedValueOnce({ id: "addr-from" } as never)
    .mockResolvedValueOnce({ id: "addr-to" } as never)
  vi.mocked(db.userInvoice.create).mockResolvedValue({ id: "inv-new" } as never)
})

describe("createPurchaseInvoiceForCheckout", () => {
  it("creates a PAID invoice keyed on the checkout session", async () => {
    const result = await createPurchaseInvoiceForCheckout(INPUT)

    expect(result).toEqual({ created: true, invoiceId: "inv-new" })
    expect(db.userInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          invoice_no: "PUR-cs_test_abc123",
          status: "PAID",
          amountPaid: 49.99,
          total: 49.99,
          sub_total: 49.99,
          currency: "USD",
          userId: "buyer-1",
          schoolId: "school-1",
        }),
      })
    )
  })

  it("uses the student name for the recipient address", async () => {
    await createPurchaseInvoiceForCheckout(INPUT)
    expect(db.userInvoiceAddress.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Ada Lovelace" }),
      })
    )
  })

  it("is idempotent: an existing session invoice short-circuits", async () => {
    vi.mocked(db.userInvoice.findFirst).mockResolvedValue({
      id: "inv-existing",
    } as never)

    const result = await createPurchaseInvoiceForCheckout(INPUT)
    expect(result).toEqual({ created: false, invoiceId: "inv-existing" })
    expect(db.userInvoice.create).not.toHaveBeenCalled()
  })

  it("treats a P2002 race as already-processed", async () => {
    vi.mocked(db.userInvoice.create).mockRejectedValue(
      Object.assign(new Error("unique"), { code: "P2002" })
    )

    const result = await createPurchaseInvoiceForCheckout(INPUT)
    expect(result.created).toBe(false)
  })

  it("skips gracefully when schoolId is missing", async () => {
    const result = await createPurchaseInvoiceForCheckout({
      ...INPUT,
      schoolId: "",
    })
    expect(result).toEqual({ created: false })
    expect(db.userInvoice.findFirst).not.toHaveBeenCalled()
  })

  it("skips zero and negative amounts", async () => {
    expect(
      await createPurchaseInvoiceForCheckout({ ...INPUT, amount: 0 })
    ).toEqual({ created: false })
    expect(
      await createPurchaseInvoiceForCheckout({ ...INPUT, amount: -5 })
    ).toEqual({ created: false })
    expect(db.userInvoice.create).not.toHaveBeenCalled()
  })
})
