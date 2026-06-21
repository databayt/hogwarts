// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { markExpensePaid } from "@/components/school-dashboard/finance/expenses/actions"
import { postExpensePayment } from "@/components/school-dashboard/finance/lib/accounting/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postExpensePayment: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/db", () => {
  const m = () => ({ findFirst: vi.fn(), update: vi.fn() })
  return { db: { expense: m() } }
})

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId: SCHOOL },
  } as never)
})

describe("markExpensePaid", () => {
  it("rejects a non-approved expense and does not pay it", async () => {
    vi.mocked(db.expense.findFirst).mockResolvedValue({
      status: "PENDING",
    } as never)

    const res = await markExpensePaid("exp-1")

    expect(res.success).toBe(false)
    expect(db.expense.update).not.toHaveBeenCalled()
    expect(postExpensePayment).not.toHaveBeenCalled()
  })

  it("marks an approved expense PAID and posts the ledger (DR expense / CR cash)", async () => {
    vi.mocked(db.expense.findFirst).mockResolvedValue({
      status: "APPROVED",
    } as never)
    vi.mocked(db.expense.update).mockResolvedValue({
      id: "exp-1",
      amount: 500,
      description: "Electricity",
      category: { id: "c1", name: "Utilities" },
    } as never)

    const res = await markExpensePaid("exp-1")

    expect(res.success).toBe(true)
    expect(db.expense.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID" }),
      })
    )
    expect(postExpensePayment).toHaveBeenCalledWith(
      SCHOOL,
      expect.objectContaining({
        expenseId: "exp-1",
        amount: 500,
        categoryName: "Utilities",
      })
    )
  })
})
