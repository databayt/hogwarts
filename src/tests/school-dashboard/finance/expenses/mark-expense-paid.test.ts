// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { markExpensePaid } from "@/components/school-dashboard/finance/expenses/actions"
import { postExpensePayment } from "@/components/school-dashboard/finance/lib/accounting/actions"
import { checkCurrentUserPermission } from "@/components/school-dashboard/finance/lib/permissions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn().mockResolvedValue(true),
}))
vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postExpensePayment: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/db", () => {
  const m = () => ({ update: vi.fn() })
  return { db: { expense: m() } }
})

const SCHOOL = "school-1"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role: "ADMIN", schoolId: SCHOOL },
  } as never)
  vi.mocked(checkCurrentUserPermission).mockResolvedValue(true)
})

describe("markExpensePaid", () => {
  it("rejects when the caller lacks the expenses approve permission", async () => {
    vi.mocked(checkCurrentUserPermission).mockResolvedValue(false)
    const res = await markExpensePaid("exp-1")
    expect(res.success).toBe(false)
    expect(db.expense.update).not.toHaveBeenCalled()
    expect(postExpensePayment).not.toHaveBeenCalled()
  })

  it("rejects a non-approved expense (conditional update matches no row → P2025)", async () => {
    vi.mocked(db.expense.update).mockRejectedValue({ code: "P2025" } as never)
    const res = await markExpensePaid("exp-1")
    expect(res.success).toBe(false)
    expect(postExpensePayment).not.toHaveBeenCalled()
  })

  it("flips an approved expense to PAID (status guard in WHERE) and posts the ledger", async () => {
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
        where: { id: "exp-1", schoolId: SCHOOL, status: "APPROVED" },
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
