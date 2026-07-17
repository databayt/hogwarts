// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The canonical invoice allocator. This is money math, so the cases below pin
 * the exact bug it replaced: the old `recordPayment` copy allocated against
 * `sub_total` (pre-tax/discount), which mis-marked any invoice whose `total`
 * differed from its `sub_total`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { allocatePaymentToInvoices } from "@/components/school-dashboard/finance/lib/invoice-allocation"

vi.mock("@/lib/db", () => ({
  db: {
    userInvoice: {
      findMany: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}))

const SCHOOL = "school-1"
const FA = "fa-1"

type Inv = { id: string; total: number; amountPaid: number }

function mockInvoices(rows: Inv[]) {
  ;(db.userInvoice.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(rows)
}

/** The (id, data) pairs passed to userInvoice.update, in call order. */
function updates(): Array<{ id: string; amountPaid: number; status: string }> {
  return (db.userInvoice.update as ReturnType<typeof vi.fn>).mock.calls.map(
    (c) => ({
      id: c[0].where.id,
      amountPaid: c[0].data.amountPaid,
      status: c[0].data.status,
    })
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(db.userInvoice.update as ReturnType<typeof vi.fn>).mockResolvedValue({})
})

describe("allocatePaymentToInvoices — the sub_total bug", () => {
  it("REGRESSION: a taxed invoice is measured by `total`, not `sub_total`", async () => {
    // Invoice: sub_total 100, +10% tax → total 110. A 105 payment does NOT
    // cover it. The old code compared against sub_total (100) and flipped it to
    // PAID at 105 — booking a fully-paid invoice that still owed 5.
    mockInvoices([{ id: "inv-1", total: 110, amountPaid: 0 }])

    await allocatePaymentToInvoices(SCHOOL, FA, 105)

    const [u] = updates()
    expect(u.status).toBe("PARTIAL")
    expect(u.amountPaid).toBe(105)
  })

  it("marks PAID only when `total` (incl. tax) is fully covered", async () => {
    mockInvoices([{ id: "inv-1", total: 110, amountPaid: 0 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 110)
    expect(updates()).toEqual([
      { id: "inv-1", amountPaid: 110, status: "PAID" },
    ])
  })

  it("queries against `total`, never `sub_total`", async () => {
    mockInvoices([{ id: "inv-1", total: 100, amountPaid: 0 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 100)
    const select = (db.userInvoice.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].select
    expect(select.total).toBe(true)
    expect(select.sub_total).toBeUndefined()
  })
})

describe("allocatePaymentToInvoices — incremental contract", () => {
  it("adds this payment on top of an invoice's existing amountPaid", async () => {
    // Already PARTIAL at 40 of 100; a second payment of 30 → 70, still PARTIAL.
    mockInvoices([{ id: "inv-1", total: 100, amountPaid: 40 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 30)
    expect(updates()).toEqual([
      { id: "inv-1", amountPaid: 70, status: "PARTIAL" },
    ])
  })

  it("clears the remaining balance to PAID", async () => {
    mockInvoices([{ id: "inv-1", total: 100, amountPaid: 70 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 30)
    expect(updates()).toEqual([
      { id: "inv-1", amountPaid: 100, status: "PAID" },
    ])
  })
})

describe("allocatePaymentToInvoices — multi-installment oldest-first", () => {
  it("fills the first installment, then spills the rest into the next", async () => {
    // findMany is ordered oldest-first by the query; the payment covers inv-1
    // fully and part of inv-2.
    mockInvoices([
      { id: "inv-1", total: 100, amountPaid: 0 },
      { id: "inv-2", total: 100, amountPaid: 0 },
    ])
    await allocatePaymentToInvoices(SCHOOL, FA, 150)
    expect(updates()).toEqual([
      { id: "inv-1", amountPaid: 100, status: "PAID" },
      { id: "inv-2", amountPaid: 50, status: "PARTIAL" },
    ])
  })

  it("stops once the payment is exhausted, leaving later installments untouched", async () => {
    // Only inv-1 receives money; inv-2 must NOT be written (so a past-due
    // installment keeps its OVERDUE status instead of being reset to UNPAID).
    mockInvoices([
      { id: "inv-1", total: 100, amountPaid: 0 },
      { id: "inv-2", total: 100, amountPaid: 0 },
    ])
    await allocatePaymentToInvoices(SCHOOL, FA, 60)
    const u = updates()
    expect(u).toHaveLength(1)
    expect(u[0]).toEqual({ id: "inv-1", amountPaid: 60, status: "PARTIAL" })
  })

  it("skips an already-fully-covered invoice and moves to the next", async () => {
    // amountPaid === total (a race where findMany returned it before its status
    // flipped): invRemaining is 0, so it's skipped, money flows to inv-2.
    mockInvoices([
      { id: "inv-1", total: 100, amountPaid: 100 },
      { id: "inv-2", total: 100, amountPaid: 0 },
    ])
    await allocatePaymentToInvoices(SCHOOL, FA, 40)
    expect(updates()).toEqual([
      { id: "inv-2", amountPaid: 40, status: "PARTIAL" },
    ])
  })
})

describe("allocatePaymentToInvoices — exclusions & edges", () => {
  it("never touches PAID or CANCELLED invoices (excluded at the query)", async () => {
    await allocatePaymentToInvoices(SCHOOL, FA, 100)
    const where = (db.userInvoice.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].where
    expect(where.status.notIn).toEqual(["PAID", "CANCELLED"])
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.feeAssignmentId).toBe(FA)
  })

  it("no-ops when there are no open invoices", async () => {
    mockInvoices([])
    await allocatePaymentToInvoices(SCHOOL, FA, 100)
    expect(db.userInvoice.update).not.toHaveBeenCalled()
  })

  it("no-ops on a zero or negative payment", async () => {
    mockInvoices([{ id: "inv-1", total: 100, amountPaid: 0 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 0)
    expect(db.userInvoice.update).not.toHaveBeenCalled()
  })

  it("orders oldest-first by due_date", async () => {
    mockInvoices([{ id: "inv-1", total: 100, amountPaid: 0 }])
    await allocatePaymentToInvoices(SCHOOL, FA, 100)
    const orderBy = (db.userInvoice.findMany as ReturnType<typeof vi.fn>).mock
      .calls[0][0].orderBy
    expect(orderBy).toEqual({ due_date: "asc" })
  })
})
